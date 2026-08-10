/* Mīzān – Körper & Sport, Ernährung, Schlaf. */

/* ==================== Körper & Sport ==================== */
var AnsichtKoerper = (function () {
  "use strict";
  var wurzel = null, tag = null, tage = [];

  function speichern() {
    tag.score = Score.fuer(tag).wert;
    return Store.tagSpeichern(tag).then(zeichne);
  }
  function wocheTrainings() { return Score.trainingsDieseWoche(tag); }
  function woche() { return Store.fensterBis(tag.datum, 7, tag); }

  function trainingKarte() {
    var e = Store.einstellungen;
    var arten = (tag.training && tag.training.arten) || [];
    return UI.el("div.karte" + (arten.length ? ".held" : ""), [
      UI.el("span.etikett", { text: UI.tagWort() + " trainiert" }),
      UI.el("div.chips", e.sport.arten.map(function (a) {
        var an = arten.indexOf(a) >= 0;
        return UI.el("button.chip" + (an ? ".an" : ""), {
          type: "button",
          onclick: function () {
            if (an) tag.training.arten = arten.filter(function (x) { return x !== a; });
            else tag.training.arten = arten.concat([a]);
            speichern();
          }
        }, a);
      })),
      arten.length ? UI.el("div.chips", { style: "margin-top:.45rem" }, e.sport.orte.map(function (o) {
        var an = tag.training.ort === o;
        return UI.el("button.chip" + (an ? ".an" : ""), {
          type: "button",
          onclick: function () { tag.training.ort = an ? null : o; speichern(); }
        }, o);
      })) : null,
      arten.indexOf("Calisthenics") >= 0 ? UI.el("p.klein", {
        text: "Dein Zirkel: Klimmzüge · Dips · Australian Pull-ups · Liegestütze"
      }) : null
    ].filter(Boolean));
  }

  function wocheKarte() {
    var e = Store.einstellungen;
    var n = wocheTrainings();
    var ziel = e.sport.wochenziel;
    var alle = woche();
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Diese Woche" }),
      UI.el("div.gebetzeile", [
        UI.el("span.gname.klein", { text: n + " von " + ziel }),
        UI.el("span.gzeit", { text: n >= ziel ? "Ziel erreicht" : (ziel - n) + " noch offen" })
      ]),
      UI.balken(n / ziel),
      UI.el("div.streifen", alle.map(function (t) {
        var d = Store.ausKey(t.datum);
        var hat = t.training && (t.training.arten || []).length;
        return UI.el("div.tagsaeule", [
          UI.el("div.saeule", [UI.el("i" + (hat ? ".f-jade" : ""), { style: "height:1.6rem" })]),
          UI.el("span.tagname", { text: UI.WOCHENTAGE[d.getDay()].slice(0, 2) })
        ]);
      }))
    ]);
  }

  function gewichtKarte() {
    var e = Store.einstellungen;
    var ziel = e.sport.gewichtZiel;
    var mitGewicht = tage.filter(function (t) { return t.gewicht; });
    var letztes = tag.gewicht || (mitGewicht.length ? mitGewicht[mitGewicht.length - 1].gewicht : null);
    var erstes = mitGewicht.length ? mitGewicht[0].gewicht : null;

    var trend = null;
    if (erstes && letztes && mitGewicht.length >= 3) {
      var tageSpanne = Math.max(1,
        (Store.ausKey(mitGewicht[mitGewicht.length - 1].datum) - Store.ausKey(mitGewicht[0].datum)) / 86400000);
      var proWoche = (letztes - erstes) / tageSpanne * 7;
      if (Math.abs(proWoche) > 0.05) {
        var bisZiel = letztes - ziel.bis;
        if (bisZiel > 0 && proWoche < 0) {
          var wochen = Math.ceil(bisZiel / Math.abs(proWoche));
          var wann = new Date(Date.now() + wochen * 7 * 86400000);
          trend = UI.zahl(Math.abs(proWoche), 2).replace(".", ",") + " kg pro Woche → " +
                  ziel.bis + " kg etwa im " + UI.MONATE[wann.getMonth()] + " " + wann.getFullYear();
        } else if (proWoche > 0) {
          trend = "Aktuell geht es nach oben: +" + UI.zahl(proWoche, 2).replace(".", ",") + " kg pro Woche.";
        }
      }
    }

    var anzeige = UI.el("div.zfwert", {
      text: letztes ? UI.zahl(letztes, 1).replace(".", ",") + " kg" : "— kg"
    });

    function setz(n) {
      var basis = tag.gewicht || letztes || ziel.bis;
      tag.gewicht = Math.round((basis + n) * 10) / 10;
      anzeige.textContent = UI.zahl(tag.gewicht, 1).replace(".", ",") + " kg";
      Store.tagSpeichern(tag);
    }

    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Gewicht · Ziel " + ziel.von + "–" + ziel.bis + " kg" }),
      anzeige,
      UI.el("div.zfknoepfe", [-1, -0.5, -0.1, 0.1, 0.5, 1].map(function (n) {
        return UI.el("button.mini", { type: "button", onclick: function () { setz(n); } },
          (n > 0 ? "+" : "") + UI.zahl(n, n % 1 === 0 ? 0 : 1).replace(".", ","));
      })),
      letztes ? UI.balken(Math.max(0, Math.min(1, (85 - letztes) / (85 - ziel.bis)))) : null,
      trend ? UI.el("p.klein", { text: trend }) : UI.el("p.klein", {
        text: "Ab drei Messungen rechnet dir Mīzān aus, wann du bei " + ziel.bis + " kg bist."
      })
    ].filter(Boolean));
  }

  function schritteKarte() {
    if (!tag.schritte) {
      return UI.el("div.karte.hinweis", [
        UI.el("div.hz", { text: "Schritte kommen über den iOS-Kurzbefehl aus Apple Health. Einrichtung unter Kalender → Erinnerungen." })
      ]);
    }
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Schritte " + UI.tagWortKlein() }),
      UI.el("div.zfwert", { text: UI.zahl(tag.schritte) }),
      UI.balken(tag.schritte / 10000)
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Körper", UI.plural(wocheTrainings(), "Training", "Trainings") + " diese Woche", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(laden),
      trainingKarte(), wocheKarte(), gewichtKarte(), schritteKarte(),
      Eigene.block("koerper", tag, laden)
    ].filter(Boolean)));
  }

  function laden() {
    return Promise.all([Store.tag(), Store.letzteTage(90)]).then(function (r) {
      tag = r[0];
      tage = r[1].filter(function (t) { return t.datum !== tag.datum; });
      zeichne();
    });
  }
  function oeffnen(root) { wurzel = root; return laden(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();


/* ==================== Ernährung ==================== */
var AnsichtErnaehrung = (function () {
  "use strict";
  var wurzel = null, tag = null, tage = [];

  function speichern(neu) {
    tag.score = Score.fuer(tag).wert;
    return Store.tagSpeichern(tag).then(function () { if (neu !== false) zeichne(); });
  }

  function wasserKarte() {
    var ziel = Store.einstellungen.wasserZiel;
    var anzeige = UI.el("div.zfwert");
    var balken = UI.balken(0);
    function auffrischen() {
      anzeige.textContent = UI.zahl(tag.wasser || 0, 2).replace(".", ",") + " / " +
                            UI.zahl(ziel, 1).replace(".", ",") + " l";
      balken.firstChild.style.width = Math.min(100, (tag.wasser || 0) / ziel * 100) + "%";
    }
    function dazu(n) {
      tag.wasser = Math.max(0, Math.round(((tag.wasser || 0) + n) * 100) / 100);
      auffrischen();
      speichern(false);
    }
    auffrischen();
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Wasser" }),
      anzeige, balken,
      UI.el("button.tippflaeche", { type: "button", onclick: function () { dazu(0.25); } },
        "+ 0,25 l  ·  ein Glas"),
      UI.el("div.zfknoepfe", [
        UI.el("button.mini", { type: "button", onclick: function () { dazu(0.5); } }, "+0,5 l"),
        UI.el("button.mini", { type: "button", onclick: function () { dazu(1); } }, "+1 l"),
        UI.el("button.mini", { type: "button", onclick: function () { dazu(-0.25); } }, "−0,25"),
        UI.el("button.mini.null", {
          type: "button", onclick: function () { tag.wasser = 0; speichern(); }
        }, "0")
      ])
    ]);
  }

  function suessKarte() {
    var e = Store.einstellungen;
    var ausnahmen = Store.fensterBis(tag.datum, 7, tag).filter(function (t) {
      return t.essen && (t.essen.suess === "wenig" || t.essen.suess === "viel");
    }).length;
    var erlaubt = e.essen.suessAusnahmen;

    var stufen = [
      { k: "keine", t: "Keine" },
      { k: "wenig", t: "Wenig — eine Ausnahme" },
      { k: "viel", t: "Zu viel" }
    ];
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Süßigkeiten " + UI.tagWortKlein() }),
      UI.el("div.fragen", { style: "margin-top:.6rem" }, stufen.map(function (s) {
        var an = tag.essen.suess === s.k;
        return UI.el("button.fbtn" + (an ? ".an" : ""), {
          type: "button",
          onclick: function () { tag.essen.suess = an ? null : s.k; speichern(); }
        }, s.t);
      })),
      UI.el("p.klein", {
        text: ausnahmen <= erlaubt
          ? ausnahmen + " von " + erlaubt + " Ausnahmen diese Woche verbraucht. „Hier und da ist okay.“"
          : ausnahmen + " Ausnahmen diese Woche — erlaubt waren " + erlaubt + ". Ab jetzt zählt es gegen dich."
      })
    ]);
  }

  function regelnBlock() {
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Regeln" }),
      UI.el("div.gruppe", [
        UI.zeile({
          haken: tag.essen.nichtUeberessen, text: "Nicht überessen", wert: "Sunnah-Maß",
          onclick: function () { tag.essen.nichtUeberessen = !tag.essen.nichtUeberessen; speichern(); }
        }),
        UI.zeile({
          haken: tag.essen.protein, text: "Protein genommen",
          onclick: function () { tag.essen.protein = !tag.essen.protein; speichern(); }
        })
      ])
    ]);
  }

  function supplementeBlock() {
    var liste = Store.einstellungen.essen.supplemente || [];
    var genommen = liste.filter(function (n) { return tag.essen.supplemente[n]; }).length;
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Supplemente · " + genommen + " von " + liste.length }),
      UI.el("div.gruppe", liste.map(function (n) {
        return UI.zeile({
          haken: !!tag.essen.supplemente[n], text: n,
          wert: n === "Kreatin" ? "täglich" : null,
          onclick: function () {
            tag.essen.supplemente[n] = !tag.essen.supplemente[n];
            speichern();
          }
        });
      }))
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Ernährung", "Regeln statt Kalorien", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(laden),
      wasserKarte(), suessKarte(), regelnBlock(), supplementeBlock(),
      Eigene.block("ernaehrung", tag, laden),
      UI.el("p.klein", {
        text: "Kein Kalorienzählen, kein Essenstagebuch, kein Intervallfasten — so wolltest du es."
      })
    ].filter(Boolean)));
  }

  function laden() {
    return Promise.all([Store.tag(), Store.letzteTage(14)]).then(function (r) {
      tag = r[0];
      tage = r[1].filter(function (t) { return t.datum !== tag.datum; });
      zeichne();
    });
  }
  function oeffnen(root) { wurzel = root; return laden(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();


/* ==================== Schlaf ==================== */
var AnsichtSchlaf = (function () {
  "use strict";
  var wurzel = null, tag = null, tage = [];

  function speichern() {
    tag.score = Score.fuer(tag).wert;
    return Store.tagSpeichern(tag).then(zeichne);
  }
  function jetztUhr() {
    var d = new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function zeitKarte(schluessel, titel, hinweis) {
    var wert = tag.schlaf[schluessel];
    var eingabe = UI.el("input.feld.zeit", {
      type: "time", value: wert || "",
      onchange: function () { tag.schlaf[schluessel] = eingabe.value || null; speichern(); }
    });
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: titel }),
      UI.el("div.zeitreihe", [
        eingabe,
        UI.el("button.mini", {
          type: "button",
          onclick: function () { tag.schlaf[schluessel] = jetztUhr(); speichern(); }
        }, "Jetzt")
      ]),
      hinweis ? UI.el("p.klein", { text: hinweis }) : null
    ].filter(Boolean));
  }

  function sommerHinweis() {
    var d = Store.ausKey(tag.datum);
    var z = Gebetszeiten.fuer(d);
    var isha = z.isha;
    var fajr = Gebetszeiten.fuer(new Date(d.getTime() + 86400000)).fajr;
    var nachtMin = Math.round((fajr - isha) / 60000);
    if (nachtMin > 300) return null;    // nur wenn es wirklich eng wird
    var std = Math.floor(nachtMin / 60), min = nachtMin % 60;
    return UI.el("div.karte.hinweis", [
      UI.el("div.hz", {
        text: "Zwischen ʿIshā' (" + Gebetszeiten.uhr(isha) + ") und Fajr (" +
              Gebetszeiten.uhr(fajr) + ") liegen nur " + std + " Std " + min + " Min. " +
              "Auf 48° Nord ist das im Hochsommer normal — plan den zweiten Block danach ein."
      })
    ]);
  }

  function verlaufKarte() {
    var alle = Store.fensterBis(tag.datum, 14, tag).filter(function (t) {
      return t.schlaf && t.schlaf.bett;
    });
    var vorMitternacht = alle.filter(function (t) {
      if (!t.schlaf || !t.schlaf.bett) return false;
      var h = +t.schlaf.bett.split(":")[0];
      return h >= 20 && h < 24;
    }).length;
    var mitDaten = alle.filter(function (t) { return t.schlaf && t.schlaf.bett; }).length;
    var fajrAuf = alle.filter(function (t) { return t.schlaf && t.schlaf.fajrAuf; }).length;

    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Letzte zwei Wochen" }),
      UI.el("div.verteilung", [
        UI.el("div.vz", [
          UI.el("span.vt", { text: "Vor 0 Uhr im Bett" }),
          UI.el("div.vbalken", [UI.el("i.f-jade", { style: "width:" + (mitDaten ? vorMitternacht / mitDaten * 100 : 0) + "%" })]),
          UI.el("span.vw", { text: vorMitternacht + "/" + mitDaten })
        ]),
        UI.el("div.vz", [
          UI.el("span.vt", { text: "Für Fajr aufgestanden" }),
          UI.el("div.vbalken", [UI.el("i.f-jade-dim", { style: "width:" + (mitDaten ? fajrAuf / mitDaten * 100 : 0) + "%" })]),
          UI.el("span.vw", { text: fajrAuf + "/" + mitDaten })
        ])
      ])
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    var e = Store.einstellungen;
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Schlaf", "Ziel: vor " + e.schlafZiel + " im Bett", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(laden),
      zeitKarte("bett", "Zu Bett gegangen", "Dein Ziel ist vor 0 Uhr."),
      UI.el("div.karte" + (tag.schlaf.fajrAuf ? ".held" : ""), [
        UI.el("span.etikett", { text: "Geteilter Schlaf" }),
        UI.el("p.aurteil", { text: "Bist du für Fajr aufgestanden und danach nochmal eingeschlafen?" }),
        UI.el("div.chips", [
          UI.el("button.chip" + (tag.schlaf.fajrAuf ? ".an" : ""), {
            type: "button",
            onclick: function () { tag.schlaf.fajrAuf = !tag.schlaf.fajrAuf; speichern(); }
          }, tag.schlaf.fajrAuf ? "Ja, für Fajr auf" : "Für Fajr aufgestanden")
        ]),
        UI.el("p.klein", {
          text: "Mīzān zählt das als zwei Blöcke, nicht als kurze Nacht. Genau das rechnen andere Schlaf-Apps gegen dich."
        })
      ]),
      zeitKarte("auf", "Endgültig aufgestanden"),
      sommerHinweis(),
      verlaufKarte(),
      Eigene.block("schlaf", tag, laden)
    ].filter(Boolean)));
  }

  function laden() {
    return Promise.all([Store.tag(), Store.letzteTage(21)]).then(function (r) {
      tag = r[0];
      tage = r[1].filter(function (t) { return t.datum !== tag.datum; });
      zeichne();
    });
  }
  function oeffnen(root) { wurzel = root; return laden(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();
