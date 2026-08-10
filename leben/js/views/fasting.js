/* Mīzān – Fasten. Freiwillig, Ramadan und das Qaḍāʾ-Konto. */
var AnsichtFasten = (function () {
  "use strict";

  var wurzel = null, tag = null;

  function speichern() {
    tag.score = Score.fuer(tag).wert;
    return Store.tagSpeichern(tag).then(zeichne);
  }

  function anlassHeute() {
    var d = Store.ausKey(tag.datum);
    var h = Hijri.fuer(d);
    if (h.ramadan) return { text: "Ramaḍān — Pflichtfasten", art: "pflicht" };
    if (h.weisserTag) return { text: "Weißer Tag · " + h.tag + ". " + h.monatName, art: "empfohlen" };
    var a = Hijri.anlass(d);
    if (a && a.art === "fasten") return { text: a.name, art: "empfohlen" };
    if (d.getDay() === 1) return { text: "Montag", art: "empfohlen" };
    if (d.getDay() === 4) return { text: "Donnerstag", art: "empfohlen" };
    return null;
  }

  function heuteKarte() {
    var a = anlassHeute();
    var z = Gebetszeiten.fuer(Store.ausKey(tag.datum));
    return UI.el("div.karte" + (a ? ".held" : ""), [
      UI.el("span.etikett", { text: a ? "Empfohlen" : UI.tagWort() }),
      UI.el("div.gebetzeile", [
        UI.el("span.gname.klein", { text: a ? a.text : "Kein Fastentag" }),
        UI.el("span.gzeit", { text: "Suḥūr bis " + Gebetszeiten.uhr(z.fajr) + " · Ifṭār " + Gebetszeiten.uhr(z.maghrib) })
      ]),
      UI.el("div.chips", [
        UI.el("button.chip" + (tag.fasten ? ".an" : ""), {
          type: "button",
          onclick: function () { tag.fasten = !tag.fasten; speichern(); }
        }, tag.fasten ? "Gefastet" : "Ich faste " + UI.tagWortKlein())
      ])
    ]);
  }

  /* Nächste empfohlene Fastentage aus dem Kalender */
  function vorschauBlock() {
    var zeilen = [], ab = new Date();
    for (var i = 1; i <= 45 && zeilen.length < 6; i++) {
      var d = new Date(ab.getTime() + i * 86400000);
      var h = Hijri.fuer(d);
      var grund = null;
      if (h.ramadan) grund = "Ramaḍān";
      else if (h.weisserTag) grund = "Weißer Tag · " + h.tag + ".";
      else {
        var a = Hijri.anlass(d);
        if (a && a.art === "fasten") grund = a.name;
        else if (d.getDay() === 1) grund = "Montag";
        else if (d.getDay() === 4) grund = "Donnerstag";
      }
      if (!grund) continue;
      (function (d, grund) {
        zeilen.push(UI.zeile({
          text: UI.WOCHENTAGE[d.getDay()].slice(0, 2) + ", " + d.getDate() + ". " + UI.MONATE[d.getMonth()].slice(0, 3),
          wert: grund
        }));
      })(d, grund);
    }
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Als Nächstes" }),
      UI.el("div.gruppe", zeilen.length ? zeilen : [UI.el("div.zeile.leer", { text: "Nichts in Sicht." })])
    ]);
  }

  /* Qaḍāʾ – offene Nachholtage bleiben sichtbar */
  /* Zählt ohne Neuaufbau der Ansicht — sonst gehen schnelle Tipps verloren. */
  function qadaKarte() {
    var e = Store.einstellungen;
    function stand() { return (e.fasten && e.fasten.qada) || 0; }

    var anzeige = UI.el("div.zfwert");
    var karte = UI.el("div.karte");
    var text = UI.el("p.klein", {
      text: "Diese Zahl verschwindet nicht von selbst. Die weißen Tage und Montag/Donnerstag eignen sich gut zum Nachholen."
    });

    function auffrischen() {
      var o = stand();
      anzeige.textContent = o === 0 ? "keine offen" : o + (o === 1 ? " Tag" : " Tage");
      karte.classList.toggle("schuld", o > 0);
      text.style.display = o > 0 ? "" : "none";
    }

    function aendern(n) {
      e.fasten.qada = Math.max(0, stand() + n);
      auffrischen();
      Store.einstellungenSpeichern();
    }

    karte.appendChild(UI.el("span.etikett", { text: "Qaḍāʾ — Nachholtage" }));
    karte.appendChild(anzeige);
    karte.appendChild(UI.el("div.zfknoepfe", [
      UI.el("button.mini", { type: "button", onclick: function () { aendern(-1); } }, "− nachgeholt"),
      UI.el("button.mini", { type: "button", onclick: function () { aendern(1); } }, "+ offen")
    ]));
    karte.appendChild(text);
    auffrischen();
    return karte;
  }

  function bilanzKarte() {
    var n = Store.fensterBis(tag.datum, 30, tag).filter(function (t) { return t.fasten; }).length;
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Letzte 30 Tage" }),
      UI.el("div.gebetzeile", [
        UI.el("span.gname.klein", { text: n + (n === 1 ? " Tag" : " Tage") }),
        UI.el("span.gzeit", { text: "gefastet" })
      ]),
      UI.balken(n / 12)
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    var h = Hijri.fuer(Store.ausKey(tag.datum));
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Fasten", h.ramadan ? "Ramaḍān" : "Freiwillig", "الصيام"));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(laden),
      heuteKarte(),
      qadaKarte(),
      vorschauBlock(),
      bilanzKarte()
    ]));
  }

  function laden() {
    return Store.tag().then(function (t) { tag = t; zeichne(); });
  }
  function oeffnen(root) { wurzel = root; return laden(); }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
