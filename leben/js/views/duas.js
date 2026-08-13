/* Mīzān – Bittgebete: aus dem Qur'an und aus der Sunnah.
   Nach Anlass sortiert, nicht nach Sammlung — du suchst nach der Lage,
   in der du steckst, nicht nach einem Buchtitel.
   Arabisch, deutsche Übersetzung, Quelle und Authentizitätsgrad. */
var AnsichtDuas = (function () {
  "use strict";

  var wurzel = null, daten = null, bereich = "sunnah", offen = {}, suche = "";

  function laden() {
    if (daten) return Promise.resolve(daten);
    return fetch("data/duas.json")
      .then(function (r) { return r.json(); })
      .then(function (j) { daten = j; return daten; })
      .catch(function () { daten = { quran: [], sunnah: [], gruppen: [] }; return daten; });
  }

  function karte(d, schluessel) {
    var auf = !!offen[schluessel];
    return UI.el("div.karte.dua" + (auf ? ".auf" : ""), {
      onclick: function () { offen[schluessel] = !auf; zeichne(); }
    }, [
      UI.el("div.dkopf", [
        UI.el("span.dwer", { text: d.wer }),
        UI.el("span.dquelle", { text: d.quelle })
      ]),
      UI.el("div.dar", { text: d.ar, dir: "rtl", lang: "ar" }),
      UI.el("div.dde", { text: "„" + d.de + "“" }),
      UI.el("div.dfuss", [
        d.anlass ? UI.el("span.danlass", { text: d.anlass }) : null,
        d.grad ? UI.el("span.dgrad", { text: d.grad }) : null
      ].filter(Boolean))
    ].filter(Boolean));
  }

  function umschalter() {
    return UI.el("div.segment", [
      { k: "sunnah", t: "Aus der Sunnah" },
      { k: "quran", t: "Aus dem Qur'an" }
    ].map(function (o) {
      return UI.el("button.segbtn" + (bereich === o.k ? ".an" : ""), {
        type: "button", onclick: function () { bereich = o.k; zeichne(); }
      }, o.t);
    }));
  }

  function passt(d) {
    if (!suche.trim()) return true;
    var q = suche.trim().toLowerCase();
    return (d.wer + " " + d.de + " " + (d.anlass || "") + " " + d.quelle)
      .toLowerCase().indexOf(q) >= 0;
  }

  /* Sunnah nach Anlass gruppiert, Qur'an als eine Liste */
  function liste() {
    var alle = ((daten && daten[bereich]) || []).filter(passt);
    if (bereich === "quran") {
      return [UI.el("div.dualiste", alle.map(function (d, i) {
        return karte(d, "q" + i);
      }))];
    }
    var gruppen = (daten && daten.gruppen) || [];
    var out = [];
    gruppen.forEach(function (g) {
      var teil = alle.filter(function (d) { return d.gruppe === g.k; });
      if (!teil.length) return;
      out.push(UI.el("div.blockkopf", { text: g.name }));
      out.push(UI.el("div.dualiste", teil.map(function (d) {
        return karte(d, g.k + "|" + d.wer);
      })));
    });
    var rest = alle.filter(function (d) {
      return !gruppen.some(function (g) { return g.k === d.gruppe; });
    });
    if (rest.length) {
      out.push(UI.el("div.blockkopf", { text: "Weitere" }));
      out.push(UI.el("div.dualiste", rest.map(function (d, i) {
        return karte(d, "r" + i);
      })));
    }
    if (!out.length) {
      out.push(UI.el("div.karte.hinweis", [
        UI.el("div.hz", { text: "Nichts gefunden." })
      ]));
    }
    return out;
  }

  function zeichne() {
    if (!wurzel) return;
    var alle = (daten && daten[bereich]) || [];
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Duʿāʾ", UI.plural(alle.length, "Bittgebet", "Bittgebete"), "الدعاء"));

    var sucheFeld = UI.el("input.aufgabenfeld", {
      type: "search", value: suche, placeholder: "Wonach suchst du?",
      oninput: function () { suche = sucheFeld.value; zeichnenVerzoegert(); }
    });

    wurzel.appendChild(UI.el("div.inhalt", [
      umschalter(),
      sucheFeld
    ].concat(liste()).concat([
      UI.el("p.klein", {
        text: "Die Hadith-Nummern folgen den gängigen Druckausgaben. Wenn du ein Bittgebet zitierst, prüf die Nummer gegen deine eigene Ausgabe — die Zählung weicht zwischen Ausgaben ab. Qur'an-Stellen sind mit Sure und Vers eindeutig belegt."
      })
    ])));
  }

  /* Beim Tippen nicht bei jedem Zeichen alles neu bauen */
  var timer = null;
  function zeichnenVerzoegert() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var pos = document.activeElement === document.querySelector("input[type=search]");
      zeichne();
      if (pos) {
        var f = document.querySelector("input[type=search]");
        if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
      }
    }, 220);
  }

  function oeffnen(root) {
    wurzel = root;
    suche = "";
    return laden().then(zeichne);
  }
  function schliessen() { clearTimeout(timer); wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
