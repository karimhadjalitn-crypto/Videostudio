/* Mīzān – Vers des Tages.
   Nur Qur'an. Die Hadith-Sammlung kommt erst, wenn Sammlung,
   Nummer und Authentizitätsgrad geprüft sind. */
var Ayat = (function () {
  "use strict";

  var daten = null;

  function laden() {
    if (daten) return Promise.resolve(daten);
    return fetch("data/ayat.json")
      .then(function (r) { return r.json(); })
      .then(function (j) { daten = j; return daten; })
      .catch(function () { daten = { verse: [] }; return daten; });
  }

  /* Passend zum Tag: bei verpassten Gebeten eine Mahnung,
     bei schwacher Lage Trost, sonst nach Datum rotierend. */
  function fuerHeute(tag) {
    if (!daten || !daten.verse.length) return null;
    var verse = daten.verse;

    function ausThema(thema) {
      var t = verse.filter(function (v) { return v.thema.indexOf(thema) >= 0; });
      if (!t.length) return null;
      var i = new Date(tag.datum).getDate() % t.length;
      return t[i];
    }

    var verpasst = Gebetszeiten.PFLICHT.filter(function (k) {
      return tag.gebete[k] === "verpasst";
    }).length;
    if (verpasst >= 1) return ausThema("gebet") || verse[0];
    if (tag.stimmung && tag.stimmung <= 2) return ausThema("trost") || verse[0];
    if (tag.muhasaba) return ausThema("muhasaba") || verse[0];

    var d = Store.ausKey(tag.datum);
    var tagImJahr = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    return verse[tagImJahr % verse.length];
  }

  function zufall() {
    if (!daten || !daten.verse.length) return null;
    return daten.verse[Math.floor(Math.random() * daten.verse.length)];
  }

  return { laden: laden, fuerHeute: fuerHeute, zufall: zufall };
})();
