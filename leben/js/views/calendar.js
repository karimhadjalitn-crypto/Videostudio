/* Mīzān – Kalender. Gregorianisch und Hijri nebeneinander. */
var AnsichtKalender = (function () {
  "use strict";

  var wurzel = null, tage = {}, monat = null, gewaehlt = null;

  function stufe(s) {
    if (s == null) return "";
    if (s >= 80) return ".s4";
    if (s >= 60) return ".s3";
    if (s >= 40) return ".s2";
    return ".s1";
  }

  function monatsKopf() {
    var erster = new Date(monat.getFullYear(), monat.getMonth(), 1);
    var letzter = new Date(monat.getFullYear(), monat.getMonth() + 1, 0);
    var h1 = Hijri.fuer(erster), h2 = Hijri.fuer(letzter);
    var spanne = h1.monatName === h2.monatName
      ? h1.monatName + " " + h1.jahr
      : h1.monatName + " – " + h2.monatName + " " + h2.jahr;

    return UI.el("div.monatskopf", [
      UI.el("button.pfeil", {
        type: "button", "aria-label": "Vorheriger Monat",
        onclick: function () { monat = new Date(monat.getFullYear(), monat.getMonth() - 1, 1); zeichne(); }
      }, "‹"),
      UI.el("div.mtitel", [
        UI.el("div.mt", { text: UI.MONATE[monat.getMonth()] + " " + monat.getFullYear() }),
        UI.el("div.mh", { text: spanne })
      ]),
      UI.el("button.pfeil", {
        type: "button", "aria-label": "Nächster Monat",
        onclick: function () { monat = new Date(monat.getFullYear(), monat.getMonth() + 1, 1); zeichne(); }
      }, "›")
    ]);
  }

  function raster() {
    var jahr = monat.getFullYear(), m = monat.getMonth();
    var erster = new Date(jahr, m, 1);
    var versatz = (erster.getDay() + 6) % 7;          // Woche beginnt montags
    var anzahl = new Date(jahr, m + 1, 0).getDate();
    var heuteKey = Store.key();
    var arbeit = Store.einstellungen.arbeitstage || [];

    var zellen = [];
    for (var v = 0; v < versatz; v++) zellen.push(UI.el("div.zelle.leerzelle"));

    for (var t = 1; t <= anzahl; t++) {
      (function (t) {
        var d = new Date(jahr, m, t);
        var k = Store.key(d);
        var eintrag = tage[k];
        var h = Hijri.fuer(d);
        var anlass = Hijri.anlass(d);
        var klassen = ".zelle" + stufe(eintrag && eintrag.score);
        if (k === heuteKey) klassen += ".heute";
        if (k === gewaehlt) klassen += ".gewaehlt";
        if (arbeit.indexOf(d.getDay()) >= 0) klassen += ".arbeit";

        var marken = [];
        if (h.weisserTag) marken.push(UI.el("i.m-bid"));
        else if (anlass && anlass.art === "fasten") marken.push(UI.el("i.m-fasten"));
        if (anlass && anlass.art === "gross") marken.push(UI.el("i.m-gross"));
        if (d.getDay() === 5) marken.push(UI.el("i.m-jumua"));
        if (Termine.fuerTag(d).length) marken.push(UI.el("i.m-termin"));

        zellen.push(UI.el(klassen, {
          onclick: function () { gewaehlt = gewaehlt === k ? null : k; zeichne(); }
        }, [
          UI.el("span.zt", { text: String(t) }),
          UI.el("span.zh", { text: String(h.tag) }),
          UI.el("div.marken", marken)
        ]));
      })(t);
    }

    return UI.el("div.kalender", [
      UI.el("div.wochenkopf", ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(function (w) {
        return UI.el("span" + (w === "Fr" ? ".fr" : ""), { text: w });
      })),
      UI.el("div.raster", zellen)
    ]);
  }

  function legende() {
    return UI.el("div.klegende", [
      UI.el("span", [UI.el("i.m-bid"), "Weißer Tag"]),
      UI.el("span", [UI.el("i.m-jumua"), "Jumuʿa"]),
      UI.el("span", [UI.el("i.m-gross"), "Islamischer Termin"]),
      UI.el("span", [UI.el("i.m-termin"), "Termin"]),
      UI.el("span", [UI.el("i.feld.s3"), "Tagesscore"])
    ]);
  }

  function tagesKarte() {
    if (!gewaehlt) return null;
    var d = Store.ausKey(gewaehlt);
    var h = Hijri.fuer(d);
    var z = Gebetszeiten.fuer(d);
    var eintrag = tage[gewaehlt];
    var anlass = Hijri.anlass(d);
    var e = Store.einstellungen;

    var termine = Termine.fuerTag(d);
    var hinweise = [];
    if (anlass) hinweise.push(anlass.name);
    if (d.getDay() === 5) {
      var sommer = d.getMonth() >= 3 && d.getMonth() <= 9;
      hinweise.push("Jumuʿa " + (sommer ? e.jumua.sommer : e.jumua.winter));
    }
    if ((e.arbeitstage || []).indexOf(d.getDay()) >= 0) hinweise.push("Arbeitstag");
    if (d.getDay() === 1 || d.getDay() === 4) hinweise.push("Fastenvorschlag");

    return UI.el("div.karte.held", [
      UI.el("span.etikett", { text: UI.datumLang(d) }),
      UI.el("div.tkopf", [
        UI.el("span.th", { text: h.text }),
        eintrag && eintrag.score != null
          ? UI.el("span.tscore", { text: "Score " + eintrag.score })
          : UI.el("span.tscore.leer", { text: "kein Eintrag" })
      ]),
      hinweise.length ? UI.el("div.thinweise", hinweise.map(function (x) {
        return UI.el("span.thin", { text: x });
      })) : null,
      termine.length ? UI.el("div.gruppe.blank", termine.map(function (x) {
        return UI.zeile({ text: x.name, wert: x.von + (x.bis ? "–" + x.bis : "") });
      })) : null,
      UI.el("div.gzeiten", ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"].map(function (k) {
        var w = eintrag && eintrag.gebete ? eintrag.gebete[k] : null;
        return UI.el("span.gz" + (w ? ".w-" + w : ""), [
          UI.el("i", { text: k === "sunrise" ? "Shurūq" : Gebetszeiten.NAMEN[k].de }),
          UI.el("b", { text: Gebetszeiten.uhr(z[k]) })
        ]);
      }))
    ].filter(Boolean));
  }

  /* Auto-Planung: bleibt aus, bis genug Tage vorliegen.
     „Wenn sie weiß, wie ich handel, sonst nicht." */
  function planungKarte() {
    var liste = Object.keys(tage).map(function (k) { return tage[k]; })
      .filter(function (t) { return typeof t.score === "number"; });
    if (liste.length < 30) {
      return UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Selbst planen kann Mīzān erst, wenn sie dein Verhalten kennt — ab 30 erfassten Tagen. " +
                "Du hast " + liste.length + ". Vorher würde sie nach einem Ideal planen statt nach dir."
        })
      ]);
    }

    /* Was sagen die Daten über deine Woche? */
    var proTag = [[], [], [], [], [], [], []];
    var trainingProTag = [0, 0, 0, 0, 0, 0, 0];
    var gesamtProTag = [0, 0, 0, 0, 0, 0, 0];
    liste.forEach(function (t) {
      var d = Store.ausKey(t.datum).getDay();
      proTag[d].push(t.score);
      gesamtProTag[d]++;
      if (t.training && (t.training.arten || []).length) trainingProTag[d]++;
    });
    function schnitt(l) {
      return l.length ? l.reduce(function (a, b) { return a + b; }, 0) / l.length : null;
    }
    var werte = proTag.map(function (l, i) { return { tag: i, s: schnitt(l), n: l.length }; })
      .filter(function (x) { return x.n >= 3; });
    if (werte.length < 5) return null;
    werte.sort(function (a, b) { return b.s - a.s; });
    var stark = werte[0], schwach = werte[werte.length - 1];

    var trainingsTage = trainingProTag.map(function (n, i) {
      return { tag: i, quote: gesamtProTag[i] ? n / gesamtProTag[i] : 0 };
    }).filter(function (x) { return x.quote >= 0.5; }).map(function (x) { return UI.WOCHENTAGE[x.tag]; });

    return UI.el("div.karte.held", [
      UI.el("span.etikett", { text: "Was Mīzān über deine Woche weiß" }),
      UI.el("p.aurteil", {
        text: UI.WOCHENTAGE[stark.tag] + " ist dein stärkster Tag (Schnitt " + Math.round(stark.s) +
              "), " + UI.WOCHENTAGE[schwach.tag] + " dein schwächster (" + Math.round(schwach.s) + "). " +
              (trainingsTage.length ? "Trainiert wird meist " + trainingsTage.join(" und ") + "." : "")
      }),
      UI.el("p.aurteil.ziel", {
        text: "Vorschlag: Leg Schweres auf " + UI.WOCHENTAGE[stark.tag] +
              " und plane " + UI.WOCHENTAGE[schwach.tag] + " bewusst leichter."
      }),
      UI.el("p.klein", {
        text: "Mīzān trägt nichts von selbst ein. Sie sagt dir, was sie sieht — entscheiden tust du."
      })
    ]);
  }

  function exportKarte() {
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "In den iPhone-Kalender" }),
      UI.el("p.aurteil", {
        text: "Gebetszeiten, weiße Tage, islamische Termine und die Jumuʿa als Kalenderdatei — mit Alarmen von iOS."
      }),
      UI.el("button.cta", {
        type: "button", onclick: function () { location.hash = "#/erinnerungen"; }
      }, "Erinnerungen einrichten")
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    var h = Hijri.fuer(new Date());
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Kalender", UI.datumLang(new Date()), h.textAr));
    wurzel.appendChild(UI.el("div.inhalt", [
      monatsKopf(),
      raster(),
      legende(),
      tagesKarte(),
      planungKarte(),
      exportKarte()
    ].filter(Boolean)));
  }

  function oeffnen(root) {
    wurzel = root;
    if (!monat) monat = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    gewaehlt = Store.key();
    return Store.alleTage().then(function (liste) {
      tage = {};
      liste.forEach(function (t) { tage[t.datum] = t; });
      zeichne();
    });
  }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
