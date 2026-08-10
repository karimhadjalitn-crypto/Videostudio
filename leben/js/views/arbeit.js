/* Mīzān – Arbeit & Uni, Business. */

/* ==================== Arbeit & Uni ==================== */
var AnsichtArbeit = (function () {
  "use strict";
  var wurzel = null, tag = null, liste = [], filter = null, zeigeErledigt = false;

  function speichern() {
    tag.score = Score.fuer(tag).wert;
    return Store.tagSpeichern(tag);
  }
  /* --- Die drei Wichtigsten --- */
  function wichtigsteKarte() {
    var w = tag.arbeit.wichtigste || [];
    while (w.length < 3) w.push({ text: "", erledigt: false });
    tag.arbeit.wichtigste = w;

    var zeilen = w.slice(0, 3).map(function (x, i) {
      var eingabe = UI.el("input.aufgabenfeld", {
        type: "text", value: x.text || "", placeholder: "Wichtigste Sache " + (i + 1) + " …",
        onchange: function () { w[i].text = eingabe.value; speichern(); }
      });
      var haken = UI.el("span.haken" + (x.erledigt ? ".an" : ""), {
        onclick: function () {
          if (!w[i].text) return;
          w[i].erledigt = !w[i].erledigt;
          speichern().then(zeichne);
        }
      });
      return UI.el("div.zeile" + (x.erledigt ? ".erledigt" : ""), [haken, eingabe]);
    });

    var fertig = w.filter(function (x) { return x.text && x.erledigt; }).length;
    var gesetzt = w.filter(function (x) { return x.text; }).length;

    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Die drei Wichtigsten · " + fertig + " von " + gesetzt }),
      UI.el("div.gruppe", zeilen),
      UI.el("p.klein", {
        text: "Drei. Nicht zehn. Was hier nicht steht, ist heute nicht wichtig."
      })
    ]);
  }

  /* --- Aufgabenliste --- */
  function neueAufgabeKarte() {
    var eingabe = UI.el("input.aufgabenfeld.gross", {
      type: "text", placeholder: "Neue Aufgabe …",
      onkeydown: function (ev) { if (ev.key === "Enter") anlegen(); }
    });
    var projektWahl = filter;
    function anlegen() {
      var text = eingabe.value.trim();
      if (!text) return;
      var a = Store.neueAufgabe(text, projektWahl);
      Store.aufgabeSpeichern(a).then(function () {
        eingabe.value = "";
        UI.meldung("Angelegt.");
        neuLaden();
      });
    }
    return UI.el("div.karte", [
      UI.el("div.zeitreihe", [
        eingabe,
        UI.el("button.mini", { type: "button", onclick: anlegen }, "+")
      ])
    ]);
  }

  function projektFilter() {
    var e = Store.einstellungen;
    return UI.el("div.chips.umbruch", [null].concat(e.projekte).map(function (p) {
      var an = filter === p;
      var offen = liste.filter(function (a) {
        return !a.erledigt && (p === null || a.projekt === p);
      }).length;
      return UI.el("button.chip" + (an ? ".an" : ""), {
        type: "button", onclick: function () { filter = an ? null : p; zeichne(); }
      }, (p === null ? "Alle" : p.split(" ")[0]) + (offen ? " " + offen : ""));
    }));
  }

  function aufgabenBlock() {
    var offen = liste.filter(function (a) {
      return !a.erledigt && (filter === null || a.projekt === filter);
    });
    var erledigt = liste.filter(function (a) {
      return a.erledigt && (filter === null || a.projekt === filter);
    });

    offen.sort(function (a, b) {
      if (a.faellig && b.faellig) return a.faellig < b.faellig ? -1 : 1;
      if (a.faellig) return -1;
      if (b.faellig) return 1;
      return a.angelegt < b.angelegt ? -1 : 1;
    });

    var heute = Store.key();
    function zeile(a) {
      var ueberfaellig = a.faellig && a.faellig < heute && !a.erledigt;
      return UI.el("div.zeile.tippbar" + (a.erledigt ? ".erledigt" : "") + (ueberfaellig ? ".offen" : ""), [
        UI.el("span.haken" + (a.erledigt ? ".an" : ""), {
          onclick: function (ev) {
            ev.stopPropagation();
            a.erledigt = !a.erledigt;
            a.erledigtAm = a.erledigt ? new Date().toISOString() : null;
            /* Wiederholende Aufgabe: beim Abhaken rückt die Fälligkeit weiter,
               statt dass die Aufgabe verschwindet. */
            if (a.erledigt && a.wiederholung) {
              var basis = a.faellig ? Store.ausKey(a.faellig) : new Date();
              var tage = a.wiederholung === "taeglich" ? 1
                       : a.wiederholung === "woechentlich" ? 7 : 30;
              a.faellig = Store.key(new Date(basis.getTime() + tage * 86400000));
              a.erledigt = false; a.erledigtAm = null;
              UI.meldung("Erledigt · nächste Fälligkeit " + a.faellig.slice(8) + "." + a.faellig.slice(5, 7) + ".");
            }
            Store.aufgabeSpeichern(a).then(neuLaden);
          }
        }),
        UI.el("span.zt.dehnbar", { text: a.text }),
        a.projekt ? UI.el("span.zw", { text: a.projekt.split(" ")[0] }) : null,
        a.faellig ? UI.el("span.zw" + (ueberfaellig ? ".warn" : ""), {
          text: a.faellig === heute ? "heute" : a.faellig.slice(8) + "." + a.faellig.slice(5, 7) + "."
        }) : null,
        a.wiederholung ? UI.el("span.zw.wdh", { text: "⟳" }) : null,
        UI.el("button.loeschen", {
          type: "button",
          onclick: function (ev) {
            ev.stopPropagation();
            Store.aufgabeLoeschen(a.id).then(neuLaden);
          }
        }, "×")
      ].filter(Boolean));
    }

    return UI.el("div", [
      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Offen · " + offen.length }),
        UI.el("div.gruppe", offen.length ? offen.map(zeile)
          : [UI.el("div.zeile.leer", { text: "Nichts offen. Alḥamdulillāh." })])
      ]),
      erledigt.length ? UI.el("div.block", [
        UI.el("div.blockkopf.tippbar", {
          onclick: function () { zeigeErledigt = !zeigeErledigt; zeichne(); },
          text: "Erledigt · " + erledigt.length + (zeigeErledigt ? "  ▾" : "  ▸")
        }),
        zeigeErledigt ? UI.el("div.gruppe", erledigt.slice(-15).reverse().map(zeile)) : null
      ].filter(Boolean)) : null
    ].filter(Boolean));
  }

  function wochenKarte() {
    var e = Store.einstellungen;
    var d = Store.ausKey(tag.datum);
    var wochentag = (d.getDay() + 6) % 7;
    var istArbeitstag = (e.arbeitstage || []).indexOf(d.getDay()) >= 0;
    var offen = liste.filter(function (a) { return !a.erledigt; }).length;
    var dieseWoche = liste.filter(function (a) {
      if (a.erledigt || !a.faellig) return false;
      var tage = (Store.ausKey(a.faellig) - d) / 86400000;
      return tage >= -30 && tage <= (6 - wochentag);
    }).length;

    return UI.el("div.karte" + (istArbeitstag ? ".held" : ""), [
      UI.el("span.etikett", { text: istArbeitstag ? "Arbeitstag" : "Kein Arbeitstag" }),
      UI.el("div.gebetzeile", [
        UI.el("span.gname.klein", { text: dieseWoche + " diese Woche fällig" }),
        UI.el("span.gzeit", { text: offen + " insgesamt offen" })
      ]),
      d.getDay() === 5 ? UI.el("p.klein", {
        text: "Freitag: Jumuʿa um " + (d.getMonth() >= 3 && d.getMonth() <= 9 ? e.jumua.sommer : e.jumua.winter) +
              " — der Block davor gehört nicht der Arbeit."
      }) : null
    ].filter(Boolean));
  }

  function zeichne() {
    if (!wurzel) return;
    UI.leeren(wurzel);
    var offen = liste.filter(function (a) { return !a.erledigt; }).length;
    wurzel.appendChild(UI.kopf("Arbeit & Uni", offen + " Aufgaben offen", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(neuLaden),
      Sichtbar.an("arbeit.wichtigste") ? wichtigsteKarte() : null,
      wochenKarte(),
      Eigene.block("arbeit", tag, neuLaden),
      projektFilter(),
      neueAufgabeKarte(),
      aufgabenBlock()
    ].filter(Boolean)));
  }

  function neuLaden() {
    return Promise.all([Store.tag(), Store.aufgaben()]).then(function (r) {
      tag = r[0]; liste = r[1];
      zeichne();
    });
  }
  function oeffnen(root) { wurzel = root; return neuLaden(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();


/* ==================== Business ==================== */
var AnsichtBusiness = (function () {
  "use strict";
  var wurzel = null, tag = null, tage = [];

  function speichern(neu) {
    tag.score = Score.fuer(tag).wert;
    return Store.tagSpeichern(tag).then(function () { if (neu !== false) zeichne(); });
  }

  function zaehler(schluessel, titel, hinweis) {
    var anzeige = UI.el("div.zfwert", { text: String(tag.business[schluessel] || 0) });
    function setz(n) {
      tag.business[schluessel] = Math.max(0, (tag.business[schluessel] || 0) + n);
      anzeige.textContent = String(tag.business[schluessel]);
      speichern(false);
    }
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: titel }),
      anzeige,
      UI.el("p.klein", { text: hinweis }),
      UI.el("div.zfknoepfe", [
        UI.el("button.mini", { type: "button", onclick: function () { setz(1); } }, "+1"),
        UI.el("button.mini", { type: "button", onclick: function () { setz(-1); } }, "−1"),
        UI.el("button.mini.null", {
          type: "button", onclick: function () { tag.business[schluessel] = 0; speichern(); }
        }, "0")
      ])
    ]);
  }

  function wocheKarte() {
    var e = Store.einstellungen;
    var videos = Store.fensterBis(tag.datum, 7, tag)
      .reduce(function (a, t) { return a + ((t.business && t.business.videos) || 0); }, 0);
    var ziel = e.business.videoZielWoche;
    return UI.el("div.karte.held", [
      UI.el("span.etikett", { text: "Videos diese Woche" }),
      UI.el("div.gebetzeile", [
        UI.el("span.gname", { text: videos + " / " + ziel }),
        UI.el("span.gzeit", { text: videos >= ziel ? "Ziel erreicht" : (ziel - videos) + " fehlen" })
      ]),
      UI.balken(videos / ziel)
    ]);
  }

  function warumKarte() {
    return UI.el("div.karte.hinweis", [
      UI.el("div.hz", {
        text: "Mīzān misst hier, was du steuern kannst — Videos, Produkte, Skripte. Nicht den Umsatz. " +
              "Du hast selbst gesagt: Monat eins nahe null, ernsthaft ab Monat sechs bis zwölf. " +
              "Eine Zahl, die ein halbes Jahr auf 0,00 € steht, bringt dich nur zum Aufhören."
      })
    ]);
  }

  /* Die Merkliste war früher tot — vier Haken, die nichts taten.
     Jetzt wird sie pro Tag gespeichert, damit du im Rückblick siehst,
     ob du wirklich geprüft hast. */
  var HALAL = [
    "Produkt halāl-geprüft",
    "KI-Kennzeichnung gesetzt",
    "Affiliate-Hinweis gesetzt",
    "Keine Musik im Video"
  ];

  function halalKarte() {
    if (!tag.business.check) tag.business.check = {};
    var c = tag.business.check;
    var fertig = HALAL.filter(function (t) { return c[t]; }).length;
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Vor jeder Veröffentlichung · " + fertig + " von " + HALAL.length }),
      UI.el("div.gruppe.blank", HALAL.map(function (t) {
        return UI.zeile({
          haken: !!c[t], text: t,
          onclick: function () { c[t] = !c[t]; speichern(); }
        });
      })),
      UI.el("p.klein", { text: "Antippen bestätigt. Nochmal antippen nimmt es zurück." })
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Business", "TikTok-Shop · halāl", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(laden),
      Sichtbar.an("business.videos") ? wocheKarte() : null,
      Sichtbar.an("business.videos")
        ? zaehler("videos", "Videos hochgeladen", "Das Maß, das zählt.") : null,
      Sichtbar.an("business.produkte")
        ? zaehler("produkte", "Produkte recherchiert", "Halāl-Prüfung vorher, immer.") : null,
      Sichtbar.an("business.skripte")
        ? zaehler("skripte", "Skripte geschrieben", "Vorarbeit ist auch Arbeit.") : null,
      Eigene.block("business", tag, laden),
      halalKarte(),
      warumKarte()
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
