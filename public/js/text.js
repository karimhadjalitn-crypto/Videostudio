// Text & Untertitel: erstellen, bearbeiten, in der Vorschau ziehen.
import { state, addText, selectedText, select, commit, emit, subscribe } from './state.js';
import { el, $, clamp } from './util.js';
import { renderNow } from './engine.js';
import { getCanvas, textBounds } from './renderer.js';

const FONTS = ['Inter', 'Playfair Display', 'Montserrat', 'Bebas Neue', 'Cormorant Garamond', 'Oswald', 'Anton', 'Georgia', 'Impact'];
const ANIMS = [['none', 'Kein'], ['fade', 'Fade'], ['slide', 'Slide'], ['pop', 'Pop'], ['typewriter', 'Schreibmaschine']];
const BGS = [['none', 'Kein'], ['#000000cc', 'Schwarz'], ['#ffffffdd', 'Weiß'], ['#e8b04bdd', 'Gold'], ['#46cabcdd', 'Teal']];

// "Gemischt (Auto)": je nach Textart die passende edle Schrift.
const PRESETS = {
  hook:    { text: 'DEIN HOOK\nHIER', font: 'Montserrat',       y: 0.17, size: 8.5, weight: 900, align: 'center', anim: 'pop',   stroke: true,  color: '#ffffff', bg: 'none',      style: 'hook' },
  caption: { text: 'Untertitel',       font: 'Montserrat',       y: 0.80, size: 6.2, weight: 800, align: 'center', anim: 'fade',  stroke: true,  color: '#ffffff', bg: 'none',      style: 'caption' },
  title:   { text: 'Titel',            font: 'Playfair Display', y: 0.50, size: 9.0, weight: 700, align: 'center', anim: 'fade',  stroke: true,  color: '#ffffff', bg: 'none',      style: 'title' },
  lower:   { text: 'Name / Quelle',    font: 'Inter',            y: 0.86, x: 0.30, size: 4.2, weight: 700, align: 'left', anim: 'slide', stroke: false, color: '#ffffff', bg: '#000000cc', style: 'lower' },
};

let inspector, layerList, lastTextId = '__none__';

// Von der KI genutzt: Preset-Text am Abspielkopf einfügen.
export function addPresetText(style, textOverride) {
  const preset = PRESETS[style] || PRESETS.title;
  const tx = addText({ ...preset, start: state.playhead, end: state.playhead + (style === 'hook' ? 2.5 : 3) });
  if (textOverride) tx.text = textOverride;
  select('text', tx.id);
  return tx;
}

export const FONT_LIST = FONTS;

export function initText() {
  inspector = $('#textInspector'); layerList = $('#textLayerList');

  document.querySelectorAll('.add-text-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = PRESETS[btn.dataset.style] || {};
      const tx = addText({ ...preset, start: state.playhead, end: state.playhead + (btn.dataset.style === 'hook' ? 2.5 : 3) });
      select('text', tx.id);
      commit(); emit('addtext'); renderNow();
      window.dispatchEvent(new CustomEvent('cs:panel', { detail: 'text' }));
    });
  });

  initPreviewDrag();
  subscribe(() => refresh());
  refresh();
}

function refresh() {
  renderLayerList();
  const tx = selectedText();
  if (!tx) { inspector.classList.add('hidden'); lastTextId = '__none__'; return; }
  inspector.classList.remove('hidden');
  if (tx.id !== lastTextId) { lastTextId = tx.id; buildInspector(tx); }
}

function renderLayerList() {
  layerList.innerHTML = '';
  if (!state.texts.length) return;
  state.texts.forEach(tx => {
    const card = el('div', { class: 'layer-card' + (state.selection.id === tx.id ? ' sel' : '') },
      el('div', { class: 'clip-meta' },
        el('div', { class: 'cm-name', text: '🅣 ' + (tx.text || '').replace(/\n/g, ' ').slice(0, 22) }),
        el('div', { class: 'cm-sub', text: `${tx.start.toFixed(1)}s – ${tx.end.toFixed(1)}s` }),
      ),
      el('button', { class: 'card-del', title: 'Entfernen', onclick: (e) => { e.stopPropagation(); delText(tx.id); } }, '🗑'),
    );
    card.addEventListener('click', () => select('text', tx.id));
    layerList.appendChild(card);
  });
}

