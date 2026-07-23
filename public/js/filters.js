// Farb-Panel: Look-Vorlagen + Feinregler (pro Clip).
import { state, selectedClip, defaultGrade, commit, emit, subscribe, rememberLook } from './state.js';
import { LOOKS, SLIDERS, lookById } from './looks.js';
import { el, $ } from './util.js';
import { renderNow } from './engine.js';

let grid, sliders, hint, lastClipId = '__none__';

export function initFilters() {
  grid = $('#lookGrid'); sliders = $('#gradeSliders'); hint = $('#filterHint');

  buildGrid();
  buildSliders();

  $('#resetGrade').addEventListener('click', () => {
    const c = selectedClip(); if (!c) return;
    c.grade = defaultGrade();
    rememberLook(c.grade); syncValues(); renderNow(); commit(); emit('grade');
  });
  $('#applyGradeAll').addEventListener('click', () => {
    const c = selectedClip(); if (!c) return;
    for (const other of state.clips) other.grade = { ...c.grade };
    renderNow(); commit(); emit('grade');
  });

  subscribe(() => refresh());
  refresh();
}

function buildGrid() {
  grid.innerHTML = '';
  for (const look of LOOKS) {
    const sw = el('div', { class: 'look-swatch', 'data-look': look.id, style: `background:${look.swatch}` },
      el('span', { text: look.name }));
    sw.addEventListener('click', () => applyLook(look.id));
    grid.appendChild(sw);
  }
}

export function applyLook(id) {
  const c = selectedClip();
  if (!c) return;
  const look = lookById(id);
  c.grade = { ...defaultGrade(), ...(look?.grade || {}), look: id };
  rememberLook(c.grade);
  syncValues(); markLook(); renderNow(); commit(); emit('grade');
}

function buildSliders() {
  sliders.innerHTML = '';
  for (const s of SLIDERS) {
    const out = el('output', { id: 'val_' + s.key, text: '0' });
    const input = el('input', { type: 'range', min: s.min, max: s.max, value: 0, 'data-key': s.key });
    input.addEventListener('input', () => {
      const c = selectedClip(); if (!c) return;
      c.grade[s.key] = Number(input.value);
      c.grade.look = 'custom';
      out.textContent = input.value;
      rememberLook(c.grade);
      renderNow();
      markLook();
    });
    input.addEventListener('change', () => { commit(); emit('grade'); });
    sliders.appendChild(el('label', { text: s.label }, out, input));
  }
}

function syncValues() {
  const c = selectedClip();
  const g = c ? c.grade : defaultGrade();
  for (const s of SLIDERS) {
    const input = sliders.querySelector(`input[data-key="${s.key}"]`);
    const out = $('#val_' + s.key);
    if (input) input.value = g[s.key] || 0;
    if (out) out.textContent = Math.round(g[s.key] || 0);
  }
}

function markLook() {
  const c = selectedClip();
  const look = c ? c.grade.look : null;
  grid.querySelectorAll('.look-swatch').forEach(sw =>
    sw.classList.toggle('sel', sw.dataset.look === look));
}

function refresh() {
  const c = selectedClip();
  const disabled = !c;
  sliders.style.opacity = disabled ? '.4' : '1';
  sliders.style.pointerEvents = disabled ? 'none' : 'auto';
  grid.style.opacity = disabled ? '.5' : '1';
  grid.style.pointerEvents = disabled ? 'none' : 'auto';
  hint.textContent = disabled
    ? 'Wähle einen Clip in der Timeline, um ihn zu graden.'
    : 'Wähle einen Look oder regle fein nach. Gilt für den ausgewählten Clip.';
  const id = c ? c.id : '__none__';
  if (id !== lastClipId) { lastClipId = id; syncValues(); markLook(); }
}
