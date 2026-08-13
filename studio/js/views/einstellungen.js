/* Sūq – Einstellungen.
   Die Grenzen stehen oben und nicht unten. Sie sind nicht Zubehör,
   sie sind der Rahmen, in dem diese App arbeitet. */
var AnsichtEinstellungen = (function () {
  "use strict";

  var wurzel = null;
  var stimmenListe = null;   // erst nach dem Abruf gefüllt
  var kontingent = null;

  function e() { return Store.einstellungen; }
  function sichern() { return Store.einstellungenSpeichern(); }

  /* ---------- Grenzen ---------- */
  function grenzen() {
    var g = e().grenzen;
    function schalt(feld, text, hinweis) {
      return UI.schalter(text, g[feld], function (an) {
        if (!an) {
          UI.rueckfrage(
            "Grenze aufheben?",
            "„" + text + "“ wird abgeschaltet. Der Wächter prüft das dann nicht mehr.",
            "Aufheben"
          ).then(function (ja) {
            if (!ja) { zeichne(); return; }
            g[feld] = false; sichern().then(zeichne);
          });
          return;
        }
        g[feld] = true; sichern().then(zeichne);
      }, hinweis);
    }

    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Grenzen" }),
      UI.el("div.gruppe", [
        schalt("keinePersonen", "Keine Menschen im Bild",
          "Keine Gesichter, keine Personen. Die eigene Hand am Produkt ist erlaubt, solange niemand ins Bild kommt."),
        schalt("keineFrauen", "Keine weiblichen Darstellungen",
          "Kleidung nur auf Bügel, flach ausgelegt oder auf der kopflosen Puppe."),
        UI.schalter("Kopflose Schneiderpuppe erlaubt", g.puppeErlaubt, function (an) {
          g.puppeErlaubt = an; sichern().then(zeichne);
        }, "Von dir freigegeben. Zeigt den Schnitt, ohne einen Menschen zu zeigen."),
        schalt("keineMusik", "Keine Musik",
          "Nasheed ohne Instrumente, die Stimme allein oder Ambient."),
        schalt("keineUebertreibung", "Keine Übertreibung",
          "Keine Heilversprechen, keine Superlative ohne Beleg."),
        schalt("keinRiba", "Kein Riba",
          "Ratenzahlung, Kredit und „jetzt kaufen, später zahlen“ werden nicht mitbeworben.")
      ])
    ]);
  }

  /* ---------- Klang ---------- */
  function klang() {
    var werte = [
      { wert: "nasheed", name: "Nasheed" },
      { wert: "stimme", name: "Nur Stimme" },
      { wert: "ambient", name: "Ambient" },
      { wert: "still", name: "Still" }
    ];
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Unter der Stimme" }),
      UI.el("div.gruppe", [
        UI.el("div.zeile.feldzeile", [
          UI.chips(werte, e().klang, function (w) { e().klang = w; sichern().then(zeichne); }, "umbruch")
        ]),
        UI.el("div.zeile.leise", {
          text: {
            nasheed: "Nasheed ohne Instrumente, leise unter der Stimme.",
            stimme: "Nichts außer der Stimme. Am ruhigsten, und meistens am besten.",
            ambient: "Raumton: Stoffrascheln, Papier, Schritte. Trägt ohne aufzufallen.",
            still: "Kein Ton außer der Stimme — auch keine Atmo."
          }[e().klang]
        })
      ])
    ]);
  }

  /* ---------- Rechtliches ---------- */
  function recht() {
    var r = e().recht;
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Rechtliches" }),
      UI.el("div.gruppe", [
        UI.el("div.zeile.feldzeile", [
          UI.el("span.zt", { text: "Wort" }),
          UI.chips([
            { wert: "Werbung", name: "Werbung" },
            { wert: "Anzeige", name: "Anzeige" }
          ], r.wort, function (w) { r.wort = w; sichern().then(zeichne); })
        ]),
        UI.el("div.zeile.leise", {
          text: "Nur diese beiden Wörter sind anerkannt. „Ad“, „Sponsored“ und " +
                "„Kooperation“ genügen den Medienanstalten nicht."
        }),
        UI.schalter("Einblendung ab Sekunde 0", r.imBild, function (an) {
          r.imBild = an; sichern().then(zeichne);
        }, "Am Anfang des Videos, deutlich lesbar. Nicht zwischen den Hashtags."),
        UI.schalter("Zusätzlich gesprochen", r.gesprochen, function (an) {
          r.gesprochen = an; sichern().then(zeichne);
        }, "Wird dem Sprechtext vorangestellt."),
        UI.schalter("Provisionshinweis", r.provisionshinweis, function (an) {
          r.provisionshinweis = an; sichern().then(zeichne);
        }, "Direkt am Link, nicht am Textende."),
        UI.schalter("KI-Offenlegung", r.kiOffenlegung, function (an) {
          r.kiOffenlegung = an; sichern().then(zeichne);
        }, "Pflicht bei synthetischer Stimme. KI-Verordnung Art. 50, gilt seit dem 2. August 2026.")
      ])
    ]);
  }

  /* ---------- Stimme ---------- */
  function stimme() {
    var s = e().stimme;

    var kinder = [
      UI.beschriftet("ElevenLabs-Schlüssel", UI.feld({
        typ: "password", wert: s.schluessel, platzhalter: "sk_…",
        onchange: function (ev) {
          s.schluessel = ev.target.value.trim();
          stimmenListe = null; kontingent = null;
          sichern().then(zeichne);
        }
      }), "Bleibt auf diesem Gerät und geht nur an ElevenLabs. Nicht Teil der Sicherung.")
    ];

    if (s.schluessel) {
      kinder.push(UI.el("div.zeile.feldzeile", [
        UI.knopf(stimmenListe ? "Stimmen neu laden" : "Stimmen laden", {
          onclick: function (ev) {
            var k = ev.target;
            k.disabled = true; k.textContent = "Lädt …";
            Promise.all([Stimme.stimmen(), Stimme.kontingent().catch(function () { return null; })])
              .then(function (r) {
                stimmenListe = r[0]; kontingent = r[1];
                zeichne();
              })
              .catch(function (f) {
                UI.meldung(f.message, "fehler");
                k.disabled = false; k.textContent = "Stimmen laden";
              });
          }
        })
      ]));
    }

    if (kontingent) {
      kinder.push(UI.el("div.zeile", [
        UI.el("span.zt", { text: "Kontingent" }),
        UI.el("span.zw", {
          text: UI.zahl(kontingent.uebrig) + " von " + UI.zahl(kontingent.grenze) + " Zeichen übrig"
        })
      ]));
    }

    if (stimmenListe) {
      kinder.push(UI.el("div.stimmenliste", stimmenListe.map(function (st) {
        return UI.el("div.stimmzeile" + (s.stimmeId === st.id ? ".an" : ""), [
          UI.el("div.stt", {
            onclick: function () {
              s.stimmeId = st.id; s.stimmeName = st.name;
              sichern().then(zeichne);
            }
          }, [
            UI.el("span.stname", { text: st.name }),
            UI.el("span.stbeschreibung", { text: st.beschreibung || st.art })
          ]),
          UI.knopf("Probe", {
            klasse: "klein",
            onclick: function (ev) {
              var k = ev.target;
              k.disabled = true;
              Stimme.probe(st.id)
                .then(function () { k.disabled = false; })
                .catch(function (f) { UI.meldung(f.message, "fehler"); k.disabled = false; });
            }
          })
        ]);
      })));
    } else if (s.stimmeName) {
      kinder.push(UI.zeile({ text: "Gewählte Stimme", wert: s.stimmeName }));
    }

    kinder.push(UI.beschriftet("Tempo", UI.feld({
      typ: "number", wert: s.tempo, inputmode: "decimal",
      onchange: function (ev) {
        var n = parseFloat(ev.target.value);
        s.tempo = isNaN(n) ? 1.0 : Math.max(0.7, Math.min(1.2, n));
        sichern().then(zeichne);
      }
    }), "0,7 bis 1,2. Bei 1,0 bleibt es, wie die Stimme gebaut ist."));

    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Stimme" }),
      UI.el("div.gruppe", kinder)
    ]);
  }

  /* ---------- Ziele ---------- */
  function ziele() {
    var z = e().ziel;
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Ziele" }),
      UI.el("div.gruppe", [
        UI.beschriftet("Videos pro Woche", UI.feld({
          typ: "number", wert: z.videosProWoche, inputmode: "numeric",
          onchange: function (ev) { z.videosProWoche = parseInt(ev.target.value, 10) || 0; sichern(); }
        }), "Die Zahl, die über die ersten Monate entscheidet."),
        UI.beschriftet("Provision pro Monat", UI.feld({
          typ: "number", wert: z.provisionProMonat, inputmode: "decimal",
          onchange: function (ev) { z.provisionProMonat = parseFloat(ev.target.value) || 0; sichern(); }
        }), "Ein Ziel, kein Versprechen. Spürbar wird es erfahrungsgemäß ab Monat neun.")
      ])
    ]);
  }

  /* ---------- Sichern ---------- */
  function sicherung() {
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Sicherung" }),
      UI.el("div.gruppe", [
        UI.el("div.zeile.feldzeile", [
          UI.knopf("Mit Fotos sichern", {
            onclick: function () {
              UI.meldung("Wird zusammengestellt …");
              Store.exportDatei(true).then(function () { UI.meldung("Gesichert."); });
            }
          }),
          UI.knopf("Ohne Fotos", {
            onclick: function () { Store.exportDatei(false).then(function () { UI.meldung("Gesichert."); }); }
          })
        ]),
        UI.el("div.zeile.leise", {
          text: e().letztesBackup
            ? "Zuletzt am " + UI.datum(e().letztesBackup) + "."
            : "Noch nie gesichert. Alles liegt nur auf diesem Gerät."
        }),
        (function () {
          var eingabe = UI.el("input", {
            type: "file", accept: "application/json", style: "display:none",
            onchange: function () {
              var d = eingabe.files && eingabe.files[0];
              if (!d) return;
              var leser = new FileReader();
              leser.onload = function () {
                try {
                  Store.importieren(JSON.parse(leser.result))
                    .then(function () { UI.meldung("Eingelesen."); zeichne(); })
                    .catch(function (f) { UI.meldung(f.message, "fehler"); });
                } catch (f) { UI.meldung("Die Datei lässt sich nicht lesen.", "fehler"); }
                eingabe.value = "";
              };
              leser.readAsText(d);
            }
          });
          return UI.el("div.zeile.feldzeile", [
            UI.knopf("Sicherung einlesen", { onclick: function () { eingabe.click(); } }),
            eingabe
          ]);
        })()
      ])
    ]);
  }

  /* ---------- Erscheinungsbild ---------- */
  function erscheinung() {
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Erscheinungsbild" }),
      UI.el("div.gruppe", [
        UI.el("div.zeile.feldzeile", [
          UI.chips([
            { wert: "hell", name: "Hell" },
            { wert: "dunkel", name: "Dunkel" },
            { wert: "system", name: "System" }
          ], e().thema, function (w) {
            e().thema = w;
            UI.themaAnwenden(w);
            sichern().then(zeichne);
          })
        ])
      ])
    ]);
  }

  function zeichne() {
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Einstellungen", "", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      grenzen(), klang(), recht(), stimme(), ziele(), erscheinung(), sicherung(),
      UI.el("p.fuss", {
        text: "Sūq ist ein Werkzeug, keine Rechtsberatung. Die Hinweise folgen dem " +
              "Leitfaden der Medienanstalten und Artikel 50 der KI-Verordnung. " +
              "Im Zweifel fragst du jemanden, der dafür haftet."
      })
    ]));
  }

  function oeffnen(root) { wurzel = root; zeichne(); }
  function schliessen() { wurzel = null; stimmenListe = null; kontingent = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
