// Zentraler Projekt-Zustand mit Pub/Sub und Undo/Redo.
import { uid } from './util.js';

export const RATIOS = {
  '16:9':   16 / 9,
  '9:16':   9 / 16,
  '1:1':    1,
  '2.39:1': 2.39,
};

export function defaultGrade() {
  return {
    look: 'none',
    exposure: 0, contrast: 0, saturation: 0,
    temperature: 0, tint: 0,
    lift: 0, gamma: 0, gain: 0,
    vignette: 0, grain: 0, fade: 0, tealOrange: 0,
  };
}

const listeners = new Set();
let lastLook = null; // zuletzt gewählter Look wird auf neue Clips vererbt

export const state = {
  projectName: 'Neues Projekt',
  aspectRatio: '16:9',
  sources: {},        // id -> { id, name, kind, url, duration, width, height, el, thumbUrl, audioBuffer }
  clips: [],          // Video-Spur: { id, srcId, in, out, start, grade }
  audioClips: [],     // Audio-Spur: { id, srcId, name, in, out, start, volume }
  texts: [],          // { id, text, start, end, x, y, size, color, bg, font, weight, align, anim, style, stroke }
  references: [],     // { id, name, kind:'image'|'video', url, thumbUrl, analysis, note }
  _activeRef: null,   // zuletzt geöffnete Referenz (für KI-Befehl)
  frame: { enabled: false, radius: 28, margin: 3, color: '#000000' },
  letterbox: { enabled: false, size: 12 },
  safezone: false,
  muteBroll: false,
  playhead: 0,
  playing: false,
  zoom: 90,           // Pixel pro Sekunde
  selection: { type: null, id: null },
  _preview: true,     // Renderer zeichnet Hilfslinien nur in der Vorschau
};

// ---- Pub/Sub ----
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function emit(reason = '') { for (const fn of listeners) fn(state, reason); }

// ---- Abgeleitete Werte ----
export function recompute() {
  // Video-Clips sequenziell anordnen
  let t = 0;
  for (const c of state.clips) {
    c.start = t;
    t += clipDur(c);
  }
  state.videoDuration = t;
  // Gesamtlänge = längste Spur
  let audioEnd = 0;
  for (const a of state.audioClips) audioEnd = Math.max(audioEnd, a.start + (a.out - a.in));
  let textEnd = 0;
  for (const tx of state.texts) textEnd = Math.max(textEnd, tx.end);
  state.duration = Math.max(t, audioEnd, textEnd, 0.1);
}

export const clipDur = (c) => Math.max(0.05, c.out - c.in);

// Welcher Video-Clip liegt bei Zeit t (Timeline-Sekunden)?
export function clipAt(t) {
  for (const c of state.clips) {
    if (t >= c.start && t < c.start + clipDur(c)) return c;
  }
  return state.clips.length ? state.clips[state.clips.length - 1] : null;
}

export function sourceTimeFor(clip, t) {
  return clip.in + (t - clip.start);
}

export function selectedClip() {
  if (state.selection.type === 'clip') return state.clips.find(c => c.id === state.selection.id) || null;
  return null;
}
export function selectedText() {
  if (state.selection.type === 'text') return state.texts.find(x => x.id === state.selection.id) || null;
  return null;
}
export function selectedAudio() {
  if (state.selection.type === 'audio') return state.audioClips.find(a => a.id === state.selection.id) || null;
  return null;
}

// ---- Mutationen ----
export function addVideoClip(src) {
  const grade = lastLook ? { ...lastLook } : defaultGrade();
  const clip = { id: uid(), srcId: src.id, in: 0, out: src.duration || 5, start: 0, grade };
  state.clips.push(clip);
  recompute();
  return clip;
}

export function addAudioClip(src) {
  const a = { id: uid(), srcId: src.id, name: src.name, in: 0, out: src.duration || 5, start: 0, volume: 1 };
  state.audioClips.push(a);
  recompute();
  return a;
}

export function addText(t) {
  const tx = Object.assign({
    id: uid(), text: 'Neuer Text', start: state.playhead, end: state.playhead + 3,
    x: 0.5, y: 0.5, size: 7, color: '#ffffff', bg: 'none', font: 'Inter',
    weight: 800, align: 'center', anim: 'fade', style: 'title', stroke: true,
  }, t || {});
  state.texts.push(tx);
  return tx;
}

export function select(type, id) {
  state.selection = { type, id };
  emit('select');
}

export function rememberLook(grade) { lastLook = { ...grade }; }

// ---- Undo / Redo ----
const history = [];
const future = [];
const MAX = 60;

function snapshot() {
  return JSON.stringify({
    aspectRatio: state.aspectRatio,
    clips: state.clips,
    audioClips: state.audioClips,
    texts: state.texts,
    frame: state.frame,
    letterbox: state.letterbox,
    safezone: state.safezone,
    muteBroll: state.muteBroll,
    projectName: state.projectName,
  });
}

let baseline = snapshot();

export function commit() {
  history.push(baseline);
  if (history.length > MAX) history.shift();
  future.length = 0;
  baseline = snapshot();
  updateUndoButtons();
}

function restore(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  recompute();
  emit('history');
}

export function undo() {
  if (!history.length) return;
  future.push(snapshot());
  const prev = history.pop();
  restore(prev);
  baseline = prev;
  updateUndoButtons();
}

export function redo() {
  if (!future.length) return;
  history.push(snapshot());
  const next = future.pop();
  restore(next);
  baseline = next;
  updateUndoButtons();
}

function updateUndoButtons() {
  const u = document.getElementById('undoBtn');
  const r = document.getElementById('redoBtn');
  if (u) u.disabled = history.length === 0;
  if (r) r.disabled = future.length === 0;
}
export { updateUndoButtons };
