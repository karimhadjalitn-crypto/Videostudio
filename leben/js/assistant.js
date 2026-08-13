/* Mīzān – der Assistent.
   Ein Satz, mehr nicht. Er redet ausschließlich über deine Gebete —
   das ist das, was dir am wichtigsten ist, und das Einzige, worüber
   die App genug weiß, um etwas Vernünftiges zu sagen.
   Er lobt nicht für Selbstverständlichkeiten. */
var Assistent = (function () {
  "use strict";

  /* Der eingestellte Ton entscheidet, wie hart formuliert wird.
     "fordernd" ist der Standard; "sanft" nimmt die Schärfe raus,
     "hart" verstärkt sie. */
  function ton() {
    return (Store.einstellungen && Store.einstellungen.ton) || "fordernd";
  }

  function schaerfen(text, sanftText) {
    var t = ton();
    if (t === "sanft" && sanftText) return sanftText;
    if (t === "hart") {
      // Satzzeichen behalten, sonst klebt der Zusatz am Vorsatz
      return /[.!?]$/.test(text) ? text + " Keine Ausreden." : text + ". Keine Ausreden.";
    }
    return text;
  }

  function zaehle(tag, wert) {
    var g = tag.gebete || {};
    return Gebetszeiten.PFLICHT.filter(function (k) { return g[k] === wert; }).length;
  }

  /* Wie liefen die letzten Tage bei den Gebeten? */
  function lage(tage, bisKey) {
    var alt = tage.filter(function (t) {
      return t.datum < bisKey && t.gebete &&
             Gebetszeiten.PFLICHT.some(function (k) { return t.gebete[k]; });
    });
    var letzte = alt.slice(-7);
    var verpasst = letzte.reduce(function (a, t) { return a + zaehle(t, "verpasst"); }, 0);
    var moschee = letzte.reduce(function (a, t) { return a + zaehle(t, "moschee"); }, 0);
    var sauber = letzte.length >= 3 && letzte.slice(-3).every(function (t) {
      return zaehle(t, "verpasst") === 0 &&
             Gebetszeiten.PFLICHT.every(function (k) { return t.gebete[k]; });
    });
    return { tage: letzte.length, verpasstWoche: verpasst, moscheeWoche: moschee, sauber: sauber };
  }

  /* Ein Satz für den Kopf von „Heute" */
  function satzZumVortag(tage, heuteKey) {
    var gestern = tage.filter(function (t) {
      return t.datum < heuteKey && t.gebete &&
             Gebetszeiten.PFLICHT.some(function (k) { return t.gebete[k]; });
    }).slice(-1)[0];

    if (!gestern) {
      return "Trag ein, wie du gebetet hast — der Rest ergibt sich.";
    }

    var l = lage(tage, heuteKey);
    var verpasst = zaehle(gestern, "verpasst");
    var moschee = zaehle(gestern, "moschee");
    var offen = Gebetszeiten.PFLICHT.filter(function (k) { return !gestern.gebete[k]; }).length;

    if (verpasst >= 2) return schaerfen(
      "Gestern " + verpasst + " Gebete verpasst. Heute nicht.",
      "Gestern lief es mit den Gebeten nicht rund. Heute ist ein neuer Anlauf.");
    if (verpasst === 1) return schaerfen(
      "Gestern ein Gebet verpasst. Das muss heute nicht wieder passieren.",
      "Gestern ist ein Gebet liegengeblieben. Heute geht das besser.");
    if (offen >= 3) return "Gestern hast du kaum etwas eingetragen. Drei Sekunden pro Gebet, dann weißt du es später.";
    if (l.sauber && moschee >= 1) return "Drei Tage sauber, gestern " +
      UI.plural(moschee, "Mal", "Mal") + " in der Moschee. Halt das.";
    if (l.sauber) return schaerfen(
      "Drei Tage ohne verpasstes Gebet. Jetzt eins in der Moschee.",
      "Drei Tage ohne verpasstes Gebet. Das trägt.");
    if (moschee >= 1) return "Gestern alle fünf, " + UI.plural(moschee, "Mal", "Mal") + " in der Moschee.";
    if (l.moscheeWoche === 0 && l.tage >= 4)
      return schaerfen("Diese Woche noch kein Gebet in der Moschee.",
                       "Diese Woche war die Moschee noch nicht dran. Vielleicht heute.");
    return "Gestern alle fünf gehalten.";
  }

  return { satzZumVortag: satzZumVortag, lage: lage, ton: ton };
})();
