/* Mīzān – Zusammenhänge.
   Vergleicht Bereiche gegeneinander und sagt im Klartext, was sie findet.
   Grundregel: Eine Aussage erscheint erst, wenn beide Gruppen groß genug
   sind und der Unterschied deutlich ist. Lieber nichts sagen als raten. */
var Zusammenhaenge = (function () {
  "use strict";

  var MINDESTGRUPPE = 4;      // je Seite
  var MINDESTUNTERSCHIED = 12; // Prozentpunkte bzw. relative Differenz

  function mittel(liste) {
    if (!liste.length) return null;
    return liste.reduce(function (a, b) { return a + b; }, 0) / liste.length;
  }

  /* Teilt Tage in zwei Gruppen und vergleicht eine Kennzahl */
  function vergleich(tage, bedingung, kennzahl) {
    var mit = [], ohne = [];
    tage.forEach(function (t) {
      var wert = kennzahl(t);
      if (wert === null || wert === undefined) return;
      (bedingung(t) ? mit : ohne).push(wert);
    });
    if (mit.length < MINDESTGRUPPE || ohne.length < MINDESTGRUPPE) return null;
    return { mit: mittel(mit), ohne: mittel(ohne), nMit: mit.length, nOhne: ohne.length };
  }

  /* Anteil-Vergleich: „an X von Y Tagen“ */
  function anteil(tage, bedingung, ereignis) {
    var mitJa = 0, mitGesamt = 0, ohneJa = 0, ohneGesamt = 0;
    tage.forEach(function (t) {
      var e = ereignis(t);
      if (e === null || e === undefined) return;
      if (bedingung(t)) { mitGesamt++; if (e) mitJa++; }
      else { ohneGesamt++; if (e) ohneJa++; }
    });
    if (mitGesamt < MINDESTGRUPPE || ohneGesamt < MINDESTGRUPPE) return null;
    return { mitJa: mitJa, mitGesamt: mitGesamt, ohneJa: ohneJa, ohneGesamt: ohneGesamt,
             quoteMit: mitJa / mitGesamt, quoteOhne: ohneJa / ohneGesamt };
  }

  function vorMitternacht(t) {
    if (!t.schlaf || !t.schlaf.bett) return null;
    var h = +t.schlaf.bett.split(":")[0];
    return h >= 19 && h < 24;
  }
  function fajrGehalten(t) {
    var w = (t.gebete || {}).fajr;
    return w && w !== "verpasst";
  }
  function inMoschee(t) {
    return Gebetszeiten.PFLICHT.some(function (k) { return (t.gebete || {})[k] === "moschee"; });
  }
  function trainiert(t) { return !!(t.training && (t.training.arten || []).length); }
  function vielGescrollt(t) {
    var g = t.bildschirm && t.bildschirm.gescrollt;
    return g == null ? null : g >= 90;
  }
  function rueckfall(t) { return ((t.kaempfe && t.kaempfe.rueckfall) || []).length > 0; }

  /* ---------- Die Regeln ---------- */
  var REGELN = [
    {
      key: "schlafFajr",
      pruefen: function (tage) {
        var r = anteil(tage.filter(function (t) { return vorMitternacht(t) !== null; }),
          vorMitternacht, fajrGehalten);
        if (!r) return null;
        var d = (r.quoteMit - r.quoteOhne) * 100;
        if (Math.abs(d) < MINDESTUNTERSCHIED) return null;
        return {
          stark: Math.abs(d) > 30,
          text: "An den " + r.mitGesamt + " Tagen, an denen du vor 0 Uhr im Bett warst, hast du Fajr " +
                r.mitJa + "-mal gehalten. An den " + r.ohneGesamt + " späteren Nächten " + r.ohneJa + "-mal. " +
                (d > 0 ? "Das ist kein Zufall mehr." : "Interessanterweise andersherum als erwartet.")
        };
      }
    },
    {
      key: "scrollenQuran",
      pruefen: function (tage) {
        var r = anteil(tage.filter(function (t) { return vielGescrollt(t) !== null; }),
          vielGescrollt, function (t) { return !!(t.quran && t.quran.murajaa); });
        if (!r) return null;
        var d = (r.quoteOhne - r.quoteMit) * 100;
        if (Math.abs(d) < MINDESTUNTERSCHIED) return null;
        return {
          stark: Math.abs(d) > 30,
          text: "An Tagen mit über 90 Minuten Scrollen hast du " + r.mitJa + " von " + r.mitGesamt +
                " Mal Murājaʿa gemacht. An den ruhigeren Tagen " + r.ohneJa + " von " + r.ohneGesamt + ". " +
                (d > 0 ? "Es ist keine Zeitfrage — es ist eine Entscheidung." : "")
        };
      }
    },
    {
      key: "moscheeScore",
      pruefen: function (tage) {
        var r = vergleich(tage, inMoschee, function (t) { return typeof t.score === "number" ? t.score : null; });
        if (!r) return null;
        var d = r.mit - r.ohne;
        if (Math.abs(d) < 6) return null;
        return {
          stark: Math.abs(d) > 15,
          text: "An den " + r.nMit + " Tagen, an denen du in der Moschee warst, lag dein Score bei " +
                Math.round(r.mit) + ". An den " + r.nOhne + " anderen bei " + Math.round(r.ohne) + "."
        };
      }
    },
    {
      key: "sportStimmung",
      pruefen: function (tage) {
        // Stimmung am FOLGETAG
        var paare = [];
        for (var i = 0; i < tage.length - 1; i++) {
          var heute = tage[i], morgen = tage[i + 1];
          if (!morgen.stimmung) continue;
          paare.push({ trainiert: trainiert(heute), stimmung: morgen.stimmung });
        }
        var mit = paare.filter(function (p) { return p.trainiert; }).map(function (p) { return p.stimmung; });
        var ohne = paare.filter(function (p) { return !p.trainiert; }).map(function (p) { return p.stimmung; });
        if (mit.length < MINDESTGRUPPE || ohne.length < MINDESTGRUPPE) return null;
        var a = mittel(mit), b = mittel(ohne);
        if (Math.abs(a - b) < 0.4) return null;
        return {
          stark: Math.abs(a - b) > 0.8,
          text: "Nach Trainingstagen liegt deine Stimmung am Folgetag bei " +
                UI.zahl(a, 1).replace(".", ",") + " von 5, sonst bei " +
                UI.zahl(b, 1).replace(".", ",") + "."
        };
      }
    },
    {
      key: "schlafRueckfall",
      pruefen: function (tage) {
        var r = anteil(tage.filter(function (t) { return vorMitternacht(t) !== null; }),
          function (t) { return !vorMitternacht(t); }, rueckfall);
        if (!r) return null;
        var d = (r.quoteMit - r.quoteOhne) * 100;
        if (Math.abs(d) < MINDESTUNTERSCHIED) return null;
        return {
          stark: Math.abs(d) > 25, geschuetzt: true,
          text: "Nach Nächten, in denen du erst nach Mitternacht im Bett warst, gab es " +
                r.mitJa + " von " + r.mitGesamt + " Mal einen Rückfall. Bei frühem Zubettgehen " +
                r.ohneJa + " von " + r.ohneGesamt + "."
        };
      }
    },
    {
      key: "arbeitstage",
      pruefen: function (tage) {
        var arbeit = Store.einstellungen.arbeitstage || [];
        var r = vergleich(tage, function (t) {
          return arbeit.indexOf(Store.ausKey(t.datum).getDay()) >= 0;
        }, function (t) { return typeof t.score === "number" ? t.score : null; });
        if (!r) return null;
        var d = r.mit - r.ohne;
        if (Math.abs(d) < 6) return null;
        return {
          stark: Math.abs(d) > 15,
          text: "An deinen Arbeitstagen (Mi–Fr) liegt dein Score bei " + Math.round(r.mit) +
                ", an den übrigen bei " + Math.round(r.ohne) + ". " +
                (d < 0 ? "Die freien Tage tragen dich — oder die Arbeitstage kosten dich mehr, als du denkst."
                       : "Struktur tut dir offenbar gut.")
        };
      }
    },
    {
      key: "fajrProduktiv",
      pruefen: function (tage) {
        var r = vergleich(tage, function (t) { return (t.gebete || {}).fajr === "moschee"; },
          function (t) {
            var w = (t.arbeit && t.arbeit.wichtigste) || [];
            var gesetzt = w.filter(function (x) { return x && x.text; }).length;
            if (!gesetzt) return null;
            return w.filter(function (x) { return x && x.erledigt; }).length / gesetzt * 100;
          });
        if (!r) return null;
        var d = r.mit - r.ohne;
        if (Math.abs(d) < MINDESTUNTERSCHIED) return null;
        return {
          stark: Math.abs(d) > 25,
          text: "An Tagen mit Fajr in der Moschee hast du " + Math.round(r.mit) +
                " % deiner wichtigsten Aufgaben geschafft, sonst " + Math.round(r.ohne) + " %."
        };
      }
    },
    {
      key: "wochentagSchwach",
      pruefen: function (tage) {
        var proTag = [[], [], [], [], [], [], []];
        tage.forEach(function (t) {
          if (typeof t.score !== "number") return;
          proTag[Store.ausKey(t.datum).getDay()].push(t.score);
        });
        var mitGenug = proTag.map(function (l, i) {
          return { tag: i, n: l.length, schnitt: mittel(l) };
        }).filter(function (x) { return x.n >= 3; });
        if (mitGenug.length < 5) return null;
        mitGenug.sort(function (a, b) { return a.schnitt - b.schnitt; });
        var schwach = mitGenug[0], stark = mitGenug[mitGenug.length - 1];
        if (stark.schnitt - schwach.schnitt < 12) return null;
        return {
          stark: stark.schnitt - schwach.schnitt > 25,
          text: UI.WOCHENTAGE[schwach.tag] + " ist dein schwächster Tag (Schnitt " +
                Math.round(schwach.schnitt) + "), " + UI.WOCHENTAGE[stark.tag] + " dein stärkster (" +
                Math.round(stark.schnitt) + ")."
        };
      }
    }
  ];

  /* Alle Regeln prüfen. geschuetzt=true nur, wenn ausdrücklich erlaubt. */
  function alle(tage, mitGeschuetzten) {
    var sortiert = tage.slice().sort(function (a, b) { return a.datum < b.datum ? -1 : 1; });
    var out = [];
    REGELN.forEach(function (r) {
      if (r.key === "schlafRueckfall" && !mitGeschuetzten) return;
      try {
        var e = r.pruefen(sortiert);
        if (e) out.push({ key: r.key, text: e.text, stark: !!e.stark });
      } catch (fehler) { /* eine kaputte Regel darf den Rest nicht mitreißen */ }
    });
    out.sort(function (a, b) { return (b.stark ? 1 : 0) - (a.stark ? 1 : 0); });
    return out;
  }

  /* Wie viele Tage fehlen noch für belastbare Aussagen? */
  function reife(tage) {
    var mitScore = tage.filter(function (t) { return typeof t.score === "number"; }).length;
    return { tage: mitScore, genug: mitScore >= 14, ziel: 14 };
  }

  return { alle: alle, reife: reife, MINDESTGRUPPE: MINDESTGRUPPE };
})();
