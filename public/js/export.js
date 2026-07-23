// Export via MediaRecorder: nimmt die Komposition in Echtzeit in Zielauflösung auf.
import { state } from './state.js';
import { $, download, toast } from './util.js';
import { dimsFor, getCanvas } from './renderer.js';
import { pause, seek, play, buildExportAudioStream, beginExport, endExport, prepareExportVideoElements, renderNow } from './engine.js';

let modal, recorder, chunks, progressTimer, running = false;

const MIMES = ['video/mp4;codecs=avc1.640028', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

function pickMime() {
  for (const m of MIMES) if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
  return '';
}

export function initExport() {
  modal = $('#exportModal');
  $('#exportBtn').addEventListener('click', open);
  $('#exportCancel').addEventListener('click', () => { if (running) stop(true); else modal.classList.add('hidden'); });
  $('#exportStart').addEventListener('click', start);
  modal.addEventListener('click', (e) => { if (e.target === modal && !running) modal.classList.add('hidden'); });

  window.addEventListener('cs:export', (e) => { open(); if (e.detail?.fourk) $('#expRes').value = '2160'; });
}

function open() {
  if (!state.clips.length && !state.texts.length) { toast('Nichts zu exportieren – füge zuerst B-Roll hinzu.', 'err'); return; }
  $('#exportProgress').classList.add('hidden');
  $('#exportResult').classList.add('hidden');
  $('#epFill').style.width = '0%';
  $('#exportStart').disabled = false;
  $('#exportStart').textContent = 'Aufnahme starten';
  modal.classList.remove('hidden');
}

function bitrate(res, q) {
  const map = { 2160: 42e6, 1440: 22e6, 1080: 13e6, 720: 6e6 };
  const b = map[res] || 12e6;
  return q === 'medium' ? b * 0.55 : b;
}

async function start() {
  if (running) return;
  const res = Number($('#expRes').value);
  const q = $('#expQuality').value;
  const { w, h } = dimsFor(state.aspectRatio, res);

  const mime = pickMime();
  if (!window.MediaRecorder) { toast('Dein Browser unterstützt keine Aufnahme.', 'err'); return; }

  pause();
  seek(0);
  prepareExportVideoElements();
  beginExport(w, h);
  // ersten Frame in Zielgröße zeichnen, damit der Stream Maße hat
  renderNow();
  await new Promise(r => setTimeout(r, 60));

  const canvas = getCanvas();
  const fps = 30;
  const vStream = canvas.captureStream(fps);
  let stream = vStream;
  try {
    const aStream = buildExportAudioStream();
    stream = new MediaStream([...vStream.getVideoTracks(), ...aStream.getAudioTracks()]);
  } catch (e) { /* nur Video */ }

  chunks = [];
  try {
    recorder = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: bitrate(res, q) });
  } catch (e) { toast('Aufnahme fehlgeschlagen: ' + e.message, 'err'); endExport(); return; }

  recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  recorder.onstop = () => finalize(mime);

  running = true;
  $('#exportProgress').classList.remove('hidden');
  $('#exportStart').disabled = true;
  $('#exportStart').textContent = 'Nimmt auf …';

  recorder.start(250);
  seek(0);
  play();

  const total = Math.max(0.5, state.duration);
  progressTimer = setInterval(() => {
    const p = Math.min(100, (state.playhead / total) * 100);
    $('#epFill').style.width = p.toFixed(1) + '%';
    $('#epLabel').textContent = `Aufnahme läuft … ${Math.round(p)}%`;
    if (!state.playing || state.playhead >= total - 0.05) stop(false);
  }, 120);
}

function stop(cancelled) {
  if (!running) return;
  running = false;
  clearInterval(progressTimer);
  pause();
  try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch (e) {}
  if (cancelled) {
    endExport(); renderNow();
    modal.classList.add('hidden');
    toast('Export abgebrochen.', 'err');
  }
}

function finalize(mime) {
  endExport();
  renderNow();
  const isMp4 = (mime || '').includes('mp4');
  const ext = isMp4 ? 'mp4' : 'webm';
  const blob = new Blob(chunks, { type: mime || 'video/webm' });
  const name = (state.projectName || 'Cinema-Studio').replace(/[^\wäöüÄÖÜ\- ]+/g, '').trim().replace(/\s+/g, '_') || 'Video';
  const res = $('#expRes').value + 'p';
  const filename = `${name}_${res}.${ext}`;
  download(blob, filename);

  // Ergebnis anzeigen (wichtig auf dem Handy: gedrückt halten → sichern)
  const url = URL.createObjectURL(blob);
  const vid = $('#resultVideo'); vid.src = url;
  const dl = $('#resultDownload'); dl.href = url; dl.download = filename;
  $('#exportProgress').classList.add('hidden');
  $('#exportResult').classList.remove('hidden');
  $('#exportStart').disabled = false;
  $('#exportStart').textContent = 'Nochmal exportieren';
  toast(`💾 Export fertig als <b>.${ext}</b> (${res}).` + (isMp4 ? '' : ' Hinweis: .webm – für TikTok ggf. in .mp4 umwandeln.'), 'ok', 5200);
}
