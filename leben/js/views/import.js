/* Mīzān – Übergabe aus iOS-Kurzbefehlen.
   Beispiel: …/leben/#/import?gebet=fajr&stufe=moschee
             …/leben/#/import?dhikr=1&gelesen=5
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
      var gueltig = Gebetszeiten.STUFEN.some(function (s) { return s.key === stufe; });
      if (gueltig) {
        tag.gebete[p.gebet] = stufe;
        var lang = Gebetszeiten.STUFEN.filter(function (s) { return s.key === stufe; })[0].lang;
        gemacht.push({ was: Gebetszeiten.NAMEN[p.gebet].de, wert: lang });
      }
    }

    var seiten = zahl(p.gelesen);
    if (seiten !== null && seiten > 0) {
      tag.quran.gelesen = (tag.quran.gelesen || 0) + Math.round(seiten);
      gemacht.push({ was: "Qur'an gelesen", wert: tag.quran.gelesen + " Seiten" });
    }

    if (p.dhikr === "1" || p.dhikr === "ja") {
      tag.dhikr.gemacht = true;
      gemacht.push({ was: "Adhkār", wert: "erledigt" });
    }

    if (p.murajaa === "1" || p.murajaa === "ja") {
      tag.quran.murajaa = true;
      gemacht.push({ was: "Murājaʿa", wert: "erledigt" });
    }

    if (p.training === "1" || p.training === "ja") {
      if (!(tag.training.arten || []).length) tag.training.arten = ["Training"];
      gemacht.push({ was: "Trainiert", wert: "ja" });
    }

    if (p.fasten === "1" || p.fasten === "ja") {
      tag.fasten = true;
      gemacht.push({ was: "Gefastet", wert: "ja" });
    }

    return gemacht;
  }

  function zeichne(gemacht) {
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
          text: "In der Adresse stand nichts, das ich verstehe. Erlaubt sind gebet, stufe, gelesen, dhikr, murajaa, training und fasten."
        })
      ]),

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
      if (!gemacht.length) { zeichne(gemacht); return; }
      return Store.tagSpeichern(tag).then(function () {
        zeichne(gemacht);
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
