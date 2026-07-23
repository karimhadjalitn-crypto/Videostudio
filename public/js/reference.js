// Referenzen: Beispiel-Videos/Bilder einfügen, Farb-/Look-Analyse, Moodboard.
// Wichtig: NICHTS wird automatisch übernommen – nur auf ausdrücklichen Wunsch.
import { state, defaultGrade, selectedClip, commit, emit } from './state.js';
import { uid, el, $, toast } from './util.js';
import { renderNow } from './engine.js';

let listEl, modal, refPool;

export function initReference() {
  listEl = $('#refList');
  modal = $('#refModal');

  const input = $('#refInput');
  input.addEventListener('change', () => { importReferences(input.files); input.value = ''; });

  $('#refModalClose').addEventListener('click', () => modal.classList.add('hidden'));
  $('#refApplyLook').addEventListener('click', () => {
    const ref = state.references.find(r => r.id === state._activeRef);
    if (ref) applyReferenceLook(ref, 'selected');
    modal.classList.add('hidden');
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

  renderList();
}

function pool() {
  if (!refPool) {
    refPool = el('div', { style: 'position:absolute;left:-9999px;width:0;height:0;overflow:hidden' });
    document.body.appendChild(refPool);
  }
  return refPool;
}

export async function importReferences(files) {
  let added = 0;
  for (const file of files) {
    try {
      if (file.type.startsWith('image/')) {
        const ref = await importImage(file);
        state.references.push(ref); added++;
      } else if (file.type.startsWith('video/')) {
        const ref = await importRefVideo(file);
        state.references.push(ref); added++;
      }
    } catch (e) {
      toast('❌ Referenz „' + file.name + '“ nicht lesbar.', 'err');
    }
  }
  if (added) {
    renderList();
    toast('📎 Referenz analysiert. Sag „übernimm den Look der Referenz“, wenn ich sie anwenden soll.', 'ok', 4200);
  }
}

function importImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const analysis = analyze(img, img.naturalWidth, img.naturalHeight);
      resolve({ id: uid(), name: file.name, kind: 'image', url, thumbUrl: url, analysis, note: '' });
    };
    img.onerror = reject;
    img.src = url;
  });
}

function importRefVideo(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.src = url; v.muted = true; v.playsInline = true; v.crossOrigin = 'anonymous';
    pool().appendChild(v);
    v.addEventListener('loadedmetadata', () => {
      const grab = () => {
        const analysis = analyze(v, v.videoWidth, v.videoHeight);
        // Thumbnail
        const c = document.createElement('canvas'); c.width = 160; c.height = 90;
        const cx = c.getContext('2d');
        const ar = v.videoWidth / v.videoHeight;
        let dw = 160, dh = 160 / ar, dy = (90 - dh) / 2, dx = 0;
        if (dh < 90) { dh = 90; dw = 90 * ar; dx = (160 - dw) / 2; dy = 0; }
        try { cx.drawImage(v, dx, dy, dw, dh); } catch (e) {}
        resolve({ id: uid(), name: file.name, kind: 'video', url, thumbUrl: c.toDataURL('image/jpeg', 0.7), analysis, note: '' });
      };
      v.addEventListener('seeked', function once() { v.removeEventListener('seeked', once); grab(); });
      try { v.currentTime = Math.min(1, (v.duration || 2) * 0.4); } catch (e) { setTimeout(grab, 200); }
    }, { once: true });
    v.addEventListener('error', reject, { once: true });
  });
}

// Farb-/Kontrast-/Sättigungs-Analyse + abgeleiteter Grade + Palette.
function analyze(srcEl, w, h) {
  const S = 84;
  const ar = w / h;
  const cw = ar >= 1 ? S : Math.round(S * ar);
  const ch = ar >= 1 ? Math.round(S / ar) : S;
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const cx = c.getContext('2d', { willReadFrequently: true });
  let data;
  try { cx.drawImage(srcEl, 0, 0, cw, ch); data = cx.getImageData(0, 0, cw, ch).data; }
  catch (e) { return fallbackAnalysis(); }

  let sr = 0, sg = 0, sb = 0, sSat = 0, n = 0;
  const lums = [];
  const buckets = {};
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    sr += r; sg += g; sb += b;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    sSat += mx === 0 ? 0 : (mx - mn) / mx;
    lums.push((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255);
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    buckets[key] = buckets[key] || { c: 0, r: 0, g: 0, b: 0 };
    buckets[key].c++; buckets[key].r += r; buckets[key].g += g; buckets[key].b += b;
    n++;
  }
  const avgR = sr / n, avgG = sg / n, avgB = sb / n, avgSat = sSat / n;
  const mean = lums.reduce((a, v) => a + v, 0) / n;
  let varr = 0; for (const v of lums) varr += (v - mean) * (v - mean);
  const std = Math.sqrt(varr / n);

  // Palette: häufigste Buckets
  const palette = Object.values(buckets).sort((a, b) => b.c - a.c).slice(0, 6)
    .map(o => rgbHex(o.r / o.c, o.g / o.c, o.b / o.c))
    .sort((a, b) => lumOf(a) - lumOf(b));

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const tempRaw = (avgR - avgB) / 255;
  const grade = {
    ...defaultGrade(),
    look: 'referenz',
    temperature: Math.round(clamp(tempRaw * 140, -100, 100)),
    exposure: Math.round(clamp((mean - 0.5) * 90, -45, 45)),
    contrast: Math.round(clamp((std - 0.19) / 0.19 * 85, -60, 70)),
    saturation: Math.round(clamp((avgSat - 0.32) / 0.32 * 70, -80, 70)),
    tint: Math.round(clamp((avgG - (avgR + avgB) / 2) / 255 * 120, -55, 55)),
    tealOrange: Math.round(clamp(18 + Math.max(0, tempRaw * 55), 0, 55)),
    vignette: 14,
  };

  return {
    grade, palette,
    stats: {
      brightness: Math.round(mean * 100),
      contrast: Math.round(std * 260),
      saturation: Math.round(avgSat * 100),
      temp: tempRaw > 0.04 ? 'warm' : tempRaw < -0.04 ? 'kühl' : 'neutral',
    },
  };
}

