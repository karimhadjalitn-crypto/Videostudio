/* Mīzān – Service Worker. Offline-Betrieb. */
var CACHE = "mizan-v2";
var ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/styles.css",
  "data/ayat.json",
  "js/store.js",
  "js/prayer.js",
  "js/hijri.js",
  "js/score.js",
  "js/ayat.js",
  "js/ics.js",
  "js/ui.js",
  "js/assistant.js",
  "js/views/today.js",
  "js/views/calendar.js",
  "js/views/prayers.js",
  "js/views/muhasaba.js",
  "js/views/mirror.js",
  "js/views/reminders.js",
  "js/views/import.js",
  "js/views/settings.js",
  "js/app.js",
  "assets/icons/icon.svg",
  "assets/icons/icon-180.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-512-maskable.png"
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
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(function () { return caches.match("index.html"); }));
    return;
  }
  e.respondWith(
    caches.match(req).then(function (gecacht) {
      return gecacht || fetch(req).then(function (res) {
        var kopie = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, kopie); });
        return res;
      }).catch(function () { return gecacht; });
    })
  );
});
