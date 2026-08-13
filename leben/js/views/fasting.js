/* Mīzān – Fasten. Freiwillig, Ramaḍān und das Qaḍāʾ-Konto.
   Neu: Tage lassen sich vormerken. Ein vorgemerkter Tag erscheint auf
   „Heute“ und im Kalender — planen statt hinterher feststellen. */

var Fasten = (function () {
  "use strict";

  function liste() {
    var e = Store.einstellungen;
    if (!e.fastenGeplant) e.fastenGeplant = [];
    return e.fastenGeplant;
  }

  function geplant(k) { return liste().indexOf(k) >= 0; }

  function umschalten(k) {
    var l = liste();
    var i = l.indexOf(k);
    if (i >= 0) l.splice(i, 1); else l.push(k);
    l.sort();
    return Store.einstellungenSpeichern();
  }

  /* Was länger als eine Woche zurückliegt, ist erledigt oder verfallen —
     die Liste soll nicht ewig wachsen. */
  function aufraeumen() {
    var grenze = Store.key(new Date(Date.now() - 7 * 86400000));
    var l = liste(), vorher = l.length;
    for (var i = l.length - 1; i >= 0; i--) if (l[i] < grenze) l.splice(i, 1);
    if (l.length !== vorher) Store.einstellungenSpeichern();
  }

  /* Warum wäre dieser Tag ein Fastentag? */
  function anlass(d) {
    var h = Hijri.fuer(d);
    if (h.ramadan) return { text: "Ramaḍān — Pflichtfasten", pflicht: true };
    if (h.weisserTag) return { text: "Weißer Tag · " + h.tag + ". " + h.monatName };
    var a = Hijri.anlass(d);
    if (a && a.art === "fasten") return { text: a.name };
    if (d.getDay() === 1) return { text: "Montag" };
    if (d.getDay() === 4) return { text: "Donnerstag" };
    return null;
  }

  return { geplant: geplant, umschalten: umschalten, anlass: anlass,
           aufraeumen: aufraeumen, liste: liste };
})();


var AnsichtFasten = (function () {
  "use strict";

  var wurzel = null, tag = null;

  function speichern() {
    return Store.tagSpeichern(tag).then(zeichne);
  }

  function heuteKarte() {
    var d = Store.ausKey(tag.datum);
    var a = Fasten.anlass(d);
    var z = Gebetszeiten.fuer(d);
    return UI.el("div.karte" + (tag.fasten ? ".held" : ""), [
      UI.el("span.etikett", { text: a ? (a.pflicht ? "Pflicht" : "Empfohlen") : UI.tagWort() }),
      UI.el("div.gebetzeile", [
        UI.el("span.gname.klein", { text: a ? a.text : "Kein Fastentag" }),
        UI.el("span.gzeit", {
          text: "Suḥūr bis " + Gebetszeiten.uhr(z.fajr) + " · Ifṭār " + Gebetszeiten.uhr(z.maghrib)
        })
      ]),
      UI.el("div.chips", [
        UI.el("button.chip" + (tag.fasten ? ".an" : ""), {
          type: "button", onclick: function () { tag.fasten = !tag.fasten; speichern(); }
        }, tag.fasten ? "Gefastet" : "Ich habe gefastet")
      ])
    ]);
  }

  /* Die nächsten empfohlenen Tage — antippen merkt sie vor */
  function planungBlock() {
    var zeilen = [], ab = new Date();
    for (var i = 0; i <= 45 && zeilen.length < 8; i++) {
      var d = new Date(ab.getFullYear(), ab.getMonth(), ab.getDate() + i);
      var a = Fasten.anlass(d);
      if (!a) continue;
      (function (d, a, i) {
        var k = Store.key(d);
        zeilen.push(UI.zeile({
          haken: Fasten.geplant(k),
          text: i === 0 ? "Heute" : UI.WOCHENTAGE[d.getDay()].slice(0, 2) + ", " +
                d.getDate() + ". " + UI.MONATE[d.getMonth()].slice(0, 3),
          wert: a.text,
          onclick: function () { Fasten.umschalten(k).then(zeichne); }
        }));
      })(d, a, i);
    }
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Vormerken" }),
      UI.el("div.gruppe", zeilen.length ? zeilen
        : [UI.el("div.zeile.leer", { text: "Nichts in Sicht." })]),
      UI.el("p.klein", {
        text: "Was du vormerkst, steht an dem Tag auf „Heute“ und ist im Kalender markiert."
      })
    ]);
  }

  /* Qaḍāʾ – offene Nachholtage bleiben sichtbar.
     Zählt ohne Neuaufbau der Ansicht — sonst gehen schnelle Tipps verloren. */
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
      anzeige.textContent = o === 0 ? "keine offen" : UI.plural(o, "Tag", "Tage");
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
        UI.el("span.gname.klein", { text: UI.plural(n, "Tag", "Tage") }),
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
      planungBlock(),
      qadaKarte(),
      bilanzKarte()
    ]));
  }

  function laden() {
    return Store.tag().then(function (t) { tag = t; zeichne(); });
  }
  function oeffnen(root) { wurzel = root; Fasten.aufraeumen(); return laden(); }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
