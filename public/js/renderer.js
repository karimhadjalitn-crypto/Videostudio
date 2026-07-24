// WebGL-Farbkorrektur + 2D-Compositing (Cinema-Frame, Balken, Text, Vignette, Korn).
import { RATIOS, defaultGrade } from './state.js';
import { gradeToUniforms } from './looks.js';

let outCanvas, ctx;               // sichtbares Ausgabe-Canvas (2D)
let glCanvas, gl, program, tex;   // Offscreen WebGL fürs Grading
let scratch, sctx;                // 2D-Zwischen-Canvas (iOS-kompatible Video-Textur)
let uLoc = {};
let noiseCanvas;                  // Filmkorn-Kachel

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
uniform vec2 u_uvScale;
void main(){
  v_uv = (a_pos * 0.5 + 0.5);
  v_uv = (v_uv - 0.5) * u_uvScale + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_exposure, u_contrast, u_saturation, u_temperature, u_tint;
uniform float u_lift, u_gamma, u_gain, u_fade, u_tealOrange;
void main(){
  vec2 uv = clamp(v_uv, 0.0, 1.0);
  vec3 c = texture2D(u_tex, uv).rgb;
  c *= pow(2.0, u_exposure);
  c.r += u_temperature; c.b -= u_temperature;
  c.g += u_tint;
  c = c * u_gain + u_lift;
  c = pow(max(c, 0.0), vec3(1.0 / u_gamma));
  c = (c - 0.5) * u_contrast + 0.5;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, u_saturation);
  if (u_tealOrange > 0.001) {
    vec3 sh = vec3(-0.05, 0.015, 0.09) * u_tealOrange;
    vec3 hi = vec3(0.09, 0.035, -0.05) * u_tealOrange;
    c += mix(sh, hi, smoothstep(0.15, 0.85, l));
  }
  if (u_fade > 0.001) c = mix(c, c * (1.0 - 0.55 * u_fade) + 0.16 * u_fade, 1.0);
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

function compileShader(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader-Fehler:', gl.getShaderInfoLog(s));
  }
  return s;
}

export function initRenderer(canvasEl) {
  outCanvas = canvasEl;
  ctx = outCanvas.getContext('2d');

  // Zwischen-Canvas: Video wird erst hier gezeichnet, dann als Textur hochgeladen.
  // (Safari/iPad kann Videos nicht direkt in WebGL laden – über ein Canvas geht es.)
  scratch = document.createElement('canvas');
  sctx = scratch.getContext('2d');

  glCanvas = document.createElement('canvas');
  gl = glCanvas.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) { console.warn('WebGL nicht verfügbar – 2D-Fallback aktiv.'); buildNoise(); return; }

  program = gl.createProgram();
  gl.attachShader(program, compileShader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  for (const n of ['u_uvScale', 'u_exposure', 'u_contrast', 'u_saturation', 'u_temperature',
    'u_tint', 'u_lift', 'u_gamma', 'u_gain', 'u_fade', 'u_tealOrange']) {
    uLoc[n] = gl.getUniformLocation(program, n);
  }

  tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  buildNoise();
}

function buildNoise() {
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = noiseCanvas.height = 256;
  const nc = noiseCanvas.getContext('2d');
  const img = nc.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  nc.putImageData(img, 0, 0);
}

// Ausgabegröße aus Seitenverhältnis und Basis-Kante berechnen.
export function dimsFor(ratio, base) {
  const r = RATIOS[ratio] || 16 / 9;
  if (r >= 1) return { w: Math.round(base * r), h: base };       // Querformat: Höhe = base
  return { w: base, h: Math.round(base / r) };                    // Hochformat: Breite = base
}

export function setResolution(w, h) {
  outCanvas.width = w;
  outCanvas.height = h;
}

