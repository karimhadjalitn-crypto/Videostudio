/* Mīzān – Spiegel. Wochen, Monate, Jahre. Muster. Zusammenhänge. */
var AnsichtSpiegel = (function () {
  "use strict";

  var wurzel = null, tage = [], zeitraum = 42, bereichWahl = "score";

  function mittel(liste) {
    var m = liste.filter(function (x) { return typeof x === "number"; });
    if (!m.length) return null;
    return m.reduce(function (a, b) { return a + b; }, 0) / m.length;
  }
  function schnittScore(liste) { return mittel(liste.map(function (t) { return t.score; })); }

  function stufe(s) {
    if (s == null) return "";
    if (s >= 80) return ".s4";
    if (s >= 60) return ".s3";
    if (s >= 40) return ".s2";
    return ".s1";
  }

  /* ---------- Kopfzahlen ---------- */
  function schnittKarte() {
    var s7 = schnittScore(tage.slice(-7));
    var s30 = schnittScore(tage.slice(-30));
    var diff = (s7 != null && s30 != null) ? Math.round(s7) - Math.round(s30) : null;
    return UI.el("div.karte.scorekarte", [
      UI.ring(s7 == null ? 0 : s7 / 100, s7 == null ? "–" : Math.round(s7)),
      UI.el("div.smeta", [
        UI.el("div.st", { text: "Schnitt der Woche" }),
        UI.el("div.ss", diff == null
          ? [UI.el("span", { text: "noch zu wenig Daten" })]
          : [
              UI.el("span" + (diff >= 0 ? ".hoch" : ".tief"), { text: (diff >= 0 ? "▲ " : "▼ ") + Math.abs(diff) }),
              UI.el("span", { text: " gegenüber dem Monat (" + Math.round(s30) + ")" })
            ])
      ])
    ]);
  }

  /* ---------- Streak ---------- */
  function streakKarte() {
    /* Regel aus dem Konzept: Ein gerissener Tag setzt nicht auf null,
       sondern drei Tage zurück. Zwei hintereinander setzen zurück.
       Reisetage pausieren. */
    var sortiert = tage.slice().sort(function (a, b) { return a.datum < b.datum ? -1 : 1; });
    var serie = 0, letzterRiss = false, laengste = 0;
    sortiert.forEach(function (t) {
      if (t.reise) return;                            // pausiert
      var gut = typeof t.score === "number" && t.score >= 50;
      if (gut) { serie++; letzterRiss = false; }
      else if (!letzterRiss) { serie = Math.max(0, serie - 3); letzterRiss = true; }
      else { serie = 0; }
      laengste = Math.max(laengste, serie);
    });
    var monat = schnittScore(sortiert.slice(-30));
    return UI.el("div.karte" + (serie >= 7 ? ".held" : ""), [
      UI.el("span.etikett", { text: "Serie" }),
      UI.el("div.gebetzeile", [
        UI.el("span.gname", { text: serie + (serie === 1 ? " Tag" : " Tage") }),
        UI.el("span.gzeit", { text: "längste: " + laengste })
      ]),
      UI.balken(Math.min(1, serie / 30)),
      UI.el("p.klein", {
        text: "Ein schwacher Tag wirft dich drei Tage zurück, nicht auf null. Zwei hintereinander setzen zurück. Reisetage pausieren." +
              (monat != null ? " Monatsdurchschnitt: " + Math.round(monat) + "." : "")
      })
    ]);
  }

  /* ---------- Heatmap ---------- */
  function werteFuer(t) {
    if (bereichWahl === "score") return t.score;
    if (bereichWahl === "gebete") {
      var w = Gebetszeiten.PFLICHT.map(function (k) { return (t.gebete || {})[k]; });
      var punkte = w.reduce(function (a, x) { return a + (Score.GEBETSWERT[x] || 0); }, 0);
      return w.some(Boolean) ? Math.round(punkte / 5 * 100) : null;
    }
    if (bereichWahl === "sport") return (t.training && (t.training.arten || []).length) ? 100 : (t.score != null ? 0 : null);
    if (bereichWahl === "schlaf") {
      if (!t.schlaf || !t.schlaf.bett) return null;
      var h = +t.schlaf.bett.split(":")[0];
      return (h >= 19 && h < 24) ? 100 : 25;
    }
    if (bereichWahl === "quran") {
      if (!t.quran) return null;
      var n = (t.quran.murajaa ? 50 : 0) + (t.quran.hifz ? 30 : 0) + (t.quran.gelesen > 0 ? 20 : 0);
      return t.score != null ? n : null;
    }
    return t.score;
  }

  function heatmapKarte() {
    var karte = {};
    tage.forEach(function (t) { karte[t.datum] = werteFuer(t); });
    var felder = [];
    var heute = new Date();
    for (var i = zeitraum - 1; i >= 0; i--) {
      var d = new Date(heute.getTime() - i * 86400000);
      var k = Store.key(d);
      var v = karte[k];
      felder.push(UI.el("i.feld" + stufe(v), {
        title: k + (v != null ? " · " + Math.round(v) : "")
      }));
    }
    var wahl = [
      { k: "score", t: "Score" }, { k: "gebete", t: "Gebete" }, { k: "quran", t: "Qur'an" },
      { k: "sport", t: "Sport" }, { k: "schlaf", t: "Schlaf" }
    ];
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Die letzten " + Math.round(zeitraum / 7) + " Wochen" }),
      UI.el("div.chips.umbruch", { style: "margin:.6rem 0" }, wahl.map(function (w) {
        return UI.el("button.chip" + (bereichWahl === w.k ? ".an" : ""), {
          type: "button", onclick: function () { bereichWahl = w.k; zeichne(); }
        }, w.t);
      })),
      UI.el("div.heat", felder),
      UI.el("div.legende", [
        UI.el("span", { text: "schwach" }),
        UI.el("i.feld.s1"), UI.el("i.feld.s2"), UI.el("i.feld.s3"), UI.el("i.feld.s4"),
        UI.el("span", { text: "stark" })
      ]),
      UI.el("div.chips", { style: "margin-top:.7rem" }, [42, 91, 182, 364].map(function (n) {
        return UI.el("button.chip" + (zeitraum === n ? ".an" : ""), {
          type: "button", onclick: function () { zeitraum = n; zeichne(); }
        }, n <= 91 ? Math.round(n / 7) + " W" : Math.round(n / 30) + " M");
      }))
    ]);
  }

  /* ---------- Bereichsvergleich ---------- */
  function bereicheKarte() {
    var letzte = tage.slice(-30);
    if (letzte.length < 3) return null;
    var e = Store.einstellungen;
    var namen = {
      religion: "Religion", produktivitaet: "Arbeit & Uni", sport: "Sport",
      schlaf: "Schlaf", ernaehrung: "Ernährung", soziales: "Soziales", innen: "Innenleben"
    };
    var summen = {}, zaehler = {};
    letzte.forEach(function (t) {
      var s = Score.fuer(t, { jetzt: Store.ausKey(t.datum) });
      Object.keys(s.bereiche).forEach(function (k) {
        if (s.bereiche[k] == null) return;
        summen[k] = (summen[k] || 0) + s.bereiche[k];
        zaehler[k] = (zaehler[k] || 0) + 1;
      });
    });
    var reihen = Object.keys(namen).filter(function (k) { return zaehler[k]; })
      .map(function (k) { return { k: k, wert: summen[k] / zaehler[k], gewicht: e.gewichte[k] }; });
    if (!reihen.length) return null;
    reihen.sort(function (a, b) { return a.wert - b.wert; });

    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Bereiche über 30 Tage · schwächste zuerst" }),
      UI.el("div.verteilung", reihen.map(function (r) {
        var farbe = r.wert >= 70 ? "jade" : r.wert >= 45 ? "jade-dim" : r.wert >= 25 ? "amber" : "rose";
        return UI.el("div.vz", [
          UI.el("span.vt", { text: namen[r.k] }),
          UI.el("div.vbalken", [UI.el("i.f-" + farbe, { style: "width:" + Math.round(r.wert) + "%" })]),
          UI.el("span.vw", { text: Math.round(r.wert) })
        ]);
      })),
      UI.el("p.klein", { text: "Der oberste Balken ist der Bereich, an dem du am meisten gewinnen kannst." })
    ]);
  }

  /* ---------- Gebetsqualität ---------- */
  function gebeteKarte() {
    var zaehler = { moschee: 0, puenktlich: 0, fenster: 0, spaet: 0, verpasst: 0 };
    var letzte = tage.slice(-30);
    var erfasst = 0;
    letzte.forEach(function (t) {
      Gebetszeiten.PFLICHT.forEach(function (k) {
        var w = (t.gebete || {})[k];
        if (w) { zaehler[w]++; erfasst++; }
      });
    });
    if (!erfasst) return null;
    var reihen = [
      { k: "moschee", t: "In der Moschee", f: "jade" },
      { k: "puenktlich", t: "Pünktlich", f: "jade" },
      { k: "fenster", t: "Im Fenster", f: "jade-dim" },
      { k: "spaet", t: "Verspätet", f: "amber" },
      { k: "verpasst", t: "Verpasst", f: "rose" }
    ];
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Gebete der letzten 30 Tage · " + erfasst + " erfasst" }),
      UI.el("div.verteilung", reihen.map(function (r) {
        return UI.el("div.vz", [
          UI.el("span.vt", { text: r.t }),
          UI.el("div.vbalken", [UI.el("i.f-" + r.f, { style: "width:" + (zaehler[r.k] / erfasst * 100) + "%" })]),
          UI.el("span.vw", { text: String(zaehler[r.k]) })
        ]);
      }))
    ]);
  }

  /* ---------- Zusammenhänge ---------- */
  function zusammenhangBlock() {
    var reife = Zusammenhaenge.reife(tage);
    if (!reife.genug) {
      return UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Zusammenhänge zeigt Mīzān ab etwa " + reife.ziel + " erfassten Tagen — du hast " +
                reife.tage + ". Mit dünner Datenlage würde sie raten, und das tut sie nicht."
        })
      ]);
    }
    var liste = Zusammenhaenge.alle(tage, false);
    if (!liste.length) {
      return UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Genug Daten, aber kein Unterschied, der deutlich genug wäre. Das ist auch eine Aussage: " +
                "es liegt gerade an nichts Einzelnem."
        })
      ]);
    }
    return UI.el("div", [
      UI.el("div.blockkopf", { text: "Was die Daten sagen" })
    ].concat(liste.map(function (z) {
      return UI.el("div.karte" + (z.stark ? ".held" : ""), [
        UI.el("p.aurteil", { text: z.text }),
        z.stark ? UI.el("span.marke", { text: "deutlich" }) : null
      ].filter(Boolean));
    })));
  }

  /* ---------- Wochenbericht ---------- */
  function wochenbericht() {
    var jetzt = new Date();
    var diese = tage.slice(-7), vorige = tage.slice(-14, -7);
    var a = schnittScore(diese), b = schnittScore(vorige);
    if (a == null) return null;

    var besser = [], schlechter = [];
    ["religion", "produktivitaet", "sport", "schlaf", "ernaehrung"].forEach(function (k) {
      function bereich(liste) {
        var w = liste.map(function (t) {
          return Score.fuer(t, { jetzt: Store.ausKey(t.datum) }).bereiche[k];
        }).filter(function (x) { return x != null; });
        return w.length ? w.reduce(function (x, y) { return x + y; }, 0) / w.length : null;
      }
      var x = bereich(diese), y = bereich(vorige);
      if (x == null || y == null) return;
      var namen = { religion: "Religion", produktivitaet: "Arbeit", sport: "Sport",
                    schlaf: "Schlaf", ernaehrung: "Ernährung" };
      if (x - y >= 8) besser.push(namen[k]);
      if (y - x >= 8) schlechter.push(namen[k]);
    });

    var moschee = diese.filter(function (t) {
      return Gebetszeiten.PFLICHT.some(function (k) { return (t.gebete || {})[k] === "moschee"; });
    }).length;
    var verpasst = diese.reduce(function (n, t) {
      return n + Gebetszeiten.PFLICHT.filter(function (k) { return (t.gebete || {})[k] === "verpasst"; }).length;
    }, 0);

    var ziel;
    if (verpasst >= 3) ziel = "Nächste Woche: kein Gebet verpassen. Nichts anderes.";
    else if (schlechter.length) ziel = "Nächste Woche: " + schlechter[0] + " zurückholen.";
    else if (moschee < 3) ziel = "Nächste Woche: dreimal in die Moschee.";
    else ziel = "Nächste Woche: den Stand halten. Beständigkeit schlägt Ausbrüche.";

    return UI.el("div.karte.held", [
      UI.el("span.etikett", { text: "Wochenbericht" }),
      UI.el("div.gebetzeile", [
        UI.el("span.gname.klein", { text: "Schnitt " + Math.round(a) }),
        UI.el("span.gzeit", {
          text: b == null ? "erste Woche"
            : (Math.round(a) === Math.round(b) ? "unverändert zur Vorwoche"
               : (a - b > 0 ? "▲ " : "▼ ") + Math.abs(Math.round(a - b)) + " zur Vorwoche")
        })
      ]),
      UI.el("p.aurteil", {
        text: (besser.length ? "Besser geworden: " + besser.join(", ") + ". " : "") +
              (schlechter.length ? "Nachgelassen: " + schlechter.join(", ") + ". " : "") +
              moschee + "× in der Moschee, " +
              (verpasst === 0 ? "kein Gebet verpasst."
               : verpasst === 1 ? "ein Gebet verpasst." : verpasst + " Gebete verpasst.")
      }),
      UI.el("p.aurteil.ziel", { text: ziel })
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    var mit = tage.filter(function (t) { return typeof t.score === "number"; }).length;
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Spiegel", UI.plural(mit, "erfasster Tag", "erfasste Tage"), "المرآة"));
    wurzel.appendChild(UI.el("div.inhalt", [
      schnittKarte(),
      wochenbericht(),
      streakKarte(),
      heatmapKarte(),
      bereicheKarte(),
      gebeteKarte(),
      zusammenhangBlock(),
      UI.el("p.klein", {
        text: "Zusammenhänge im geschützten Bereich (Rückfälle) siehst du nur dort — sie tauchen hier nicht auf."
      })
    ].filter(Boolean)));
  }

  function oeffnen(root) {
    wurzel = root;
    return Store.letzteTage(400).then(function (l) { tage = l; zeichne(); });
  }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
