/* Service Worker – Offline-Cache für die Lern-App */
var CACHE = "arabisch-lernen-v2";
var ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/styles.css",
  "data/appdata.js",
  "js/store.js",
  "js/data.js",
  "js/audio.js",
  "js/ui.js",
  "js/views/home.js",
  "js/views/flashcards.js",
  "js/views/quiz.js",
  "js/views/sentences.js",
  "js/views/add.js",
  "js/views/stats.js",
  "js/views/settings.js",
  "js/views/extra.js",
  "js/app.js",
  "assets/icons/icon.svg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-180.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (u) {
        return c.add(u).catch(function () { /* einzelne Datei fehlt -> ignorieren */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  // Fremd-Hosts (z.B. Tesseract-CDN) nicht abfangen
  if (url.origin !== self.location.origin) return;

  // Navigationen: erst Netz, sonst index.html aus Cache
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(function () { return caches.match("index.html"); }));
    return;
  }
  // Assets: Cache-first
  e.respondWith(
    caches.match(req).then(function (cached) {
      return cached || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return cached; });
    })
  );
});
