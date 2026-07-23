// Cinema Studio – minimaler, abhängigkeitsfreier Server.
// Liefert die Web-App aus und ist im lokalen WLAN erreichbar (auch vom Handy).
// Start:  npm start   →   http://localhost:3000
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import os from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, 'public');
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-cache',
    ...headers,
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (urlPath === '/') urlPath = '/index.html';

    // Pfad absichern (kein Ausbruch aus /public)
    const safePath = normalize(join(ROOT, urlPath));
    if (!safePath.startsWith(ROOT)) {
      return send(res, 403, 'Forbidden');
    }

    let info;
    try {
      info = await stat(safePath);
    } catch {
      // Fallback: SPA-Verhalten -> index.html
      const html = await readFile(join(ROOT, 'index.html'));
      return send(res, 200, html, { 'Content-Type': MIME['.html'] });
    }

    if (info.isDirectory()) {
      const html = await readFile(join(safePath, 'index.html'));
      return send(res, 200, html, { 'Content-Type': MIME['.html'] });
    }

    const type = MIME[extname(safePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    createReadStream(safePath).pipe(res);
  } catch (err) {
    send(res, 500, 'Server-Fehler: ' + err.message);
  }
});

function lanAddresses() {
  const nets = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) out.push(net.address);
    }
  }
  return out;
}

server.listen(PORT, '0.0.0.0', () => {
  const lines = [
    '',
    '  🎬  Cinema Studio läuft!',
    '',
    `  Auf diesem Rechner:   http://localhost:${PORT}`,
  ];
  for (const ip of lanAddresses()) {
    lines.push(`  Vom Handy (WLAN):     http://${ip}:${PORT}`);
  }
  lines.push('');
  lines.push('  Zum Beenden: Strg + C');
  lines.push('');
  console.log(lines.join('\n'));
});
