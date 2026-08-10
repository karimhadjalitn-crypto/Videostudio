/* Mīzān – Hifz und Murājaʿa.
   Karim lernt rückwärts durch den Mushaf: an-Nās (114) abwärts.
   Der Wiederholungsplan teilt den Bestand in sechs Tagesblöcke,
   aufgeteilt nach Versanzahl statt nach Suren-Anzahl — sonst hättest
   du an einem Tag zehn kurze und am nächsten al-Mursalāt. */
var Hifz = (function () {
  "use strict";

  var daten = null;
  var WOCHENBLOECKE = 6;   // Tag 7 ist Prüfung

  function laden() {
    if (daten) return Promise.resolve(daten);
    return fetch("data/suren.json")
      .then(function (r) { return r.json(); })
      .then(function (j) { daten = j; return daten; })
      .catch(function () { daten = { suren: [], juz: {} }; return daten; });
  }

  function sure(nr) {
    if (!daten) return null;
    return daten.suren.filter(function (s) { return s.nr === +nr; })[0] || null;
  }
  function alleSuren() { return daten ? daten.suren.slice() : []; }

  function status() {
    var h = Store.einstellungen.hifz || {};
    return h.status || {};
  }

  function mitStatus(wert) {
    var st = status();
    return Object.keys(st).filter(function (k) { return st[k] === wert; })
      .map(function (k) { return sure(k); })
      .filter(Boolean)
      .sort(function (a, b) { return b.nr - a.nr; });   // Lernreihenfolge: 114 zuerst
  }

  function fertige() { return mitStatus("fertig"); }
  function wackelige() { return mitStatus("wackelig"); }

  function aktuelle() {
    var lernt = mitStatus("lernt");
    return lernt.length ? lernt[0] : null;
  }

  /* Nächste Sure auf dem Weg rückwärts */
  function naechste() {
    var a = aktuelle();
    var ab = a ? a.nr - 1 : 114;
    var st = status();
    for (var n = ab; n >= 1; n--) {
      if (!st[n]) { var s = sure(n); if (s) return s; }
    }
    return null;
  }

  /* Fortschritt im Juz', in dem die aktuelle Sure liegt */
  function juzFortschritt() {
    var a = aktuelle() || fertige()[fertige().length - 1];
    if (!a || !daten.juz) return null;
    var treffer = null;
    Object.keys(daten.juz).forEach(function (j) {
      var b = daten.juz[j];
      if (a.nr >= b[0] && a.nr <= b[1]) treffer = { juz: +j, von: b[0], bis: b[1] };
    });
    if (!treffer) return null;

    var st = status();
    var gesamt = 0, geschafft = 0, offen = [];
    for (var n = treffer.von; n <= treffer.bis; n++) {
      var s = sure(n); if (!s) continue;
      gesamt += s.verse;
      if (st[n] === "fertig") geschafft += s.verse;
      else offen.push(s);
    }
    offen.sort(function (a2, b2) { return b2.nr - a2.nr; });
    return {
      juz: treffer.juz, gesamt: gesamt, geschafft: geschafft,
      offen: offen,
      offeneVerse: offen.reduce(function (x, s2) { return x + s2.verse; }, 0),
      anteil: gesamt ? geschafft / gesamt : 0
    };
  }

  function gesamtVerse(liste) {
    return liste.reduce(function (a, s) { return a + s.verse; }, 0);
  }

  /* Sechs Blöcke mit möglichst gleicher Versanzahl.
     Die Grenzen liegen dort, wo die laufende Summe dem k-ten Sechstel
     am nächsten kommt — ein reiner Greedy-Lauf hinterlässt sonst einen
     Rumpfblock am Ende. */
  function bloecke() {
    var liste = fertige();
    if (!liste.length) return [];
    var n = Math.min(WOCHENBLOECKE, liste.length);
    if (n === 1) return [liste];

    var gesamt = gesamtVerse(liste);
    var kum = [], s = 0;
    liste.forEach(function (x) { s += x.verse; kum.push(s); });

    var grenzen = [];
    for (var k = 1; k < n; k++) {
      var ziel = k * gesamt / n;
      var best = -1, bester = Infinity;
      for (var i = 0; i < liste.length - 1; i++) {
        if (i < k - 1) continue;                       // links genug Suren lassen
        if (liste.length - 1 - i < n - k) continue;    // rechts auch
        if (grenzen.indexOf(i) >= 0) continue;
        var abstand = Math.abs(kum[i] - ziel);
        if (abstand < bester) { bester = abstand; best = i; }
      }
      if (best >= 0) grenzen.push(best);
    }
    grenzen.sort(function (a, b) { return a - b; });

    var out = [], start = 0;
    grenzen.concat([liste.length - 1]).forEach(function (g) {
      if (g >= start) { out.push(liste.slice(start, g + 1)); start = g + 1; }
    });
    return out.filter(function (b) { return b.length; });
  }

  function tagImJahr(d) {
    return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  }

  /* Was steht heute an? */
  function heuteDran(d) {
    d = d || new Date();
    var index = (d.getDay() + 6) % 7;          // Mo = 0 … So = 6
    var b = bloecke();
    var pruefung = index >= WOCHENBLOECKE;
    var block = pruefung ? [] : (b[index] || []);

    // Alle drei Tage zusätzlich die zuletzt Gefestigten
    var frisch = [];
    if (tagImJahr(d) % 3 === 0) {
      frisch = fertige().slice(-3);
    }

    return {
      neu: aktuelle(),
      block: block,
      blockNr: pruefung ? null : index + 1,
      bloeckeGesamt: WOCHENBLOECKE,
      frisch: frisch,
      wackelig: wackelige(),
      pruefung: pruefung,
      verse: gesamtVerse(block) + gesamtVerse(frisch) + gesamtVerse(wackelige())
    };
  }

  /* Status setzen und speichern */
  function setzen(nr, wert) {
    var h = Store.einstellungen.hifz;
    if (!h.status) h.status = {};
    if (wert) h.status[nr] = wert; else delete h.status[nr];
    return Store.einstellungenSpeichern();
  }

  /* Aktuelle Sure abschließen und zur nächsten weitergehen */
  function abschliessen() {
    var a = aktuelle();
    if (!a) return Promise.resolve(null);
    var h = Store.einstellungen.hifz;
    h.status[a.nr] = "fertig";
    var n = naechste();
    if (n) h.status[n.nr] = "lernt";
    return Store.einstellungenSpeichern().then(function () { return n; });
  }

  /* Rückgängig: die zuletzt abgeschlossene Sure wieder ins Lernen holen.
     Ein Fehltipp darf den Bestand nicht dauerhaft verfälschen. */
  function abschlussRueckgaengig() {
    var a = aktuelle();
    var h = Store.einstellungen.hifz;
    // Die Sure davor auf dem Rückwärtsweg ist die zuletzt abgeschlossene
    var vorher = a ? sure(a.nr + 1) : null;
    if (!vorher || h.status[vorher.nr] !== "fertig") return Promise.resolve(null);
    if (a) delete h.status[a.nr];
    h.status[vorher.nr] = "lernt";
    return Store.einstellungenSpeichern().then(function () { return vorher; });
  }

  /* Erstbefüllung: an-Nās (114) bis al-Muzzammil (73) fertig, al-Jinn (72) im Lernen */
  function grundbestand() {
    var st = {};
    for (var n = 73; n <= 114; n++) st[n] = "fertig";
    st[72] = "lernt";
    return st;
  }

  return {
    laden: laden, sure: sure, alleSuren: alleSuren,
    fertige: fertige, wackelige: wackelige, aktuelle: aktuelle, naechste: naechste,
    juzFortschritt: juzFortschritt, bloecke: bloecke, heuteDran: heuteDran,
    setzen: setzen, abschliessen: abschliessen, abschlussRueckgaengig: abschlussRueckgaengig,
    grundbestand: grundbestand,
    gesamtVerse: gesamtVerse, WOCHENBLOECKE: WOCHENBLOECKE
  };
})();
