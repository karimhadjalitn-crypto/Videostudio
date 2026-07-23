// Cinema Studio – Einstiegspunkt: verbindet alle Module.
import { $, $$, fmtTime, el, toast } from './util.js';
import { state, subscribe, emit, commit, recompute, undo, redo, select, updateUndoButtons } from './state.js';
import { initRenderer, getCanvas } from './renderer.js';
import { initEngine, toggle, play, pause, seek, renderNow, setBrollMuted, refreshResolution, now } from './engine.js';
import { importVideos, importAudio, initMediaPanels } from './media.js';
import { initTimeline, render as renderTimeline, updatePlayhead } from './timeline.js';
import { initFilters } from './filters.js';
import { initText } from './text.js';
import { initReference, importReferences } from './reference.js';
import { runCommand, EXAMPLES, autoEdit } from './ai.js';
import { initExport } from './export.js';
import { ensureFonts } from './fonts.js';

async function boot() {
  initRenderer(getCanvasEl());
  refreshResolution();
  initEngine(onFrame);
  initMediaPanels();
  initTimeline({ seek, now });
  initFilters();
  initText();
  initReference();
  initExport();

  wireTopbar();
  wireRail();
  wireTransport();
  wireDropzones();
  wireFrameControls();
  wireAudioControls();
  wireAI();
  wireKeyboard();
  wireMobilePanelClose();

  subscribe(onStateChange);
  updateUndoButtons();
  updateEmpty();

  // Kleiner Zugriffspunkt (z.B. für Automatisierung/Debugging)
  window.CinemaStudio = { state, runCommand, importVideos, importAudio, importReferences, autoEdit, renderNow };

  await ensureFonts();
  renderNow();
}

function getCanvasEl() { return document.getElementById('preview'); }

// ---- Frame-Callback (Wiedergabe) ----
function onFrame(t) {
  updatePlayhead(t);
  $('#timecode').textContent = `${fmtTime(t)} / ${fmtTime(state.duration)}`;
  const pp = $('#playPause');
  pp.textContent = state.playing ? '⏸' : '▶';
  updateEmpty();
}

// ---- Zustandsänderungen ----
function onStateChange(_s, reason) {
  renderTimeline();
  syncFormat();
  syncFrameControls();
  $('#timecode').textContent = `${fmtTime(state.playhead)} / ${fmtTime(state.duration)}`;
  updateEmpty();
  if (!state.playing && reason === 'history') renderNow();
}

function updateEmpty() {
  const empty = $('#viewerEmpty');
  const has = state.clips.length || state.texts.length;
  empty.style.display = has ? 'none' : 'flex';
}

// ---- Topbar ----
function wireTopbar() {
  const pn = $('#projectName');
  pn.addEventListener('change', () => { state.projectName = pn.value; commit(); });

  $('#formatSwitch').addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    state.aspectRatio = btn.dataset.ratio;
    syncFormat();
    refreshResolution();
    renderNow();
    commit(); emit('format');
  });

  $('#undoBtn').addEventListener('click', () => { undo(); afterHistory(); });
  $('#redoBtn').addEventListener('click', () => { redo(); afterHistory(); });
}

function afterHistory() { syncFormat(); syncFrameControls(); renderTimeline(); renderNow(); }

function syncFormat() {
  $$('#formatSwitch button').forEach(b => b.classList.toggle('active', b.dataset.ratio === state.aspectRatio));
}

// ---- Rail / Panels ----
function wireRail() {
  const rail = $('#railbar');
  rail.addEventListener('click', (e) => {
    const btn = e.target.closest('.rail-btn'); if (!btn) return;
    openPanel(btn.dataset.panel);
  });
  window.addEventListener('cs:panel', (e) => openPanel(e.detail));
}

function openPanel(name) {
  const panelEl = $('#panel');
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  const wasActive = document.querySelector(`.rail-btn[data-panel="${name}"]`)?.classList.contains('active');
  // Auf dem Handy: erneutes Tippen auf das aktive Werkzeug schließt das Panel wieder.
  if (isMobile && wasActive && panelEl.classList.contains('open')) { panelEl.classList.remove('open'); return; }
  $$('.rail-btn').forEach(b => b.classList.toggle('active', b.dataset.panel === name));
  $$('.panel-page').forEach(p => p.classList.toggle('active', p.dataset.page === name));
  panelEl.classList.add('open'); // Mobile: einblenden
}

// Auf dem Handy: Tippen auf die Vorschau schließt das Werkzeug-Panel.
function wireMobilePanelClose() {
  $('.stage').addEventListener('click', () => {
    if (window.matchMedia('(max-width: 900px)').matches) $('#panel').classList.remove('open');
  });
}

// ---- Transport ----
function wireTransport() {
  $('#playPause').addEventListener('click', () => toggle());
  $('#skipStart').addEventListener('click', () => seek(0));
  $('#skipEnd').addEventListener('click', () => seek(state.duration));
  $('#splitBtn').addEventListener('click', () => runCommand('teile hier'));
}

