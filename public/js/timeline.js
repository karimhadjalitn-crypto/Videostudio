// Timeline: Clips anzeigen, verschieben, trimmen, teilen, scrubben.
import { state, recompute, commit, emit, select, clipDur, clipAt } from './state.js';
import { el, $, clamp } from './util.js';

let scroll, ruler, trackV, trackT, trackA, playhead;
let api = { seek: () => {}, now: () => state.playhead };

export function initTimeline(engineApi) {
  api = engineApi;
  scroll = $('#tlScroll'); ruler = $('#tlRuler');
  trackV = $('#trackVideo'); trackT = $('#trackText'); trackA = $('#trackAudio');
  playhead = $('#playhead');

  // Scrubbing im Lineal / leeren Bereich
  ruler.addEventListener('pointerdown', beginScrub);
  scroll.addEventListener('pointerdown', (e) => {
    if (e.target === scroll || e.target.classList.contains('tl-tracks') || e.target.classList.contains('tl-track') || e.target.classList.contains('tl-track-clips')) {
      beginScrub(e);
    }
  });

  $('#zoomIn').addEventListener('click', () => { state.zoom = clamp(state.zoom * 1.3, 20, 600); render(); });
  $('#zoomOut').addEventListener('click', () => { state.zoom = clamp(state.zoom / 1.3, 20, 600); render(); });

  render();
}

const pps = () => state.zoom;

function beginScrub(e) {
  const move = (ev) => {
    const rect = scroll.getBoundingClientRect();
    const x = ev.clientX - rect.left + scroll.scrollLeft;
    api.seek(clamp(x / pps(), 0, state.duration));
  };
  move(e);
  const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

export function updatePlayhead(t) {
  if (!playhead) return;
  playhead.style.left = (t * pps()) + 'px';
}

function niceStep(pxPerSec) {
  const targetPx = 70;
  const steps = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
  for (const s of steps) if (s * pxPerSec >= targetPx) return s;
  return 600;
}

function makeHandles(onLeft, onRight) {
  const l = el('div', { class: 'handle l' });
  const r = el('div', { class: 'handle r' });
  l.addEventListener('pointerdown', (e) => startDrag(e, onLeft));
  r.addEventListener('pointerdown', (e) => startDrag(e, onRight));
  return [l, r];
}

function startDrag(e, onMove) {
  e.stopPropagation();
  e.preventDefault();
  const startX = e.clientX;
  const move = (ev) => onMove((ev.clientX - startX) / pps(), ev);
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    recompute(); commit(); emit('trim');
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

export function render() {
  if (!scroll) return;
  const dur = Math.max(state.duration, 6);
  const width = dur * pps() + 40;

  // Lineal
  ruler.style.width = width + 'px';
  ruler.innerHTML = '';
  const step = niceStep(pps());
  for (let t = 0; t <= dur; t += step) {
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    ruler.appendChild(el('div', { class: 'tick', style: `left:${t * pps()}px`, text: `${m}:${String(s).padStart(2, '0')}` }));
  }
  $('#tlTracks').style.width = width + 'px';

  // Video-Clips
  trackV.innerHTML = '';
  state.clips.forEach((c) => {
    const src = state.sources[c.srcId];
    const clip = el('div', { class: 'tl-clip video' + (state.selection.id === c.id ? ' sel' : ''),
      style: `left:${c.start * pps()}px; width:${clipDur(c) * pps()}px` });
    if (src?.thumbUrl) {
      const tw = el('div', { class: 'thumbs' });
      const n = Math.max(1, Math.round(clipDur(c) * pps() / 60));
      for (let i = 0; i < n; i++) tw.appendChild(el('img', { src: src.thumbUrl }));
      clip.appendChild(tw);
    }
    clip.appendChild(el('div', { class: 'clip-label', text: src?.name || 'Clip' }));
    const [l, r] = makeHandles(
      (d) => { const nd = clamp(c.in + d, 0, c.out - 0.2); c.in = nd; recompute(); render(); },
      (d) => { const nd = clamp(c.out + d, c.in + 0.2, src?.duration || c.out + d); c.out = nd; recompute(); render(); },
    );
    clip.append(l, r);
    clip.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('handle')) return;
      select('clip', c.id);
      startClipReorder(e, c);
    });
    trackV.appendChild(clip);
  });

  // Text-Clips
  trackT.innerHTML = '';
  state.texts.forEach((tx) => {
    const clip = el('div', { class: 'tl-clip text' + (state.selection.id === tx.id ? ' sel' : ''),
      style: `left:${tx.start * pps()}px; width:${Math.max(0.3, tx.end - tx.start) * pps()}px` });
    clip.appendChild(el('div', { class: 'clip-label', text: 'T ' + (tx.text || '').slice(0, 18) }));
    const [l, r] = makeHandles(
      (d) => { tx.start = clamp(tx.start + d, 0, tx.end - 0.2); render(); },
      (d) => { tx.end = clamp(tx.end + d, tx.start + 0.2, state.duration + 30); render(); },
    );
    clip.append(l, r);
    clip.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('handle')) return;
      select('text', tx.id);
      startFreeMove(e, tx, 'start', 'end');
    });
    trackT.appendChild(clip);
  });

  // Audio-Clips
  trackA.innerHTML = '';
  state.audioClips.forEach((a) => {
    const src = state.sources[a.srcId];
    const clip = el('div', { class: 'tl-clip audio' + (state.selection.id === a.id ? ' sel' : ''),
      style: `left:${a.start * pps()}px; width:${Math.max(0.3, a.out - a.in) * pps()}px` });
    const wave = waveFor(src);
    if (wave) clip.appendChild(el('img', { class: 'wave', src: wave }));
    clip.appendChild(el('div', { class: 'clip-label', text: '🎙 ' + (a.name || 'Audio') }));
    const [l, r] = makeHandles(
      (d) => { const nd = clamp(d, -a.start, a.out - a.in - 0.2); a.start += nd; a.in += nd; render(); },
      (d) => { a.out = clamp(a.out + d, a.in + 0.2, src?.duration || a.out + d); render(); },
    );
    clip.append(l, r);
    clip.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('handle')) return;
      select('audio', a.id);
      startAudioMove(e, a);
    });
    trackA.appendChild(clip);
  });

  updatePlayhead(api.now ? api.now() : state.playhead);
}