function delText(id) {
  const i = state.texts.findIndex(t => t.id === id);
  if (i < 0) return;
  state.texts.splice(i, 1);
  if (state.selection.id === id) state.selection = { type: null, id: null };
  commit(); emit('deltext'); renderNow();
}

function buildInspector(tx) {
  inspector.innerHTML = '';
  const ta = el('textarea', { rows: 2 });
  ta.value = tx.text;
  ta.addEventListener('input', () => { tx.text = ta.value; renderNow(); renderLayerList(); });
  ta.addEventListener('change', () => { commit(); emit('text'); });
  inspector.appendChild(ta);

  // Schrift + Größe
  const fontSel = el('select', {}, ...FONTS.map(f => el('option', { value: f, text: f })));
  fontSel.value = tx.font;
  fontSel.addEventListener('change', () => { tx.font = fontSel.value; renderNow(); commit(); });
  const sizeIn = el('input', { type: 'number', min: 2, max: 20, step: 0.5, value: tx.size });
  sizeIn.addEventListener('input', () => { tx.size = Number(sizeIn.value); renderNow(); });
  sizeIn.addEventListener('change', () => { commit(); });
  inspector.appendChild(el('div', { class: 'ti-row' },
    el('label', { class: 'ti-field', text: 'Schriftart' }, fontSel),
    el('label', { class: 'ti-field', text: 'Größe' }, sizeIn),
  ));

  // Farbe + Hintergrund
  const colorIn = el('input', { type: 'color', value: tx.color });
  colorIn.addEventListener('input', () => { tx.color = colorIn.value; renderNow(); });
  colorIn.addEventListener('change', () => commit());
  const bgSel = el('select', {}, ...BGS.map(([v, l]) => el('option', { value: v, text: l })));
  bgSel.value = tx.bg;
  bgSel.addEventListener('change', () => { tx.bg = bgSel.value; renderNow(); commit(); });
  inspector.appendChild(el('div', { class: 'ti-row' },
    el('label', { class: 'ti-field', text: 'Textfarbe' }, colorIn),
    el('label', { class: 'ti-field', text: 'Hintergrund' }, bgSel),
  ));

  // Ausrichtung
  inspector.appendChild(el('div', { class: 'ti-field', text: 'Ausrichtung' }));
  const alignRow = el('div', { class: 'chip-row' });
  [['left', 'Links'], ['center', 'Mitte'], ['right', 'Rechts']].forEach(([v, l]) => {
    const chip = el('button', { class: 'chip' + (tx.align === v ? ' sel' : ''), text: l });
    chip.addEventListener('click', () => { tx.align = v; renderNow(); commit(); alignRow.querySelectorAll('.chip').forEach(c => c.classList.remove('sel')); chip.classList.add('sel'); });
    alignRow.appendChild(chip);
  });
  inspector.appendChild(alignRow);

  // Position (schnell)
  inspector.appendChild(el('div', { class: 'ti-field', text: 'Position' }));
  const posRow = el('div', { class: 'chip-row' });
  [['Oben', 0.16], ['Mitte', 0.5], ['Unten', 0.84]].forEach(([l, y]) => {
    const chip = el('button', { class: 'chip' + (Math.abs(tx.y - y) < 0.02 ? ' sel' : ''), text: l });
    chip.addEventListener('click', () => { tx.y = y; renderNow(); commit(); posRow.querySelectorAll('.chip').forEach(c => c.classList.remove('sel')); chip.classList.add('sel'); });
    posRow.appendChild(chip);
  });
  inspector.appendChild(posRow);

  // Schriftstärke
  inspector.appendChild(el('div', { class: 'ti-field', text: 'Schriftstärke' }));
  const weightRow = el('div', { class: 'chip-row' });
  [['Normal', 500], ['Fett', 700], ['Kräftig', 800], ['Extra', 900]].forEach(([l, w]) => {
    const chip = el('button', { class: 'chip' + (tx.weight === w ? ' sel' : ''), text: l });
    chip.addEventListener('click', () => { tx.weight = w; renderNow(); commit(); weightRow.querySelectorAll('.chip').forEach(c => c.classList.remove('sel')); chip.classList.add('sel'); });
    weightRow.appendChild(chip);
  });
  inspector.appendChild(weightRow);

  // Buchstabenabstand
  const lsOut = el('output', { text: (tx.letterSpacing || 0).toString() });
  const lsIn = el('input', { type: 'range', min: -5, max: 30, value: tx.letterSpacing || 0 });
  lsIn.addEventListener('input', () => { tx.letterSpacing = Number(lsIn.value); lsOut.textContent = lsIn.value; renderNow(); });
  lsIn.addEventListener('change', () => commit());
  inspector.appendChild(el('label', { class: 'ti-field', text: 'Buchstabenabstand ' }, lsOut, lsIn));

  // Animation
  inspector.appendChild(el('div', { class: 'ti-field', text: 'Animation' }));
  const animRow = el('div', { class: 'chip-row' });
  ANIMS.forEach(([v, l]) => {
    const chip = el('button', { class: 'chip' + (tx.anim === v ? ' sel' : ''), text: l });
    chip.addEventListener('click', () => { tx.anim = v; renderNow(); commit(); animRow.querySelectorAll('.chip').forEach(c => c.classList.remove('sel')); chip.classList.add('sel'); });
    animRow.appendChild(chip);
  });
  inspector.appendChild(animRow);

  // Kontur + Schatten
  const strokeChip = el('button', { class: 'chip' + (tx.stroke ? ' sel' : ''), text: '◻ Kontur' });
  strokeChip.addEventListener('click', () => { tx.stroke = !tx.stroke; strokeChip.classList.toggle('sel', tx.stroke); renderNow(); commit(); });
  const shadowChip = el('button', { class: 'chip' + (tx.shadow ? ' sel' : ''), text: '☾ Schatten' });
  shadowChip.addEventListener('click', () => { tx.shadow = !tx.shadow; shadowChip.classList.toggle('sel', tx.shadow); renderNow(); commit(); });
  inspector.appendChild(el('div', { class: 'chip-row' }, strokeChip, shadowChip));
}

