/* Mīzān – Service Worker. Offline-Betrieb.

   Skripte und Stylesheet tragen die Version in der Adresse (?v=…).
   Nur so reicht ein einziges Schließen und Neuöffnen der App: index.html
   kommt aus dem Netz und verweist auf die neuen Adressen, die im alten
   Cache gar nicht stehen. Ohne das käme beim ersten Öffnen noch der alte
   Stand und erst beim zweiten der neue. */
var VERSION = "7";
var CACHE = "mizan-v" + VERSION;

var VERSIONIERT = [
  "css/styles.css",
  "js/store.js",
  "js/prayer.js",
  "js/hijri.js",
  "js/score.js",
  "js/ayat.js",
  "js/hifz.js",
  "js/punkte.js",
  "js/ics.js",
  "js/insights.js",
  "js/modi.js",
  "js/ui.js",
  "js/assistant.js",
  "js/views/today.js",
  "js/views/punkte.js",
  "js/views/calendar.js",
  "js/views/termine.js",
  "js/views/bereiche.js",
  "js/views/religion.js",
  "js/views/prayers.js",
  "js/views/quran.js",
  "js/views/adhkar.js",
  "js/views/fasting.js",
  "js/views/duas.js",
  "js/views/koerper.js",
  "js/views/arbeit.js",
  "js/views/leben.js",
  "js/views/privat.js",
  "js/views/muhasaba.js",
  "js/views/mirror.js",
  "js/views/reminders.js",
  "js/views/import.js",
  "js/views/settings.js",
  "js/views/einstellungen2.js",
  "js/app.js"
];

var UNVERAENDERT = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/ayat.json",
  "data/suren.json",
  "data/duas.json",
  "assets/icons/icon.svg",
  "assets/icons/icon-180.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-512-maskable.png"
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

  /* index.html immer zuerst aus dem Netz — sie entscheidet, welche
     Fassung der Skripte geladen wird. */
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