// ---- Dropzones + Drag&Drop ----
function wireDropzones() {
  $('#videoInput').addEventListener('change', (e) => { importVideos(e.target.files); e.target.value = ''; });
  $('#audioInput').addEventListener('change', (e) => { importAudio(e.target.files); e.target.value = ''; });

  setupDrop($('#videoDrop'), (files) => importVideos(files), 'video/');
  setupDrop($('#audioDrop'), (files) => importAudio(files), 'audio/');
  setupDrop($('#refDrop'), (files) => importReferences(files), null);

  // Video direkt auf die Vorschau ziehen
  const stage = $('#viewer');
  ['dragover', 'dragenter'].forEach(ev => stage.addEventListener(ev, (e) => { e.preventDefault(); }));
  stage.addEventListener('drop', (e) => {
    e.preventDefault();
    const vids = [...e.dataTransfer.files].filter(f => f.type.startsWith('video/'));
    if (vids.length) importVideos(vids);
  });

  $('#autoEditBtn').addEventListener('click', () => autoEdit());
}

function setupDrop(zone, cb, filterPrefix) {
  if (!zone) return;
  ['dragover', 'dragenter'].forEach(ev => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('drag'); }));
  ['dragleave', 'dragend'].forEach(ev => zone.addEventListener(ev, () => zone.classList.remove('drag')));
  zone.addEventListener('drop', (e) => {
    e.preventDefault(); zone.classList.remove('drag');
    let files = [...e.dataTransfer.files];
    if (filterPrefix) files = files.filter(f => f.type.startsWith(filterPrefix));
    if (files.length) cb(files);
  });
}

// ---- Frame / Format Panel ----
function wireFrameControls() {
  const bind = (id, fn, evt = 'input') => $('#' + id).addEventListener(evt, fn);

  $('#frameToggle').addEventListener('change', (e) => { state.frame.enabled = e.target.checked; toggleSub('#frameControls', e.target.checked); renderNow(); commit(); emit('frame'); });
  bind('frameRadius', (e) => { state.frame.radius = +e.target.value; $('#radiusOut').textContent = e.target.value; renderNow(); });
  bind('frameMargin', (e) => { state.frame.margin = +e.target.value; $('#marginOut').textContent = e.target.value; renderNow(); });
  bind('frameColor', (e) => { state.frame.color = e.target.value; renderNow(); });
  $('#frameRadius').addEventListener('change', () => commit());
  $('#frameMargin').addEventListener('change', () => commit());
  $('#frameColor').addEventListener('change', () => commit());

  $('#letterboxToggle').addEventListener('change', (e) => { state.letterbox.enabled = e.target.checked; toggleSub('#letterboxControls', e.target.checked); renderNow(); commit(); emit('frame'); });
  bind('letterboxSize', (e) => { state.letterbox.size = +e.target.value; $('#lbOut').textContent = e.target.value; renderNow(); });
  $('#letterboxSize').addEventListener('change', () => commit());

  $('#safezoneToggle').addEventListener('change', (e) => { state.safezone = e.target.checked; renderNow(); });

  syncFrameControls();
}

function toggleSub(sel, on) { $(sel).classList.toggle('disabled', !on); }

function syncFrameControls() {
  $('#frameToggle').checked = state.frame.enabled;
  $('#frameRadius').value = state.frame.radius; $('#radiusOut').textContent = state.frame.radius;
  $('#frameMargin').value = state.frame.margin; $('#marginOut').textContent = state.frame.margin;
  $('#frameColor').value = state.frame.color;
  $('#letterboxToggle').checked = state.letterbox.enabled;
  $('#letterboxSize').value = state.letterbox.size; $('#lbOut').textContent = state.letterbox.size;
  $('#safezoneToggle').checked = state.safezone;
  toggleSub('#frameControls', state.frame.enabled);
  toggleSub('#letterboxControls', state.letterbox.enabled);
}

// ---- Audio ----
function wireAudioControls() {
  $('#muteBroll').addEventListener('change', (e) => { setBrollMuted(e.target.checked); commit(); });
}

// ---- KI-Bar ----
function wireAI() {
  const input = $('#aiInput');
  const send = () => { const v = input.value.trim(); if (!v) return; runCommand(v); input.value = ''; };
  $('#aiSend').addEventListener('click', send);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });

  const help = $('#helpModal');
  const list = $('#helpList');
  EXAMPLES.forEach(ex => {
    const li = el('li', { text: ex });
    li.addEventListener('click', () => { input.value = ex; help.classList.add('hidden'); input.focus(); });
    list.appendChild(li);
  });
  $('#aiHelp').addEventListener('click', () => help.classList.remove('hidden'));
  $('#helpClose').addEventListener('click', () => help.classList.add('hidden'));
  help.addEventListener('click', (e) => { if (e.target === help) help.classList.add('hidden'); });
}

// ---- Tastatur ----
function wireKeyboard() {
  window.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { /* Feld-eigenes Undo */ }
      return;
    }
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); seek(state.playhead - (e.shiftKey ? 5 : 1)); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); seek(state.playhead + (e.shiftKey ? 5 : 1)); }
    else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) { runCommand('teile hier'); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) { redo(); } else { undo(); } afterHistory(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); afterHistory(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelected(); }
  });
}

function deleteSelected() {
  const { type, id } = state.selection;
  if (!type) return;
  if (type === 'clip') { const i = state.clips.findIndex(c => c.id === id); if (i >= 0) state.clips.splice(i, 1); }
  else if (type === 'text') { const i = state.texts.findIndex(t => t.id === id); if (i >= 0) state.texts.splice(i, 1); }
  else if (type === 'audio') { const i = state.audioClips.findIndex(a => a.id === id); if (i >= 0) state.audioClips.splice(i, 1); }
  state.selection = { type: null, id: null };
  recompute(); commit(); emit('delete');
  renderNow();
}

boot();
