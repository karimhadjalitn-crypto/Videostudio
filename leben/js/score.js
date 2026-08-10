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

  /* ---------- Ernährung (Phase 1: nur Wasser) ---------- */
  function ernaehrung(tag, tagZu, e) {
    var ziel = (e && e.wasserZiel) || 3;
    var q = Math.min(1, (tag.wasser || 0) / ziel);
    if (q > 0) return paar(q * 100, 100);
    return tagZu ? paar(0, 100) : paar(0, 0);
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
    if (tag.stimmung) return paar(100, 100);
    return tagZu ? paar(0, 100) : paar(0, 0);
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
    var bereiche = [
      { key: "religion",   gewicht: w.religion,   wert: religion(tag, abgelaufen, tagZu) },
      { key: "ernaehrung", gewicht: w.ernaehrung, wert: ernaehrung(tag, tagZu, e) },
      { key: "schlaf",     gewicht: w.schlaf,     wert: schlaf(tag, tagZu) },
      { key: "innen",      gewicht: w.innen,      wert: innen(tag, tagZu) }
      /* Sport, Produktivität und Soziales kommen in den Phasen 4–6 dazu.
         Bis dahin verteilt sich ihr Gewicht anteilig auf die aktiven Bereiche. */
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
