// Import von Video- und Audiodateien, Thumbnails, Medien-Panels.
import { state, addVideoClip, addAudioClip, recompute, commit, emit, select, subscribe } from './state.js';
import { uid, el, $, toast, fmtTime } from './util.js';
import { getAudioContext, renderNow } from './engine.js';

let pool = null;
function mediaPool() {
  if (!pool) {
    pool = el('div', { style: 'position:absolute;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;left:-9999px' });
    document.body.appendChild(pool);
  }
  return pool;
}

function loadVideoMeta(url) {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.src = url; v.preload = 'auto'; v.playsInline = true; v.muted = false;
    v.crossOrigin = 'anonymous';
    mediaPool().appendChild(v);
    v.addEventListener('loadedmetadata', async () => {
      // Manche Dateien (z.B. Aufnahmen) liefern erst keine gültige Dauer.
      if (!isFinite(v.duration) || v.duration <= 0) {
        await new Promise((res) => {
          let settled = false;
          const finish = () => { if (settled) return; settled = true; v.removeEventListener('timeupdate', onU); try { v.currentTime = 0; } catch (e) {} res(); };
          const onU = () => { if (isFinite(v.duration) && v.duration > 0) finish(); };
          v.addEventListener('timeupdate', onU);
          try { v.currentTime = 1e6; } catch (e) {}
          setTimeout(finish, 1500);
        });
      }
      resolve(v);
    }, { once: true });
    v.addEventListener('error', () => reject(new Error('Video konnte nicht geladen werden')), { once: true });
  });
}

function makeThumb(v) {
  return new Promise((resolve) => {
    const draw = () => {
      const c = document.createElement('canvas');
      c.width = 160; c.height = 90;
      const cx = c.getContext('2d');
      const ar = v.videoWidth / v.videoHeight;
      let dw = 160, dh = 160 / ar, dy = (90 - dh) / 2, dx = 0;
      if (dh < 90) { dh = 90; dw = 90 * ar; dx = (160 - dw) / 2; dy = 0; }
      try { cx.drawImage(v, dx, dy, dw, dh); } catch (e) {}
      resolve(c.toDataURL('image/jpeg', 0.7));
    };
    const t = Math.min(0.1, (v.duration || 1) / 2);
    if (Math.abs(v.currentTime - t) < 0.05 && v.readyState >= 2) { draw(); return; }
    v.addEventListener('seeked', function once() { v.removeEventListener('seeked', once); draw(); });
    try { v.currentTime = t; } catch (e) { setTimeout(draw, 200); }
  });
}

export async function importVideos(files) {
  let first = null;
  for (const file of files) {
    if (!file.type.startsWith('video/')) continue;
    try {
      const url = URL.createObjectURL(file);
      const v = await loadVideoMeta(url);
      const thumb = await makeThumb(v);
      const dur = (isFinite(v.duration) && v.duration > 0) ? v.duration : 5;
      const src = {
        id: uid(), name: file.name, kind: 'video', url, el: v,
        duration: dur, width: v.videoWidth || 1280, height: v.videoHeight || 720, thumbUrl: thumb,
      };
      state.sources[src.id] = src;
      const clip = addVideoClip(src);
      if (!first) first = clip;
    } catch (e) {
      toast('❌ „' + file.name + '“ konnte nicht geladen werden.', 'err');
    }
  }
  if (first) {
    recompute(); commit();
    select('clip', first.id);
    emit('import');
    renderNow();
    toast('🎞️ B-Roll hinzugefügt.', 'ok');
  }
}

export async function importAudio(files) {
  const ctx = getAudioContext();
  let added = false;
  for (const file of files) {
    if (!file.type.startsWith('audio/')) continue;
    try {
      const url = URL.createObjectURL(file);
      const buf = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(buf.slice(0));
      const src = {
        id: uid(), name: file.name, kind: 'audio', url,
        duration: audioBuffer.duration, audioBuffer,
      };
      state.sources[src.id] = src;
      addAudioClip(src);
      added = true;
    } catch (e) {
      toast('❌ Audio „' + file.name + '“ nicht lesbar.', 'err');
    }
  }
  if (added) {
    recompute(); commit(); emit('import'); renderNow();
    toast('🎙️ Ton hinzugefügt.', 'ok');
  }
}

export function deleteClip(id) {
  const i = state.clips.findIndex(c => c.id === id);
  if (i < 0) return;
  state.clips.splice(i, 1);
  if (state.selection.id === id) state.selection = { type: null, id: null };
  recompute(); commit(); emit('delete'); renderNow();
}

export function deleteAudio(id) {
  const i = state.audioClips.findIndex(a => a.id === id);
  if (i < 0) return;
  state.audioClips.splice(i, 1);
  recompute(); commit(); emit('delete'); renderNow();
}

// ---------- Panels ----------
export function initMediaPanels() {
  const clipList = $('#clipList');
  const audioList = $('#audioLayerList');

  function renderClipList() {
    clipList.innerHTML = '';
    if (!state.clips.length) {
      clipList.appendChild(el('p', { class: 'hint', text: 'Noch keine Clips. Lade oben Deine B-Roll hoch.' }));
      return;
    }
    state.clips.forEach((c, idx) => {
      const src = state.sources[c.srcId];
      const card = el('div', { class: 'clip-card' + (state.selection.id === c.id ? ' sel' : '') },
        el('img', { class: 'clip-thumb', src: src?.thumbUrl || '' }),
        el('div', { class: 'clip-meta' },
          el('div', { class: 'cm-name', text: `${idx + 1}. ${src?.name || 'Clip'}` }),
          el('div', { class: 'cm-sub', text: fmtTime(c.out - c.in) + ' · ' + (src?.width || '?') + '×' + (src?.height || '?') }),
        ),
        el('button', { class: 'card-del', title: 'Entfernen', onclick: (e) => { e.stopPropagation(); deleteClip(c.id); } }, '🗑'),
      );
      card.addEventListener('click', () => select('clip', c.id));
      clipList.appendChild(card);
    });
  }

  function renderAudioList() {
    audioList.innerHTML = '';
    if (!state.audioClips.length) return;
    state.audioClips.forEach((a) => {
      const src = state.sources[a.srcId];
      const vol = el('input', { type: 'range', min: 0, max: 150, value: Math.round((a.volume ?? 1) * 100),
        oninput: (e) => { a.volume = e.target.value / 100; } });
      vol.addEventListener('change', () => { commit(); });
      const card = el('div', { class: 'layer-card' + (state.selection.id === a.id ? ' sel' : '') },
        el('div', { class: 'clip-meta' },
          el('div', { class: 'cm-name', text: '🎙️ ' + (a.name || 'Audio') }),
          el('div', { class: 'cm-sub', text: fmtTime(a.out - a.in) }),
          vol,
        ),
        el('button', { class: 'card-del', title: 'Entfernen', onclick: (e) => { e.stopPropagation(); deleteAudio(a.id); } }, '🗑'),
      );
      card.addEventListener('click', () => select('audio', a.id));
      audioList.appendChild(card);
    });
  }

  subscribe(() => { renderClipList(); renderAudioList(); });
  renderClipList(); renderAudioList();
}
