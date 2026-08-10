/* Mīzān – Qur'an: Lesen, Hifz und Murājaʿa. */
var AnsichtQuran = (function () {
  "use strict";

  var wurzel = null, tag = null, bestandOffen = false;

  function speichern() {
    tag.score = Score.fuer(tag).wert;
    return Store.tagSpeichern(tag).then(zeichne);
  }

  function surenName(s) { return s.de + " (" + s.nr + ")"; }

  /* ---------- Fortschritt im Juz' ---------- */
  function juzKarte() {
    var f = Hifz.juzFortschritt();
    if (!f) return null;
    var naechsteDrei = f.offen.slice(0, 3).map(surenName).join(" · ");
    return UI.el("div.karte.held", [
      UI.el("span.etikett", { text: "Ziel: Juz' " + f.juz + " komplett" }),
      UI.el("div.gebetzeile", [
        UI.el("span.gname.klein", { text: f.offen.length + " Suren" }),
        UI.el("span.gzeit", { text: f.offeneVerse + " Verse offen" })
      ]),
      UI.balken(f.anteil),
      UI.el("p.klein", {
        text: f.offen.length
          ? "Als Nächstes: " + naechsteDrei + (f.offen.length > 3 ? " …" : "")
          : "Juz' " + f.juz + " sitzt vollständig. Alḥamdulillāh."
      })
    ]);
  }

  /* ---------- Sure, die gerade gelernt wird ---------- */
  function aktuellKarte() {
    var a = Hifz.aktuelle();
    var n = Hifz.naechste();
    if (!a) {
      return UI.el("div.karte", [
        UI.el("span.etikett", { text: "Neu lernen" }),
        UI.el("p.aurteil", { text: "Gerade lernst du keine Sure. Wähle unten im Bestand eine aus." }),
        n ? UI.knopf("Mit " + surenName(n) + " anfangen", {
          klasse: "cta", onclick: function () { Hifz.setzen(n.nr, "lernt").then(zeichne); }
        }) : null
      ].filter(Boolean));
    }
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Lernst du gerade" }),
      UI.el("div.gebetzeile", [
        UI.el("span.gname", { text: a.de }),
        UI.el("span.ar", { text: a.ar }),
        UI.el("span.gzeit", { text: a.verse + " Verse · Nr. " + a.nr })
      ]),
      UI.el("div.chips", [
        UI.el("button.chip" + (tag.quran.hifz ? ".an" : ""), {
          type: "button",
          onclick: function () { tag.quran.hifz = !tag.quran.hifz; speichern(); }
        }, "Heute daran gelernt"),
        UI.el("button.chip", {
          type: "button",
          onclick: function () {
            Hifz.abschliessen().then(function (neu) {
              UI.meldung(neu ? a.de + " sitzt. Weiter mit " + neu.de + "." : a.de + " sitzt.");
              zeichne();
            });
          }
        }, "Sitzt — weiter")
      ])
    ]);
  }

  /* ---------- Heutige Wiederholung ---------- */
  function surenZeile(s, herkunft) {
    var st = (Store.einstellungen.hifz.status || {})[s.nr];
    return UI.zeile({
      text: s.de, ar: s.ar,
      wert: s.verse + " Verse" + (herkunft ? " · " + herkunft : ""),
      rechts: UI.el("span.stufe" + (st === "wackelig" ? ".f-amber.an" : ".f-jade"), {
        onclick: function (ev) {
          ev.stopPropagation();
          Hifz.setzen(s.nr, st === "wackelig" ? "fertig" : "wackelig").then(function () {
            UI.meldung(s.de + (st === "wackelig" ? " ist wieder gefestigt." : " kommt jetzt täglich."));
            zeichne();
          });
        }
      }, st === "wackelig" ? "wackelig" : "sitzt")
    });
  }

  function murajaaBlock() {
    var d = Hifz.heuteDran();
    var zeilen = [];

    d.wackelig.forEach(function (s) { zeilen.push(surenZeile(s, "wackelig")); });
    d.frisch.forEach(function (s) {
      if (d.wackelig.indexOf(s) < 0) zeilen.push(surenZeile(s, "frisch"));
    });
    d.block.forEach(function (s) {
      if (d.wackelig.indexOf(s) < 0 && d.frisch.indexOf(s) < 0) zeilen.push(surenZeile(s));
    });

    var kopf = d.pruefung
      ? "Prüfungstag — such dir selbst aus, was sitzen muss"
      : "Murājaʿa heute · Block " + d.blockNr + " von " + d.bloeckeGesamt;

    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: kopf }),
      UI.el("div.gruppe", zeilen.length ? zeilen : [
        UI.el("div.zeile.leer", { text: d.pruefung ? "Heute ist Prüfungstag." : "Noch nichts im Bestand." })
      ]),
      UI.el("div.karte", [
        UI.el("div.chips", [
          UI.el("button.chip" + (tag.quran.murajaa ? ".an" : ""), {
            type: "button",
            onclick: function () { tag.quran.murajaa = !tag.quran.murajaa; speichern(); }
          }, tag.quran.murajaa ? "Wiederholung erledigt" : "Wiederholung erledigen"),
          UI.el("span.chip.still", { text: d.verse + " Verse heute" })
        ])
      ])
    ]);
  }

  /* ---------- Lesen ---------- */
  function lesenKarte() {
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Gelesen heute" }),
      UI.el("div.zfwert", { text: (tag.quran.gelesen || 0) + (tag.quran.gelesen === 1 ? " Seite" : " Seiten") }),
      UI.el("div.zfknoepfe", [1, 2, 5, 10, -1].map(function (n) {
        return UI.el("button.mini", {
          type: "button",
          onclick: function () {
            tag.quran.gelesen = Math.max(0, (tag.quran.gelesen || 0) + n);
            speichern();
          }
        }, (n > 0 ? "+" : "") + n);
      }).concat([
        UI.el("button.mini.null", {
          type: "button",
          onclick: function () { tag.quran.gelesen = 0; speichern(); }
        }, "0")
      ]))
    ]);
  }

  /* ---------- Bestand ---------- */
  function bestandBlock() {
    var st = Store.einstellungen.hifz.status || {};
    var f = Hifz.fertige();
    var kopf = UI.zeile({
      text: "Mein Bestand",
      wert: f.length + " Suren · " + Hifz.gesamtVerse(f) + " Verse",
      onclick: function () { bestandOffen = !bestandOffen; zeichne(); }
    });
    if (!bestandOffen) {
      return UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Auswendig" }),
        UI.el("div.gruppe", [kopf])
      ]);
    }

    var zeilen = [kopf].concat(Hifz.alleSuren().slice().reverse().map(function (s) {
      var z = st[s.nr];
      var text = z === "fertig" ? "sitzt" : z === "lernt" ? "lernt" : z === "wackelig" ? "wackelig" : "offen";
      var farbe = z === "fertig" ? ".f-jade" : z === "lernt" ? ".f-jade-dim" : z === "wackelig" ? ".f-amber" : "";
      return UI.zeile({
        text: s.de, ar: s.ar, wert: s.verse + " V.",
        rechts: UI.el("span.stufe" + farbe + (z ? ".an" : ""), {
          onclick: function (ev) {
            ev.stopPropagation();
            var naechster = z === "fertig" ? "wackelig" : z === "wackelig" ? null
                          : z === "lernt" ? "fertig" : "fertig";
            Hifz.setzen(s.nr, naechster).then(zeichne);
          }
        }, text)
      });
    }));

    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Auswendig · tippen ändert den Status" }),
      UI.el("div.gruppe", zeilen)
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    var h = Hijri.fuer(new Date());
    UI.leeren(wurzel);
    var f = Hifz.fertige();
    wurzel.appendChild(UI.kopf("Qur'an", f.length + " Suren auswendig", "القرآن"));
    wurzel.appendChild(UI.el("div.inhalt", [
      juzKarte(),
      aktuellKarte(),
      murajaaBlock(),
      lesenKarte(),
      bestandBlock(),
      UI.el("p.klein", {
        text: "Der Wiederholungsplan teilt deinen Bestand in sechs Tagesblöcke, aufgeteilt nach Versanzahl. Sonntag ist Prüfungstag. Was du als wackelig markierst, kommt bis auf Weiteres täglich dran."
      })
    ].filter(Boolean)));
  }

  function oeffnen(root) {
    wurzel = root;
    return Promise.all([Store.tag(), Hifz.laden()]).then(function (r) {
      tag = r[0];
      zeichne();
    });
  }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
