/* Sūq – Werkstatt.
   Hier entsteht ein Video: Skript, Einstellungen, Stimme, Rechtliches.
   Vier Abteilungen hintereinander, weil man sie in dieser Reihenfolge
   braucht — und weil alles auf einer Seite ein Formular von zwei Metern
   Länge wäre.

   Der Wächter läuft nicht am Ende, sondern immer. Sein Urteil steht oben
   und ändert sich beim Tippen. Wer erst nach dem Schreiben erfährt, dass
   die Hälfte gesperrt ist, schreibt zweimal. */
var AnsichtWerkstatt = (function () {
  "use strict";

  var wurzel = null, v = null, p = null;
  var teil = "skript";           // skript | shots | stimme | recht
  var hookIndex = 0;
  var adressen = [];

  function frei() {
    adressen.forEach(function (u) { URL.revokeObjectURL(u); });
    adressen = [];
  }

  function sichern() { return Store.videoSpeichern(v); }

  /* ---------- Kopfleiste mit dem Urteil ---------- */
  function urteilskarte() {
    var e = Halal.pruefe(v, p);
    var dauer = Skript.gesamt(v);

    var klasse = e.frei ? (e.hinweise.length ? "hinweis" : "frei") : "sperre";
    var satz = e.frei
      ? (e.hinweise.length
          ? UI.plural(e.hinweise.length, "Sache", "Sachen") + " solltest du dir ansehen."
          : "Nichts zu beanstanden.")
      : UI.plural(e.sperren.length, "Punkt hält", "Punkte halten") + " dieses Video auf.";

    return UI.el("div.karte.urteil." + klasse, [
      UI.el("div.ukopf", [
        UI.el("span.uzeichen", { text: e.frei ? (e.hinweise.length ? "!" : "✓") : "✕" }),
        UI.el("div.ut", [
          UI.el("span.utt", { text: e.frei ? (e.hinweise.length ? "Frei, mit Anmerkungen" : "Frei") : "Gesperrt" }),
          UI.el("span.uts", { text: satz })
        ])
      ]),
      e.befunde.length ? UI.el("div.befunde", e.befunde.map(function (b) {
        return UI.el("div.befund." + b.stufe, [
          UI.el("div.bwo", [
            UI.el("span.bort", { text: b.wo }),
            b.wort ? UI.el("span.bwort", { text: "„" + b.wort + "“" }) : null
          ].filter(Boolean)),
          UI.el("div.bwarum", { text: b.warum }),
          UI.el("div.bersatz", { text: b.ersatz })
        ]);
      })) : null,
      UI.el("div.udauer", [
        UI.el("span", { text: "Länge " + UI.sek(dauer) }),
        UI.el("span", { text: (v.shots || []).length + " Einstellungen" }),
        UI.el("span", { text: Skript.zeichen(v) + " Zeichen für die Stimme" })
      ])
    ].filter(Boolean));
  }

  /* ---------- Abteilung: Skript ---------- */
  function teilSkript() {
    var hooks = Skript.passendeHooks(p);

    return UI.el("div.inhalt", [
      /* Produktzuordnung — ohne Produkt fehlt dem Skript die Grundlage */
      UI.block("Grundlage", [
        UI.beschriftet("Produkt", UI.auswahl({
          werte: [{ wert: "", name: "— keins —" }].concat(
            Store.produkte().map(function (x) { return { wert: x.id, name: x.name || "Ohne Namen" }; })),
          wert: v.produktId || "",
          onchange: function (e) {
            v.produktId = e.target.value || null;
            p = v.produktId ? Store.produkt(v.produktId) : null;
            sichern().then(zeichne);
          }
        })),
        UI.beschriftet("Titel", UI.feld({
          wert: v.titel, platzhalter: "Wofür du es später wiederfindest",
          onchange: function (e) { v.titel = e.target.value; sichern(); }
        }))
      ]),

      /* Hook-Auswahl. Die Kennzeichnungs-Hooks stehen oben und sind
         markiert — sie erledigen die Werbekennzeichnung im Satz. */
      UI.el("div.block", [
        UI.el("div.blockkopf", [
          UI.el("span", { text: "Hook wählen" }),
          UI.el("span.bhinweis", { text: hooks.length + " für " + (p ? p.kategorie : "alle") })
        ]),
        UI.el("div.hookliste", hooks.map(function (h, i) {
          var text = h.text.replace(/\{preis\}/g, p && p.preis ? UI.euro(p.preis) : "zwanzig Euro");
          var gewaehlt = v.skript.hook.text === text;
          return UI.el("button.hook" + (gewaehlt ? ".an" : ""), {
            type: "button",
            onclick: function () {
              v.skript.hook.text = text;
              v.skript.hook.sek = Skript.sekunden(text);
              sichern().then(zeichne);
            }
          }, [
            UI.el("span.hookt", { text: text }),
            h.kennzeichnet
              ? UI.el("span.marke.frei", { text: "kennzeichnet" })
              : UI.el("span.hookart", { text: h.art })
          ]);
        }))
      ]),

      /* Die sechs Abschnitte */
      UI.el("div.block", [
        UI.el("div.blockkopf", [
          UI.el("span", { text: "Skript" }),
          UI.knopf("Vorschlag", {
            klasse: "klein",
            onclick: function () {
              if (!p) { UI.meldung("Erst ein Produkt zuordnen."); return; }
              hookIndex++;
              var vs = Skript.vorschlag(p, hookIndex);
              v.skript = vs.skript;
              if (v.stand === "idee") v.stand = "skript";
              sichern().then(zeichne);
            }
          })
        ]),
        UI.el("div.abschnitte", Skript.ABSCHNITTE.map(function (a) {
          var s = v.skript[a.id];
          var befunde = Halal.pruefeText(s.text, "skript", a.name);
          var feld = UI.textfeld({
            wert: s.text, zeilen: 2, platzhalter: a.frage,
            oninput: function (e) {
              s.text = e.target.value;
              s.sek = Skript.sekunden(s.text);
              zeit.textContent = UI.sek(s.sek);
              feld.classList.toggle("beanstandet",
                Halal.pruefeText(s.text, "skript", a.name).some(function (b) {
                  return b.stufe === "sperre";
                }));
            },
            onblur: function () { sichern().then(zeichne); }
          });
          if (befunde.some(function (b) { return b.stufe === "sperre"; })) {
            feld.classList.add("beanstandet");
          }
          var zeit = UI.el("span.asek", { text: UI.sek(s.sek) });

          return UI.el("div.abschnitt", [
            UI.el("div.akopf", [
              UI.el("span.aname", { text: a.name }),
              UI.el("span.afrage", { text: a.frage }),
              zeit
            ]),
            feld
          ]);
        }))
      ]),

      UI.el("div.knopfreihe", [
        UI.cta("Einstellungen ableiten", {
          onclick: function () {
            if (!Skript.gesamt(v)) { UI.meldung("Erst das Skript schreiben."); return; }
            v.shots = Shots.vorschlag(v, p);
            if (v.stand === "idee") v.stand = "skript";
            sichern().then(function () { teil = "shots"; zeichne(); });
          }
        }),
        UI.knopf("Skript kopieren", {
          onclick: function () { UI.kopieren(Skript.fliesstext(v), "Skript"); }
        })
      ])
    ]);
  }

  /* ---------- Abteilung: Einstellungen ---------- */
  function teilShots() {
    if (!(v.shots || []).length) {
      return UI.el("div.inhalt", [
        UI.karte("hinweis", [
          UI.el("div.hz", { text: "Noch keine Einstellungen." }),
          UI.el("div.hz", { text: "Sie werden aus dem Skript abgeleitet — jede Einstellung bekommt ihren Platz auf der Zeitachse des Voiceovers." })
        ]),
        UI.cta("Aus dem Skript ableiten", {
          onclick: function () {
            v.shots = Shots.vorschlag(v, p);
            sichern().then(zeichne);
          }
        })
      ]);
    }

    var fotos = p ? p.fotos : [];

    return UI.el("div.inhalt", [
      UI.karte("hinweis", [
        UI.el("div.hz", { text: "Kein Mensch im Bild, keine Musik. Die Vorlagen halten das ein — was du selbst hineinschreibst, prüft der Wächter." })
      ]),

      UI.el("div.shotliste", v.shots.map(function (s, i) {
        var befunde = Halal.pruefeText(
          [s.was, s.bewegung, s.einblendung].filter(Boolean).join(" · "),
          "shot", "Einstellung " + (i + 1)
        );
        var gesperrt = befunde.some(function (b) { return b.stufe === "sperre"; });

        return UI.el("div.shot" + (gesperrt ? ".beanstandet" : ""), [
          UI.el("div.skopf", [
            UI.el("span.snr", { text: String(s.nr).padStart(2, "0") }),
            UI.el("span.szeit", { text: "+" + s.von.toFixed(1) + " s" }),
            UI.el("span.sabschnitt", { text: s.abschnittName || "" }),
            UI.el("span.sdauer", { text: s.dauer.toFixed(1) + " s" })
          ]),

          UI.textfeld({
            wert: s.was, zeilen: 2, klasse: "swas",
            platzhalter: "Was ist zu sehen?",
            onblur: function (e) { s.was = e.target.value; sichern().then(zeichne); }
          }),

          UI.el("div.sreihe", [
            UI.auswahl({
              werte: Object.keys(Shots.QUELLEN).map(function (k) {
                return { wert: k, name: Shots.QUELLEN[k] };
              }),
              wert: s.quelle,
              onchange: function (e) { s.quelle = e.target.value; sichern(); }
            }),
            UI.auswahl({
              werte: Object.keys(Shots.BEWEGUNGEN).map(function (k) {
                return { wert: k, name: Shots.BEWEGUNGEN[k] };
              }),
              wert: s.bewegung,
              onchange: function (e) { s.bewegung = e.target.value; sichern(); }
            })
          ]),

          /* Foto zuordnen — daraus baut das Montagewerkzeug später das Bild. */
          fotos.length ? UI.el("div.sfotos", fotos.map(function (f) {
            var kachel = UI.el("button.sfoto" + (s.bild === f.id ? ".an" : ""), {
              type: "button",
              onclick: function () {
                s.bild = (s.bild === f.id) ? null : f.id;
                sichern().then(zeichne);
              }
            });
            Store.bildAdresse(f.id).then(function (url) {
              if (!url) return;
              adressen.push(url);
              kachel.appendChild(UI.el("img", { src: url, alt: "" }));
            });
            return kachel;
          })) : null,

          UI.el("div.sreihe", [
            UI.feld({
              wert: s.einblendung, platzhalter: "Einblendung (leer lassen, wenn keine)",
              onchange: function (e) { s.einblendung = e.target.value; sichern(); }
            }),
            UI.knopf("−", {
              klasse: "klein",
              onclick: function () {
                v.shots.splice(i, 1);
                Shots.neuNummerieren(v.shots);
                sichern().then(zeichne);
              }
            })
          ])
        ].filter(Boolean));
      })),

      UI.el("div.knopfreihe", [
        UI.knopf("Einstellung anhängen", {
          onclick: function () {
            v.shots.push({
              nr: v.shots.length + 1, abschnitt: "produkt", abschnittName: "Produkt",
              von: 0, dauer: 2.2, quelle: "eigen", bewegung: "hinein",
              was: "", bild: null, einblendung: ""
            });
            Shots.neuNummerieren(v.shots);
            sichern().then(zeichne);
          }
        }),
        UI.knopf("Neu ableiten", {
          onclick: function () {
            UI.rueckfrage("Neu ableiten?",
              "Die jetzige Liste wird ersetzt. Zugeordnete Fotos gehen dabei verloren.",
              "Ersetzen").then(function (ja) {
              if (!ja) return;
              v.shots = Shots.vorschlag(v, p);
              sichern().then(zeichne);
            });
          }
        }),
        UI.knopf("Drehplan kopieren", {
          onclick: function () { UI.kopieren(Shots.alsText(v, p), "Drehplan"); }
        })
      ])
    ].filter(Boolean));
  }

  /* ---------- Abteilung: Stimme ---------- */
  function teilStimme() {
    var e = Store.einstellungen.stimme;
    var text = Skript.fliesstext(v);

    return UI.el("div.inhalt", [
      !Stimme.eingerichtet()
        ? UI.karte("hinweis", [
            UI.el("div.hz", { text: "ElevenLabs ist noch nicht eingerichtet." }),
            UI.el("div.hz", { text: "Schlüssel und Stimme trägst du unter Einstellungen ein. Der Schlüssel bleibt auf diesem Gerät." }),
            UI.knopf("Zu den Einstellungen", {
              onclick: function () { location.hash = "#/einstellungen"; }
            })
          ])
        : null,

      UI.block("Was gesprochen wird", [
        UI.el("div.zeile.feldzeile", [
          UI.el("div.vorlesetext", { text: text || "Noch kein Skript." })
        ])
      ], UI.el("span.bhinweis", { text: text.length + " Zeichen" })),

      v.stimme.erzeugt
        ? UI.karte("fertig", [
            UI.el("span.etikett", { text: "Stimme erzeugt" }),
            UI.el("div.ft", { text: v.stimme.datei }),
            UI.el("div.fs", { text: "am " + UI.datum(v.stimme.erzeugt) + " — die Datei liegt in deinem Download-Ordner." })
          ])
        : null,

      UI.el("div.knopfreihe", [
        UI.cta(v.stimme.erzeugt ? "Neu erzeugen" : "Stimme erzeugen", {
          aus: !Stimme.eingerichtet() || !text,
          onclick: function (ev) {
            var knopf = ev.target;
            knopf.disabled = true;
            knopf.textContent = "Wird erzeugt …";
            Stimme.erzeugenUndSichern(v, p).then(function (name) {
              UI.meldung(name + " gespeichert.");
              zeichne();
            }).catch(function (f) {
              UI.meldung(f.message, "fehler");
              knopf.disabled = false;
              knopf.textContent = "Stimme erzeugen";
            });
          }
        }),
        UI.knopf("Text kopieren", {
          onclick: function () { UI.kopieren(text, "Sprechtext"); }
        })
      ]),

      /* Die KI-Offenlegung ist keine Empfehlung. Sie steht hier, damit
         niemand die Stimme erzeugt und den Rest vergisst. */
      v.stimme.erzeugt ? UI.karte("hinweis", [
        UI.el("div.hz", { text: "Diese Stimme ist synthetisch. Nach Artikel 50 der KI-Verordnung, in Kraft seit dem 2. August 2026, muss das gekennzeichnet werden." }),
        UI.el("div.hz", { text: "Sūq hat den Hinweis in den Beschreibungstext gesetzt. In TikTok musst du den Schalter für KI-Inhalte zusätzlich selbst setzen." })
      ]) : null
    ].filter(Boolean));
  }

  /* ---------- Abteilung: Rechtliches ---------- */
  function teilRecht() {
    var m = Recht.mappe(v, p);

    return UI.el("div.inhalt", [
      UI.karte("recht", [
        UI.el("span.etikett", { text: "Im Video" }),
        m.einblendung
          ? UI.el("div.rblock", [
              UI.el("div.rgross", { text: "„" + m.einblendung.text + "“" }),
              UI.el("div.rklein", {
                text: "Sekunde " + m.einblendung.von + " bis " + m.einblendung.bis +
                      ", oben, deutlich lesbar. " + m.einblendung.hinweis
              })
            ])
          : UI.el("div.rblock", [
              UI.el("div.rklein", { text: "Keine Einblendung — die Kennzeichnung steckt im Hook. Prüf, dass sie dort wirklich steht." })
            ]),
        m.gesprochen
          ? UI.el("div.rblock", [
              UI.el("div.rklein", { text: "Gesprochen zu Beginn: „" + m.gesprochen + "“" })
            ])
          : null
      ].filter(Boolean)),

      UI.el("div.block", [
        UI.el("div.blockkopf", [
          UI.el("span", { text: "Beschreibungstext" }),
          UI.knopf("Kopieren", {
            klasse: "klein",
            onclick: function () {
              UI.kopieren(m.beschreibung + "\n\n" + m.hashtags, "Beschreibung");
            }
          })
        ]),
        UI.el("div.gruppe", [
          UI.el("div.zeile.feldzeile", [
            UI.el("div.vorlesetext", { text: m.beschreibung })
          ]),
          UI.el("div.zeile.feldzeile", [
            UI.el("div.vorlesetext.leise", { text: m.hashtags })
          ])
        ])
      ]),

      UI.block("In TikTok setzen", m.schalter.map(function (s) {
        return UI.zeile({
          text: s.text, dehnbar: true, unter: s.warum, klasse: "hoch"
        });
      })),

      UI.el("div.knopfreihe", [
        UI.knopf("Ganze Mappe kopieren", {
          onclick: function () { UI.kopieren(Recht.alsText(v, p), "Mappe"); }
        }),
        UI.cta("Bauplan sichern", {
          onclick: function () {
            var plan = Shots.alsBauplan(v, p);
            var blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = "bauplan-" + (v.titel || "video")
              .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".json";
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
            UI.meldung("Bauplan gesichert — den gibst du dem Montagewerkzeug.");
          }
        })
      ])
    ].filter(Boolean));
  }

  /* ---------- Stand ---------- */
  function standleiste() {
    return UI.el("div.stand", Store.STUFEN.map(function (s, i) {
      var jetzt = Store.STUFEN.indexOf(v.stand);
      return UI.el("button.stufe" + (i <= jetzt ? ".erreicht" : "") + (i === jetzt ? ".jetzt" : ""), {
        type: "button",
        onclick: function () { v.stand = s; sichern().then(zeichne); }
      }, Store.STUFEN_NAME[s]);
    }));
  }

  /* ---------- Zeichnen ---------- */
  function zeichne() {
    if (!wurzel) return;
    frei();
    UI.leeren(wurzel);

    wurzel.appendChild(UI.kopf(
      v.titel || "Neues Video",
      p ? p.name : "Kein Produkt zugeordnet",
      Store.STUFEN_NAME[v.stand]
    ));

    var abteilungen = [
      { id: "skript", name: "Skript" },
      { id: "shots",  name: "Einstellungen" },
      { id: "stimme", name: "Stimme" },
      { id: "recht",  name: "Rechtliches" }
    ];

    wurzel.appendChild(UI.el("div.inhalt.eng", [
      standleiste(),
      urteilskarte(),
      UI.el("div.segment", abteilungen.map(function (a) {
        return UI.el("button.segbtn" + (teil === a.id ? ".an" : ""), {
          type: "button", onclick: function () { teil = a.id; zeichne(); }
        }, a.name);
      }))
    ]));

    wurzel.appendChild(
      teil === "skript" ? teilSkript() :
      teil === "shots"  ? teilShots()  :
      teil === "stimme" ? teilStimme() : teilRecht()
    );

    wurzel.appendChild(UI.el("div.inhalt", [
      UI.knopf("Video löschen", {
        klasse: "gefahr",
        onclick: function () {
          UI.rueckfrage("Video löschen?", "Skript, Einstellungen und Zahlen gehen verloren.", "Löschen")
            .then(function (ja) {
              if (!ja) return;
              Store.videoLoeschen(v.id).then(function () { location.hash = "#/pipeline"; });
            });
        }
      })
    ]));
  }

  function param(name) {
    var teil2 = (location.hash.split("?")[1] || "");
    var treffer = teil2.split("&").filter(function (x) { return x.indexOf(name + "=") === 0; })[0];
    return treffer ? decodeURIComponent(treffer.slice(name.length + 1)) : null;
  }

  function oeffnen(root) {
    wurzel = root;
    var id = param("id");
    v = id ? Store.video(id) : null;
    if (!v) { location.hash = "#/pipeline"; return; }
    p = v.produktId ? Store.produkt(v.produktId) : null;
    teil = "skript";
    hookIndex = 0;
    zeichne();
  }

  function schliessen() {
    if (v) Store.videoSpeichern(v);
    frei();
    wurzel = null; v = null; p = null;
  }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
