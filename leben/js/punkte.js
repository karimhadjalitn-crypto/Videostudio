/* Mīzān – eigene Tagespunkte.
   Frei anlegbar in jedem Bereich, mit verschiedenen Erfassungsarten —
   nicht jeder Punkt lässt sich sinnvoll auf ja/nein reduzieren. */
var Punkte = (function () {
  "use strict";

  var ARTEN = {
    haken:  { name: "Haken", hinweis: "Erledigt oder nicht" },
    stufen: { name: "Drei Stufen", hinweis: "Ganz · teilweise · gar nicht" },
    skala:  { name: "Skala 1–5", hinweis: "Wie gut lief es?" },
    zaehler:{ name: "Zähler", hinweis: "Wie oft? Mit Ziel" },
    zahl:   { name: "Zahl", hinweis: "Freier Wert mit Einheit" },
    zeit:   { name: "Uhrzeit", hinweis: "Wann?" },
    text:   { name: "Text", hinweis: "Ein Satz" }
  };

  var BEREICHE = {
    religion:  "Religion",
    koerper:   "Körper",
    sonstiges: "Sonstiges"
  };

  function alle(bereich) {
    var liste = Store.einstellungen.eigenePunkte || [];
    return liste.filter(function (p) {
      return p.aktiv !== false && (!bereich || p.bereich === bereich);
    });
  }

  function neu(name, bereich, art) {
    return {
      id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      name: name, ar: "", bereich: BEREICHE[bereich] ? bereich : "sonstiges", art: art || "haken",
      ziel: art === "zaehler" ? 10 : null,
      einheit: "", aktiv: true,
      aufHeute: true          // in der Tagesliste zeigen?
    };
  }

  function hinzufuegen(p) {
    if (!Store.einstellungen.eigenePunkte) Store.einstellungen.eigenePunkte = [];
    Store.einstellungen.eigenePunkte.push(p);
    return Store.einstellungenSpeichern();
  }

  function entfernen(id) {
    var l = Store.einstellungen.eigenePunkte || [];
    var i = l.findIndex(function (p) { return p.id === id; });
    if (i >= 0) l.splice(i, 1);
    return Store.einstellungenSpeichern();
  }

  function wert(tag, id) {
    return (tag.eigene || {})[id];
  }

  function setzen(tag, id, w) {
    if (!tag.eigene) tag.eigene = {};
    if (w === null || w === undefined || w === "") delete tag.eigene[id];
    else tag.eigene[id] = w;
  }

  /* Gilt ein Punkt als erledigt? Je nach Art unterschiedlich. */
  function erledigt(tag, p) {
    var w = wert(tag, p.id);
    if (w === undefined || w === null || w === "") return false;
    if (p.art === "haken") return w === true;
    if (p.art === "stufen") return w === "ganz";
    if (p.art === "skala") return w >= 3;
    if (p.art === "zaehler") return p.ziel ? w >= p.ziel : w > 0;
    return true;   // zahl, zeit, text: erfasst = erledigt
  }

  /* Kurzer Text für die Anzeige rechts in der Zeile */
  function anzeige(tag, p) {
    var w = wert(tag, p.id);
    if (w === undefined || w === null || w === "") {
      if (p.art === "zaehler" && p.ziel) return "0 / " + p.ziel;
      return null;
    }
    if (p.art === "haken") return null;
    if (p.art === "stufen") return w === "ganz" ? "ganz" : (w === "teils" ? "teils" : "nein");
    if (p.art === "skala") return w + " von 5";
    if (p.art === "zaehler") return p.ziel ? w + " / " + p.ziel : String(w);
    if (p.art === "zahl") return w + (p.einheit ? " " + p.einheit : "");
    if (p.art === "zeit") return String(w);
    if (p.art === "text") return String(w).length > 22 ? String(w).slice(0, 22) + "…" : String(w);
    return String(w);
  }

  return {
    ARTEN: ARTEN, BEREICHE: BEREICHE,
    alle: alle, neu: neu, hinzufuegen: hinzufuegen, entfernen: entfernen,
    wert: wert, setzen: setzen, erledigt: erledigt,
    anzeige: anzeige
  };
})();


/* ---------- Standardpunkte ein- und ausblenden ---------- */
var Sichtbar = (function () {
  "use strict";

  /* Alle ausblendbaren Standardpunkte, mit Bereich und Klartext */
  var KATALOG = [
    { k: "quran.murajaa",   name: "Murājaʿa",       bereich: "religion" },
    { k: "quran.hifz",      name: "Neu gelernt",    bereich: "religion" },
    { k: "quran.gelesen",   name: "Qur'an gelesen", bereich: "religion" },
    { k: "dhikr",           name: "Adhkār",         bereich: "religion" },
    { k: "sunnah.rawatib",  name: "Sunan Rawātib",  bereich: "religion" },
    { k: "sunnah.witr",     name: "Witr",           bereich: "religion" },
    { k: "sunnah.duha",     name: "Ḍuḥā",           bereich: "religion" },
    { k: "sunnah.ishraq",   name: "Ishrāq",         bereich: "religion" },
    { k: "sunnah.tahajjud", name: "Tahajjud",       bereich: "religion" },
    { k: "fasten",          name: "Gefastet",       bereich: "religion" },
    { k: "training",        name: "Trainiert",      bereich: "koerper" }
  ];

  function aus(k) {
    return (Store.einstellungen.ausgeblendet || []).indexOf(k) >= 0;
  }
  function an(k) { return !aus(k); }

  function umschalten(k) {
    var l = Store.einstellungen.ausgeblendet || (Store.einstellungen.ausgeblendet = []);
    var i = l.indexOf(k);
    if (i >= 0) l.splice(i, 1); else l.push(k);
    return Store.einstellungenSpeichern();
  }

  return { KATALOG: KATALOG, aus: aus, an: an, umschalten: umschalten };
})();
