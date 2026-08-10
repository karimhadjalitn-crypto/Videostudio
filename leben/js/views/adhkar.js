/* Mīzān – Adhkār und Dhikr-Zähler.
   Große Tippflächen: bedienbar, ohne hinzusehen, ohne Ton. */
var AnsichtAdhkar = (function () {
  "use strict";

  var wurzel = null, tag = null;

  function speichern(neuZeichnen) {
    tag.score = Score.fuer(tag).wert;
    return Store.tagSpeichern(tag).then(function () { if (neuZeichnen !== false) zeichne(); });
  }

  function zaehlerKarte(schluessel, titel, arabisch, ziel, schritte) {
    var wert = tag.dhikr[schluessel] || 0;
    var anzeige = UI.el("div.zaehlwert", { text: String(wert) });

    function setz(n) {
      tag.dhikr[schluessel] = Math.max(0, (tag.dhikr[schluessel] || 0) + n);
      anzeige.textContent = String(tag.dhikr[schluessel]);
      balken.firstChild.style.width =
        Math.min(100, tag.dhikr[schluessel] / ziel * 100) + "%";
      speichern(false);
    }

    var balken = UI.balken(wert / ziel);

    return UI.el("div.karte.zaehler", [
      UI.el("div.zkopf", [
        UI.el("span.etikett", { text: titel }),
        UI.el("span.ar", { text: arabisch })
      ]),
      anzeige,
      UI.el("div.zziel", { text: "Ziel " + UI.zahl(ziel) }),
      balken,
      UI.el("button.tippflaeche", {
        type: "button", onclick: function () { setz(1); }
      }, "Tippen"),
      UI.el("div.zfknoepfe", schritte.map(function (n) {
        return UI.el("button.mini", {
          type: "button", onclick: function () { setz(n); }
        }, (n > 0 ? "+" : "") + n);
      }).concat([
        UI.el("button.mini.null", {
          type: "button",
          onclick: function () { tag.dhikr[schluessel] = 0; speichern(); }
        }, "0")
      ]))
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    var d0 = Store.ausKey(tag.datum);
    var h = Hijri.fuer(d0);
    var freitag = d0.getDay() === 5;
    var salawatZiel = freitag ? 300 : 100;

    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Adhkār", freitag ? "Freitag — mehr Salawāt" : "Morgens und abends", "الأذكار"));
    var feste = [
      Sichtbar.an("dhikr.morgens") ? UI.zeile({
        haken: tag.dhikr.morgens, text: "Adhkār am Morgen", ar: "أذكار الصباح",
        wert: "nach Fajr",
        onclick: function () { tag.dhikr.morgens = !tag.dhikr.morgens; speichern(); }
      }) : null,
      Sichtbar.an("dhikr.abends") ? UI.zeile({
        haken: tag.dhikr.abends, text: "Adhkār am Abend", ar: "أذكار المساء",
        wert: "nach ʿAṣr",
        onclick: function () { tag.dhikr.abends = !tag.dhikr.abends; speichern(); }
      }) : null,
      Sichtbar.an("dhikr.nachGebet") ? UI.zeile({
        haken: (tag.dhikr.nachGebet || 0) >= 5,
        text: "Adhkār nach dem Gebet",
        wert: (tag.dhikr.nachGebet || 0) + " von 5",
        onclick: function () {
          tag.dhikr.nachGebet = ((tag.dhikr.nachGebet || 0) + 1) % 6;
          speichern();
        },
        rechts: (tag.dhikr.nachGebet || 0) > 0 ? UI.el("button.mini.klein", {
          type: "button", "aria-label": "eins weniger",
          onclick: function (ev) {
            ev.stopPropagation();
            tag.dhikr.nachGebet = Math.max(0, (tag.dhikr.nachGebet || 0) - 1);
            speichern();
          }
        }, "−") : null
      }) : null
    ].filter(Boolean);

    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(laden),

      feste.length ? UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Feste Adhkār" }),
        UI.el("div.gruppe", feste)
      ]) : null,

      zaehlerKarte("istighfar", "Istighfār", "أستغفر الله", 100, [10, 33, 100]),
      zaehlerKarte("salawat", "Salawāt auf den Propheten ﷺ", "الصلاة على النبي", salawatZiel, [10, 33, 100]),

      freitag ? UI.el("div.karte.held", [
        UI.el("span.etikett", { text: "Freitag" }),
        UI.el("p.aurteil", { text: "Heute zählt das Salawāt-Ziel dreifach. Und Sūrat al-Kahf steht an." })
      ]) : null,

      UI.el("p.klein", {
        text: "Die Zähler laufen bis Mitternacht und beginnen dann neu. Über das Datumsband oben trägst du auch für einen vergangenen Tag nach."
      })
    ].filter(Boolean)));
  }

  function laden() {
    return Store.tag().then(function (t) { tag = t; zeichne(); });
  }
  function oeffnen(root) { wurzel = root; return laden(); }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
