/* Mīzān – Speicher.
   Alles liegt in IndexedDB auf diesem Gerät. Kein Server, keine Übertragung. */
var Store = (function () {
  "use strict";

  var DB_NAME = "mizan";
  var DB_VERSION = 1;
  var SCHEMA = 1;          // Version der Tagesdatensätze (für spätere Migrationen)
  var db = null;

  /* ---------- Standard-Einstellungen ---------- */
  var DEFAULTS = {
    v: SCHEMA,
    name: "",
    ort: { label: "München, Fürstenried West", lat: 48.0889, lng: 11.4919 },
    methode: "MWL",         // Fajr 18° / ʿIshā' 17°
    asr: "standard",        // Karim: Standard (Shāfiʿī)
    hochbreiten: "winkel",  // Sommerregel für München
    korrektur: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    hijriOffset: 0,
    jumua: { sommer: "14:45", winter: "13:30" },
    arbeitstage: [3, 4, 5], // Mi, Do, Fr
    schlafZiel: "00:00",
    wasserZiel: 3.0,
    moscheeZielWoche: 7,
    hifz: { aktuell: "al-Jinn (72)", verse: 28 },
    thema: "dunkel",        // dunkel | hell | system
    gewichte: {
      religion: 45, produktivitaet: 18, sport: 12,
      schlaf: 8, ernaehrung: 8, soziales: 5, innen: 4
    },
    ton: "fordernd",
    codeAktiv: false,
    code: "",
    letztesBackup: null
  };

  /* ---------- Tagesdatensatz ---------- */
  function leererTag(datum) {
    return {
      datum: datum, v: SCHEMA,
      gebete: { fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null },
      sunnah: { rawatib: false, witr: false, duha: false, tahajjud: false, ishraq: false },
      quran: { gelesen: 0, murajaa: false, hifz: false },
      dhikr: { morgens: false, abends: false, istighfar: 0, salawat: 0 },
      fasten: false,
      akhlaq: {},
      notizen: {},        // freie Ergänzung zu einzelnen Fragen
      wasser: 0,
      training: null,
      gewicht: null,
      bildschirm: { gearbeitet: null, gescrollt: null },
      stimmung: null,
      schlaf: { bett: null, auf: null, fajrAuf: false },
      notiz: "",
      reise: false,
      muhasaba: false,
      score: null
    };
  }

  /* ---------- Datum ---------- */
  function key(d) {
    d = d || new Date();
    return d.getFullYear() + "-" +
           String(d.getMonth() + 1).padStart(2, "0") + "-" +
           String(d.getDate()).padStart(2, "0");
  }
  function ausKey(k) {
    var p = k.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  /* ---------- IndexedDB ---------- */
  function oeffnen() {
    return new Promise(function (ok, fehler) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var d = e.target.result;
        if (!d.objectStoreNames.contains("tage")) d.createObjectStore("tage", { keyPath: "datum" });
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

  /* ---------- Öffentlich ---------- */
  var einstellungen = null;

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

  function bereit() {
    return oeffnen().then(function () {
      return anfrage(tx("kv").get("einstellungen"));
    }).then(function (row) {
      einstellungen = tief(DEFAULTS, row ? row.wert : {});
      API.einstellungen = einstellungen;
      return einstellungen;
    });
  }

  function einstellungenSpeichern() {
    API.einstellungen = einstellungen;
    return anfrage(tx("kv", "readwrite").put({ k: "einstellungen", wert: einstellungen }));
  }

  function tag(k) {
    k = k || key();
    return anfrage(tx("tage").get(k)).then(function (t) {
      return t ? tief(leererTag(k), t) : leererTag(k);
    });
  }

  function tagSpeichern(t) {
    return anfrage(tx("tage", "readwrite").put(t));
  }

  function alleTage() {
    return anfrage(tx("tage").getAll());
  }

  /* Letzte n Tage, aufsteigend sortiert */
  function letzteTage(n) {
    return alleTage().then(function (liste) {
      liste.sort(function (a, b) { return a.datum < b.datum ? -1 : 1; });
      return n ? liste.slice(-n) : liste;
    });
  }

  /* ---------- Export / Import ---------- */
  function exportieren() {
    return alleTage().then(function (tage) {
      return {
        app: "mizan", schema: SCHEMA,
        erstellt: new Date().toISOString(),
        einstellungen: einstellungen,
        tage: tage
      };
    });
  }

  function exportDatei() {
    return exportieren().then(function (daten) {
      var text = JSON.stringify(daten, null, 2);
      var blob = new Blob([text], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "mizan-" + key() + ".json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      einstellungen.letztesBackup = new Date().toISOString();
      return einstellungenSpeichern();
    });
  }

  function importieren(daten) {
    if (!daten || daten.app !== "mizan") throw new Error("Das ist keine Mīzān-Sicherung.");
    var store = tx("tage", "readwrite");
    (daten.tage || []).forEach(function (t) { store.put(tief(leererTag(t.datum), t)); });
    einstellungen = tief(DEFAULTS, daten.einstellungen || {});
    return einstellungenSpeichern();
  }

  var API = {
    bereit: bereit,
    einstellungen: null,
    einstellungenSpeichern: einstellungenSpeichern,
    tag: tag,
    tagSpeichern: tagSpeichern,
    alleTage: alleTage,
    letzteTage: letzteTage,
    leererTag: leererTag,
    key: key,
    ausKey: ausKey,
    exportieren: exportieren,
    exportDatei: exportDatei,
    importieren: importieren,
    SCHEMA: SCHEMA
  };
  return API;
})();