// Video-Clips per Ziehen neu anordnen.
function startClipReorder(e, c) {
  e.preventDefault();
  const startX = e.clientX;
  let moved = false;
  const move = (ev) => {
    if (Math.abs(ev.clientX - startX) < 4 && !moved) return;
    moved = true;
    const rect = scroll.getBoundingClientRect();
    const x = ev.clientX - rect.left + scroll.scrollLeft;
    const others = state.clips.filter(o => o !== c);
    let idx = 0, acc = 0;
    for (const o of others) { const w = clipDur(o); if (x > (acc + w / 2) * pps()) idx++; acc += w; }
    const cur = state.clips.indexOf(c);
    if (cur !== idx) {
      state.clips.splice(cur, 1);
      state.clips.splice(idx, 0, c);
      recompute(); render();
    }
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    if (moved) { commit(); emit('reorder'); }
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function startFreeMove(e, obj, startKey, endKey) {
  e.preventDefault();
  const startX = e.clientX;
  const s0 = obj[startKey], e0 = obj[endKey], len = e0 - s0;
  const move = (ev) => {
    const d = (ev.clientX - startX) / pps();
    obj[startKey] = Math.max(0, s0 + d);
    obj[endKey] = obj[startKey] + len;
    render();
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    recompute(); commit(); emit('move');
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function startAudioMove(e, a) {
  e.preventDefault();
  const startX = e.clientX;
  const s0 = a.start;
  const move = (ev) => { a.start = Math.max(0, s0 + (ev.clientX - startX) / pps()); render(); };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    recompute(); commit(); emit('move');
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

// Einfache Wellenform aus dem AudioBuffer (einmal je Quelle gecacht).
function waveFor(src) {
  if (!src || !src.audioBuffer) return null;
  if (src._wave) return src._wave;
  try {
    const buf = src.audioBuffer;
    const data = buf.getChannelData(0);
    const W = 600, H = 40;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const cx = c.getContext('2d');
    cx.fillStyle = 'rgba(70,202,188,0.8)';
    const bucket = Math.floor(data.length / W) || 1;
    for (let i = 0; i < W; i++) {
      let max = 0;
      for (let j = 0; j < bucket; j += 8) { const v = Math.abs(data[i * bucket + j] || 0); if (v > max) max = v; }
      const h = Math.max(1, max * H);
      cx.fillRect(i, (H - h) / 2, 1, h);
    }
    src._wave = c.toDataURL('image/png');
    return src._wave;
  } catch (e) { return null; }
}