function fallbackAnalysis() {
  return { grade: { ...defaultGrade(), look: 'referenz' }, palette: ['#222', '#555', '#888', '#bbb'], stats: { brightness: 50, contrast: 50, saturation: 50, temp: 'neutral' } };
}

function rgbHex(r, g, b) {
  const h = (x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}
function lumOf(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function applyReferenceLook(ref, scope = 'selected') {
  if (!ref || !ref.analysis) { toast('Keine Referenz zum Übernehmen gefunden.', 'err'); return false; }
  const grade = { ...ref.analysis.grade };
  if (scope === 'all' || !selectedClip()) {
    if (!state.clips.length) { toast('Erst B-Roll hinzufügen, dann den Look übernehmen.', 'err'); return false; }
    for (const c of state.clips) c.grade = { ...grade };
    toast('🎨 Look der Referenz auf <b>alle Clips</b> übernommen.', 'ok');
  } else {
    selectedClip().grade = { ...grade };
    toast('🎨 Look der Referenz auf den <b>ausgewählten Clip</b> übernommen.', 'ok');
  }
  renderNow(); commit(); emit('reflook');
  return true;
}

export function getReferences() { return state.references; }
export function activeReference() {
  if (state._activeRef) return state.references.find(r => r.id === state._activeRef);
  return state.references[state.references.length - 1] || null;
}

function renderList() {
  listEl.innerHTML = '';
  if (!state.references.length) return;
  state.references.forEach(ref => {
    const pal = el('div', { class: 'ref-palette' }, ...(ref.analysis?.palette || []).map(c => el('i', { style: `background:${c}` })));
    const card = el('div', { class: 'ref-card' },
      el('img', { class: 'ref-thumb', src: ref.thumbUrl }),
      el('div', { class: 'ref-info' },
        el('div', { class: 'ri-name', text: (ref.kind === 'video' ? '🎬 ' : '🖼️ ') + ref.name }),
        pal,
      ),
      el('button', { class: 'card-del', title: 'Entfernen', onclick: (e) => { e.stopPropagation(); delRef(ref.id); } }, '🗑'),
    );
    card.addEventListener('click', () => openModal(ref));
    listEl.appendChild(card);
  });
}

function delRef(id) {
  const i = state.references.findIndex(r => r.id === id);
  if (i >= 0) state.references.splice(i, 1);
  renderList();
}

function openModal(ref) {
  state._activeRef = ref.id;
  $('#refModalTitle').textContent = ref.name;
  const view = $('#refView'); view.innerHTML = '';
  if (ref.kind === 'video') view.appendChild(el('video', { src: ref.url, controls: 'controls', loop: 'loop', muted: 'muted' }));
  else view.appendChild(el('img', { src: ref.url }));

  const st = ref.analysis?.stats || {};
  const an = $('#refAnalysis'); an.innerHTML = '';
  an.appendChild(el('div', { class: 'ref-stat', html: `Helligkeit <b>${st.brightness ?? '–'}%</b>` }));
  an.appendChild(el('div', { class: 'ref-stat', html: `Kontrast <b>${st.contrast ?? '–'}</b>` }));
  an.appendChild(el('div', { class: 'ref-stat', html: `Sättigung <b>${st.saturation ?? '–'}%</b>` }));
  an.appendChild(el('div', { class: 'ref-stat', html: `Farbton <b>${st.temp ?? '–'}</b>` }));
  const bp = el('div', { class: 'ref-bigpalette' }, ...(ref.analysis?.palette || []).map(c => el('i', { style: `background:${c}`, title: c })));
  an.appendChild(bp);

  const note = $('#refNote');
  note.value = ref.note || '';
  note.oninput = () => { ref.note = note.value; };

  modal.classList.remove('hidden');
}
