// Deutscher KI-Assistent: versteht Befehle in normaler Sprache und übernimmt das Editing.
import {
  state, selectedClip, selectedText, defaultGrade, commit, emit, recompute,
  clipAt, undo, redo,
} from './state.js';
import { uid, clamp, toast } from './util.js';
import { seek, play, pause, renderNow } from './engine.js';
import { applyLook } from './filters.js';
import { applyReferenceLook, activeReference } from './reference.js';
import { addPresetText, FONT_LIST } from './text.js';

const UNIPOLAR = new Set(['vignette', 'grain', 'fade', 'tealOrange']);

const NUM = {
  null: 0, ein: 1, eine: 1, eins: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, fuenf: 5,
  sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12, zwoelf: 12,
  dreizehn: 13, vierzehn: 14, fünfzehn: 15, fuenfzehn: 15, zwanzig: 20, dreissig: 30, 'dreißig': 30,
  halbe: 0.5, halb: 0.5,
};

function firstNumber(str, def = 3) {
  const d = str.match(/(\d+(?:[.,]\d+)?)/);
  if (d) return parseFloat(d[1].replace(',', '.'));
  for (const w of str.split(/\s+/)) if (w in NUM) return NUM[w];
  return def;
}

function scopeAll(s) { return /\balle\b|ganze[ns]?\s+video|gesamt|überall|jeden clip/.test(s); }

function colorTargets(s) {
  return (scopeAll(s) || !selectedClip()) ? state.clips.slice() : [selectedClip()];
}

function nudge(s, key, delta) {
  const targets = colorTargets(s);
  if (!targets.length) return false;
  const min = UNIPOLAR.has(key) ? 0 : -100;
  for (const c of targets) {
    c.grade[key] = clamp((c.grade[key] || 0) + delta, min, 100);
    c.grade.look = 'custom';
  }
  return true;
}

function setLook(s, id) {
  const targets = colorTargets(s);
  if (!targets.length) return false;
  // applyLook wirkt auf den ausgewählten Clip – für "alle" direkt setzen:
  if (targets.length === 1 && targets[0] === selectedClip()) { applyLook(id); return true; }
  const preset = LOOK_GRADE(id);
  for (const c of targets) c.grade = { ...defaultGrade(), ...preset, look: id };
  return true;
}

function LOOK_GRADE(id) {
  // Minimal-Duplikat der wichtigsten Looks für den "alle Clips"-Fall.
  const M = {
    cinematic: { contrast: 12, saturation: -6, temperature: 8, tealOrange: 58, vignette: 20, fade: 8 },
    moody: { exposure: -10, contrast: 18, saturation: -14, temperature: -6, vignette: 34, fade: 10, tealOrange: 26, grain: 8 },
    warm: { temperature: 28, saturation: 8, contrast: 6, vignette: 12, grain: 6 },
    cold: { temperature: -30, tint: -6, saturation: -8, contrast: 8, vignette: 18 },
    noir: { saturation: -100, contrast: 30, vignette: 35, grain: 14, exposure: -4 },
    vintage: { temperature: 16, saturation: -18, fade: 34, grain: 24, contrast: -6, vignette: 22 },
    dream: { fade: 40, exposure: 8, saturation: 6, contrast: -12, vignette: 10 },
    bold: { contrast: 34, saturation: 20, tealOrange: 20, vignette: 14 },
    none: {},
  };
  return M[id] || {};
}

function cutTarget() {
  return selectedClip() || clipAt(state.playhead) || state.clips[0] || null;
}

function splitAtPlayhead() {
  const t = state.playhead, c = clipAt(t);
  if (!c) return false;
  const srcT = c.in + (t - c.start);
  if (srcT <= c.in + 0.1 || srcT >= c.out - 0.1) return false;
  const idx = state.clips.indexOf(c);
  const nb = { id: uid(), srcId: c.srcId, in: srcT, out: c.out, start: 0, grade: { ...c.grade } };
  c.out = srcT;
  state.clips.splice(idx + 1, 0, nb);
  recompute();
  return true;
}

// 1-Klick cinematisch-cleaner Look über alle Clips.
export function autoEdit() {
  if (!state.clips.length) { toast('Erst B-Roll hinzufügen, dann Auto-Edit.', 'err'); return; }
  const clean = { contrast: 10, saturation: -4, temperature: 6, tealOrange: 28, vignette: 15, fade: 5 };
  for (const c of state.clips) c.grade = { ...defaultGrade(), ...clean, look: 'cinematic' };
  renderNow(); commit(); emit('autoedit');
  toast('✨ Auto-Edit: einheitlicher cinematisch-cleaner Look auf <b>alle Clips</b> angewendet.', 'ok', 3600);
}

