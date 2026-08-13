/* Mīzān – Listen, Sperre und Reisemodus. */

/* ==================== Gewichtung ==================== */
var AnsichtListen = (function () {
  "use strict";
  var wurzel = null;

  function sichern() { return Store.einstellungenSpeichern().then(zeichne); }

  function liste(titel, arr, platzhalter, hinweis) {
    var eingabe = UI.el("input.aufgabenfeld", {
      type: "text", placeholder: platzhalter,
      onkeydown: function (ev) { if (ev.key === "Enter") dazu(); }
    });
    function dazu() {
      var t = eingabe.value.trim();
      if (!t) return;
      arr.push(t); eingabe.value = "";
      sichern();
    }
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: titel }),
      UI.el("div.gruppe", arr.map(function (x, i) {
        return UI.el("div.zeile", [
          UI.el("span.zt.dehnbar", { text: x }),
          UI.el("button.loeschen", {
            type: "button", onclick: function () { arr.splice(i, 1); sichern(); }
          }, "×")
        ]);
      }).concat([
        UI.el("div.zeile", [
          eingabe,
          UI.el("button.mini", { type: "button", onclick: dazu }, "+")
        ])
      ])),
      hinweis ? UI.el("p.klein", { text: hinweis }) : null
    ].filter(Boolean));
  }

  function zeichne() {
    if (!wurzel) return;
    var e = Store.einstellungen;
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Listen", "Was die App dir anbietet", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      liste("Trainingsarten", e.sport.arten, "Art hinzufügen …",
        "Erscheint beim Tagesabschluss, wenn du „Trainiert“ antippst."),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Bücher" }),
        UI.el("div.gruppe", [
          UI.el("div.zeile.tippbar.hinzu", {
            onclick: function () { location.hash = "#/quran"; }
          }, [
            UI.el("span.zt.dehnbar", {
              text: UI.plural((e.buecher || []).length, "Buch", "Bücher") + " · anlegen und eintragen"
            }),
            UI.el("span.bpfeil.klein", { text: "›" })
          ])
        ]),
        UI.el("p.klein", {
          text: "Titel, Gesamtumfang und die Seiten eines Tages trägst du unter Qur'an → Bücher ein."
        })
      ]),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Arbeitstage" }),
        UI.el("div.gruppe", [0, 1, 2, 3, 4, 5, 6].map(function (wt) {
          var an = (e.arbeitstage || []).indexOf(wt) >= 0;
          return UI.zeile({
            haken: an, text: UI.WOCHENTAGE[wt],
            onclick: function () {
              if (!e.arbeitstage) e.arbeitstage = [];
              var i = e.arbeitstage.indexOf(wt);
              if (i >= 0) e.arbeitstage.splice(i, 1); else e.arbeitstage.push(wt);
              e.arbeitstage.sort();
              sichern();
            }
          });
        })),
        UI.el("p.klein", { text: "Nur als Markierung im Kalender — nichts wird dazu erfasst." })
      ]),

      UI.el("button.cta.leise", {
        type: "button",
        onclick: function () { if (history.length > 1) history.back(); else location.hash = "#/mehr"; }
      }, "Zurück")
    ]));
  }

  function oeffnen(root) { wurzel = root; zeichne(); return Promise.resolve(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();


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
    wurzel.appendChild(UI.kopf("Sperre", "Codes für App und Journal", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Codes werden nur als Prüfsumme gespeichert, nie im Klartext — auch nicht in der Sicherungsdatei. " +
                "Vergisst du einen Code, kommst du an das Journal nicht mehr heran. Es gibt keine Wiederherstellung."
        })
      ]),
      codeSetzen("appCode", "Code beim Öffnen der App"),
      codeSetzen("bereichCode", "Code fürs Journal"),
      UI.el("p.klein", {
        text: "Empfehlung: nur den Journal-Code setzen. Sonst tippst du ihn jedes Mal, auch wenn du nur ein Gebet eintragen willst."
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