// ---- Ziehen in der Vorschau ----
function initPreviewDrag() {
  const viewer = $('#viewer');
  let dragTx = null, offX = 0, offY = 0;

  function canvasPoint(e) {
    const cv = getCanvas(); const r = cv.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * cv.width,
      y: (e.clientY - r.top) / r.height * cv.height,
      W: cv.width, H: cv.height,
    };
  }

  viewer.addEventListener('pointerdown', (e) => {
    const cv = getCanvas(); if (!cv) return;
    const p = canvasPoint(e);
    const hit = [...state.texts].reverse().find(tx =>
      state.playhead >= tx.start && state.playhead <= tx.end && inBounds(tx, p));
    if (!hit) return;
    select('text', hit.id);
    dragTx = hit;
    offX = p.x - hit.x * p.W;
    offY = p.y - hit.y * p.H;
    viewer.setPointerCapture?.(e.pointerId);
  });

  viewer.addEventListener('pointermove', (e) => {
    if (!dragTx) return;
    const p = canvasPoint(e);
    dragTx.x = clamp((p.x - offX) / p.W, 0, 1);
    dragTx.y = clamp((p.y - offY) / p.H, 0, 1);
    renderNow();
  });

  const end = () => { if (dragTx) { dragTx = null; commit(); emit('move'); } };
  viewer.addEventListener('pointerup', end);
  viewer.addEventListener('pointercancel', end);

  viewer.addEventListener('dblclick', (e) => {
    const p = canvasPoint(e);
    const hit = [...state.texts].reverse().find(tx =>
      state.playhead >= tx.start && state.playhead <= tx.end && inBounds(tx, p));
    if (hit) {
      select('text', hit.id);
      window.dispatchEvent(new CustomEvent('cs:panel', { detail: 'text' }));
      setTimeout(() => inspector.querySelector('textarea')?.focus(), 60);
    }
  });
}

function inBounds(tx, p) {
  const b = textBounds(tx, p.W, p.H);
  const pad = p.H * 0.03;
  return p.x >= b.x - pad && p.x <= b.x + b.w + pad && p.y >= b.y - pad && p.y <= b.y + b.h + pad;
}
