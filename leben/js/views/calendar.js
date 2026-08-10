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
        if ((Store.einstellungen.eintraege || []).some(function (x) { return x.datum === k; })) {
          marken.push(UI.el("i.m-eigen"));
        }

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
      UI.el("span", [UI.el("i.m-eigen"), "Eigener Eintrag"]),
      UI.el("span", [UI.el("i.feld.s3"), "Tagesscore"])
    ]);
  }

  /* Einmalige Einträge für den gewählten Tag */
  function eintragKarte() {
    if (!gewaehlt) return null;
    var e = Store.einstellungen;
    var meine = (e.eintraege || []).filter(function (x) { return x.datum === gewaehlt; });

    var nameFeld = UI.el("input.aufgabenfeld.gross", {
      type: "text", placeholder: "Was steht an?",
      onkeydown: function (ev) { if (ev.key === "Enter") anlegen(); }
    });
    var zeitFeld = UI.el("input.feld.zeit", { type: "time" });

    function anlegen() {
      var n = nameFeld.value.trim();
      if (!n) return;
      if (!e.eintraege) e.eintraege = [];
      e.eintraege.push({
        id: "e" + Date.now().toString(36), datum: gewaehlt,
        name: n, von: zeitFeld.value || null
      });
      nameFeld.value = "";
      Store.einstellungenSpeichern().then(zeichne);
      UI.meldung("Eingetragen.");
    }

    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Eigene Einträge an diesem Tag" }),
      meine.length ? UI.el("div.gruppe.blank", meine.map(function (x) {
        return UI.el("div.zeile", [
          UI.el("span.zt.dehnbar", { text: x.name }),
          x.von ? UI.el("span.zw", { text: x.von }) : null,
          UI.el("button.loeschen", {
            type: "button",
            onclick: function () {
              var i = e.eintraege.indexOf(x);
              if (i >= 0) e.eintraege.splice(i, 1);
              Store.einstellungenSpeichern().then(zeichne);
            }
          }, "×")
        ].filter(Boolean));
      })) : null,
      nameFeld,
      UI.el("div.zeitreihe", [
        zeitFeld,
        UI.el("button.mini", { type: "button", onclick: anlegen }, "Eintragen")
      ]),
      UI.el("p.klein", { text: "Ohne Uhrzeit gilt der Eintrag als ganztägig." })
    ].filter(Boolean));
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
    var eigene = (Store.einstellungen.eintraege || []).filter(function (x) { return x.datum === gewaehlt; });
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
      (termine.length || eigene.length) ? UI.el("div.gruppe.blank",
        termine.map(function (x) {
          return UI.zeile({ text: x.name, wert: x.von + (x.bis ? "–" + x.bis : "") });
        }).concat(eigene.map(function (x) {
          return UI.zeile({ text: x.name, wert: x.von || "ganztägig" });
        }))) : null,
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

  /* Direkt zu diesem Tag springen und dort eintragen.
     Für morgen gibt es nichts einzutragen — Termine ja, Taten nein. */
  function bearbeitenKnopf() {
    if (!gewaehlt) return null;
    if (gewaehlt > Store.heute()) {
      return UI.el("div.notiz", {
        text: "Ein künftiger Tag lässt sich planen, aber nicht abhaken. Trag unten ein, was ansteht."
      });
    }
    return UI.el("button.cta", {
      type: "button",
      onclick: function () {
        Store.setzeDatum(gewaehlt);
        location.hash = "#/heute";
      }
    }, gewaehlt === Store.heute() ? "Zum heutigen Tag" : "Diesen Tag nachtragen");
  }

  /* Lücken der letzten 30 Tage.
     „Da weiß ich nicht mehr alles" — deshalb zeigt Mīzān, welche Tage
     leer sind, statt darauf zu warten, dass es dir auffällt. */
  function hatEintrag(t) {
    if (!t) return false;
    if (t.muhasaba || typeof t.score === "number") return true;
    return Gebetszeiten.PFLICHT.some(function (k) { return t.gebete && t.gebete[k]; });
  }

  function lueckenKarte() {
    var heuteKey = Store.heute();
    var leer = [];
    for (var i = 1; i <= 30; i++) {
      var d = new Date(Store.ausKey(heuteKey).getTime() - i * 86400000);
      var k = Store.key(d);
      if (!hatEintrag(tage[k])) leer.push(k);
    }
    if (!leer.length) {
      return UI.el("div.karte", [
        UI.el("span.etikett", { text: "Lückenlos" }),
        UI.el("p.aurteil", { text: "Die letzten 30 Tage sind alle erfasst. Genau so." })
      ]);
    }
    return UI.el("div.karte" + (leer.length > 6 ? ".schuld" : ""), [
      UI.el("span.etikett", {
        text: UI.plural(leer.length, "Tag ohne Eintrag", "Tage ohne Eintrag") + " · letzte 30"
      }),
      UI.el("div.chips.umbruch", leer.slice(0, 10).map(function (k) {
        var d = Store.ausKey(k);
        return UI.el("button.chip", {
          type: "button",
          onclick: function () {
            Store.setzeDatum(k);
            location.hash = "#/heute";
          }
        }, UI.WOCHENTAGE[d.getDay()].slice(0, 2) + ", " + d.getDate() + "." + (d.getMonth() + 1) + ".");
      })),
      UI.el("p.klein", {
        text: leer.length > 10
          ? "Die zehn jüngsten stehen hier. Tippen springt in die Tagesansicht — dort trägst du alles nach."
          : "Tippen springt in die Tagesansicht — dort trägst du alles nach."
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
      bearbeitenKnopf(),
      eintragKarte(),
      lueckenKarte(),
      planungKarte(),
      exportKarte()
    ].filter(Boolean)));
  }

  function oeffnen(root) {
    wurzel = root;
    // Der Kalender öffnet dort, wo du gerade stehst — nicht immer im Heute
    gewaehlt = Store.datum();
    var g = Store.ausKey(gewaehlt);
    monat = new Date(g.getFullYear(), g.getMonth(), 1);
    return Store.alleTage().then(function (liste) {
      tage = {};
      liste.forEach(function (t) { tage[t.datum] = t; });
      zeichne();
    });
  }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
