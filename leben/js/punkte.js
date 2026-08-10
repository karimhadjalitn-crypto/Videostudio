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
    religion:   "Religion",
    koerper:    "Körper & Sport",
    ernaehrung: "Ernährung",
    schlaf:     "Schlaf",
    arbeit:     "Arbeit & Uni",
    business:   "Business",
    finanzen:   "Finanzen",
    soziales:   "Soziales",
    innen:      "Innenleben",
    sonstiges:  "Sonstiges"
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
      name: name, ar: "", bereich: bereich || "sonstiges", art: art || "haken",
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

  /* Anteil zwischen 0 und 1 — geht in den Score ein. */
  function anteil(tag, p) {
    var w = wert(tag, p.id);
    if (w === undefined || w === null || w === "") return null;
    if (p.art === "haken") return w ? 1 : 0;
    if (p.art === "stufen") return w === "ganz" ? 1 : (w === "teils" ? 0.5 : 0);
    if (p.art === "skala") return Math.max(0, Math.min(1, (w - 1) / 4));
    if (p.art === "zaehler") return p.ziel ? Math.min(1, w / p.ziel) : (w > 0 ? 1 : 0);
    return 1;
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
    wert: wert, setzen: setzen, erledigt: erledigt, anteil: anteil,
    anzeige: anzeige
  };
})();


/* ---------- Standardpunkte ein- und ausblenden ---------- */
var Sichtbar = (function () {
  "use strict";

  /* Alle ausblendbaren Standardpunkte, mit Bereich und Klartext */
  var KATALOG = [
    { k: "sunnah.rawatib",  name: "Sunan Rawātib",       bereich: "religion" },
    { k: "sunnah.witr",     name: "Witr",                bereich: "religion" },
    { k: "sunnah.duha",     name: "Ḍuḥā",                bereich: "religion" },
    { k: "sunnah.ishraq",   name: "Ishrāq",              bereich: "religion" },
    { k: "sunnah.tahajjud", name: "Tahajjud",            bereich: "religion" },
    { k: "quran.murajaa",   name: "Murājaʿa",            bereich: "religion" },
    { k: "quran.hifz",      name: "Hifz — neu gelernt",  bereich: "religion" },
    { k: "quran.gelesen",   name: "Qur'an gelesen",      bereich: "religion" },
    { k: "dhikr.morgens",   name: "Adhkār am Morgen",    bereich: "religion" },
    { k: "dhikr.abends",    name: "Adhkār am Abend",     bereich: "religion" },
    { k: "dhikr.nachGebet", name: "Adhkār nach dem Gebet", bereich: "religion" },
    { k: "wasser",          name: "Wasser",              bereich: "ernaehrung" },
    { k: "essen.suess",     name: "Süßigkeiten",         bereich: "ernaehrung" },
    { k: "essen.nichtUeberessen", name: "Nicht überessen", bereich: "ernaehrung" },
    { k: "essen.protein",   name: "Protein",             bereich: "ernaehrung" },
    { k: "training",        name: "Training",            bereich: "koerper" },
    { k: "gewicht",         name: "Gewicht",             bereich: "koerper" },
    { k: "schlaf.bett",     name: "Zubettgehzeit",       bereich: "schlaf" },
    { k: "arbeit.wichtigste", name: "Die drei Wichtigsten", bereich: "arbeit" },
    { k: "bildschirm",      name: "Bildschirmzeit",      bereich: "arbeit" },
    { k: "business.videos", name: "Videos",              bereich: "business" },
    { k: "business.produkte", name: "Produkte recherchiert", bereich: "business" },
    { k: "business.skripte", name: "Skripte",            bereich: "business" },
    { k: "sadaqa",          name: "Sadaqa",              bereich: "finanzen" },
    { k: "stimmung",        name: "Stimmung",            bereich: "innen" },
    { k: "dankbar",         name: "Dankbarkeit",         bereich: "innen" }
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


/* ---------- Baustein: eigene Punkte eines Bereichs ----------
   Steht unter jeder Bereichsansicht. Damit lässt sich überall etwas
   hinzufügen oder wegnehmen — nicht nur auf „Heute“. */
var Eigene = (function () {
  "use strict";

  function block(bereich, tag, neuLaden) {
    var liste = Punkte.alle(bereich);

    function speichern() {
      tag.score = Score.fuer(tag).wert;
      return Store.tagSpeichern(tag).then(function () { if (neuLaden) neuLaden(); });
    }

    var zeilen = liste.map(function (p) {
      return UI.punktZeile(tag, p, speichern);
    });

    zeilen.push(UI.el("div.zeile.tippbar.hinzu", {
      onclick: function () { location.hash = "#/punkte?b=" + bereich; }
    }, [
      UI.el("span.zt.dehnbar", {
        text: liste.length ? "Punkte anpassen" : "Eigenen Punkt hinzufügen"
      }),
      UI.el("span.bpfeil.klein", { text: "›" })
    ]));

    return UI.el("div.block", [
      UI.el("div.blockkopf", {
        text: liste.length ? "Deine Punkte · " + liste.length : "Deine Punkte"
      }),
      UI.el("div.gruppe", zeilen)
    ]);
  }

  return { block: block };
})();
