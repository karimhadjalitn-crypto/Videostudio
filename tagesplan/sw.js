/* Service Worker – macht den Tagesplan offline nutzbar.
   Strategie „erst Netz, dann Cache": Ist Internet da, kommt immer die neueste
   Version (und wird gespeichert). Ohne Internet wird die gespeicherte genutzt.
   Deine Aufgaben liegen NICHT hier, sondern im localStorage. */

const CACHE = "tagesplan-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon.svg",
               "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  // Nur eigene alte Caches löschen – die anderen Apps im Repo nutzen dieselbe Domain.
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith("tagesplan-") && k !== CACHE)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  e.respondWith((async () => {
    try {
      // Bei schlechtem Netz nicht ewig warten: nach 4 Sekunden auf den Cache ausweichen.
      const res = await Promise.race([
        fetch(req),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000))
      ]);
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    } catch (err) {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      if (req.mode === "navigate") return caches.match("index.html");
      throw err;
    }
  })());
});
