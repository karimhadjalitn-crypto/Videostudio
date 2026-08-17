/* Mīzān – Kalender. Das Zuhause der App.
   Gregorianisch und Hijri nebeneinander, Woche oder Monat, eigene
   Einträge, Fastentage zum Vormerken und das islamische Jahr. */
var AnsichtKalender = (function () {
  "use strict";

  var wurzel = null, tage = {}, anker = null, gewaehlt = null, sicht = "monat";

  function e() { return Store.einstellungen; }
  function eintraegeAm(k) {
    return (e().eintraege || []).filter(function (x) { return x.datum === k; });
  }

  /* ---------- Kopf: blättern und umschalten ---------- */
  function kopfLeiste() {
    var titel, unter;
    if (sicht === "monat") {
      var erster = new Date(anker.getFullYear(), anker.getMonth(), 1);
      var letzter = new Date(anker.getFullYear(), anker.getMonth() + 1, 0);
      var h1 = Hijri.fuer(erster), h2 = Hijri.fuer(letzter);
      titel = UI.MONATE[anker.getMonth()] + " " + anker.getFullYear();
      unter = h1.monatName === h2.monatName
        ? h1.monatName + " " + h1.jahr
        : h1.monatName + " – " + h2.monatName + " " + h2.jahr;
    } else {
      var mo = wochenStart(anker);
      var so = new Date(mo.getFullYear(), mo.getMonth(), mo.getDate() + 6);
      var hm = Hijri.fuer(mo);
      titel = mo.getDate() + ". " + UI.MONATE[mo.getMonth()].slice(0, 3) + " – " +
              so.getDate() + ". " + UI.MONATE[so.getMonth()].slice(0, 3);
      unter = hm.monatName + " " + hm.jahr;
    }

    function schieben(n) {
      if (sicht === "monat") anker = new Date(anker.getFullYear(), anker.getMonth() + n, 1);
      else anker = new Date(anker.getFullYear(), anker.getMonth(), anker.getDate() + n * 7);
      zeichne();
    }

    return UI.el("div", [
      UI.el("div.monatskopf", [
        UI.el("button.pfeil", {
          type: "button", "aria-label": "Zurück", onclick: function () { schieben(-1); }
        }, "‹"),
        UI.el("button.mtitel", {
          type: "button",
          onclick: function () { anker = new Date(); gewaehlt = Store.heute(); zeichne(); }
        }, [
          UI.el("div.mt", { text: titel }),
          UI.el("div.mh", { text: unter })
        ]),
        UI.el("button.pfeil", {
          type: "button", "aria-label": "Vor", onclick: function () { schieben(1); }
        }, "›")
      ]),
      UI.el("div.segment", [
        UI.el("button.segbtn" + (sicht === "woche" ? ".an" : ""), {
          type: "button", onclick: function () { sicht = "woche"; zeichne(); }
        }, "Woche"),
        UI.el("button.segbtn" + (sicht === "monat" ? ".an" : ""), {
          type: "button", onclick: function () { sicht = "monat"; zeichne(); }
        }, "Monat")
      ])
    ]);
  }

  function wochenStart(d) {
    var versatz = (d.getDay() + 6) % 7;   // Woche beginnt montags
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - versatz);
  }

  /* ---------- Eine Zelle im Raster ---------- */
  function zelle(d, imMonat) {
    var k = Store.key(d);
    var h = Hijri.fuer(d);
    var anlass = Hijri.anlass(d);
    var klassen = ".zelle";
    if (!imMonat) klassen += ".fremd";
    if (k === Store.heute()) klassen += ".heute";
    if (k === gewaehlt) klassen += ".gewaehlt";
    if ((e().arbeitstage || []).indexOf(d.getDay()) >= 0) klassen += ".arbeit";
    var marken = [];
    if (Fasten.geplant(k)) marken.push(UI.el("i.m-fasten"));
    if (h.weisserTag) marken.push(UI.el("i.m-bid"));
    if (anlass && anlass.art === "gross") marken.push(UI.el("i.m-gross"));
    if (d.getDay() === 5) marken.push(UI.el("i.m-jumua"));
    if (Termine.fuerTag(d).length) marken.push(UI.el("i.m-termin"));
    if (eintraegeAm(k).length) marken.push(UI.el("i.m-eigen"));

    return UI.el(klassen, {
      onclick: function () {
        gewaehlt = k;
        if (!imMonat) anker = new Date(d.getFullYear(), d.getMonth(), 1);
        zeichne();
      }
    }, [
      UI.el("span.zt", { text: String(d.getDate()) }),
      UI.el("span.zh", { text: String(h.tag) }),
      UI.el("div.marken", marken)
    ]);
  }

  function raster() {
    var zellen = [];
    if (sicht === "woche") {
      var mo = wochenStart(anker);
      for (var i = 0; i < 7; i++) {
        zellen.push(zelle(new Date(mo.getFullYear(), mo.getMonth(), mo.getDate() + i), true));
      }
    } else {
      var jahr = anker.getFullYear(), m = anker.getMonth();
      var versatz = (new Date(jahr, m, 1).getDay() + 6) % 7;
      var anzahl = new Date(jahr, m + 1, 0).getDate();
      for (var v = versatz; v > 0; v--) zellen.push(zelle(new Date(jahr, m, 1 - v), false));
      for (var t = 1; t <= anzahl; t++) zellen.push(zelle(new Date(jahr, m, t), true));
      while (zellen.length % 7 !== 0) {
        zellen.push(zelle(new Date(jahr, m, anzahl + 1 + (zellen.length % 7)), false));
      }
    }

    return UI.el("div.kalender" + (sicht === "woche" ? ".wochensicht" : ""), [
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
      UI.el("span", [UI.el("i.m-fasten"), "Fasten vorgemerkt"])
    ]);
  }

  /* ---------- Der gewählte Tag ---------- */
  function tagesKarte() {
    if (!gewaehlt) return null;
    var d = Store.ausKey(gewaehlt);
    var h = Hijri.fuer(d);
    var z = Gebetszeiten.fuer(d);
    var eintrag = tage[gewaehlt];
    var anlass = Hijri.anlass(d);

    var termine = Termine.fuerTag(d);
    var eigene = eintraegeAm(gewaehlt);
    var hinweise = [];
    if (anlass) hinweise.push(anlass.name);
    if (d.getDay() === 5) {
      var sommer = d.getMonth() >= 3 && d.getMonth() <= 9;
      hinweise.push("Jumuʿa " + (sommer ? e().jumua.sommer : e().jumua.winter));
    }
    if ((e().arbeitstage || []).indexOf(d.getDay()) >= 0) hinweise.push("Arbeitstag");

    var gehalten = eintrag && eintrag.gebete
      ? Gebetszeiten.PFLICHT.filter(function (k) {
          return eintrag.gebete[k] && eintrag.gebete[k] !== "verpasst";
        }).length
      : null;

    return UI.el("div.karte.held", [
      UI.el("span.etikett", { text: UI.datumLang(d) }),
      UI.el("div.tkopf", [
        UI.el("span.th", { text: h.text }),
        eintrag && eintrag.muhasaba
          ? UI.el("span.tscore", { text: gehalten + " von 5 gehalten" })
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

  /* Zu diesem Tag springen — oder ihn zum Fasten vormerken */
  function aktionen() {
    if (!gewaehlt) return null;
    var kuenftig = gewaehlt > Store.heute();
    var d = Store.ausKey(gewaehlt);
    var fastenAnlass = Fasten.anlass(d);
    var vorgemerkt = Fasten.geplant(gewaehlt);

    var knoepfe = [];
    if (!kuenftig) {
      knoepfe.push(UI.el("button.cta", {
        type: "button",
        onclick: function () { Store.setzeDatum(gewaehlt); location.hash = "#/abschluss"; }
      }, gewaehlt === Store.heute() ? "Diesen Tag eintragen" : "Diesen Tag nachtragen"));
    }
    if (kuenftig || fastenAnlass) {
      knoepfe.push(UI.el("button.cta.leise", {
        type: "button",
        onclick: function () {
          Fasten.umschalten(gewaehlt).then(function () {
            UI.meldung(vorgemerkt ? "Vormerkung entfernt." : "Zum Fasten vorgemerkt.");
            zeichne();
          });
        }
      }, vorgemerkt ? "✓ Zum Fasten vorgemerkt" : "Zum Fasten vormerken"));
    }
    if (kuenftig && !fastenAnlass && knoepfe.length === 1) {
      knoepfe.push(UI.el("p.klein", {
        text: "Ein künftiger Tag lässt sich planen, aber nicht abhaken."
      }));
    }
    return knoepfe.length ? UI.el("div.aktionen", knoepfe) : null;
  }

  /* ---------- Eigene Einträge ---------- */
  function eintragKarte() {
    if (!gewaehlt) return null;
    var meine = eintraegeAm(gewaehlt);

    var nameFeld = UI.el("input.aufgabenfeld.gross", {
      type: "text", placeholder: "Was steht an?",
      onkeydown: function (ev) { if (ev.key === "Enter") anlegen(); }
    });
    var zeitFeld = UI.el("input.feld.zeit", { type: "time" });

    function anlegen() {
      var n = nameFeld.value.trim();
      if (!n) return;
      if (!e().eintraege) e().eintraege = [];
      e().eintraege.push({
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
              var i = e().eintraege.indexOf(x);
              if (i >= 0) e().eintraege.splice(i, 1);
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

  /* ---------- Das islamische Jahr ---------- */
  function jahrBlock() {
    var heute = new Date();
    var zeilen = [];
    for (var i = 0; i <= 380 && zeilen.length < 8; i++) {
      var d = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() + i);
      var a = Hijri.anlass(d);
      if (!a || a.art !== "gross") continue;
      (function (d, a, i) {
        zeilen.push(UI.zeile({
          text: a.name,
          wert: i === 0 ? "heute" : (i === 1 ? "morgen" : "in " + i + " Tagen"),
          onclick: function () {
            anker = new Date(d.getFullYear(), d.getMonth(), 1);
            gewaehlt = Store.key(d);
            sicht = "monat";
            zeichne();
            window.scrollTo(0, 0);
          }
        }));
      })(d, a, i);
    }
    if (!zeilen.length) return null;
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Im islamischen Jahr" }),
      UI.el("div.gruppe", zeilen)
    ]);
  }

  /* ---------- Lücken der letzten 30 Tage ---------- */
  function hatEintrag(t) {
    if (!t) return false;
    if (t.muhasaba) return true;
    return Gebetszeiten.PFLICHT.some(function (k) { return t.gebete && t.gebete[k]; });
  }

  function lueckenKarte() {
    var leer = [];
    for (var i = 1; i <= 30; i++) {
      var d = new Date(Store.ausKey(Store.heute()).getTime() - i * 86400000);
      var k = Store.key(d);
      if (!hatEintrag(tage[k])) leer.push(k);
    }
    if (!leer.length) {
      return UI.el("div.karte", [
        UI.el("span.etikett", { text: "Lückenlos" }),
        UI.el("p.aurteil", { text: "Die letzten 30 Tage sind alle erfasst. Genau so." })
      ]);
    }
    return UI.el("div.karte" + (leer.length > 8 ? ".schuld" : ""), [
      UI.el("span.etikett", {
        text: UI.plural(leer.length, "Tag ohne Eintrag", "Tage ohne Eintrag") + " · letzte 30"
      }),
      UI.el("div.chips.umbruch", leer.slice(0, 10).map(function (k) {
        var d = Store.ausKey(k);
        return UI.el("button.chip", {
          type: "button",
          onclick: function () { Store.setzeDatum(k); location.hash = "#/abschluss"; }
        }, UI.WOCHENTAGE[d.getDay()].slice(0, 2) + ", " + d.getDate() + "." + (d.getMonth() + 1) + ".");
      })),
      UI.el("p.klein", {
        text: leer.length > 10
          ? "Die zehn jüngsten stehen hier. Tippen öffnet den Tag zum Nachtragen."
          : "Tippen öffnet den Tag zum Nachtragen."
      })
    ]);
  }

  /* ---------- Weiterführendes ---------- */
  function wegeBlock() {
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Mehr" }),
      UI.el("div.gruppe", [
        UI.zeile({
          text: "Fasten", wert: (Fasten.liste() || []).length
            ? UI.plural(Fasten.liste().length, "Tag vorgemerkt", "Tage vorgemerkt")
            : "vormerken & Qaḍāʾ",
          onclick: function () { location.hash = "#/fasten"; },
          rechts: UI.el("span.bpfeil.klein", { text: "›" })
        }),
        UI.zeile({
          text: "Wiederkehrende Termine",
          wert: UI.plural((e().termine || []).length, "Termin", "Termine"),
          onclick: function () { location.hash = "#/termine"; },
          rechts: UI.el("span.bpfeil.klein", { text: "›" })
        }),
        UI.zeile({
          text: "Erinnerungen", wert: "Kalenderdatei & Kurzbefehle",
          onclick: function () { location.hash = "#/erinnerungen"; },
          rechts: UI.el("span.bpfeil.klein", { text: "›" })
        })
      ])
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    var h = Hijri.fuer(new Date());
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Kalender", UI.datumLang(new Date()), h.textAr));
    wurzel.appendChild(UI.el("div.inhalt", [
      kopfLeiste(),
      raster(),
      legende(),
      tagesKarte(),
      aktionen(),
      eintragKarte(),
      jahrBlock(),
      lueckenKarte(),
      wegeBlock()
    ].filter(Boolean)));
  }

  function oeffnen(root) {
    wurzel = root;
    Fasten.aufraeumen();
    // Der Kalender öffnet dort, wo du gerade stehst — nicht immer im Heute
    gewaehlt = Store.datum();
    var g = Store.ausKey(gewaehlt);
    anker = sicht === "woche" ? g : new Date(g.getFullYear(), g.getMonth(), 1);
    return Store.alleTage().then(function (liste) {
      tage = {};
      liste.forEach(function (t) { tage[t.datum] = t; });
      zeichne();
    });
  }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
