/* Sūq – Service Worker. Offline-Betrieb.

   Wie in Mīzān tragen Skripte und Stylesheet die Version in der Adresse.
   index.html kommt immer aus dem Netz und entscheidet, welche Fassung
   geladen wird — sonst bräuchte man zweimal Öffnen für eine Neuerung.

   Was nicht in den Cache gehört: die Aufrufe an api.elevenlabs.io. Die
   sind nicht vom eigenen Ursprung und werden unten ohnehin durchgereicht. */
var VERSION = "1";
var CACHE = "suq-v" + VERSION;

var VERSIONIERT = [
  "css/styles.css",
  "js/store.js",
  "js/ui.js",
  "js/recht.js",
  "js/halal.js",
  "js/skript.js",
  "js/shots.js",
  "js/voice.js",
  "js/views/produkte.js",
  "js/views/werkstatt.js",
  "js/views/pipeline.js",
  "js/views/zahlen.js",
  "js/views/einstellungen.js",
  "js/app.js"
];

var UNVERAENDERT = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "assets/icons/icon.svg"
];

var ASSETS = UNVERAENDERT.concat(VERSIONIERT.map(function (u) {
  return u + "?v=" + VERSION;
}));

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
