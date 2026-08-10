/* Mīzān – Bittgebete der Propheten und aus der Sunnah.
   Arabisch mit deutscher Übersetzung darunter, dazu der Anlass. */
var AnsichtDuas = (function () {
  "use strict";

  var wurzel = null, daten = null, bereich = "quran", offen = {};

  function laden() {
    if (daten) return Promise.resolve(daten);
    return fetch("data/duas.json")
      .then(function (r) { return r.json(); })
      .then(function (j) { daten = j; return daten; })
      .catch(function () { daten = { quran: [], sunnah: [] }; return daten; });
  }

  function karte(d, i) {
    var auf = !!offen[bereich + i];
    return UI.el("div.karte.dua" + (auf ? ".auf" : ""), {
      onclick: function () { offen[bereich + i] = !auf; zeichne(); }
    }, [
      UI.el("div.dkopf", [
        UI.el("span.dwer", { text: d.wer }),
        UI.el("span.dquelle", { text: d.quelle })
      ]),
      UI.el("div.dar", { text: d.ar, dir: "rtl", lang: "ar" }),
      UI.el("div.dde", { text: "„" + d.de + "“" }),
      d.anlass ? UI.el("div.danlass", { text: d.anlass }) : null
    ].filter(Boolean));
  }

  function umschalter() {
    return UI.el("div.segment", [
      { k: "quran", t: "Aus dem Qur'an" },
      { k: "sunnah", t: "Aus der Sunnah" }
    ].map(function (o) {
      return UI.el("button.segbtn" + (bereich === o.k ? ".an" : ""), {
        type: "button", onclick: function () { bereich = o.k; zeichne(); }
      }, o.t);
    }));
  }

  function zeichne() {
    if (!wurzel) return;
    var liste = (daten && daten[bereich]) || [];
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Duʿāʾ", liste.length + " Bittgebete", "الدعاء"));
    wurzel.appendChild(UI.el("div.inhalt", [
      umschalter(),
      bereich === "sunnah" ? UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Die Hadith-Nummern folgen den gängigen Druckausgaben. Wenn du eines dieser Bittgebete zitierst, prüf die Nummer gegen deine eigene Ausgabe — die Zählung weicht zwischen Ausgaben ab."
        })
      ]) : null,
      UI.el("div.dualiste", liste.map(karte)),
      UI.el("p.klein", {
        text: "Alle Texte liegen offline in der App. Qur'an-Stellen sind mit Sure und Vers eindeutig belegt."
      })
    ].filter(Boolean)));
  }

  function oeffnen(root) {
    wurzel = root;
    return laden().then(zeichne);
  }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
