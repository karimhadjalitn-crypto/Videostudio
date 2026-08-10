/* Mīzān – Tagesscore.
   Grundsatz: Was noch nicht fällig war, zählt nicht gegen dich.
   Was du früh erledigst, hebt den Score sofort.
   Erst wenn der Tag geschlossen ist (Muḥāsaba oder Datum vorbei),
   zählt alles Offene als nicht erledigt. */
var Score = (function () {
  "use strict";

  var GEBETSWERT = {
    moschee:    1.00,
    puenktlich: 0.85,
    fenster:    0.65,
    spaet:      0.30,
    verpasst:   0.00
  };

  var GEBETSSTUFEN = [
    { key: "moschee",    kurz: "Moschee",   lang: "In der Moschee (Jamāʿa)", farbe: "jade" },
    { key: "puenktlich", kurz: "Pünktlich", lang: "Pünktlich zu Hause",      farbe: "jade" },
    { key: "fenster",    kurz: "Fenster",   lang: "Noch im Zeitfenster",     farbe: "jade-dim" },
    { key: "spaet",      kurz: "Spät",      lang: "Nach Ablauf nachgeholt",  farbe: "amber" },
    { key: "verpasst",   kurz: "Verpasst",  lang: "Nicht gebetet",           farbe: "rose" }
  ];

  /* Gewichte innerhalb der Religion */
  var RELIGION = { gebete: 55, sunnah: 10, quran: 15, dhikr: 10, akhlaq: 10 };

  function paar(erreicht, moeglich) { return { got: erreicht, max: moeglich }; }

  /* Ein Ja/Nein-Punkt: offen und Tag noch nicht zu -> zählt gar nicht */
  function haken(erledigt, gewicht, tagZu) {
    if (erledigt) return paar(gewicht, gewicht);
    return tagZu ? paar(0, gewicht) : paar(0, 0);
  }

  function summe(teile) {
    return teile.reduce(function (a, b) {
      return { got: a.got + b.got, max: a.max + b.max };
    }, { got: 0, max: 0 });
  }

  function anteil(p) { return p.max > 0 ? p.got / p.max : 0; }

  /* ---------- Religion ---------- */
  function religion(tag, abgelaufen, tagZu) {
    var teile = [];

    /* Pflichtgebete: Ein Gebet zählt erst gegen dich, wenn sein Fenster
       ZU ist — nicht schon, wenn es aufgeht. Eingetragenes zählt sofort. */
    var g = { got: 0, max: 0 };
    Gebetszeiten.PFLICHT.forEach(function (k) {
      var wert = tag.gebete[k];
      if (wert) { g.got += GEBETSWERT[wert]; g.max += 1; }
      else if (abgelaufen.indexOf(k) >= 0) { g.max += 1; }
    });
    teile.push(paar(g.got * RELIGION.gebete, g.max * RELIGION.gebete));

    // Sunan
    var s = ["rawatib", "witr", "duha", "tahajjud", "ishraq"];
    var sg = RELIGION.sunnah / s.length;
    s.forEach(function (k) { teile.push(haken(tag.sunnah[k], sg, tagZu)); });

    // Qur'an
    teile.push(haken(tag.quran.murajaa, RELIGION.quran * 0.5, tagZu));
    teile.push(haken(tag.quran.hifz, RELIGION.quran * 0.25, tagZu));
    teile.push(haken(tag.quran.gelesen > 0, RELIGION.quran * 0.25, tagZu));

    // Adhkār
    teile.push(haken(tag.dhikr.morgens, RELIGION.dhikr / 2, tagZu));
    teile.push(haken(tag.dhikr.abends, RELIGION.dhikr / 2, tagZu));

    // Akhlāq – nur was abends tatsächlich gefragt wurde
    var keys = Object.keys(tag.akhlaq || {});
    if (keys.length) {
      var ag = RELIGION.akhlaq / keys.length;
      keys.forEach(function (k) {
        var w = tag.akhlaq[k] === "ja" ? 1 : (tag.akhlaq[k] === "teils" ? 0.5 : 0);
        teile.push(paar(w * ag, ag));
      });
    } else if (tagZu) {
      teile.push(paar(0, RELIGION.akhlaq));
    }

    return summe(teile);
  }

  /* ---------- Ernährung ---------- */
  function ernaehrung(tag, tagZu, e) {
    var teile = [];

    // Wasser: anteilig, sobald der erste Schluck drin ist
    var ziel = (e && e.wasserZiel) || 3;
    var q = Math.min(1, (tag.wasser || 0) / ziel);
    if (q > 0) teile.push(paar(q * 40, 40));
    else teile.push(tagZu ? paar(0, 40) : paar(0, 0));

    // Süßigkeiten: null = noch nicht beantwortet
    var s = tag.essen && tag.essen.suess;
    if (s === "keine") teile.push(paar(25, 25));
    else if (s === "wenig") teile.push(paar(15, 25));
    else if (s === "viel") teile.push(paar(0, 25));
    else if (tagZu) teile.push(paar(0, 25));

    teile.push(haken(tag.essen && tag.essen.nichtUeberessen, 15, tagZu));
    teile.push(haken(tag.essen && tag.essen.protein, 10, tagZu));

    // Supplemente: anteilig nach Liste
    var liste = (e && e.essen && e.essen.supplemente) || [];
    if (liste.length) {
      var genommen = liste.filter(function (n) {
        return tag.essen && tag.essen.supplemente && tag.essen.supplemente[n];
      }).length;
      if (genommen > 0) teile.push(paar(genommen / liste.length * 10, 10));
      else teile.push(tagZu ? paar(0, 10) : paar(0, 0));
    }

    return summe(teile);
  }

  /* ---------- Sport und Körper ---------- */
  function sport(tag, tagZu, e, wocheTrainings) {
    var arten = (tag.training && tag.training.arten) || [];
    var ziel = (e.sport && e.sport.wochenziel) || 4;

    // Ein Trainingstag zählt voll. An trainingsfreien Tagen richtet sich
    // die Bewertung danach, ob das Wochenziel noch erreichbar ist.
    if (arten.length) return paar(100, 100);
    if (!tagZu) return paar(0, 0);
    // Tag zu und nicht trainiert: nur anteilig abwerten, Ruhetage gehören dazu
    var anteilWoche = Math.min(1, (wocheTrainings || 0) / ziel);
    return paar(anteilWoche * 100, 100);
  }

  /* ---------- Produktivität ---------- */
  function produktivitaet(tag, tagZu, e) {
    var teile = [];
    var w = (tag.arbeit && tag.arbeit.wichtigste) || [];
    var erledigt = w.filter(function (x) { return x && x.erledigt; }).length;

    // Die drei Wichtigsten machen den Hauptteil aus
    if (w.length) teile.push(paar(erledigt / w.length * 55, 55));
    else teile.push(tagZu ? paar(0, 55) : paar(0, 0));

    // Business: gearbeitet ja/nein
    var b = tag.business || {};
    var getan = (b.videos || 0) + (b.produkte || 0) + (b.skripte || 0);
    if (getan > 0) teile.push(paar(20, 20));
    else teile.push(tagZu ? paar(0, 20) : paar(0, 0));

    /* Bildschirmzeit: gearbeitet zählt positiv, gescrollt negativ.
       Das ist der Punkt, an dem jeder normale Tracker bei Karim
       falschliegt — sein Geschäft läuft über dieselbe App wie seine
       größte Baustelle. */
    var bs = tag.bildschirm || {};
    if (bs.gescrollt != null || bs.gearbeitet != null) {
      var gescrollt = bs.gescrollt || 0;
      // 0 Min = voll, 60 Min = halb, ab 150 Min = null
      var wert = gescrollt <= 0 ? 1 : Math.max(0, 1 - gescrollt / 150);
      teile.push(paar(wert * 25, 25));
    } else {
      teile.push(tagZu ? paar(0, 25) : paar(0, 0));
    }

    return summe(teile);
  }

  /* ---------- Soziales ---------- */
  function soziales(tag, tagZu, e, letzterKontakt) {
    var liste = e.kontakte || [];
    if (!liste.length) return paar(0, 0);
    var heute = Store.ausKey(tag.datum);
    var teile = [];

    liste.forEach(function (k) {
      var g = (k.intervall || 7);
      var erreicht = tag.kontakte && tag.kontakte[k.name];
      if (erreicht) { teile.push(paar(1, 1)); return; }
      // Nur fordern, wenn das Intervall wirklich abgelaufen ist
      var letzte = letzterKontakt && letzterKontakt[k.name];
      if (!letzte) { if (tagZu) teile.push(paar(0, 1)); return; }
      var tageHer = Math.round((heute - Store.ausKey(letzte)) / 86400000);
      if (tageHer >= g && tagZu) teile.push(paar(0, 1));
    });

    return summe(teile);
  }

  /* ---------- Finanzen (Teil von „Innenleben & Finanzen“) ---------- */
  function finanzen(tag, tagZu, e) {
    var teile = [];
    // Im Rahmen des Budgets geblieben?
    var budget = (e.finanzen && e.finanzen.budget) || 0;
    if (budget > 0) {
      var summeTag = (tag.ausgaben || []).reduce(function (a, x) { return a + (x.betrag || 0); }, 0);
      var tagesbudget = budget / 30;
      if (summeTag <= tagesbudget) teile.push(paar(50, 50));
      else teile.push(paar(Math.max(0, 50 - (summeTag - tagesbudget) / tagesbudget * 25), 50));
    }
    // Sadaqa gegeben
    if (tag.sadaqa > 0) teile.push(paar(50, 50));
    else if (tagZu) teile.push(paar(0, 50));
    return summe(teile);
  }

  /* ---------- Schlaf ---------- */
  function schlaf(tag, tagZu) {
    if (!tag.schlaf || !tag.schlaf.bett) return tagZu ? paar(0, 100) : paar(0, 0);
    var p = tag.schlaf.bett.split(":");
    var stunde = +p[0] + (+p[1]) / 60;
    // Ziel: vor 0 Uhr im Bett. 22–24 Uhr = voll, danach fallend.
    var wert;
    if (stunde >= 20 && stunde < 24) wert = 1;
    else if (stunde < 4) wert = Math.max(0, 1 - stunde / 4);
    else wert = 0.5;
    if (tag.schlaf.fajrAuf) wert = Math.min(1, wert + 0.15);
    return paar(wert * 100, 100);
  }

  /* ---------- Innenleben ---------- */
  function innen(tag, tagZu) {
    var teile = [];
    teile.push(tag.stimmung ? paar(60, 60) : (tagZu ? paar(0, 60) : paar(0, 0)));
    teile.push(haken((tag.dankbar || []).length > 0, 40, tagZu));
    return summe(teile);
  }

  /* ---------- Gesamtscore ---------- */
  function fuer(tag, optionen) {
    optionen = optionen || {};
    var e = optionen.einstellungen || Store.einstellungen;
    var jetzt = optionen.jetzt || new Date();
    var heute = Store.key(jetzt);
    // optionen.schliessen: so rechnen, als wäre der Tag schon abgeschlossen.
    // Sonst zeigt die Abendabrechnung eine geschönte Zahl, die danach fällt.
    var tagZu = !!optionen.schliessen || !!tag.muhasaba || tag.datum < heute;
    var abgelaufen = (optionen.schliessen || tag.datum !== heute)
      ? Gebetszeiten.PFLICHT.slice()
      : Gebetszeiten.abgelaufen(jetzt, e);

    var w = e.gewichte;
    var innenUndGeld = summe([
      innen(tag, tagZu), finanzen(tag, tagZu, e)
    ]);

    var bereiche = [
      { key: "religion",       gewicht: w.religion,       wert: religion(tag, abgelaufen, tagZu) },
      { key: "produktivitaet", gewicht: w.produktivitaet, wert: produktivitaet(tag, tagZu, e) },
      { key: "sport",          gewicht: w.sport,          wert: sport(tag, tagZu, e, optionen.wocheTrainings) },
      { key: "schlaf",         gewicht: w.schlaf,         wert: schlaf(tag, tagZu) },
      { key: "ernaehrung",     gewicht: w.ernaehrung,     wert: ernaehrung(tag, tagZu, e) },
      { key: "soziales",       gewicht: w.soziales,       wert: soziales(tag, tagZu, e, optionen.letzterKontakt) },
      { key: "innen",          gewicht: w.innen,          wert: innenUndGeld }
    ];

    var got = 0, max = 0, detail = {};
    bereiche.forEach(function (b) {
      if (b.wert.max <= 0) { detail[b.key] = null; return; }
      var q = anteil(b.wert);
      detail[b.key] = Math.round(q * 100);
      got += q * b.gewicht;
      max += b.gewicht;
    });

    return {
      wert: max > 0 ? Math.round(got / max * 100) : 0,
      bereiche: detail,
      tagZu: tagZu,
      abgelaufen: abgelaufen
    };
  }

  /* Durchschnitt der letzten n Tage, ohne heute */
  function schnitt(tage, heute) {
    var relevant = tage.filter(function (t) {
      return t.datum !== heute && typeof t.score === "number";
    });
    if (!relevant.length) return null;
    var s = relevant.reduce(function (a, t) { return a + t.score; }, 0);
    return Math.round(s / relevant.length);
  }

  return {
    fuer: fuer, schnitt: schnitt,
    GEBETSWERT: GEBETSWERT, GEBETSSTUFEN: GEBETSSTUFEN, RELIGION: RELIGION
  };
})();
