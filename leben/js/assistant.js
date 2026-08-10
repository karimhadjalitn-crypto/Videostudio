/* Mīzān – der Assistent.
   Läuft vollständig offline über deine eigenen Daten.
   Grundton: direkt und fordernd. Sanft, wenn die Daten es rechtfertigen.
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

  /* Wie war die Lage der letzten Tage? */
  function lage(tage, heuteKey) {
    var alt = tage.filter(function (t) { return t.datum !== heuteKey && typeof t.score === "number"; });
    var letzte = alt.slice(-5);
    var schnitt = alt.length ? alt.reduce(function (a, t) { return a + t.score; }, 0) / alt.length : null;
    var schwach = letzte.length >= 3 && letzte.slice(-3).every(function (t) { return t.score < 45; });
    var stark = letzte.length >= 3 && letzte.slice(-3).every(function (t) { return t.score >= 75; });
    var tief = letzte.filter(function (t) { return t.stimmung && t.stimmung <= 2; }).length >= 2;
    return { schnitt: schnitt, schwach: schwach, stark: stark, tief: tief, anzahl: alt.length };
  }

  /* Ein Satz zum gestrigen Tag, für den Kopf von „Heute“ */
  function satzZumVortag(tage, heuteKey) {
    var gestern = tage.filter(function (t) { return t.datum < heuteKey; }).slice(-1)[0];
    if (!gestern || typeof gestern.score !== "number") {
      return "Erster Tag. Trag ein, was du tust — der Rest ergibt sich.";
    }
    var l = lage(tage, heuteKey);
    var g = gestern.gebete || {};
    var verpasst = Gebetszeiten.PFLICHT.filter(function (k) { return g[k] === "verpasst"; }).length;
    var moschee = Gebetszeiten.PFLICHT.filter(function (k) { return g[k] === "moschee"; }).length;

    if (verpasst >= 2) return schaerfen(
      "Gestern " + verpasst + " Gebete verpasst. Heute nicht.",
      "Gestern lief es mit den Gebeten nicht rund. Heute ist ein neuer Anlauf.");
    if (verpasst === 1) return schaerfen(
      "Gestern ein Gebet verpasst. Das muss heute nicht wieder passieren.",
      "Gestern ist ein Gebet liegengeblieben. Heute geht das besser.");
    if (l.tief && moschee > 0) return "Harte Tage gerade. Du warst gestern trotzdem in der Moschee. Das zählt.";
    if (moschee >= 1 && gestern.score >= 70) return "Gestern " + gestern.score + ". Halt das.";
    if (gestern.score >= 80) return "Gestern " + gestern.score + " — dein bisher stärkster Bereich ist die Beständigkeit. Nutz sie.";
    if (gestern.score < 40) return "Gestern " + gestern.score + ". Heute ist ein neuer Tag, aber er wird sich nicht selbst besser machen.";
    return "Gestern " + gestern.score + "." + (l.schnitt ? " Dein Schnitt: " + Math.round(l.schnitt) + "." : "");
  }

  /* Abschluss der Abendabrechnung */
  function abschluss(tag, score, tage) {
    var l = lage(tage, tag.datum);
    var g = tag.gebete || {};
    var verpasst = Gebetszeiten.PFLICHT.filter(function (k) { return g[k] === "verpasst"; });
    var spaet = Gebetszeiten.PFLICHT.filter(function (k) { return g[k] === "spaet"; });
    var moschee = Gebetszeiten.PFLICHT.filter(function (k) { return g[k] === "moschee"; });
    var offenGebete = Gebetszeiten.PFLICHT.filter(function (k) { return !g[k]; });

    var urteil, morgen;

    if (offenGebete.length >= 3) {
      urteil = offenGebete.length + " Gebete hast du gar nicht eingetragen. Ohne Eintrag weiß weder die App noch du, wie der Tag wirklich war.";
      morgen = "Morgen: trag jedes Gebet direkt danach ein. Dauert drei Sekunden.";
    } else if (verpasst.length >= 2) {
      urteil = schaerfen(
        verpasst.length + " Gebete heute verpasst. Du sagst, das ist dir das Wichtigste — dieser Tag sagt etwas anderes.",
        verpasst.length + " Gebete sind heute liegengeblieben. Das kommt vor. Morgen zählt.");
      morgen = "Morgen: kein einziges verpasstes Gebet. Nichts sonst.";
    } else if (verpasst.length === 1) {
      urteil = Gebetszeiten.NAMEN[verpasst[0]].de + " verpasst. Ein Gebet, das nicht mehr wiederkommt.";
      morgen = "Morgen: stell dir für " + Gebetszeiten.NAMEN[verpasst[0]].de + " eine Erinnerung.";
    } else if (spaet.length >= 2) {
      urteil = spaet.length + " Gebete verspätet. Gebetet ist gebetet — aber die Zeit war da.";
      morgen = "Morgen: eins davon im ersten Drittel der Zeit.";
    } else if (offenGebete.length >= 1) {
      urteil = offenGebete.map(function (k) { return Gebetszeiten.NAMEN[k].de; }).join(" und ") +
               " fehlt im Eintrag. Der Score rechnet es als nicht gebetet — wenn das falsch ist, trag es nach.";
      morgen = "Morgen: alle fünf eintragen, direkt nach dem Gebet.";
    } else if (moschee.length >= 1 && score >= 70) {
      urteil = "Guter Tag. Alle fünf gehalten, " + moschee.length + "× davon in der Moschee.";
      morgen = "Morgen: dasselbe nochmal. Beständigkeit schlägt Ausbrüche.";
    } else if (score >= 70) {
      urteil = "Solider Tag. Alle fünf gehalten, kein Gebet verpasst.";
      morgen = "Morgen: geh einmal in die Moschee.";
    } else if (l.tief || l.schwach) {
      urteil = "Kein starker Tag — aber du sitzt hier und rechnest ab. Das machen die wenigsten.";
      morgen = "Morgen: eine Sache. Fajr. Mehr nicht.";
    } else {
      urteil = "Durchwachsener Tag.";
      morgen = "Morgen: such dir eine Sache aus, die heute liegen blieb.";
    }

    if (tag.bildschirm && tag.bildschirm.gescrollt >= 90 && (tag.quran && !tag.quran.murajaa)) {
      urteil += " " + Math.round(tag.bildschirm.gescrollt) + " Minuten gescrollt, keine Murājaʿa. Das ist eine Entscheidung, keine Zeitfrage.";
    }

    return { urteil: urteil, morgen: morgen };
  }

  /* Alle Tagespunkte mit ihrem Stand. Erledigtes verschwindet nicht —
     es bekommt einen Haken und bleibt sichtbar. */
  function tagesliste(tag, e) {
    var liste = [];
    // Der Wiederholungsblock hängt am Wochentag — beim Rückblick also
    // am Tag, den du gerade ansiehst, nicht am heutigen.
    var dran = (typeof Hifz !== "undefined" && Hifz.aktuelle)
      ? Hifz.heuteDran(Store.ausKey(tag.datum)) : null;

    function dazu(k, text, opt) {
      if (Sichtbar.aus(k)) return;
      opt = opt || {};
      liste.push({
        key: k, text: text, ar: opt.ar || null, wert: opt.wert || null,
        erledigt: !!opt.erledigt, ziel: opt.ziel || false
      });
    }

    dazu("dhikr.morgens", "Adhkār am Morgen", { ar: "الأذكار", erledigt: tag.dhikr.morgens });
    dazu("quran.murajaa", "Murājaʿa", {
      wert: dran ? (dran.pruefung ? "Prüfungstag" : dran.verse + " Verse") : null,
      erledigt: tag.quran.murajaa
    });
    dazu("quran.hifz", "Hifz — neu gelernt", {
      wert: dran && dran.neu ? dran.neu.de : null, erledigt: tag.quran.hifz
    });
    dazu("quran.gelesen", "Qur'an gelesen", {
      wert: tag.quran.gelesen ? tag.quran.gelesen + " S." : null,
      erledigt: tag.quran.gelesen > 0
    });
    dazu("wasser", "Wasser", {
      wert: UI.zahl(tag.wasser || 0, 1).replace(".", ",") + " / " + UI.zahl(e.wasserZiel, 1) + " l",
      erledigt: (tag.wasser || 0) >= e.wasserZiel
    });
    dazu("sunnah.rawatib", "Sunan Rawātib", { wert: "12 Rakʿa", erledigt: tag.sunnah.rawatib });
    dazu("sunnah.witr", "Witr", { erledigt: tag.sunnah.witr });
    dazu("sunnah.duha", "Ḍuḥā", { erledigt: tag.sunnah.duha });
    dazu("sunnah.ishraq", "Ishrāq", { erledigt: tag.sunnah.ishraq });
    dazu("sunnah.tahajjud", "Tahajjud", { erledigt: tag.sunnah.tahajjud });
    dazu("dhikr.nachGebet", "Adhkār nach dem Gebet", {
      wert: (tag.dhikr.nachGebet || 0) + " von 5",
      erledigt: (tag.dhikr.nachGebet || 0) >= 5
    });
    dazu("dhikr.abends", "Adhkār am Abend", { ar: "الأذكار", erledigt: tag.dhikr.abends });

    /* Punkte, die woanders erfasst werden — sie führen dorthin */
    var nachsicht = (typeof Modi !== "undefined") ? Modi.nachsicht(tag) : {};
    var w = (tag.arbeit && tag.arbeit.wichtigste) || [];
    var gesetzt = w.filter(function (x) { return x && x.text; });
    if (!Sichtbar.aus("arbeit.wichtigste")) {
      liste.push({
        key: "#/arbeit", ziel: true, text: "Die drei Wichtigsten",
        wert: gesetzt.length
          ? gesetzt.filter(function (x) { return x.erledigt; }).length + " von " + gesetzt.length
          : "offen",
        erledigt: gesetzt.length > 0 && gesetzt.every(function (x) { return x.erledigt; })
      });
    }
    if (!Sichtbar.aus("training") && !nachsicht.sportLocker) {
      var arten = (tag.training && tag.training.arten) || [];
      liste.push({
        key: "#/koerper", ziel: true, text: "Training",
        wert: arten.length ? arten.join(", ") : null, erledigt: arten.length > 0
      });
    }
    if (!Sichtbar.aus("schlaf.bett")) {
      liste.push({
        key: "#/schlaf", ziel: true, text: "Zubettgehzeit",
        wert: tag.schlaf.bett || null, erledigt: !!tag.schlaf.bett
      });
    }

    return liste;
  }

  return { satzZumVortag: satzZumVortag, abschluss: abschluss,
           tagesliste: tagesliste, lage: lage, ton: ton };
})();
