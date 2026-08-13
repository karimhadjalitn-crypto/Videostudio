/* Sūq – Speicher.
   Alles liegt in IndexedDB auf diesem Gerät. Kein Server, kein Konto.
   Bilder werden als Blob abgelegt, nicht als Base64-Text: eine Handykamera
   liefert schnell 4 MB pro Foto, und als Text wäre das ein Drittel größer
   und würde beim Lesen jedes Mal neu geparst. */
var Store = (function () {
  "use strict";

  var DB_NAME = "suq";
  var DB_VERSION = 1;
  var SCHEMA = 1;
  var db = null;

  /* ---------- Standard-Einstellungen ---------- */
  var DEFAULTS = {
    v: SCHEMA,
    kanal: { name: "", follower: 13300 },

    /* Der ElevenLabs-Schlüssel bleibt hier auf dem Gerät und geht nur an
       ElevenLabs selbst. Er landet nicht in der Sicherungsdatei. */
    stimme: {
      schluessel: "",
      stimmeId: "",
      stimmeName: "",
      modell: "eleven_multilingual_v2",
      tempo: 1.0
    },

    /* ---------- Die Grenzen ----------
       Das ist keine Einstellung im üblichen Sinn. Es ist der Rahmen, in dem
       diese App überhaupt arbeitet. Wer hier etwas lockert, muss es bewusst tun. */
    grenzen: {
      keinePersonen: true,      // keine Gesichter, keine Menschen im Bild
      keineFrauen: true,        // keine weiblichen Darstellungen, auch nicht angedeutet
      keineMusik: true,         // nur Nasheed a cappella, Stimme oder Ambient
      puppeErlaubt: true,       // kopflose Schneiderpuppe für Kleidung — von dir freigegeben
      keineUebertreibung: true, // keine Heilversprechen, keine Superlative ohne Beleg
      keinRiba: true            // keine Ratenzahlung, kein Kredit, kein "Jetzt kaufen, später zahlen"
    },

    /* Ton der Untermalung. Musik gibt es hier nicht. */
    klang: "ambient",           // nasheed | stimme | ambient | still

    /* ---------- Rechtliches ----------
       Vorbelegt nach dem Leitfaden der Medienanstalten und AI Act Art. 50.
       "Werbung" und "Anzeige" sind die einzigen unstrittigen Wörter. */
    recht: {
      wort: "Werbung",          // Werbung | Anzeige
      imBild: true,             // Einblendung ab Sekunde 0
      gesprochen: false,        // zusätzlich im Voiceover
      kiOffenlegung: true,      // synthetische Stimme kennzeichnen
      provisionshinweis: true
    },

    /* Kategorien deines Sortiments. Steuern Hooks, Szenen und Wächterregeln. */
    kategorien: [
      "Gebetsteppich", "Kleidung", "Duft & Attar", "Tasbīḥ & Dhikr",
      "Buch & Qurʾān", "Zuhause", "Kinder", "Reise", "Sonstiges"
    ],

    /* Ziele, an denen du dich misst — bewusst nüchtern gehalten. */
    ziel: { videosProWoche: 5, provisionProMonat: 1000 },

    thema: "hell",              // hell | dunkel | system

    letztesBackup: null
  };

  /* ---------- Datensätze ---------- */

  function leeresProdukt(id) {
    return {
      id: id, v: SCHEMA,
      name: "",
      kategorie: "Gebetsteppich",
      seller: "",
      preis: null,
      provisionProzent: null,
      link: "",
      /* Freigabe des Sellers für die Bildnutzung — ohne die drehst du nicht. */
      freigabe: { erteilt: false, am: null, wie: "" },
      merkmale: [],     // Verkaufsargumente, je ein kurzer Satz
      einwaende: [],    // was jemanden vom Kauf abhält
      fotos: [],        // { id, name, typ }  — die Blobs liegen im Speicher "bilder"
      notiz: "",
      angelegt: null,
      status: "aktiv"   // aktiv | pausiert | raus
    };
  }

  var STUFEN = ["idee", "skript", "stimme", "gedreht", "geschnitten", "gepostet"];
  var STUFEN_NAME = {
    idee: "Idee", skript: "Skript", stimme: "Stimme",
    gedreht: "Gedreht", geschnitten: "Geschnitten", gepostet: "Gepostet"
  };

  function leeresVideo(id, produktId) {
    return {
      id: id, v: SCHEMA,
      produktId: produktId || null,
      titel: "",
      stand: "idee",
      /* Das Skript in Abschnitten. Jeder Abschnitt kennt seine Sekunden. */
      skript: {
        hook:    { text: "", sek: 3 },
        problem: { text: "", sek: 5 },
        produkt: { text: "", sek: 10 },
        beweis:  { text: "", sek: 8 },
        einwand: { text: "", sek: 6 },
        cta:     { text: "", sek: 4 }
      },
      shots: [],          // { nr, dauer, quelle, bewegung, was, einblendung }
      stimme: { erzeugt: null, datei: "", stimmeId: "" },
      zahlen: { views: null, klicks: null, bestellungen: null, provision: null },
      gepostetAm: null,
      notiz: "",
      angelegt: null
    };
  }

  /* ---------- IndexedDB ---------- */
  function oeffnen() {
    return new Promise(function (ok, fehler) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var d = e.target.result;
        if (!d.objectStoreNames.contains("produkte")) d.createObjectStore("produkte", { keyPath: "id" });
        if (!d.objectStoreNames.contains("videos")) d.createObjectStore("videos", { keyPath: "id" });
        if (!d.objectStoreNames.contains("bilder")) d.createObjectStore("bilder", { keyPath: "id" });
        if (!d.objectStoreNames.contains("kv")) d.createObjectStore("kv", { keyPath: "k" });
      };
      req.onsuccess = function () { db = req.result; ok(db); };
      req.onerror = function () { fehler(req.error); };
    });
  }

  function tx(store, modus) {
    return db.transaction(store, modus || "readonly").objectStore(store);
  }
  function anfrage(r) {
    return new Promise(function (ok, fehler) {
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { fehler(r.error); };
    });
  }

  /* ---------- Zusammenführen ----------
     Ältere Datensätze behalten Felder, die es hier nicht mehr gibt. */
  function tief(ziel, quelle) {
    var out = JSON.parse(JSON.stringify(ziel));
    Object.keys(quelle || {}).forEach(function (k) {
      if (quelle[k] && typeof quelle[k] === "object" && !Array.isArray(quelle[k]) && out[k]) {
        out[k] = tief(out[k], quelle[k]);
      } else if (quelle[k] !== undefined) {
        out[k] = quelle[k];
      }
    });
    return out;
  }

  /* ---------- Cache ----------
     Produkte und Videos sind wenige Dutzend Datensätze. Die halten wir
     im Speicher, damit jede Ansicht sofort zeichnen kann. Bilder nicht —
     die bleiben in der Datenbank und werden bei Bedarf geholt. */
  var produkteCache = [];
  var videosCache = [];
  var einstellungen = null;

  function produkte() { return produkteCache; }
  function videos() { return videosCache; }

  function produkt(id) {
    for (var i = 0; i < produkteCache.length; i++) {
      if (produkteCache[i].id === id) return produkteCache[i];
    }
    return null;
  }
  function video(id) {
    for (var i = 0; i < videosCache.length; i++) {
      if (videosCache[i].id === id) return videosCache[i];
    }
    return null;
  }

  /* Videos zu einem Produkt, neueste zuerst */
  function videosZu(produktId) {
    return videosCache.filter(function (v) { return v.produktId === produktId; });
  }

  function neuId(praefix) {
    return praefix + "-" + Date.now().toString(36) + "-" +
           Math.random().toString(36).slice(2, 7);
  }

  /* ---------- Laden ---------- */
  function bereit() {
    return oeffnen().then(function () {
      return anfrage(tx("kv").get("einstellungen"));
    }).then(function (row) {
      einstellungen = tief(DEFAULTS, row ? row.wert : {});
      API.einstellungen = einstellungen;
      return Promise.all([
        anfrage(tx("produkte").getAll()),
        anfrage(tx("videos").getAll())
      ]);
    }).then(function (r) {
      produkteCache = r[0].map(function (p) { return tief(leeresProdukt(p.id), p); });
      videosCache = r[1].map(function (v) { return tief(leeresVideo(v.id, v.produktId), v); });
      sortieren();
      return einstellungen;
    });
  }

  function sortieren() {
    /* Neueste zuerst — beim Arbeiten interessiert das Letzte, nicht das Erste. */
    var nachDatum = function (a, b) {
      return (b.angelegt || "") < (a.angelegt || "") ? -1 : 1;
    };
    produkteCache.sort(nachDatum);
    videosCache.sort(nachDatum);
  }

  function einstellungenSpeichern() {
    API.einstellungen = einstellungen;
    return anfrage(tx("kv", "readwrite").put({ k: "einstellungen", wert: einstellungen }));
  }

  /* ---------- Schreiben ---------- */
  function produktSpeichern(p) {
    if (!p.angelegt) p.angelegt = new Date().toISOString();
    var i = produkteCache.findIndex(function (x) { return x.id === p.id; });
    if (i >= 0) produkteCache[i] = p; else produkteCache.unshift(p);
    return anfrage(tx("produkte", "readwrite").put(JSON.parse(JSON.stringify(p))));
  }

  function videoSpeichern(v) {
    if (!v.angelegt) v.angelegt = new Date().toISOString();
    var i = videosCache.findIndex(function (x) { return x.id === v.id; });
    if (i >= 0) videosCache[i] = v; else videosCache.unshift(v);
    return anfrage(tx("videos", "readwrite").put(JSON.parse(JSON.stringify(v))));
  }

  /* Ein Produkt zu löschen heißt: seine Videos und Bilder mit. Sonst bleiben
     verwaiste Datensätze liegen, die nirgends mehr auftauchen und trotzdem
     Platz belegen. */
  function produktLoeschen(id) {
    var p = produkt(id);
    var bildIds = p ? p.fotos.map(function (f) { return f.id; }) : [];
    var videoIds = videosZu(id).map(function (v) { return v.id; });
    produkteCache = produkteCache.filter(function (x) { return x.id !== id; });
    videosCache = videosCache.filter(function (x) { return x.produktId !== id; });
    return new Promise(function (ok, fehler) {
      var t = db.transaction(["produkte", "videos", "bilder"], "readwrite");
      t.objectStore("produkte").delete(id);
      videoIds.forEach(function (vid) { t.objectStore("videos").delete(vid); });
      bildIds.forEach(function (bid) { t.objectStore("bilder").delete(bid); });
      t.oncomplete = function () { ok(); };
      t.onerror = function () { fehler(t.error); };
    });
  }

  function videoLoeschen(id) {
    videosCache = videosCache.filter(function (x) { return x.id !== id; });
    return anfrage(tx("videos", "readwrite").delete(id));
  }

  /* ---------- Bilder ---------- */
  function bildSpeichern(blob, name) {
    var id = neuId("bild");
    return anfrage(tx("bilder", "readwrite").put({ id: id, blob: blob, name: name }))
      .then(function () { return { id: id, name: name, typ: blob.type }; });
  }

  function bild(id) {
    return anfrage(tx("bilder").get(id)).then(function (r) { return r ? r.blob : null; });
  }

  function bildLoeschen(id) {
    return anfrage(tx("bilder", "readwrite").delete(id));
  }

  /* Erzeugt eine Adresse für ein <img>. Der Aufrufer muss sie wieder
     freigeben, sonst hält der Browser den Blob für immer fest. */
  function bildAdresse(id) {
    return bild(id).then(function (b) { return b ? URL.createObjectURL(b) : null; });
  }

  /* ---------- Sicherung ----------
     Bilder gehen als Base64 mit, sonst ist die Sicherung wertlos: ohne die
     Produktfotos lässt sich kein Video mehr bauen. Das macht die Datei groß,
     aber eine unvollständige Sicherung wäre schlimmer.
     Der ElevenLabs-Schlüssel bleibt draußen. */
  function exportieren(mitBildern) {
    var einst = JSON.parse(JSON.stringify(einstellungen));
    einst.stimme.schluessel = "";
    var basis = {
      app: "suq", schema: SCHEMA,
      erstellt: new Date().toISOString(),
      einstellungen: einst,
      produkte: JSON.parse(JSON.stringify(produkteCache)),
      videos: JSON.parse(JSON.stringify(videosCache)),
      bilder: []
    };
    if (!mitBildern) return Promise.resolve(basis);

    return anfrage(tx("bilder").getAll()).then(function (alle) {
      return Promise.all(alle.map(function (b) {
        return new Promise(function (ok) {
          var leser = new FileReader();
          leser.onload = function () {
            ok({ id: b.id, name: b.name, daten: leser.result });
          };
          leser.onerror = function () { ok(null); };
          leser.readAsDataURL(b.blob);
        });
      }));
    }).then(function (liste) {
      basis.bilder = liste.filter(Boolean);
      return basis;
    });
  }

  function exportDatei(mitBildern) {
    return exportieren(mitBildern).then(function (daten) {
      var blob = new Blob([JSON.stringify(daten, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "suq-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      einstellungen.letztesBackup = new Date().toISOString();
      return einstellungenSpeichern();
    });
  }

  function datenUrlZuBlob(url) {
    var teile = url.split(",");
    var typ = (teile[0].match(/:(.*?);/) || [, "image/jpeg"])[1];
    var roh = atob(teile[1]);
    var buf = new Uint8Array(roh.length);
    for (var i = 0; i < roh.length; i++) buf[i] = roh.charCodeAt(i);
    return new Blob([buf], { type: typ });
  }

  function importieren(daten) {
    if (!daten || daten.app !== "suq") throw new Error("Das ist keine Sūq-Sicherung.");
    return new Promise(function (ok, fehler) {
      var t = db.transaction(["produkte", "videos", "bilder"], "readwrite");
      (daten.produkte || []).forEach(function (p) {
        if (p && p.id) t.objectStore("produkte").put(tief(leeresProdukt(p.id), p));
      });
      (daten.videos || []).forEach(function (v) {
        if (v && v.id) t.objectStore("videos").put(tief(leeresVideo(v.id, v.produktId), v));
      });
      (daten.bilder || []).forEach(function (b) {
        if (b && b.id && b.daten) {
          try {
            t.objectStore("bilder").put({ id: b.id, name: b.name, blob: datenUrlZuBlob(b.daten) });
          } catch (e) { /* ein kaputtes Bild darf den Import nicht kippen */ }
        }
      });
      t.oncomplete = function () { ok(); };
      t.onerror = function () { fehler(t.error); };
      t.onabort = function () { fehler(t.error || new Error("Import abgebrochen")); };
    }).then(function () {
      /* Der eingelesene Schlüssel ist leer — den auf dem Gerät behalten wir. */
      var schluessel = einstellungen.stimme.schluessel;
      einstellungen = tief(DEFAULTS, daten.einstellungen || {});
      einstellungen.stimme.schluessel = schluessel;
      return einstellungenSpeichern();
    }).then(function () {
      return bereit();
    });
  }

  var API = {
    bereit: bereit,
    einstellungen: null,
    einstellungenSpeichern: einstellungenSpeichern,

    leeresProdukt: leeresProdukt,
    leeresVideo: leeresVideo,
    STUFEN: STUFEN,
    STUFEN_NAME: STUFEN_NAME,

    produkte: produkte,
    produkt: produkt,
    produktSpeichern: produktSpeichern,
    produktLoeschen: produktLoeschen,

    videos: videos,
    video: video,
    videosZu: videosZu,
    videoSpeichern: videoSpeichern,
    videoLoeschen: videoLoeschen,

    bildSpeichern: bildSpeichern,
    bild: bild,
    bildAdresse: bildAdresse,
    bildLoeschen: bildLoeschen,

    neuId: neuId,
    exportieren: exportieren,
    exportDatei: exportDatei,
    importieren: importieren,
    SCHEMA: SCHEMA
  };
  return API;
})();
