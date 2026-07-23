// Wiedergabe-Engine: Master-Uhr, Video-Synchronisation, Audio-Mix (WebAudio).
import { state, clipAt, sourceTimeFor, clipDur, recompute } from './state.js';
import { renderFrame, dimsFor, setResolution } from './renderer.js';

let audioCtx = null;
let masterGain, brollGain, voiceGain, streamDest;
let scheduled = [];         // laufende AudioBufferSourceNodes
let playStartCtx = 0, playStartHead = 0;
let raf = 0;
let activeClipId = null;
let onFrameCb = null;
let exportMode = null;     // { w, h } während des Exports
const PREVIEW_BASE = 720;

export function beginExport(w, h) { exportMode = { w, h }; }
export function endExport() { exportMode = null; refreshResolution(); }

export function initEngine(onFrame) {
  onFrameCb = onFrame;
}

function ensureAudio() {
  if (audioCtx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AC();
  masterGain = audioCtx.createGain();
  brollGain = audioCtx.createGain();
  voiceGain = audioCtx.createGain();
  brollGain.connect(masterGain);
  voiceGain.connect(masterGain);
  masterGain.connect(audioCtx.destination);
}

// MediaElementSource pro Video-Quelle (einmalig).
function connectVideoAudio(src) {
  if (!audioCtx || src._mediaNode || !src.el) return;
  try {
    const node = audioCtx.createMediaElementSource(src.el);
    node.connect(brollGain);
    src._mediaNode = node;
  } catch (e) { /* schon verbunden */ }
}

export function now() {
  if (state.playing && audioCtx) return playStartHead + (audioCtx.currentTime - playStartCtx);
  return state.playhead;
}

// Render-Optionen für Zeit t zusammenstellen.
function optsAt(t, preview = true) {
  const clip = clipAt(t);
  let source = null, grade = null;
  if (clip) {
    const src = state.sources[clip.srcId];
    if (src && src.el && src.el.readyState >= 2) {
      source = { el: src.el, w: src.width || src.el.videoWidth, h: src.height || src.el.videoHeight };
      grade = clip.grade;
    }
  }
  return {
    source, grade,
    texts: state.texts,
    frame: state.frame,
    letterbox: state.letterbox,
    safezone: state.safezone,
    ratio: state.aspectRatio,
    time: t,
    preview,
  };
}

// Video-Elemente an die Master-Uhr anpassen.
function syncVideo(t, playing) {
  const clip = clipAt(t);
  if (!clip) { activeClipId = null; return; }
  const src = state.sources[clip.srcId];
  if (!src || !src.el) return;
  const target = sourceTimeFor(clip, t);

  // vorherigen Clip anhalten, wenn gewechselt
  if (activeClipId && activeClipId !== clip.id) {
    const prev = state.clips.find(c => c.id === activeClipId);
    if (prev) { const ps = state.sources[prev.srcId]; if (ps && ps.el && ps.el !== src.el) ps.el.pause(); }
  }
  activeClipId = clip.id;

  if (playing) {
    if (src.el.paused) { src.el.currentTime = clampSrcTime(src, target); src.el.play().catch(() => {}); }
    else if (Math.abs(src.el.currentTime - target) > 0.3) src.el.currentTime = clampSrcTime(src, target);
  } else {
    src.el.pause();
    src.el.currentTime = clampSrcTime(src, target);
  }
}

function clampSrcTime(src, t) {
  return Math.max(0, Math.min((src.duration || 1e9) - 0.05, t));
}

function drawAt(t, preview = true) {
  const { w, h } = dimsFor(state.aspectRatio, PREVIEW_BASE);
  if (getCanvasW() !== w || getCanvasH() !== h) setResolution(w, h);
  renderFrame(optsAt(t, preview));
}

let _cw = 0, _ch = 0;
function getCanvasW() { return _cw; }
function getCanvasH() { return _ch; }

export function refreshResolution() {
  const { w, h } = dimsFor(state.aspectRatio, PREVIEW_BASE);
  setResolution(w, h); _cw = w; _ch = h;
}

// Einzelbild neu zeichnen (nach Bearbeitung, ohne Abspielen).
export function renderNow() {
  if (state.playing) return; // während der Wiedergabe zeichnet die Loop
  refreshResolution();
  syncVideo(state.playhead, false);
  drawAt(state.playhead, true);
  // Sobald das Videobild fertig geladen/gesucht ist, nachzeichnen.
  const clip = clipAt(state.playhead);
  if (clip) {
    const s = state.sources[clip.srcId];
    if (s && s.el) {
      const redraw = () => { s.el.removeEventListener('seeked', redraw); s.el.removeEventListener('loadeddata', redraw); if (!state.playing) drawAt(state.playhead, true); };
      s.el.addEventListener('seeked', redraw, { once: true });
      s.el.addEventListener('loadeddata', redraw, { once: true });
    }
  }
  requestAnimationFrame(() => { if (!state.playing) drawAt(state.playhead, true); });
}

function scheduleAudio(fromHead) {
  stopScheduled();
  if (!audioCtx) return;
  const base = audioCtx.currentTime + 0.06;
  for (const a of state.audioClips) {
    const src = state.sources[a.srcId];
    if (!src || !src.audioBuffer) continue;
    const clipStart = a.start;
    const clipEnd = a.start + (a.out - a.in);
    if (clipEnd <= fromHead) continue;                    // schon vorbei
    const when = base + Math.max(0, clipStart - fromHead);
    const offset = a.in + Math.max(0, fromHead - clipStart);
    const dur = (a.out) - offset;
    if (dur <= 0) continue;
    const node = audioCtx.createBufferSource();
    node.buffer = src.audioBuffer;
    const g = audioCtx.createGain();
    g.gain.value = a.volume ?? 1;
    node.connect(g); g.connect(voiceGain);
    try { node.start(when, offset, dur); } catch (e) {}
    scheduled.push(node);
  }
}

function stopScheduled() {
  for (const n of scheduled) { try { n.stop(); } catch (e) {} }
  scheduled = [];
}

function loop() {
  const t = now();
  if (t >= state.duration) { pause(); seek(state.duration); return; }
  state.playhead = t;
  syncVideo(t, true);
  if (exportMode) drawExportFrame(t, exportMode.w, exportMode.h);
  else drawAt(t, true);
  if (onFrameCb) onFrameCb(t);
  raf = requestAnimationFrame(loop);
}

export function play() {
  if (state.playing) return;
  if (state.duration <= 0) return;
  ensureAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  for (const id in state.sources) if (state.sources[id].kind === 'video') connectVideoAudio(state.sources[id]);
  brollGain.gain.value = state.muteBroll ? 0 : 1;

  if (state.playhead >= state.duration - 0.05) state.playhead = 0;
  state.playing = true;
  playStartCtx = audioCtx.currentTime;
  playStartHead = state.playhead;
  scheduleAudio(state.playhead);
  raf = requestAnimationFrame(loop);
  if (onFrameCb) onFrameCb(state.playhead, true);
}

export function pause() {
  if (!state.playing) return;
  state.playing = false;
  cancelAnimationFrame(raf);
  stopScheduled();
  for (const id in state.sources) { const s = state.sources[id]; if (s.el) s.el.pause(); }
  if (onFrameCb) onFrameCb(state.playhead, true);
}

export function toggle() { state.playing ? pause() : play(); }

export function seek(t) {
  t = Math.max(0, Math.min(state.duration, t));
  state.playhead = t;
  if (state.playing) {
    playStartCtx = audioCtx.currentTime;
    playStartHead = t;
    scheduleAudio(t);
    syncVideo(t, true);
  } else {
    syncVideo(t, false);
    drawAt(t, true);
    requestAnimationFrame(() => drawAt(t, true));
  }
  if (onFrameCb) onFrameCb(t, true);
}

export function setBrollMuted(m) {
  state.muteBroll = m;
  if (brollGain) brollGain.gain.value = m ? 0 : 1;
}

// ---------- Export-Unterstützung ----------
export function getAudioContext() { ensureAudio(); return audioCtx; }

export function buildExportAudioStream() {
  ensureAudio();
  if (!streamDest) streamDest = audioCtx.createMediaStreamDestination();
  else { try { masterGain.disconnect(streamDest); } catch (e) {} }
  masterGain.connect(streamDest);
  return streamDest.stream;
}

// Für den Export: Frame zu Zeit t in voller Zielauflösung zeichnen.
export function drawExportFrame(t, w, h) {
  setResolution(w, h);
  renderFrame(optsAt(t, false));
}

export function prepareExportVideoElements() {
  ensureAudio();
  for (const id in state.sources) if (state.sources[id].kind === 'video') connectVideoAudio(state.sources[id]);
  brollGain.gain.value = state.muteBroll ? 0 : 1;
}
