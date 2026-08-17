/* Mīzān – Qur'an: Lesen, Hifz und Murājaʿa. */
var AnsichtQuran = (function () {
  "use strict";

  var wurzel = null, tag = null, bestandOffen = false, neuesBuch = false, offenesBuch = null;

  function speichern(neu) {
    return Store.tagSpeichern(tag).then(function () { if (neu !== false) zeichne(); });
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
        UI.el("span.gname.klein", { text: "Noch " + UI.plural(f.offen.length, "Sure", "Suren") }),
        UI.el("span.gzeit", { text: UI.plural(f.offeneVerse, "Vers", "Verse") })
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
      UI.el("div.chips.umbruch", [
        UI.el("button.chip" + (tag.quran.hifz ? ".an" : ""), {
          type: "button",
          onclick: function () { tag.quran.hifz = !tag.quran.hifz; speichern(); }
        }, tag.quran.hifz ? "Daran gelernt ✓" : "Daran gelernt"),
        UI.el("button.chip", {
          type: "button",
          onclick: function () {
            Hifz.abschliessen().then(function (neu) {
              UI.meldung(neu ? a.de + " sitzt. Weiter mit " + neu.de + "." : a.de + " sitzt.");
              zeichne();
            });
          }
        }, "Sitzt — weiter"),
        UI.el("button.chip.leise", {
          type: "button",
          onclick: function () {
            Hifz.abschlussRueckgaengig().then(function (zurueck) {
              UI.meldung(zurueck ? zurueck.de + " ist wieder im Lernen." : "Nichts zum Rückgängigmachen.");
              zeichne();
            });
          }
        }, "↶ Rückgängig")
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
    var d = Hifz.heuteDran(Store.ausKey(tag.datum));
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
      : "Murājaʿa · Block " + d.blockNr + " von " + d.bloeckeGesamt;

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
          UI.el("span.chip.still", { text: d.verse + " Verse" })
        ])
      ])
    ]);
  }

  /* ---------- Lesen ---------- */
  function lesenKarte() {
    var anzeige = UI.el("div.zfwert", {
      text: (tag.quran.gelesen || 0) + (tag.quran.gelesen === 1 ? " Seite" : " Seiten")
    });
    function setz(n) {
      tag.quran.gelesen = Math.max(0, n);
      anzeige.textContent = tag.quran.gelesen + (tag.quran.gelesen === 1 ? " Seite" : " Seiten");
      feld.value = "";
      speichern(false);
    }
    var feld = UI.el("input.aufgabenfeld", {
      type: "text", inputmode: "numeric", placeholder: "genaue Seitenzahl",
      onchange: function () {
        var n = parseInt(feld.value, 10);
        if (!isNaN(n)) setz(n);
      },
      onkeydown: function (ev) { if (ev.key === "Enter") ev.target.blur(); }
    });
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Gelesen " + UI.tagWortKlein() }),
      anzeige,
      UI.el("div.zfknoepfe", [1, 2, 5, 10, 20].map(function (n) {
        return UI.el("button.mini", {
          type: "button", onclick: function () { setz((tag.quran.gelesen || 0) + n); }
        }, "+" + n);
      }).concat([
        UI.el("button.mini", {
          type: "button", onclick: function () { setz((tag.quran.gelesen || 0) - 1); }
        }, "−1"),
        UI.el("button.mini.null", { type: "button", onclick: function () { setz(0); } }, "0")
      ])),
      UI.el("div.zeitreihe", [feld])
    ]);
  }

  /* ---------- Bestand ---------- */
  function bestandBlock() {
    var st = Store.einstellungen.hifz.status || {};
    var f = Hifz.fertige();
    var kopf = UI.zeile({
      text: "Mein Bestand",
      wert: UI.plural(f.length, "Sure", "Suren") + " · " + UI.plural(Hifz.gesamtVerse(f), "Vers", "Verse"),
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

  /* ---------- Bücher ----------
     Du legst selbst an, welches Buch du liest, und trägst die Seiten
     genau ein — nicht nur in Fünferschritten. */
  function buchZeile(b, i) {
    var e = Store.einstellungen;
    var gelesen = (tag.buecher && tag.buecher[b.titel]) || 0;

    /* Der Tageswert und der Gesamtstand hängen zusammen: was du heute
       liest, rückt auch den Stand vor. Deshalb nur die Differenz. */
    function setzeTagesWert(n) {
      if (!tag.buecher) tag.buecher = {};
      var alt = tag.buecher[b.titel] || 0;
      var neu = Math.max(0, n);
      if (neu) tag.buecher[b.titel] = neu; else delete tag.buecher[b.titel];
      b.stand = Math.max(0, (b.stand || 0) + (neu - alt));
    }

    function dazu(n) {
      setzeTagesWert((tag.buecher && tag.buecher[b.titel] || 0) + n);
      sichern();
    }

    function sichern() {
      return Store.einstellungenSpeichern().then(function () { return speichern(); });
    }

    var kopfZeile = UI.el("div.bzkopf.tippbar", {
      onclick: function () { offenesBuch = offenesBuch === b.titel ? null : b.titel; zeichne(); }
    }, [
      UI.el("span.zt.dehnbar", { text: b.titel }),
      UI.el("span.zw", {
        text: b.seiten > 0 ? b.stand + " / " + b.seiten + " S." : "S. " + (b.stand || 0)
      })
    ]);

    var kinder = [
      kopfZeile,
      b.seiten > 0 ? UI.balken(b.stand / b.seiten) : null,
      UI.el("div.bzzeile", [
        UI.el("span.bzheute", {
          text: gelesen ? UI.plural(gelesen, "Seite", "Seiten") + " " + UI.tagWortKlein()
                        : (UI.tagWort() + " noch nichts")
        }),
        UI.el("div.zfknoepfe", [1, 5, 10, 20].map(function (n) {
          return UI.el("button.mini", { type: "button", onclick: function () { dazu(n); } }, "+" + n);
        }).concat([
          UI.el("button.mini", {
            type: "button", "aria-label": "eine Seite weniger",
            onclick: function () { dazu(-1); }
          }, "−")
        ]))
      ])
    ];

    if (offenesBuch === b.titel) {
      var seitenFeld = UI.el("input.aufgabenfeld", {
        type: "text", inputmode: "numeric", value: gelesen || "",
        placeholder: "Seiten " + UI.tagWortKlein()
      });
      var standFeld = UI.el("input.aufgabenfeld", {
        type: "text", inputmode: "numeric", value: b.stand || "",
        placeholder: "Bin auf Seite"
      });
      var umfangFeld = UI.el("input.aufgabenfeld", {
        type: "text", inputmode: "numeric", value: b.seiten || "",
        placeholder: "Seiten insgesamt"
      });
      kinder.push(UI.el("div.bzeditor", [
        UI.el("div.unterkopf", { text: "Genau eintragen" }),
        seitenFeld, standFeld, umfangFeld,
        UI.el("div.zfknoepfe", [
          UI.el("button.mini", {
            type: "button",
            onclick: function () {
              var n = parseInt(seitenFeld.value, 10);
              var st = parseInt(standFeld.value, 10);
              var um = parseInt(umfangFeld.value, 10);
              if (!isNaN(um)) b.seiten = Math.max(0, um);
              if (!isNaN(n)) setzeTagesWert(n);
              // Eine ausdrückliche Seitenangabe schlägt die Hochrechnung
              if (!isNaN(st)) b.stand = Math.max(0, st);
              offenesBuch = null;
              sichern();
            }
          }, "Übernehmen"),
          UI.el("button.mini.gefahr", {
            type: "button",
            onclick: function () {
              e.buecher.splice(i, 1);
              if (tag.buecher) delete tag.buecher[b.titel];
              offenesBuch = null;
              UI.meldung("Buch entfernt.");
              sichern();
            }
          }, "Buch löschen")
        ])
      ]));
    }

    return UI.el("div.buchzeile" + (gelesen ? ".gelesen" : ""), kinder.filter(Boolean));
  }

  function neuesBuchZeile() {
    if (!neuesBuch) {
      return UI.el("div.zeile.tippbar.hinzu", {
        onclick: function () { neuesBuch = true; zeichne(); }
      }, [
        UI.el("span.zt.dehnbar", { text: "Buch hinzufügen" }),
        UI.el("span.bpfeil.klein", { text: "›" })
      ]);
    }
    var titelFeld = UI.el("input.aufgabenfeld.gross", { type: "text", placeholder: "Titel" });
    var autorFeld = UI.el("input.aufgabenfeld", { type: "text", placeholder: "Autor (freiwillig)" });
    var seitenFeld = UI.el("input.aufgabenfeld", {
      type: "text", inputmode: "numeric", placeholder: "Seiten insgesamt (freiwillig)"
    });
    function anlegen() {
      var t = titelFeld.value.trim();
      if (!t) { UI.meldung("Titel fehlt."); return; }
      var e = Store.einstellungen;
      if (!e.buecher) e.buecher = [];
      e.buecher.push({
        titel: t, autor: autorFeld.value.trim(),
        seiten: parseInt(seitenFeld.value, 10) || 0, stand: 0
      });
      neuesBuch = false;
      Store.einstellungenSpeichern().then(function () {
        UI.meldung("„" + t + "“ angelegt.");
        zeichne();
      });
    }
    titelFeld.addEventListener("keydown", function (ev) { if (ev.key === "Enter") anlegen(); });
    setTimeout(function () { titelFeld.focus(); }, 60);
    return UI.el("div.bzeditor", [
      titelFeld, autorFeld, seitenFeld,
      UI.el("div.zfknoepfe", [
        UI.el("button.mini", { type: "button", onclick: anlegen }, "Anlegen"),
        UI.el("button.mini", {
          type: "button", onclick: function () { neuesBuch = false; zeichne(); }
        }, "Abbrechen")
      ])
    ]);
  }

  function buecherBlock() {
    var e = Store.einstellungen;
    var liste = e.buecher || [];
    var gelesenHeute = liste.filter(function (b) {
      return tag.buecher && tag.buecher[b.titel];
    }).length;
    return UI.el("div.block", [
      UI.el("div.blockkopf", {
        text: "Bücher" + (gelesenHeute ? " · " + gelesenHeute + " gelesen" : "")
      }),
      UI.el("div.gruppe.buecher", liste.map(buchZeile).concat([neuesBuchZeile()])),
      UI.el("p.klein", {
        text: "Eine Zeile antippen öffnet die genaue Eingabe: Seiten an diesem Tag, aktuelle Seite, Gesamtumfang."
      })
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    var h = Hijri.fuer(Store.ausKey(tag.datum));
    UI.leeren(wurzel);
    var f = Hifz.fertige();
    wurzel.appendChild(UI.kopf("Qur'an", UI.plural(f.length, "Sure", "Suren") + " auswendig", "القرآن"));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(laden),
      juzKarte(),
      aktuellKarte(),
      murajaaBlock(),
      Sichtbar.an("quran.gelesen") ? lesenKarte() : null,
      buecherBlock(),
      bestandBlock(),
      UI.el("p.klein", {
        text: "Der Wiederholungsplan teilt deinen Bestand in sechs Tagesblöcke, aufgeteilt nach Versanzahl. Sonntag ist Prüfungstag. Was du als wackelig markierst, kommt bis auf Weiteres täglich dran."
      })
    ].filter(Boolean)));
  }

  function laden() {
    return Promise.all([Store.tag(), Hifz.laden()]).then(function (r) {
      tag = r[0];
      zeichne();
    });
  }
  function oeffnen(root) { wurzel = root; return laden(); }
  function schliessen() { wurzel = null; neuesBuch = false; offenesBuch = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
