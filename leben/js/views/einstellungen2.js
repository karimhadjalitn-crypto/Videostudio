/* Mīzān – Ergänzende Einstellungen: Gewichtung, Ziele, Kontakte,
   Sperre und der Reisemodus. */

/* ==================== Gewichtung ==================== */
var AnsichtGewichtung = (function () {
  "use strict";
  var wurzel = null;

  var NAMEN = {
    religion: "Religion", produktivitaet: "Arbeit & Uni", sport: "Sport & Körper",
    schlaf: "Schlaf", ernaehrung: "Ernährung", soziales: "Soziales & Familie",
    innen: "Innenleben & Finanzen"
  };

  function zeichne() {
    if (!wurzel) return;
    var e = Store.einstellungen;
    var g = e.gewichte;
    var summe = Object.keys(g).reduce(function (a, k) { return a + g[k]; }, 0);

    function regler(k) {
      var anzeige = UI.el("span.zw", { text: g[k] + " %" });
      function setz(n) {
        g[k] = Math.max(0, Math.min(80, g[k] + n));
        anzeige.textContent = g[k] + " %";
        Store.einstellungenSpeichern().then(function () {
          var s = Object.keys(g).reduce(function (a, x) { return a + g[x]; }, 0);
          gesamt.textContent = s + " %";
          gesamt.className = "zw" + (s === 100 ? "" : " warn");
        });
      }
      return UI.el("div.zeile", [
        UI.el("span.zt.dehnbar", { text: NAMEN[k] }),
        anzeige,
        UI.el("div.stepper", [
          UI.el("button.mini", { type: "button", onclick: function () { setz(-1); } }, "−"),
          UI.el("button.mini", { type: "button", onclick: function () { setz(1); } }, "+")
        ])
      ]);
    }

    var gesamt = UI.el("span.zw" + (summe === 100 ? "" : ".warn"), { text: summe + " %" });

    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Gewichtung", "Was wie stark zählt", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Diese Prozente bestimmen deinen Tagesscore. Sie müssen sich nicht exakt auf 100 summieren — Mīzān rechnet anteilig. Aber es hilft beim Denken."
        })
      ]),
      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Anteile" }),
        UI.el("div.gruppe", Object.keys(NAMEN).map(regler).concat([
          UI.el("div.zeile.summe", [UI.el("span.zt.dehnbar", { text: "Summe" }), gesamt])
        ]))
      ]),
      UI.el("button.cta.leise", {
        type: "button",
        onclick: function () {
          e.gewichte = { religion: 45, produktivitaet: 18, sport: 12, schlaf: 8,
                         ernaehrung: 8, soziales: 5, innen: 4 };
          Store.einstellungenSpeichern().then(zeichne);
          UI.meldung("Zurückgesetzt.");
        }
      }, "Auf Ausgangswerte zurücksetzen"),
      UI.el("button.cta.leise", {
        type: "button", onclick: function () { location.hash = "#/mehr"; }
      }, "Zurück")
    ]));
  }

  function oeffnen(root) { wurzel = root; zeichne(); return Promise.resolve(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();


/* ==================== Ziele & Listen ==================== */
var AnsichtZiele = (function () {
  "use strict";
  var wurzel = null;

  function textZeile(label, wert, beiAenderung, platzhalter) {
    var inp = UI.el("input.feld", {
      type: "text", value: wert == null ? "" : String(wert), placeholder: platzhalter || "",
      onchange: function () { beiAenderung(inp.value); }
    });
    return UI.el("div.zeile", [UI.el("span.zt.dehnbar", { text: label }), inp]);
  }

  function zahlZeile(label, wert, schritt, min, max, beiAenderung, einheit) {
    var anzeige = UI.el("span.zw", { text: wert + (einheit || "") });
    var akt = wert;
    function setz(v) {
      akt = Math.max(min, Math.min(max, Math.round(v * 100) / 100));
      anzeige.textContent = akt + (einheit || "");
      beiAenderung(akt);
    }
    return UI.el("div.zeile", [
      UI.el("span.zt.dehnbar", { text: label }), anzeige,
      UI.el("div.stepper", [
        UI.el("button.mini", { type: "button", onclick: function () { setz(akt - schritt); } }, "−"),
        UI.el("button.mini", { type: "button", onclick: function () { setz(akt + schritt); } }, "+")
      ])
    ]);
  }

  function liste(titel, arr, beiAenderung, platzhalter) {
    var eingabe = UI.el("input.aufgabenfeld", {
      type: "text", placeholder: platzhalter,
      onkeydown: function (ev) { if (ev.key === "Enter") dazu(); }
    });
    function dazu() {
      var t = eingabe.value.trim();
      if (!t) return;
      arr.push(t); eingabe.value = "";
      beiAenderung();
    }
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: titel }),
      UI.el("div.gruppe", arr.map(function (x, i) {
        return UI.el("div.zeile", [
          UI.el("span.zt.dehnbar", { text: x }),
          UI.el("button.loeschen", {
            type: "button", onclick: function () { arr.splice(i, 1); beiAenderung(); }
          }, "×")
        ]);
      }).concat([
        UI.el("div.zeile", [eingabe, UI.el("button.mini", { type: "button", onclick: dazu }, "+")])
      ]))
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    var e = Store.einstellungen;
    function sichern() { Store.einstellungenSpeichern().then(zeichne); }
    function still() { Store.einstellungenSpeichern(); }

    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Ziele & Listen", "Deine Vorgaben", ""));
    wurzel.appendChild(UI.el("div.inhalt", [

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Sport" }),
        UI.el("div.gruppe", [
          zahlZeile("Trainings pro Woche", e.sport.wochenziel, 1, 0, 14,
            function (v) { e.sport.wochenziel = v; still(); }, "×"),
          zahlZeile("Zielgewicht von", e.sport.gewichtZiel.von, 0.5, 40, 150,
            function (v) { e.sport.gewichtZiel.von = v; still(); }, " kg"),
          zahlZeile("Zielgewicht bis", e.sport.gewichtZiel.bis, 0.5, 40, 150,
            function (v) { e.sport.gewichtZiel.bis = v; still(); }, " kg")
        ])
      ]),
      liste("Trainingsarten", e.sport.arten, sichern, "Art hinzufügen …"),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Ernährung" }),
        UI.el("div.gruppe", [
          zahlZeile("Wasser am Tag", e.wasserZiel, 0.25, 0.5, 6,
            function (v) { e.wasserZiel = v; still(); }, " l"),
          zahlZeile("Süßigkeiten-Ausnahmen je Woche", e.essen.suessAusnahmen, 1, 0, 14,
            function (v) { e.essen.suessAusnahmen = v; still(); }, "×")
        ])
      ]),
      liste("Supplemente", e.essen.supplemente, sichern, "Supplement hinzufügen …"),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Business" }),
        UI.el("div.gruppe", [
          zahlZeile("Videos pro Woche", e.business.videoZielWoche, 1, 0, 30,
            function (v) { e.business.videoZielWoche = v; still(); }, "×")
        ])
      ]),
      liste("Projekte", e.projekte, sichern, "Projekt hinzufügen …"),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Bücher · Lesefortschritt" }),
        UI.el("div.gruppe", (e.buecher || []).map(function (b, i) {
          return UI.el("div.zeile", [
            UI.el("span.zt.dehnbar", { text: b.titel }),
            (function () {
              var a = UI.el("span.zw", { text: (b.stand || 0) + (b.seiten ? "/" + b.seiten : "") });
              return UI.el("span", [a, UI.el("span.stepper", [
                UI.el("button.mini", {
                  type: "button",
                  onclick: function () {
                    b.seiten = Math.max(0, (b.seiten || 0) - 50);
                    a.textContent = (b.stand || 0) + (b.seiten ? "/" + b.seiten : ""); still();
                  }
                }, "−50"),
                UI.el("button.mini", {
                  type: "button",
                  onclick: function () {
                    b.seiten = (b.seiten || 0) + 50;
                    a.textContent = (b.stand || 0) + (b.seiten ? "/" + b.seiten : ""); still();
                  }
                }, "+50")
              ])]);
            })(),
            UI.el("button.loeschen", {
              type: "button", onclick: function () { e.buecher.splice(i, 1); sichern(); }
            }, "×")
          ]);
        }).concat([(function () {
          var eingabe = UI.el("input.aufgabenfeld", {
            type: "text", placeholder: "Buch hinzufügen …",
            onkeydown: function (ev) {
              if (ev.key === "Enter" && eingabe.value.trim()) {
                e.buecher.push({ titel: eingabe.value.trim(), autor: "", seiten: 0, stand: 0 });
                sichern();
              }
            }
          });
          return UI.el("div.zeile", [eingabe]);
        })()]))
      ]),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Finanzen" }),
        UI.el("div.gruppe", [
          zahlZeile("Ausgaben einzeln erfassen ab", e.finanzen.schwelle, 5, 0, 200,
            function (v) { e.finanzen.schwelle = v; still(); }, " €"),
          zahlZeile("Monatsbudget", e.finanzen.budget, 50, 0, 10000,
            function (v) { e.finanzen.budget = v; still(); }, " €"),
          zahlZeile("Sadaqa-Ziel je Monat", e.finanzen.sadaqaZielMonat, 5, 0, 2000,
            function (v) { e.finanzen.sadaqaZielMonat = v; still(); }, " €"),
          textZeile("Sparziel", e.finanzen.sparziel.name,
            function (v) { e.finanzen.sparziel.name = v; still(); }, "z. B. Hochzeit"),
          zahlZeile("Sparziel-Betrag", e.finanzen.sparziel.betrag, 250, 0, 200000,
            function (v) { e.finanzen.sparziel.betrag = v; still(); }, " €")
        ])
      ]),
      liste("Ausgaben-Kategorien", e.finanzen.kategorien, sichern, "Kategorie hinzufügen …"),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Soziales · Abstand in Tagen" }),
        UI.el("div.gruppe", e.kontakte.map(function (k, i) {
          return UI.el("div.zeile", [
            UI.el("span.zt.dehnbar", { text: k.name }),
            (function () {
              var a = UI.el("span.zw", { text: k.intervall + " T" });
              function setz(n) {
                k.intervall = Math.max(1, Math.min(90, k.intervall + n));
                a.textContent = k.intervall + " T"; still();
              }
              return UI.el("span", [a, UI.el("span.stepper", [
                UI.el("button.mini", { type: "button", onclick: function () { setz(-1); } }, "−"),
                UI.el("button.mini", { type: "button", onclick: function () { setz(1); } }, "+")
              ])]);
            })(),
            UI.el("button.loeschen", {
              type: "button", onclick: function () { e.kontakte.splice(i, 1); sichern(); }
            }, "×")
          ]);
        }).concat([(function () {
          var eingabe = UI.el("input.aufgabenfeld", {
            type: "text", placeholder: "Person hinzufügen …",
            onkeydown: function (ev) {
              if (ev.key === "Enter" && eingabe.value.trim()) {
                e.kontakte.push({ name: eingabe.value.trim(), intervall: 7 }); sichern();
              }
            }
          });
          return UI.el("div.zeile", [eingabe]);
        })()]))
      ]),

      UI.el("button.cta.leise", {
        type: "button", onclick: function () { location.hash = "#/mehr"; }
      }, "Zurück")
    ]));
  }

  function oeffnen(root) { wurzel = root; zeichne(); return Promise.resolve(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();


/* ==================== Sperre ==================== */
var AnsichtSperre = (function () {
  "use strict";
  var wurzel = null;

  function codeSetzen(feldName, titel) {
    var e = Store.einstellungen;
    var alt = e.sperre[feldName];
    var neu = UI.el("input.codefeld", {
      type: "password", inputmode: "numeric", maxlength: 8, placeholder: "••••", autocomplete: "off"
    });
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: titel }),
      UI.el("p.klein", { text: alt ? "Ein Code ist gesetzt." : "Kein Code gesetzt." }),
      neu,
      UI.el("div.zfknoepfe", [
        UI.el("button.mini", {
          type: "button",
          onclick: function () {
            if (neu.value.length < 4) { UI.meldung("Mindestens vier Zeichen."); return; }
            Sperre.hash(neu.value).then(function (h) {
              e.sperre[feldName] = h;
              return Store.einstellungenSpeichern();
            }).then(function () {
              neu.value = "";
              UI.meldung("Code gesetzt.");
              zeichne();
            });
          }
        }, alt ? "Code ändern" : "Code setzen"),
        alt ? UI.el("button.mini", {
          type: "button",
          onclick: function () {
            e.sperre[feldName] = "";
            Store.einstellungenSpeichern().then(function () {
              UI.meldung("Code entfernt."); zeichne();
            });
          }
        }, "Entfernen") : null
      ].filter(Boolean))
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Sperre", "Codes für App und Bereich", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Codes werden nur als Prüfsumme gespeichert, nie im Klartext — auch nicht in der Sicherungsdatei. " +
                "Vergisst du einen Code, kommst du an den Bereich nicht mehr heran. Es gibt keine Wiederherstellung."
        })
      ]),
      codeSetzen("appCode", "Code beim Öffnen der App"),
      codeSetzen("bereichCode", "Code für den geschützten Bereich"),
      UI.el("p.klein", {
        text: "Empfehlung: nur den Bereichs-Code setzen. Sonst tippst du ihn zwanzigmal am Tag, auch wenn du nur Wasser eintragen willst."
      }),
      UI.el("button.cta.leise", {
        type: "button", onclick: function () { location.hash = "#/mehr"; }
      }, "Zurück")
    ]));
  }

  function oeffnen(root) { wurzel = root; zeichne(); return Promise.resolve(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();


/* ==================== Reisemodus ==================== */
var AnsichtReise = (function () {
  "use strict";
  var wurzel = null;

  function zeichne() {
    if (!wurzel) return;
    var e = Store.einstellungen;
    var r = e.reise;
    function still() { Store.einstellungenSpeichern(); }

    var ortFeld = UI.el("input.aufgabenfeld.gross", {
      type: "text", value: r.ort || "", placeholder: "Wohin? z. B. Alicante",
      onchange: function () { r.ort = ortFeld.value; still(); }
    });
    var vonFeld = UI.el("input.feld", {
      type: "date", value: r.von || "",
      onchange: function () { r.von = vonFeld.value || null; still(); }
    });
    var bisFeld = UI.el("input.feld", {
      type: "date", value: r.bis || "",
      onchange: function () { r.bis = bisFeld.value || null; still(); }
    });

    var info = Modi.reiseInfo();

    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Reise", r.aktiv ? "aktiv" : "aus", ""));
    wurzel.appendChild(UI.el("div.inhalt", [

      UI.el("div.karte" + (r.aktiv ? ".held" : ""), [
        UI.el("span.etikett", { text: "Reisemodus" }),
        info ? UI.el("p.aurteil", { text: info.satz }) : null,
        UI.el("div.chips", [
          UI.el("button.chip" + (r.aktiv ? ".an" : ""), {
            type: "button",
            onclick: function () { r.aktiv = !r.aktiv; Store.einstellungenSpeichern().then(zeichne); }
          }, r.aktiv ? "Reisemodus ist an" : "Reisemodus einschalten")
        ])
      ].filter(Boolean)),

      UI.el("div.karte", [
        UI.el("span.etikett", { text: "Ziel und Zeitraum" }),
        ortFeld,
        UI.el("div.zeile", [UI.el("span.zt.dehnbar", { text: "Von" }), vonFeld]),
        UI.el("div.zeile", [UI.el("span.zt.dehnbar", { text: "Bis" }), bisFeld])
      ]),

      UI.el("div.karte", [
        UI.el("span.etikett", { text: "Was sich ändert" }),
        UI.el("div.gruppe.blank", [
          UI.zeile({ haken: true, text: "Gebete", wert: "Qaṣr und Jamʿ möglich" }),
          UI.zeile({ haken: true, text: "Serie", wert: "pausiert statt gebrochen" }),
          UI.zeile({ haken: true, text: "Sport", wert: "wird nicht eingefordert" }),
          UI.zeile({ haken: true, text: "Ernährung", wert: "wird nicht eingefordert" })
        ]),
        UI.el("p.klein", {
          text: "Die Erfassung der Gebete bleibt gleich — ob du gekürzt oder zusammengelegt hast, ist eine Frage des Fiqh, nicht der App. Mīzān wertet nur nicht ab, was auf Reisen anders ist."
        })
      ]),

      UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Gebetszeiten am Zielort: trag den Ort unter Mehr → Gebetszeiten ein, solange du dort bist. " +
                "Vergiss nicht, ihn danach zurückzustellen."
        })
      ]),

      UI.el("button.cta.leise", {
        type: "button", onclick: function () { location.hash = "#/mehr"; }
      }, "Zurück")
    ]));
  }

  function oeffnen(root) { wurzel = root; zeichne(); return Promise.resolve(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();
