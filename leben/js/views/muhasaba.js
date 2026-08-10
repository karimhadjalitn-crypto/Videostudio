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
      },
      fertig: function () {
        return Gebetszeiten.PFLICHT.every(function (k) { return !!tag.gebete[k]; });
      }
    };
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
        return UI.el("div.fragen", opt.map(function (o) {
          var an = tag.akhlaq[frage.k] === o.w;
          return UI.el("button.fbtn" + (an ? ".an" : ""), {
            type: "button",
            onclick: function () { tag.akhlaq[frage.k] = o.w; speichern().then(weiter); }
          }, o.t);
        }));
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
          feld("gescrollt", "Gescrollt", "TikTok, Instagram")
        ]);
      },
      fertig: function () {
        return tag.bildschirm.gearbeitet != null || tag.bildschirm.gescrollt != null;
      }
    };
  }

  function schrittStimmung() {
    return {
      titel: "Stimmung",
      unter: "Wie war der Tag in dir?",
      bauen: function () {
        var stufen = ["Sehr schlecht", "Schlecht", "Geht so", "Gut", "Sehr gut"];
        return UI.el("div.fragen", stufen.map(function (t, i) {
          var an = tag.stimmung === i + 1;
          return UI.el("button.fbtn" + (an ? ".an" : ""), {
            type: "button",
            onclick: function () { tag.stimmung = i + 1; speichern().then(weiter); }
          }, t);
        }));
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
    s.push(schrittBildschirm());
    s.push(schrittStimmung());
    s.push(schrittNotiz());
    s.push(schrittAbschluss());
    return s;
  }

  function zeichne() {
    if (!wurzel) return;
    var sch = schritte[index];
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Muḥāsaba", "Schritt " + (index + 1) + " von " + schritte.length, "المحاسبة"));
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
      zeiten = Gebetszeiten.fuer(new Date());
      schritte = bauenSchritte();
      index = 0;
      zeichne();
    });
  }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