function roundRect(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

// Cover-Ausschnitt der Quelle für ein Zielrechteck berechnen.
function coverCrop(srcW, srcH, dw, dh) {
  const sAR = srcW / srcH, dAR = dw / dh;
  let sw, sh, sx, sy;
  if (sAR > dAR) { sh = srcH; sw = srcH * dAR; sx = (srcW - sw) / 2; sy = 0; }
  else { sw = srcW; sh = srcW / dAR; sx = 0; sy = (srcH - sh) / 2; }
  return { sx, sy, sw, sh };
}

// Quelle graden -> glCanvas (Größe = Zielrechteck). Cover-Fit passiert im Zwischen-Canvas.
function gradeSource(srcEl, srcW, srcH, dstW, dstH, grade) {
  // 1) Video cover-fit in das 2D-Zwischen-Canvas zeichnen (iOS-kompatibel)
  scratch.width = dstW; scratch.height = dstH;
  const { sx, sy, sw, sh } = coverCrop(srcW, srcH, dstW, dstH);
  try {
    sctx.clearRect(0, 0, dstW, dstH);
    sctx.drawImage(srcEl, sx, sy, sw, sh, 0, 0, dstW, dstH);
  } catch (e) { return null; }

  // 2) Als Textur hochladen und graden
  glCanvas.width = dstW; glCanvas.height = dstH;
  gl.viewport(0, 0, dstW, dstH);
  gl.uniform2f(uLoc.u_uvScale, 1, 1);

  const u = gradeToUniforms(grade || defaultGrade());
  gl.uniform1f(uLoc.u_exposure, u.exposure);
  gl.uniform1f(uLoc.u_contrast, u.contrast);
  gl.uniform1f(uLoc.u_saturation, u.saturation);
  gl.uniform1f(uLoc.u_temperature, u.temperature);
  gl.uniform1f(uLoc.u_tint, u.tint);
  gl.uniform1f(uLoc.u_lift, u.lift);
  gl.uniform1f(uLoc.u_gamma, u.gamma);
  gl.uniform1f(uLoc.u_gain, u.gain);
  gl.uniform1f(uLoc.u_fade, u.fade);
  gl.uniform1f(uLoc.u_tealOrange, u.tealOrange);

  gl.bindTexture(gl.TEXTURE_2D, tex);
  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
  } catch (e) { return null; }
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  return u;
}

// Reiner 2D-Fallback (falls WebGL fehlt): Video direkt zeichnen, Grade genähert per Filter.
function draw2DFallback(source, dx, dy, dw, dh, grade) {
  const u = gradeToUniforms(grade || defaultGrade());
  const bright = Math.pow(2, u.exposure);
  const { sx, sy, sw, sh } = coverCrop(source.w, source.h, dw, dh);
  ctx.save();
  try { ctx.filter = `brightness(${bright.toFixed(3)}) contrast(${u.contrast.toFixed(3)}) saturate(${u.saturation.toFixed(3)})`; } catch (e) {}
  try { ctx.drawImage(source.el, sx, sy, sw, sh, dx, dy, dw, dh); } catch (e) {}
  ctx.restore();
  return u;
}

