/* Mīzān – Speicher.
   Alles liegt in IndexedDB auf diesem Gerät. Kein Server, keine Übertragung. */
var Store = (function () {
  "use strict";

  var DB_NAME = "mizan";
  var DB_VERSION = 2;      // v2: eigener Speicher für Aufgaben
  var SCHEMA = 2;          // Version der Tagesdatensätze (für spätere Migrationen)
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
    /* Rückwärts durch den Mushaf: an-Nās (114) bis al-Muzzammil (73) sitzen,
       al-Jinn (72) wird gerade gelernt. Wird beim ersten Start befüllt. */
    hifz: { status: {}, richtung: "rueckwaerts" },
    fasten: { qada: 0 },
    thema: "hell",          // hell | dunkel | system
    gewichte: {
      religion: 45, produktivitaet: 18, sport: 12,
      schlaf: 8, ernaehrung: 8, soziales: 5, innen: 4
    },
    ton: "fordernd",

    /* ---------- Körper und Sport ---------- */
    sport: {
      wochenziel: 4,
      arten: ["Calisthenics", "Kraft", "Fußball"],
      orte: ["McFit", "Draußen", "Zuhause"],
      gewichtZiel: { von: 75, bis: 78 }
    },

    /* ---------- Ernährung ---------- */
    essen: {
      supplemente: ["D3 + K2", "Ashwagandha", "Magnesium", "Vitamin C + Zink",
                    "Vitamin-B-Komplex", "Omega-3", "Kreatin"],
      suessAusnahmen: 2       // erlaubte Ausnahmen pro Woche
    },

    /* ---------- Arbeit, Uni, Selbstständigkeit ---------- */
    projekte: ["FOM Wirtschaftspsychologie", "LMU Klinikum", "Bewerbungen", "Selbstständigkeit"],

    /* Wiederkehrende Termine — Wochentage 0=So … 6=Sa */
    termine: [
      { id: "t1", name: "Arbeit · LMU Klinikum", tage: [3, 4, 5], von: "08:00", bis: "12:30", art: "arbeit" },
      { id: "t2", name: "Jumuʿa", tage: [5], von: "14:45", bis: "15:45", art: "religion" },
      { id: "t3", name: "Qur'an-Unterricht", tage: [6], von: "18:00", bis: "19:30", art: "religion" },
      { id: "t4", name: "Arabisch online", tage: [2], von: "19:00", bis: "20:00", art: "lernen" }
    ],

    /* Bücher mit Lesefortschritt */
    buecher: [
      { titel: "Minhāj al-Muslim", autor: "Abū Bakr al-Jazāʾirī", seiten: 0, stand: 0 }
    ],
    business: { videoZielWoche: 4 },

    /* ---------- Finanzen: keine Zakāt-Berechnung, nur Sadaqa ---------- */
    finanzen: {
      schwelle: 20,           // darunter läuft es als Wochenpauschale
      kategorien: ["Essen", "Transport", "Uni & Bücher", "Kleidung", "Handy & Abos",
                   "Sadaqa", "Freizeit", "Sonstiges"],
      budget: 0,
      sadaqaZielMonat: 0,
      sparziel: { name: "", betrag: 0, stand: 0 },
      vermoegen: 0
    },

    /* ---------- Soziales ---------- */
    kontakte: [
      { name: "Eltern", intervall: 3 },
      { name: "Neva", intervall: 1 },
      { name: "Geschwister", intervall: 7 },
      { name: "Verwandte", intervall: 21 },
      { name: "Freunde", intervall: 14 }
    ],

    /* ---------- Ehe und Familienplanung ---------- */
    ehe: { geschuetzt: true, notiz: "" },

    /* ---------- Geschützter Bereich ---------- */
    kaempfe: [
      { id: "scrollen", name: "Scrollen", aktiv: true },
      { id: "blick", name: "Blick senken", aktiv: true },
      { id: "zunge", name: "Zunge hüten", aktiv: true },
      { id: "aufschieben", name: "Aufschieben", aktiv: true },
      { id: "zorn", name: "Zorn", aktiv: false }
    ],
    sperre: { appCode: "", bereichCode: "" },

    /* ---------- Eigene Tagespunkte ----------
       Frei anlegbar, in jedem Bereich, mit verschiedenen Erfassungsarten. */
    eigenePunkte: [],

    /* Ausgeblendete Standardpunkte (Schlüssel wie "sunnah.duha") */
    ausgeblendet: [],

    /* Einmalige Kalendereinträge */
    eintraege: [],

    /* ---------- Sondermodi ---------- */
    reise: { aktiv: false, ort: "", von: null, bis: null },

    letztesBackup: null
  };

  /* ---------- Tagesdatensatz ---------- */
  function leererTag(datum) {
    return {
      datum: datum, v: SCHEMA,
      gebete: { fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null },
      sunnah: { rawatib: false, witr: false, duha: false, tahajjud: false, ishraq: false, tarawih: false },
      quran: { gelesen: 0, murajaa: false, hifz: false },
      buecher: {},          // Titel -> heute gelesene Seiten
      dhikr: { morgens: false, abends: false, nachGebet: 0, istighfar: 0, salawat: 0 },
      fasten: false,
      akhlaq: {},
      notizen: {},        // freie Ergänzung zu einzelnen Fragen
      wasser: 0,
      essen: { suess: null, nichtUeberessen: false, protein: false, supplemente: {} },
      training: { arten: [], ort: null },
      gewicht: null,
      schritte: null,
      bildschirm: { gearbeitet: null, gescrollt: null },
      arbeit: { erledigt: 0, wichtigste: [] },
      business: { videos: 0, produkte: 0, skripte: 0, check: {} },
      ausgaben: [],          // { betrag, kategorie, notiz }
      sadaqa: 0,
      kontakte: {},          // name -> true, wenn heute erreicht
      kaempfe: { rueckfall: [], ausloeser: {} },
      stimmung: null,
      dankbar: [],
      eigene: {},           // id -> Wert der eigenen Punkte
      schlaf: { bett: null, auf: null, fajrAuf: false },
      notiz: "",
      reise: false,
      muhasaba: false,
      score: null
    };
  }

  /* ---------- Datums-Kontext ----------
     Alle Ansichten arbeiten auf diesem Datum. Standard ist heute; über das
     Datumsband blätterst du zurück und trägst für alte Tage genauso ein. */
  var gewaehltesDatum = null;

  function heute() { return key(new Date()); }
  function datum() { return gewaehltesDatum || heute(); }
  function setzeDatum(k) {
    gewaehltesDatum = (k === heute()) ? null : k;
    return API.datum();
  }
  function istHeute() { return datum() === heute(); }
  function datumVerschieben(tage) {
    var d = ausKey(datum());
    d.setDate(d.getDate() + tage);
    var neu = key(d);
    if (neu > heute()) neu = heute();     // Zukunft gibt es nicht
    return setzeDatum(neu);
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
        // Aufgaben leben über Tage hinweg und brauchen einen eigenen Speicher
        if (!d.objectStoreNames.contains("aufgaben")) {
          d.createObjectStore("aufgaben", { keyPath: "id" });
        }
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

  /* ---------- Tagescache ----------
     Der Score braucht den Wochenzusammenhang: wie oft wurde diese Woche
     trainiert, wann war der letzte Kontakt. Früher musste jede Ansicht das
     selbst mitliefern — je nachdem, von wo aus gespeichert wurde, kam ein
     anderer Score heraus. Der Cache macht das eindeutig. */
  var tageCache = [];

  function tageImSpeicher() { return tageCache; }

  /* Die n Kalendertage, die auf `bis` enden — Lücken werden zu leeren Tagen.
     Damit stimmen Wochenstreifen und Wochenzähler auch im Rückblick; vorher
     hingen sie an den zuletzt gespeicherten Tagen, egal welchen. */
  function fensterBis(bis, n, live) {
    var karte = {};
    tageCache.forEach(function (t) { karte[t.datum] = t; });
    if (live) karte[live.datum] = live;
    var d = ausKey(bis), out = [];
    for (var i = n - 1; i >= 0; i--) {
      var k = key(new Date(d.getFullYear(), d.getMonth(), d.getDate() - i));
      out.push(karte[k] || leererTag(k));
    }
    return out;
  }

  function cacheAktualisieren(t) {
    var kopie = JSON.parse(JSON.stringify(t));
    for (var i = 0; i < tageCache.length; i++) {
      if (tageCache[i].datum === t.datum) { tageCache[i] = kopie; return; }
    }
    tageCache.push(kopie);
    tageCache.sort(function (a, b) { return a.datum < b.datum ? -1 : 1; });
  }

  function bereit() {
    return oeffnen().then(function () {
      return anfrage(tx("kv").get("einstellungen"));
    }).then(function (row) {
      einstellungen = tief(DEFAULTS, row ? row.wert : {});
      // Altlast: früher stand hier ein Text statt der Suren-Tabelle
      if (typeof einstellungen.hifz.aktuell === "string") delete einstellungen.hifz.aktuell;
      if (typeof einstellungen.hifz.verse === "number") delete einstellungen.hifz.verse;
      API.einstellungen = einstellungen;
      return alleTage();
    }).then(function () {
      return einstellungen;
    });
  }

  function einstellungenSpeichern() {
    API.einstellungen = einstellungen;
    return anfrage(tx("kv", "readwrite").put({ k: "einstellungen", wert: einstellungen }));
  }

  function tag(k) {
    k = k || datum();
    return anfrage(tx("tage").get(k)).then(function (t) {
      return t ? tief(leererTag(k), t) : leererTag(k);
    });
  }

  function tagSpeichern(t) {
    cacheAktualisieren(t);
    return anfrage(tx("tage", "readwrite").put(t));
  }

  function alleTage() {
    return anfrage(tx("tage").getAll()).then(function (liste) {
      liste.sort(function (a, b) { return a.datum < b.datum ? -1 : 1; });
      tageCache = liste;
      return liste;
    });
  }

  /* Letzte n Tage, aufsteigend sortiert */
  function letzteTage(n) {
    return alleTage().then(function (liste) {
      return n ? liste.slice(-n) : liste;
    });
  }

  /* ---------- Aufgaben ---------- */
  function neueAufgabe(text, projekt) {
    return {
      id: "a" + Date.now() + Math.random().toString(36).slice(2, 7),
      text: text, projekt: projekt || null,
      faellig: null,          // "YYYY-MM-DD"
      wiederholung: null,     // null | "taeglich" | "woechentlich" | "monatlich"
      erledigt: false, erledigtAm: null,
      wichtig: false,         // eine der „drei Wichtigsten“
      angelegt: new Date().toISOString()
    };
  }
  function aufgaben() { return anfrage(tx("aufgaben").getAll()); }
  function aufgabeSpeichern(a) { return anfrage(tx("aufgaben", "readwrite").put(a)); }
  function aufgabeLoeschen(id) { return anfrage(tx("aufgaben", "readwrite").delete(id)); }

  /* ---------- Export / Import ---------- */
  /* Tiefe Kopie, keine lebende Referenz: sonst verändert sich eine schon
     erzeugte Sicherung mit, sobald danach eine Einstellung angefasst wird. */
  function exportieren() {
    return Promise.all([alleTage(), aufgaben()]).then(function (r) {
      return {
        app: "mizan", schema: SCHEMA,
        erstellt: new Date().toISOString(),
        einstellungen: JSON.parse(JSON.stringify(einstellungen)),
        tage: JSON.parse(JSON.stringify(r[0])),
        aufgaben: JSON.parse(JSON.stringify(r[1]))
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

  /* Wartet, bis die Transaktion wirklich durch ist. Vorher wurde die
     nächste Transaktion geöffnet, während die Puts noch liefen — dabei
     konnten Tage verlorengehen. */
  function importieren(daten) {
    if (!daten || daten.app !== "mizan") throw new Error("Das ist keine Mīzān-Sicherung.");
    return new Promise(function (ok, fehler) {
      var t = db.transaction(["tage", "aufgaben"], "readwrite");
      var store = t.objectStore("tage");
      (daten.tage || []).forEach(function (x) {
        if (x && x.datum) store.put(tief(leererTag(x.datum), x));
      });
      var aStore = t.objectStore("aufgaben");
      (daten.aufgaben || []).forEach(function (a) { if (a && a.id) aStore.put(a); });
      t.oncomplete = function () { ok(); };
      t.onerror = function () { fehler(t.error); };
      t.onabort = function () { fehler(t.error || new Error("Import abgebrochen")); };
    }).then(function () {
      einstellungen = tief(DEFAULTS, daten.einstellungen || {});
      if (typeof einstellungen.hifz.aktuell === "string") delete einstellungen.hifz.aktuell;
      return einstellungenSpeichern();
    }).then(function () {
      return alleTage();      // Cache nach dem Import neu aufbauen
    });
  }

  var API = {
    bereit: bereit,
    einstellungen: null,
    einstellungenSpeichern: einstellungenSpeichern,
    tag: tag,
    tagSpeichern: tagSpeichern,
    alleTage: alleTage,
    letzteTage: letzteTage,
    tageImSpeicher: tageImSpeicher,
    fensterBis: fensterBis,
    leererTag: leererTag,
    heute: heute,
    datum: datum,
    setzeDatum: setzeDatum,
    istHeute: istHeute,
    datumVerschieben: datumVerschieben,
    aufgaben: aufgaben,
    neueAufgabe: neueAufgabe,
    aufgabeSpeichern: aufgabeSpeichern,
    aufgabeLoeschen: aufgabeLoeschen,
    key: key,
    ausKey: ausKey,
    exportieren: exportieren,
    exportDatei: exportDatei,
    importieren: importieren,
    SCHEMA: SCHEMA
  };
  return API;
})();
