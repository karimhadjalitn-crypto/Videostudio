/* Mīzān – Gebete. Fünf Stufen statt eines Hakens. */
var AnsichtGebete = (function () {
  "use strict";

  var tag = null, zeiten = null, wurzel = null, offenesGebet = null;

  function speichern() {
    return Store.tagSpeichern(tag).then(zeichne);
  }

  function stufenWaehler(k) {
    return UI.el("div.stufen", Gebetszeiten.STUFEN.map(function (s) {
      var an = tag.gebete[k] === s.key;
      return UI.el("button.stufe.f-" + s.farbe + (an ? ".an" : ""), {
        type: "button", title: s.lang,
        onclick: function (ev) {
          ev.stopPropagation();
          tag.gebete[k] = an ? null : s.key;
          offenesGebet = null;
          speichern();
          if (!an) UI.meldung(Gebetszeiten.NAMEN[k].de + " · " + s.lang);
        }
      }, s.kurz);
    }));
  }

  /* Fünf Punkte: je besser die Stufe, desto mehr sind gefüllt.
     Moschee = 5, Verpasst = 1 (rot). */
  function punkte(k) {
    var w = tag.gebete[k];
    var idx = w ? Gebetszeiten.STUFEN.findIndex(function (s) { return s.key === w; }) : -1;
    var anzahl = idx >= 0 ? Gebetszeiten.STUFEN.length - idx : 0;
    var farbe = idx >= 0 ? Gebetszeiten.STUFEN[idx].farbe : "";
    return UI.el("span.punkte", Gebetszeiten.STUFEN.map(function (_, i) {
      return UI.el("i" + (i < anzahl ? ".f-" + farbe : ""));
    }));
  }

  function gebetsZeile(k) {
    // An einem vergangenen Tag war jedes Gebet fällig
    var faellig = !Store.istHeute() || new Date() >= zeiten[k];
    var z = UI.el("div.zeile.tippbar" + (faellig && !tag.gebete[k] ? ".offen" : ""), {
      onclick: function () { offenesGebet = offenesGebet === k ? null : k; zeichne(); }
    }, [
      UI.el("span.zt", { text: Gebetszeiten.NAMEN[k].de }),
      UI.el("span.ar", { text: Gebetszeiten.NAMEN[k].ar }),
      UI.el("span.zw", { text: Gebetszeiten.uhr(zeiten[k]) }),
      punkte(k)
    ]);
    if (offenesGebet !== k) return z;
    return UI.el("div", [z, stufenWaehler(k)]);
  }

  function sunnahZeilen() {
    var s = [
      { k: "rawatib", t: "Sunan Rawātib", w: "12 Rakʿa" },
      { k: "witr", t: "Witr" },
      { k: "duha", t: "Ḍuḥā" },
      { k: "ishraq", t: "Ishrāq" },
      { k: "tahajjud", t: "Tahajjud" }
    ];
    return s.filter(function (x) { return Sichtbar.an("sunnah." + x.k); })
      .map(function (x) {
        return UI.zeile({
          haken: tag.sunnah[x.k], text: x.t, wert: x.w,
          onclick: function () { tag.sunnah[x.k] = !tag.sunnah[x.k]; speichern(); }
        });
      });
  }

  function moscheeKarte() {
    var n = Store.fensterBis(tag.datum, 7, tag).reduce(function (a, t) {
      return a + Gebetszeiten.PFLICHT.filter(function (k) {
        return t.gebete && t.gebete[k] === "moschee";
      }).length;
    }, 0);
    var ziel = Store.einstellungen.moscheeZielWoche;
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Diese Woche in der Moschee" }),
      UI.el("div.gebetzeile", [
        UI.el("span.gname.klein", { text: String(n) }),
        UI.el("span.gzeit", { text: "Ziel: " + ziel + " · meist Maghrib oder ʿIshā'" })
      ]),
      UI.balken(n / ziel)
    ]);
  }

  function wochenStreifen() {
    var alle = Store.fensterBis(tag.datum, 7, tag);
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Letzte sieben Tage" }),
      UI.el("div.streifen", alle.map(function (t) {
        var d = Store.ausKey(t.datum);
        return UI.el("div.tagsaeule", [
          UI.el("div.saeule", Gebetszeiten.PFLICHT.map(function (k) {
            var w = (t.gebete || {})[k];
            var f = w === "moschee" || w === "puenktlich" ? "jade"
                  : w === "fenster" ? "jade-dim"
                  : w === "spaet" ? "amber"
                  : w === "verpasst" ? "rose" : "leer";
            return UI.el("i.f-" + f);
          })),
          UI.el("span.tagname", { text: UI.WOCHENTAGE[d.getDay()].slice(0, 2) })
        ]);
      }))
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    var h = Hijri.fuer(Store.ausKey(tag.datum));
    UI.leeren(wurzel);
    var gemacht = Gebetszeiten.PFLICHT.filter(function (k) {
      return tag.gebete[k] && tag.gebete[k] !== "verpasst";
    }).length;
    var sunnah = sunnahZeilen();
    wurzel.appendChild(UI.kopf("Gebete", UI.tagWort() + " " + gemacht + " von 5", h.textAr));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(laden),
      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Pflichtgebete · tippen zum Bewerten" }),
        UI.el("div.gruppe", Gebetszeiten.PFLICHT.map(gebetsZeile))
      ]),
      sunnah.length ? UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Freiwillig" }),
        UI.el("div.gruppe", sunnah)
      ]) : null,
      moscheeKarte(),
      wochenStreifen()
    ].filter(Boolean)));
  }

  function laden() {
    return Store.tag().then(function (t) {
      tag = t;
      zeiten = Gebetszeiten.fuer(Store.ausKey(tag.datum));
      offenesGebet = null;
      zeichne();
    });
  }
  function oeffnen(root) { wurzel = root; return laden(); }
  function schliessen() { wurzel = null; offenesGebet = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