// Hauptzeichnung eines Frames.
// opts: { source:{el,w,h}, grade, texts, frame, letterbox, safezone, ratio, time, preview }
export function renderFrame(opts) {
  if (!ctx) return;
  const W = outCanvas.width, H = outCanvas.height;
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // Hintergrund (Rahmenfarbe bei aktivem Frame, sonst schwarz)
  ctx.fillStyle = opts.frame?.enabled ? (opts.frame.color || '#000') : '#000';
  ctx.fillRect(0, 0, W, H);

  // Content-Rechteck (Rahmen-Rand + Letterbox berücksichtigen)
  let cx = 0, cy = 0, cw = W, ch = H;
  if (opts.frame?.enabled && opts.frame.margin > 0) {
    const m = (opts.frame.margin / 100) * Math.min(W, H);
    cx += m; cy += m; cw -= 2 * m; ch -= 2 * m;
  }
  if (opts.letterbox?.enabled) {
    const bar = (opts.letterbox.size / 100) * H;
    cy += bar; ch -= 2 * bar;
  }
  const radius = opts.frame?.enabled ? (opts.frame.radius / 100) * Math.min(cw, ch) * 0.5 : 0;

  // Video
  if (opts.source && opts.source.el && opts.source.w) {
    const dstW = Math.max(2, Math.round(cw)), dstH = Math.max(2, Math.round(ch));
    let u = null, glOk = false;
    if (gl) { u = gradeSource(opts.source.el, opts.source.w, opts.source.h, dstW, dstH, opts.grade); glOk = (u !== null); }
    ctx.save();
    if (radius > 0) { roundRect(ctx, cx, cy, cw, ch, radius); ctx.clip(); }
    if (glOk) {
      ctx.drawImage(glCanvas, cx, cy, cw, ch);
    } else {
      // WebGL nicht möglich -> direkt in 2D zeichnen
      u = draw2DFallback(opts.source, cx, cy, cw, ch, opts.grade);
    }

    // Vignette
    if (u && u.vignette > 0.001) {
      const g = ctx.createRadialGradient(cx + cw / 2, cy + ch / 2, Math.min(cw, ch) * 0.28,
        cx + cw / 2, cy + ch / 2, Math.max(cw, ch) * 0.72);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${(u.vignette * 0.85).toFixed(3)})`);
      ctx.fillStyle = g;
      ctx.fillRect(cx, cy, cw, ch);
    }
    // Filmkorn
    if (u && u.grain > 0.001 && noiseCanvas) {
      ctx.globalAlpha = u.grain * 0.16;
      ctx.globalCompositeOperation = 'overlay';
      const ox = -Math.random() * 128, oy = -Math.random() * 128;
      const pat = ctx.createPattern(noiseCanvas, 'repeat');
      ctx.fillStyle = pat;
      ctx.save(); ctx.translate(ox, oy); ctx.fillRect(cx - ox, cy - oy, cw, ch); ctx.restore();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  // Cinema-Frame Rand (feine Linie)
  if (opts.frame?.enabled && radius > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = Math.max(1, W * 0.001);
    roundRect(ctx, cx, cy, cw, ch, radius);
    ctx.stroke();
  }

  // Safe-Zones (nur Vorschau, v.a. 9:16)
  if (opts.safezone && opts.preview) drawSafezones(W, H);

  // Text-Ebenen
  for (const tx of opts.texts || []) {
    if (opts.time >= tx.start && opts.time <= tx.end) drawText(tx, opts.time, W, H);
  }

  ctx.restore();
}

function drawSafezones(W, H) {
  ctx.save();
  ctx.strokeStyle = 'rgba(70,202,188,0.5)';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  // rechte Button-Spalte
  ctx.strokeRect(W * 0.86, H * 0.45, W * 0.12, H * 0.4);
  // untere Beschreibung
  ctx.strokeRect(W * 0.04, H * 0.78, W * 0.72, H * 0.16);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(70,202,188,0.7)';
  ctx.font = `${Math.round(H * 0.018)}px Inter, sans-serif`;
  ctx.fillText('TikTok-UI', W * 0.05, H * 0.77);
  ctx.restore();
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

function drawText(tx, time, W, H) {
  const localT = time - tx.start;
  const dur = Math.max(0.1, tx.end - tx.start);
  const fontPx = (tx.size / 100) * H;
  let alpha = 1, dy = 0, scale = 1, reveal = 1;

  const inD = 0.35, outD = 0.3;
  const baseFade = Math.min(1, localT / inD) * Math.min(1, (dur - localT) / outD);
  alpha = Math.max(0, Math.min(1, baseFade));

  if (tx.anim === 'slide') dy = (1 - easeOut(Math.min(1, localT / 0.45))) * H * 0.05;
  else if (tx.anim === 'pop') { const p = Math.min(1, localT / 0.4); scale = 0.6 + easeOut(p) * 0.4; }
  else if (tx.anim === 'typewriter') reveal = Math.min(1, localT / Math.min(1.4, dur * 0.6));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(tx.x * W, tx.y * H + dy);
  ctx.scale(scale, scale);
  ctx.textAlign = tx.align || 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${tx.weight || 700} ${fontPx}px ${tx.font || 'Inter'}, Inter, sans-serif`;
  try { ctx.letterSpacing = ((tx.letterSpacing || 0) / 100 * fontPx).toFixed(2) + 'px'; } catch (e) {}

  let text = tx.text || '';
  if (tx.anim === 'typewriter') text = text.slice(0, Math.ceil(text.length * reveal));
  const lines = text.split('\n');
  const lh = fontPx * 1.18;
  const startY = -((lines.length - 1) * lh) / 2;

  // Hintergrundbox
  if (tx.bg && tx.bg !== 'none') {
    let maxW = 0;
    for (const ln of lines) maxW = Math.max(maxW, ctx.measureText(ln).width);
    const padX = fontPx * 0.35, padY = fontPx * 0.22;
    const boxW = maxW + padX * 2, boxH = lines.length * lh + padY * 2 - (lh - fontPx) * 0.4;
    let bx = -boxW / 2;
    if (tx.align === 'left') bx = -padX;
    if (tx.align === 'right') bx = -boxW + padX;
    ctx.fillStyle = tx.bg;
    roundRect(ctx, bx, startY - lh / 2 - padY + fontPx * 0.1, boxW, boxH, fontPx * 0.18);
    ctx.fill();
  }

  lines.forEach((ln, i) => {
    const y = startY + i * lh;
    if (tx.stroke) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.92)';
      ctx.lineWidth = fontPx * 0.14;
      ctx.strokeText(ln, 0, y);
    }
    if (tx.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = fontPx * 0.22;
      ctx.shadowOffsetY = fontPx * 0.06;
    }
    ctx.fillStyle = tx.color || '#fff';
    ctx.fillText(ln, 0, y);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  });

  ctx.restore();
}

// Für Treffer-Test beim Ziehen von Text (grobe Box in Canvas-Koordinaten).
export function textBounds(tx, W, H) {
  const fontPx = (tx.size / 100) * H;
  ctx.save();
  ctx.font = `${tx.weight || 700} ${fontPx}px ${tx.font || 'Inter'}, sans-serif`;
  try { ctx.letterSpacing = ((tx.letterSpacing || 0) / 100 * fontPx).toFixed(2) + 'px'; } catch (e) {}
  const lines = (tx.text || '').split('\n');
  let maxW = 40;
  for (const ln of lines) maxW = Math.max(maxW, ctx.measureText(ln).width);
  ctx.restore();
  const h = lines.length * fontPx * 1.18;
  return { x: tx.x * W - maxW / 2, y: tx.y * H - h / 2, w: maxW, h };
}

export function getCanvas() { return outCanvas; }