function extractText(input, raw) {
  const q = raw.match(/["„“”']([^"„“”']{1,140})["„“”']/);
  if (q) return q[1].trim();
  return null;
}

function setFontOnText(name) {
  const tx = selectedText();
  if (!tx) return null;
  const match = FONT_LIST.find(f => f.toLowerCase() === name) ||
    FONT_LIST.find(f => f.toLowerCase().includes(name));
  if (match) { tx.font = match; return match; }
  return null;
}

// Hauptfunktion.
export function runCommand(raw) {
  const s = (raw || '').toLowerCase().trim();
  if (!s) return;
  const done = [];
  let touchedColor = false, structural = false;

  const add = (m) => done.push(m);

  // ---- Undo / Redo ----
  if (/\b(rückgängig|zurück nehmen|undo)\b/.test(s)) { undo(); renderNow(); add('↶ rückgängig'); return finish(done, false); }
  if (/\b(wiederhole|nochmal machen|redo)\b/.test(s)) { redo(); renderNow(); add('↷ wiederholt'); return finish(done, false); }

  // ---- Wiedergabe ----
  if (/\b(abspielen|starte|play|wiedergabe)\b/.test(s) && !/nicht/.test(s)) { play(); add('▶ abgespielt'); }
  if (/\b(stopp|stop|pause|anhalten|halt)\b/.test(s)) { pause(); add('⏸ angehalten'); }
  if (/\b(an den anfang|zum start|zum anfang|von vorne)\b/.test(s)) { seek(0); add('⏮ an den Anfang'); }

  // ---- Referenz-Look ----
  if (/(referenz|beispiel|vorlage).*(look|farbe|editing|grade|übernehm|übernimm|wie)|übernimm.*(look|editing|farbe)|mach.*wie.*(referenz|beispiel)|wie (im|das) beispiel|ich mag (sein|dein|den|die) (editing|farben|look|grade)/.test(s)) {
    const ref = activeReference();
    if (ref) { applyReferenceLook(ref, scopeAll(s) ? 'all' : 'selected'); add('🎨 Look der Referenz übernommen'); structural = true; }
    else add('⚠️ Keine Referenz vorhanden – füge zuerst eine unter „Referenz“ ein.');
  }
  if (/(referenz|beispiel).*(schrift|font)|ich mag (die|seine|dessen) schrift/.test(s)) {
    add('ℹ️ Die genaue Schriftart eines Beispiel-Videos kann das Studio offline nicht erkennen. Öffne die Referenz und wähle im Text-Panel eine passende Schrift – oder sag mir den Namen (z.B. „nimm Playfair“).');
  }

  // ---- Auto-Edit ----
  if (/(auto.?edit|übernimm das editing|editing übernehmen|bearbeite (das|mein) video|mach (das|es|mein) (ganze[s]? )?video (cinematisch|hochwertig|clean|schön)|cinematisch clean|mach es hochwertig|editier)/.test(s)) {
    autoEdit(); add('✨ Auto-Edit angewendet'); return finish(done, false);
  }

  // ---- Farbe / Look ----
  if (/wärmer|wärme|warmer ton/.test(s)) touchedColor = nudge(s, 'temperature', +15) || touchedColor, add('🌡️ wärmer');
  if (/kälter|kühler|kalter ton/.test(s)) touchedColor = nudge(s, 'temperature', -15) || touchedColor, add('🌡️ kühler');
  if (/heller|aufhellen|mehr licht/.test(s)) touchedColor = nudge(s, 'exposure', +12) || touchedColor, add('☀️ heller');
  if (/dunkler|abdunkeln|weniger licht/.test(s)) touchedColor = nudge(s, 'exposure', -12) || touchedColor, add('🌙 dunkler');
  if (/mehr kontrast|kontrastreicher|knackiger|mehr tiefe/.test(s)) touchedColor = nudge(s, 'contrast', +15) || touchedColor, add('◐ mehr Kontrast');
  if (/weniger kontrast|flacher|flach/.test(s)) touchedColor = nudge(s, 'contrast', -15) || touchedColor, add('◐ weniger Kontrast');
  if (/(mehr|kräftiger|satter|bunter|intensiver).*(farbe|sättigung)|kräftigere farben|satter|bunter/.test(s)) touchedColor = nudge(s, 'saturation', +15) || touchedColor, add('🎨 mehr Sättigung');
  if (/(weniger|blasser|entsättig|dezenter).*(farbe|sättigung)|entsättigt|blasser|zurückhaltender/.test(s)) touchedColor = nudge(s, 'saturation', -15) || touchedColor, add('🎨 weniger Sättigung');
  if (/schwarz.?weiß|s\/w|noir|schwarzweiss/.test(s)) { setLook(s, 'noir'); touchedColor = true; add('🖤 Schwarzweiß'); }
  else if (/cinematisch|kinolook|kino.?look|film.?look|filmisch/.test(s) && !/clean/.test(s)) { setLook(s, 'cinematic'); touchedColor = true; add('🎬 Cinematic-Look'); }
  else if (/moody|düster|atmosphär|dark academia/.test(s)) { setLook(s, 'moody'); touchedColor = true; add('🌑 Moody'); }
  else if (/vintage|retro|super.?8|alt(er)? film/.test(s)) { setLook(s, 'vintage'); touchedColor = true; add('📼 Vintage'); }
  else if (/warm.?film|warmer look/.test(s)) { setLook(s, 'warm'); touchedColor = true; add('🔥 Warm Film'); }
  else if (/kühler look|cold|kalt.?look|nachdenklich/.test(s)) { setLook(s, 'cold'); touchedColor = true; add('❄️ Kühl'); }
  else if (/traum|verträumt|weich.?zeichn|soft look/.test(s)) { setLook(s, 'dream'); touchedColor = true; add('💭 Traum'); }
  if (/teal.?orange|teal und orange|orange teal/.test(s)) touchedColor = nudge(s, 'tealOrange', +30) || touchedColor, add('🟠 Teal & Orange');
  if (/vignette|abdunklung am rand|dunkle ränder/.test(s)) touchedColor = nudge(s, 'vignette', +25) || touchedColor, add('⭕ Vignette');
  if (/körn|filmkorn|grain|rauschen/.test(s)) touchedColor = nudge(s, 'grain', +20) || touchedColor, add('🎞️ Filmkorn');
  if (/\bfade\b|verblasst|matt(er)?|milchig/.test(s)) touchedColor = nudge(s, 'fade', +25) || touchedColor, add('🌫️ Fade');

  // ---- Frame / Format ----
  if (/(cinema.?frame|rahmen|abgerundet|runde ecken|gerundet)/.test(s) && !/kein|ohne|weg/.test(s)) { state.frame.enabled = true; structural = true; add('🖼️ Cinema-Frame an'); }
  if (/(kein|ohne) rahmen|rahmen (weg|aus)/.test(s)) { state.frame.enabled = false; structural = true; add('🖼️ Rahmen aus'); }
  if (/(cinemascope|kinobalken|schwarze balken|letterbox|balken)/.test(s) && !/kein|ohne|weg|aus/.test(s)) { state.letterbox.enabled = true; structural = true; add('▬ Kinobalken an'); }
  if (/(kein[e]?|ohne) balken|balken (weg|aus)/.test(s)) { state.letterbox.enabled = false; structural = true; add('▬ Balken aus'); }
  if (/hochformat|9:16|9 zu 16|vertikal|tiktok.?format/.test(s)) { setRatio('9:16'); structural = true; add('📱 Hochformat 9:16'); }
  else if (/querformat|16:9|16 zu 9|horizontal|breitbild/.test(s)) { setRatio('16:9'); structural = true; add('🖥️ Querformat 16:9'); }
  else if (/quadrat|1:1|quadratisch/.test(s)) { setRatio('1:1'); structural = true; add('⬛ Quadrat 1:1'); }
  else if (/2\.?39|cinemascope format|breitwand/.test(s)) { setRatio('2.39:1'); structural = true; add('🎞️ Cinemascope 2.39:1'); }

  // ---- Schnitt ----
  if (/(erste[nr]?|vorne|anfang).*(sekunde|sek).*(weg|entfern|abschneid|schneid)|schneide.*(erste|vorne)/.test(s)) {
    const n = firstNumber(s, 2), c = cutTarget();
    if (c) { c.in = clamp(c.in + n, 0, c.out - 0.2); recompute(); structural = true; add(`✂ erste ${n}s entfernt`); }
  }
  if (/(letzte[nr]?|ende|hinten).*(sekunde|sek).*(weg|entfern|abschneid|schneid)|schneide.*(letzte|ende|hinten)/.test(s)) {
    const n = firstNumber(s, 2), c = cutTarget();
    if (c) { c.out = clamp(c.out - n, c.in + 0.2, c.out); recompute(); structural = true; add(`✂ letzte ${n}s entfernt`); }
  }
  if (/kürze auf|kürzen auf|mach.*sekunden lang|auf .* sekunden/.test(s)) {
    const n = firstNumber(s, 5), c = cutTarget();
    if (c) { const src = state.sources[c.srcId]; c.out = clamp(c.in + n, c.in + 0.2, src?.duration || c.in + n); recompute(); structural = true; add(`✂ auf ${n}s gekürzt`); }
  }
  if (/\b(teile|teilen|split|schneide hier|trenn)\b/.test(s)) {
    if (splitAtPlayhead()) { structural = true; add('✂ am Abspielkopf geteilt'); }
    else add('⚠️ Zum Teilen den Abspielkopf mitten in einen Clip setzen.');
  }
  if (/(lösche|entferne|weg) (den |diesen )?clip|clip (löschen|entfernen)/.test(s)) {
    const c = cutTarget();
    if (c) { const i = state.clips.indexOf(c); state.clips.splice(i, 1); if (state.selection.id === c.id) state.selection = { type: null, id: null }; recompute(); structural = true; add('🗑 Clip gelöscht'); }
  }

  // ---- Ton ----
  if (/(b.?roll|video).*(stumm|ton aus|leise)|nur (voiceover|stimme|naschid)|kein videoton/.test(s)) { state.muteBroll = true; structural = true; add('🔇 B-Roll stumm'); }
  if (/(b.?roll|video).*(ton an|laut)|videoton an/.test(s)) { state.muteBroll = false; structural = true; add('🔊 B-Roll-Ton an'); }

  // ---- Text ----
  const quoted = extractText(s, raw);
  if (/\b(hook|aufmacher)\b/.test(s)) { addPresetText('hook', quoted); structural = true; add('🅣 Hook-Text' + (quoted ? `: „${quoted}“` : '')); }
  else if (/untertitel|caption|bauchbinde/.test(s) && !/schrift/.test(s)) { addPresetText(/bauchbinde/.test(s) ? 'lower' : 'caption', quoted); structural = true; add('🅣 Untertitel'); }
  else if (/\btitel\b/.test(s)) { addPresetText('title', quoted); structural = true; add('🅣 Titel' + (quoted ? `: „${quoted}“` : '')); }
  else if (/(füge|schreib|setz).*(text)|^text /.test(s)) { addPresetText('title', quoted); structural = true; add('🅣 Text' + (quoted ? `: „${quoted}“` : '')); }

  // ---- Schrift setzen ----
  const fontMatch = s.match(/(nimm|verwende|schrift(art)?|font)\s+([a-zäöü ]+?)(\s|$|,)/);
  if (fontMatch) {
    const applied = setFontOnText(fontMatch[3].trim());
    if (applied) { structural = true; add('🔤 Schrift: ' + applied); }
  }

  // ---- Export ----
  if (/(exportier|export|rendern|render|speicher|download|herunterladen)/.test(s)) {
    window.dispatchEvent(new CustomEvent('cs:export', { detail: { fourk: /4k|2160|ultra/.test(s) } }));
    add('💾 Export-Dialog geöffnet');
  }

  return finish(done, touchedColor || structural);
}

function setRatio(r) {
  state.aspectRatio = r;
  document.querySelectorAll('#formatSwitch button').forEach(b => b.classList.toggle('active', b.dataset.ratio === r));
}

function finish(done, changed) {
  if (changed) { renderNow(); commit(); emit('ai'); }
  else renderNow();
  if (done.length) toast('✅ ' + done.join(' · '), 'ok', Math.min(6000, 2200 + done.length * 600));
  else toast('🤔 Das habe ich nicht verstanden. Tippe „?“ für Beispiele – z.B. „mach es wärmer und cinematisch“.', 'err', 4200);
}

export const EXAMPLES = [
  'mach es wärmer und cinematisch',
  'übernimm das Editing für das ganze Video',
  'schneide die ersten 2 Sekunden weg',
  'füge einen Hook-Text hinzu',
  'titel „Warum wir prokrastinieren“',
  'mach Schwarzweiß mit Filmkorn',
  'hochformat für TikTok',
  'cinema frame mit runden Ecken',
  'nur Voiceover, B-Roll stumm',
  'übernimm den Look der Referenz',
  'teile den Clip hier',
  'exportiere in 4K',
];
