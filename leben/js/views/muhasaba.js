/* Mīzān – Abendabrechnung (Muḥāsaba).
   Geführt, eine Sache pro Bildschirm, unter 60 Sekunden. */
var AnsichtMuhasaba = (function () {
  "use strict";

  var AKHLAQ = [
    { k: "zorn",       f: "Hast du deinen Zorn beherrscht?" },
    { k: "barmherzig", f: "Warst du barmherzig und nachsichtig?" },
    { k: "grosszuegig",f: "Warst du großzügig — mit Geld, Zeit oder Hilfe?" },
    { k: "verletzt",   f: "Hast du niemanden beleidigt oder verletzt?" },
    { k: "ghiba",      f: "Hast du über niemanden gelästert?" },
    { k: "wahrheit",   f: "Hast du die Wahrheit gesagt?" },
    { k: "blick",      f: "Hast du deinen Blick gesenkt?" },
    { k: "geduld",     f: "Hattest du Geduld, als es unangenehm wurde?" }
  ];

  var tag = null, tage = [], zeiten = null, wurzel = null;
  var schritte = [], index = 0;
  var notizOffen = {};

  /* Freies Feld zu jeder Frage. Ist es offen, springt die App nach der
     Antwort nicht weiter — sonst könntest du nichts dazuschreiben. */
  function notizFeld(schluessel) {
    var hatText = !!(tag.notizen[schluessel] || "").trim();
    if (!notizOffen[schluessel] && !hatText) {
      return UI.el("button.notizlink", {
        type: "button",
        onclick: function () { notizOffen[schluessel] = true; zeichne(); }
      }, "＋  Etwas dazu schreiben");
    }
    var ta = UI.el("textarea.notizfeld.klein", {
      rows: 3, placeholder: "Deine Ergänzung …",
      oninput: function () { tag.notizen[schluessel] = ta.value; },
      onblur: function () { speichern(); }
    });
    ta.value = tag.notizen[schluessel] || "";
    return UI.el("div.notizraum", [
      UI.el("div.notizkopf", { text: "Deine Ergänzung" }),
      ta
    ]);
  }

  function notizIstOffen(schluessel) {
    return !!notizOffen[schluessel] || !!(tag.notizen[schluessel] || "").trim();
  }

  /* Drei Fragen, die täglich wechseln */
  function fragenFuerHeute(datum) {
    var d = Store.ausKey(datum);
    var n = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    var start = (n * 3) % AKHLAQ.length;
    return [0, 1, 2].map(function (i) { return AKHLAQ[(start + i) % AKHLAQ.length]; });
  }

  function speichern() {
    tag.score = Score.fuer(tag).wert;
    return Store.tagSpeichern(tag);
  }

  function weiter() {
    speichern().then(function () {
      if (index < schritte.length - 1) { index++; zeichne(); }
    });
  }
  function zurueck() { if (index > 0) { index--; zeichne(); } }

  /* ---------- Schritte ---------- */
  function schrittGebete() {
    return {
      titel: "Die fünf Gebete",
      unter: "Trag nach, was noch fehlt.",
      bauen: function () {
        return UI.el("div", [gebetsListe(), notizFeld("gebete")]);
      },
      fertig: function () {
        return Gebetszeiten.PFLICHT.every(function (k) { return !!tag.gebete[k]; });
      }
    };
  }

  function gebetsListe() {
    return UI.el("div.gruppe", Gebetszeiten.PFLICHT.map(function (k) {
          return UI.el("div.mzeile", [
            UI.el("div.mkopf", [
              UI.el("span.zt", { text: Gebetszeiten.NAMEN[k].de }),
              UI.el("span.ar", { text: Gebetszeiten.NAMEN[k].ar }),
              UI.el("span.zw", { text: Gebetszeiten.uhr(zeiten[k]) })
            ]),
            UI.el("div.stufen", Score.GEBETSSTUFEN.map(function (s) {
              var an = tag.gebete[k] === s.key;
              return UI.el("button.stufe.f-" + s.farbe + (an ? ".an" : ""), {
                type: "button", title: s.lang,
                onclick: function () { tag.gebete[k] = an ? null : s.key; speichern().then(zeichne); }
              }, s.kurz);
            }))
          ]);
    }));
  }

  function schrittAkhlaq(frage) {
    return {
      titel: "Akhlāq",
      unter: null,
      grossefrage: frage.f,
      bauen: function () {
        var opt = [
          { w: "ja", t: "Ja, alḥamdulillāh" },
          { w: "teils", t: "Teils — es war knapp" },
          { w: "nein", t: "Nein" }
        ];
        return UI.el("div", [
          UI.el("div.fragen", opt.map(function (o) {
            var an = tag.akhlaq[frage.k] === o.w;
            return UI.el("button.fbtn" + (an ? ".an" : ""), {
              type: "button",
              onclick: function () {
                tag.akhlaq[frage.k] = o.w;
                speichern().then(notizIstOffen(frage.k) ? zeichne : weiter);
              }
            }, o.t);
          })),
          notizFeld(frage.k)
        ]);
      },
      fertig: function () { return !!tag.akhlaq[frage.k]; }
    };
  }

  function schrittBildschirm() {
    return {
      titel: "Bildschirmzeit",
      unter: "Getrennt: gearbeitet zählt positiv, gescrollt zählt gegen dich.",
      bauen: function () {
        function feld(pfad, label, hinweis) {
          var wert = tag.bildschirm[pfad];
          return UI.el("div.zeitfeld", [
            UI.el("div.zflabel", [UI.el("b", { text: label }), UI.el("span", { text: hinweis })]),
            UI.el("div.zfwert", { text: wert == null ? "—" : wert + " Min" }),
            UI.el("div.zfknoepfe", [15, 30, 60, -15].map(function (n) {
              return UI.el("button.mini", {
                type: "button",
                onclick: function () {
                  var v = (tag.bildschirm[pfad] || 0) + n;
                  tag.bildschirm[pfad] = Math.max(0, v);
                  speichern().then(zeichne);
                }
              }, (n > 0 ? "+" : "") + n);
            }).concat([
              UI.el("button.mini.null", {
                type: "button",
                onclick: function () { tag.bildschirm[pfad] = 0; speichern().then(zeichne); }
              }, "0")
            ]))
          ]);
        }
        return UI.el("div", [
          feld("gearbeitet", "TikTok gearbeitet", "Videos, Recherche, Skripte"),
          feld("gescrollt", "Gescrollt", "TikTok, Instagram"),
          notizFeld("bildschirm")
        ]);
      },
      fertig: function () {
        return tag.bildschirm.gearbeitet != null || tag.bildschirm.gescrollt != null;
      }
    };
  }

  /* Mehrere kleine Dinge auf einem Bildschirm — sonst wird die
     Abrechnung länger als die Minute, die sie dauern soll. */
  function schrittSchnellcheck() {
    return {
      titel: "Kurz durchgehen",
      unter: "Antippen, was heute war.",
      bauen: function () {
        var e = Store.einstellungen;
        var arten = (tag.training && tag.training.arten) || [];

        var trainingChips = UI.el("div.chips.umbruch", e.sport.arten.map(function (a) {
          var an = arten.indexOf(a) >= 0;
          return UI.el("button.chip" + (an ? ".an" : ""), {
            type: "button",
            onclick: function () {
              tag.training.arten = an
                ? arten.filter(function (x) { return x !== a; })
                : arten.concat([a]);
              speichern().then(zeichne);
            }
          }, a);
        }));

        var kontaktChips = UI.el("div.chips.umbruch", (e.kontakte || []).map(function (k) {
          var an = !!(tag.kontakte && tag.kontakte[k.name]);
          return UI.el("button.chip" + (an ? ".an" : ""), {
            type: "button",
            onclick: function () {
              if (!tag.kontakte) tag.kontakte = {};
              tag.kontakte[k.name] = !an;
              speichern().then(zeichne);
            }
          }, k.name);
        }));

        var bettFeld = UI.el("input.feld.zeit", {
          type: "time", value: tag.schlaf.bett || "",
          onchange: function () { tag.schlaf.bett = bettFeld.value || null; speichern(); }
        });

        return UI.el("div", [
          UI.el("div.unterkopf", { text: "Trainiert?" }), trainingChips,
          UI.el("div.unterkopf", { text: "Wen hast du erreicht?" }), kontaktChips,
          UI.el("div.unterkopf", { text: "Wann gehst du ins Bett?" }),
          UI.el("div.zeitreihe", [
            bettFeld,
            UI.el("button.mini", {
              type: "button",
              onclick: function () {
                var d = new Date();
                tag.schlaf.bett = String(d.getHours()).padStart(2, "0") + ":" +
                                  String(d.getMinutes()).padStart(2, "0");
                speichern().then(zeichne);
              }
            }, "Jetzt")
          ]),
          notizFeld("schnellcheck")
        ]);
      },
      fertig: function () {
        return !!(tag.schlaf.bett || (tag.training && tag.training.arten.length));
      }
    };
  }

  function schrittDankbar() {
    return {
      titel: "Dankbarkeit",
      grossefrage: "Wofür bist du heute dankbar?",
      unter: null,
      bauen: function () {
        var liste = tag.dankbar || [];
        var eingabe = UI.el("input.aufgabenfeld.gross", {
          type: "text", placeholder: "Eine Sache genügt …",
          onkeydown: function (ev) { if (ev.key === "Enter") dazu(); }
        });
        function dazu() {
          var t = eingabe.value.trim();
          if (!t) return;
          tag.dankbar = liste.concat([t]);
          eingabe.value = "";
          speichern().then(zeichne);
        }
        return UI.el("div", [
          UI.el("div.zeitreihe", [eingabe, UI.el("button.mini", { type: "button", onclick: dazu }, "+")]),
          liste.length ? UI.el("div.gruppe.blank", liste.map(function (t, i) {
            return UI.el("div.zeile", [
              UI.el("span.zt.dehnbar", { text: "· " + t }),
              UI.el("button.loeschen", {
                type: "button",
                onclick: function () { tag.dankbar.splice(i, 1); speichern().then(zeichne); }
              }, "×")
            ]);
          })) : null
        ].filter(Boolean));
      },
      fertig: function () { return (tag.dankbar || []).length > 0; }
    };
  }

  function schrittStimmung() {
    return {
      titel: "Stimmung",
      unter: "Wie war der Tag in dir?",
      bauen: function () {
        var stufen = ["Sehr schlecht", "Schlecht", "Geht so", "Gut", "Sehr gut"];
        return UI.el("div", [
          UI.el("div.fragen", stufen.map(function (t, i) {
            var an = tag.stimmung === i + 1;
            return UI.el("button.fbtn" + (an ? ".an" : ""), {
              type: "button",
              onclick: function () {
                tag.stimmung = i + 1;
                speichern().then(notizIstOffen("stimmung") ? zeichne : weiter);
              }
            }, t);
          })),
          notizFeld("stimmung")
        ]);
      },
      fertig: function () { return !!tag.stimmung; }
    };
  }

  function schrittNotiz() {
    return {
      titel: "Ein Satz",
      unter: "Freiwillig. Was war heute wichtig?",
      bauen: function () {
        var ta = UI.el("textarea.notizfeld", {
          rows: 4, placeholder: "…",
          oninput: function () { tag.notiz = ta.value; }
        });
        ta.value = tag.notiz || "";
        return ta;
      },
      fertig: function () { return true; }
    };
  }

  function schrittAbschluss() {
    return {
      titel: "Abschluss",
      unter: null,
      bauen: function () {
        var s = Score.fuer(tag, { jetzt: new Date(), schliessen: true });
        var a = Assistent.abschluss(tag, s.wert, tage);

        // Was du heute dazugeschrieben hast, bleibt sichtbar
        var beschriftung = {
          gebete: "Zu den Gebeten", stimmung: "Zur Stimmung",
          bildschirm: "Zur Bildschirmzeit"
        };
        AKHLAQ.forEach(function (f) { beschriftung[f.k] = f.f; });
        var meine = Object.keys(tag.notizen || {}).filter(function (k) {
          return (tag.notizen[k] || "").trim();
        });

        return UI.el("div", [
          UI.el("div.abschluss", [
            UI.ring(s.wert / 100, s.wert, 96),
            UI.el("div.at", { text: "Tagesscore" })
          ]),
          UI.el("div.karte", [
            UI.el("span.etikett", { text: "Wie der Tag war" }),
            UI.el("p.aurteil", { text: a.urteil })
          ]),
          UI.el("div.karte.held", [
            UI.el("span.etikett", { text: "Eine Sache für morgen" }),
            UI.el("p.aurteil", { text: a.morgen })
          ]),
          meine.length ? UI.el("div.karte", [
            UI.el("span.etikett", { text: "Was du dazugeschrieben hast" }),
            UI.el("div.meinenotizen", meine.map(function (k) {
              return UI.el("div.mn", [
                UI.el("div.mnk", { text: beschriftung[k] || k }),
                UI.el("div.mnt", { text: tag.notizen[k] })
              ]);
            }))
          ]) : null,
          UI.el("button.cta", {
            type: "button",
            onclick: function () {
              tag.muhasaba = true;
              tag.score = Score.fuer(tag, { schliessen: true }).wert;
              Store.tagSpeichern(tag).then(function () {
                UI.meldung("Abgerechnet. Tagesscore " + tag.score + ".");
                location.hash = "#/heute";
              });
            }
          }, "Tag abschließen")
        ]);
      },
      fertig: function () { return true; }
    };
  }

  function bauenSchritte() {
    var s = [schrittGebete()];
    fragenFuerHeute(tag.datum).forEach(function (f) { s.push(schrittAkhlaq(f)); });
    s.push(schrittSchnellcheck());
    s.push(schrittBildschirm());
    s.push(schrittStimmung());
    s.push(schrittDankbar());
    s.push(schrittNotiz());
    s.push(schrittAbschluss());
    return s;
  }

  function zeichne() {
    if (!wurzel) return;
    var sch = schritte[index];
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Muḥāsaba",
      "Schritt " + (index + 1) + " von " + schritte.length +
      (Store.istHeute() ? "" : "  ·  " + UI.datumLang(Store.ausKey(tag.datum))),
      "المحاسبة"));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.el("div.punkteleiste", schritte.map(function (_, i) {
        return UI.el("i" + (i <= index ? ".an" : ""));
      })),
      UI.el("div.karte.schritt", [
        UI.el("span.etikett", { text: sch.titel }),
        sch.grossefrage ? UI.el("div.grossefrage", { text: sch.grossefrage }) : null,
        sch.unter ? UI.el("p.unter", { text: sch.unter }) : null,
        sch.bauen()
      ].filter(Boolean)),
      index < schritte.length - 1
        ? UI.el("div.navi", [
            index > 0 ? UI.el("button.zurueck", { type: "button", onclick: zurueck }, "Zurück") : UI.el("span"),
            UI.el("button.cta.schmal" + (sch.fertig() ? "" : ".leise"),
              { type: "button", onclick: weiter },
              sch.fertig() ? "Weiter" : "Überspringen")
          ])
        : null
    ].filter(Boolean)));
  }

  function oeffnen(root) {
    wurzel = root;
    return Promise.all([Store.tag(), Store.letzteTage(30)]).then(function (r) {
      tag = r[0];
      tage = r[1];
      zeiten = Gebetszeiten.fuer(Store.ausKey(tag.datum));
      schritte = bauenSchritte();
      index = 0;
      notizOffen = {};
      zeichne();
    });
  }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
