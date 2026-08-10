/* Mīzān – Übergabe aus iOS-Kurzbefehlen.
   Beispiel: …/leben/#/import?gebet=fajr&stufe=moschee
             …/leben/#/import?gewicht=80,4&schritte=8231
   Nichts geht dabei nach außen: die Werte kommen aus der Adresszeile
   und landen direkt im Speicher dieses Geräts. */
var AnsichtImport = (function () {
  "use strict";

  var wurzel = null, timer = null;

  function parameter() {
    var h = location.hash || "";
    var i = h.indexOf("?");
    if (i < 0) return {};
    var out = {};
    h.slice(i + 1).split("&").forEach(function (paar) {
      if (!paar) return;
      var t = paar.split("=");
      out[decodeURIComponent(t[0])] = decodeURIComponent((t[1] || "").replace(/\+/g, " "));
    });
    return out;
  }

  function zahl(v) {
    if (v == null || v === "") return null;
    var n = parseFloat(String(v).replace(",", ".").replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? null : n;
  }

  function uhrzeit(v) {
    if (!v) return null;
    if (v === "jetzt") {
      var d = new Date();
      return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    }
    var m = String(v).match(/^(\d{1,2})[:.](\d{2})$/);
    return m ? String(+m[1]).padStart(2, "0") + ":" + m[2] : null;
  }

  function anwenden(tag, p) {
    var gemacht = [];

    if (p.gebet && Gebetszeiten.PFLICHT.indexOf(p.gebet) >= 0) {
      var stufe = p.stufe || "puenktlich";
      var gueltig = Score.GEBETSSTUFEN.some(function (s) { return s.key === stufe; });
      if (gueltig) {
        tag.gebete[p.gebet] = stufe;
        var lang = Score.GEBETSSTUFEN.filter(function (s) { return s.key === stufe; })[0].lang;
        gemacht.push({ was: Gebetszeiten.NAMEN[p.gebet].de, wert: lang });
      }
    }

    var g = zahl(p.gewicht);
    if (g !== null && g > 20 && g < 400) {
      tag.gewicht = Math.round(g * 10) / 10;
      gemacht.push({ was: "Gewicht", wert: UI.zahl(tag.gewicht, 1).replace(".", ",") + " kg" });
    }

    var s = zahl(p.schritte);
    if (s !== null && s >= 0) {
      tag.schritte = Math.round(s);
      gemacht.push({ was: "Schritte", wert: UI.zahl(tag.schritte) });
    }

    var w = zahl(p.wasser);
    if (w !== null && w > 0) {
      tag.wasser = Math.round(((tag.wasser || 0) + w) * 100) / 100;
      gemacht.push({ was: "Wasser", wert: UI.zahl(tag.wasser, 1).replace(".", ",") + " l" });
    }

    var bett = uhrzeit(p.bett);
    if (bett) { tag.schlaf.bett = bett; gemacht.push({ was: "Zu Bett", wert: bett + " Uhr" }); }

    var auf = uhrzeit(p.auf);
    if (auf) { tag.schlaf.auf = auf; gemacht.push({ was: "Aufgestanden", wert: auf + " Uhr" }); }

    if (p.fajrAuf === "1" || p.fajrAuf === "ja") {
      tag.schlaf.fajrAuf = true;
      gemacht.push({ was: "Für Fajr aufgestanden", wert: "ja" });
    }

    var ist = zahl(p.istighfar);
    if (ist !== null && ist > 0) {
      tag.dhikr.istighfar = (tag.dhikr.istighfar || 0) + Math.round(ist);
      gemacht.push({ was: "Istighfār", wert: String(tag.dhikr.istighfar) });
    }

    var sal = zahl(p.salawat);
    if (sal !== null && sal > 0) {
      tag.dhikr.salawat = (tag.dhikr.salawat || 0) + Math.round(sal);
      gemacht.push({ was: "Salawāt", wert: String(tag.dhikr.salawat) });
    }

    return gemacht;
  }

  function zeichne(gemacht, score) {
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf(gemacht.length ? "Eingetragen" : "Nichts erkannt", "Aus dem Kurzbefehl", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      gemacht.length ? UI.el("div.karte.held", [
        UI.el("span.etikett", { text: "Übernommen" }),
        UI.el("div.gruppe.blank", gemacht.map(function (g) {
          return UI.zeile({ haken: true, text: g.was, wert: g.wert });
        }))
      ]) : UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "In der Adresse stand nichts, das ich verstehe. Erlaubt sind unter anderem gebet, stufe, gewicht, schritte, wasser, bett, auf, istighfar und salawat."
        })
      ]),
      gemacht.length ? UI.el("div.karte.scorekarte", [
        UI.ring(score / 100, score),
        UI.el("div.smeta", [
          UI.el("div.st", { text: "Tagesscore" }),
          UI.el("div.ss", { text: "gerade neu berechnet" })
        ])
      ]) : null,
      UI.el("button.cta", {
        type: "button", onclick: function () { location.hash = "#/heute"; }
      }, "Weiter zu Heute"),
      UI.el("p.klein", { text: "Springt in fünf Sekunden von selbst weiter." })
    ].filter(Boolean)));
  }

  function oeffnen(root) {
    wurzel = root;
    var p = parameter();
    return Store.tag().then(function (tag) {
      var gemacht = anwenden(tag, p);
      if (!gemacht.length) { zeichne(gemacht, 0); return; }
      tag.score = Score.fuer(tag).wert;
      return Store.tagSpeichern(tag).then(function () {
        zeichne(gemacht, tag.score);
        clearTimeout(timer);
        timer = setTimeout(function () {
          if (location.hash.indexOf("import") >= 0) location.hash = "#/heute";
        }, 5000);
      });
    });
  }

  function schliessen() { clearTimeout(timer); wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
