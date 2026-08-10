/* Mīzān – Wiederkehrende Termine und das Morgenbriefing. */

/* ==================== Terminverwaltung ==================== */
var Termine = (function () {
  "use strict";

  var ARTEN = {
    arbeit:   { name: "Arbeit", farbe: "amber" },
    religion: { name: "Religion", farbe: "jade" },
    lernen:   { name: "Lernen", farbe: "jade-dim" },
    privat:   { name: "Privat", farbe: "rose" }
  };

  function fuerTag(datum) {
    var wt = (datum || new Date()).getDay();
    return (Store.einstellungen.termine || [])
      .filter(function (t) { return (t.tage || []).indexOf(wt) >= 0; })
      .sort(function (a, b) { return (a.von || "") < (b.von || "") ? -1 : 1; });
  }

  /* Nächster Termin ab jetzt */
  function naechster(jetzt) {
    jetzt = jetzt || new Date();
    var uhr = String(jetzt.getHours()).padStart(2, "0") + ":" + String(jetzt.getMinutes()).padStart(2, "0");
    var heute = fuerTag(jetzt).filter(function (t) { return t.von > uhr; });
    if (heute.length) return { termin: heute[0], heute: true };
    for (var i = 1; i <= 7; i++) {
      var d = new Date(jetzt.getTime() + i * 86400000);
      var liste = fuerTag(d);
      if (liste.length) return { termin: liste[0], heute: false, tage: i, datum: d };
    }
    return null;
  }

  return { ARTEN: ARTEN, fuerTag: fuerTag, naechster: naechster };
})();


var AnsichtTermine = (function () {
  "use strict";
  var wurzel = null, bearbeite = null;

  var WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  function speichern() { return Store.einstellungenSpeichern().then(zeichne); }

  function terminKarte(t, i) {
    var e = Store.einstellungen;
    if (bearbeite !== t.id) {
      return UI.el("div.karte.tippbar", {
        onclick: function () { bearbeite = t.id; zeichne(); }
      }, [
        UI.el("div.bkopf", [
          UI.el("span.bt", { text: t.name }),
          UI.el("span.bgew", { text: (t.von || "") + (t.bis ? "–" + t.bis : "") })
        ]),
        UI.el("div.bstand", {
          text: (t.tage || []).map(function (d) { return WT[d]; }).join(", ") +
                " · " + (Termine.ARTEN[t.art] ? Termine.ARTEN[t.art].name : "")
        })
      ]);
    }

    var name = UI.el("input.aufgabenfeld.gross", {
      type: "text", value: t.name,
      onchange: function () { t.name = name.value; Store.einstellungenSpeichern(); }
    });
    var von = UI.el("input.feld.zeit", {
      type: "time", value: t.von || "",
      onchange: function () { t.von = von.value; Store.einstellungenSpeichern(); }
    });
    var bis = UI.el("input.feld.zeit", {
      type: "time", value: t.bis || "",
      onchange: function () { t.bis = bis.value; Store.einstellungenSpeichern(); }
    });

    return UI.el("div.karte.held", [
      name,
      UI.el("div.unterkopf", { text: "An welchen Tagen?" }),
      UI.el("div.chips", WT.map(function (w, d) {
        var an = (t.tage || []).indexOf(d) >= 0;
        return UI.el("button.chip" + (an ? ".an" : ""), {
          type: "button",
          onclick: function () {
            t.tage = an ? t.tage.filter(function (x) { return x !== d; })
                        : (t.tage || []).concat([d]).sort();
            speichern();
          }
        }, w);
      })),
      UI.el("div.unterkopf", { text: "Uhrzeit" }),
      UI.el("div.zeitreihe", [von, UI.el("span.zt", { text: "bis" }), bis]),
      UI.el("div.unterkopf", { text: "Art" }),
      UI.el("div.chips", Object.keys(Termine.ARTEN).map(function (a) {
        var an = t.art === a;
        return UI.el("button.chip" + (an ? ".an" : ""), {
          type: "button", onclick: function () { t.art = a; speichern(); }
        }, Termine.ARTEN[a].name);
      })),
      UI.el("div.zfknoepfe", { style: "margin-top:.8rem" }, [
        UI.el("button.mini", {
          type: "button", onclick: function () { bearbeite = null; zeichne(); }
        }, "Fertig"),
        UI.el("button.mini", {
          type: "button",
          onclick: function () { e.termine.splice(i, 1); bearbeite = null; speichern(); }
        }, "Löschen")
      ])
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    var e = Store.einstellungen;
    var eingabe = UI.el("input.aufgabenfeld.gross", {
      type: "text", placeholder: "Neuer Termin, z. B. Vorlesung …",
      onkeydown: function (ev) { if (ev.key === "Enter") anlegen(); }
    });
    function anlegen() {
      var n = eingabe.value.trim();
      if (!n) return;
      var id = "t" + Date.now().toString(36);
      e.termine.push({ id: id, name: n, tage: [], von: "18:00", bis: "19:00", art: "privat" });
      bearbeite = id;
      speichern();
    }

    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Termine", (e.termine || []).length + " wiederkehrend", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Diese Termine erscheinen im Kalender, im Morgenbriefing und in der Kalenderdatei für dein iPhone. Antippen zum Ändern."
        })
      ]),
      UI.el("div.karte", [
        UI.el("div.zeitreihe", [eingabe, UI.el("button.mini", { type: "button", onclick: anlegen }, "+")])
      ])
    ].concat((e.termine || []).map(terminKarte)).concat([
      UI.el("button.cta.leise", {
        type: "button", onclick: function () { location.hash = "#/mehr"; }
      }, "Zurück")
    ])));
  }

  function oeffnen(root) { wurzel = root; bearbeite = null; zeichne(); return Promise.resolve(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();


/* ==================== Morgenbriefing ==================== */
var AnsichtBriefing = (function () {
  "use strict";
  var wurzel = null, tag = null, tage = [], aufgaben = [];

  function zeichne() {
    if (!wurzel) return;
    var e = Store.einstellungen;
    var jetzt = new Date();
    var h = Hijri.fuer(jetzt);
    var z = Gebetszeiten.fuer(jetzt);
    var termine = Termine.fuerTag(jetzt);
    var ram = Modi.ramadanInfo();
    var reise = Modi.reiseInfo();

    var heute = Store.key();
    var faellig = aufgaben.filter(function (a) {
      return !a.erledigt && a.faellig && a.faellig <= heute;
    });
    var wichtigste = (tag.arbeit && tag.arbeit.wichtigste) || [];
    var gesetzt = wichtigste.filter(function (x) { return x && x.text; });

    var d = Hifz.heuteDran();
    var vers = Ayat.fuerHeute(tag);

    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Guten Morgen", UI.datumLang(jetzt), h.textAr));
    wurzel.appendChild(UI.el("div.inhalt", [

      UI.el("div.assistent", { text: Assistent.satzZumVortag(tage, tag.datum) }),

      /* Gebetszeiten des Tages */
      UI.el("div.karte.held", [
        UI.el("span.etikett", { text: "Heute" }),
        UI.el("div.gzeiten", Gebetszeiten.PFLICHT.map(function (k) {
          return UI.el("span.gz", [
            UI.el("i", { text: Gebetszeiten.NAMEN[k].de }),
            UI.el("b", { text: Gebetszeiten.uhr(z[k]) })
          ]);
        }))
      ]),

      ram && ram.aktiv ? UI.el("div.karte.ramadan", [
        UI.el("span.etikett", { text: "Ramaḍān · Tag " + ram.tag }),
        UI.el("p.aurteil", {
          text: "Suḥūr bis " + Gebetszeiten.uhr(ram.suhurBis) +
                " · Ifṭār " + Gebetszeiten.uhr(ram.iftar) + " · heute Juz' " + ram.juzHeute
        })
      ]) : null,

      reise ? UI.el("div.karte.hinweis", [UI.el("div.hz", { text: reise.satz })]) : null,

      /* Termine */
      termine.length ? UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Termine heute" }),
        UI.el("div.gruppe", termine.map(function (t) {
          return UI.zeile({ text: t.name, wert: t.von + (t.bis ? "–" + t.bis : "") });
        }))
      ]) : null,

      /* Die drei Wichtigsten */
      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Die drei Wichtigsten" }),
        UI.el("div.gruppe", gesetzt.length
          ? gesetzt.map(function (x) {
              return UI.zeile({ haken: x.erledigt, text: x.text });
            })
          : [UI.el("div.zeile.tippbar.leer", {
              onclick: function () { location.hash = "#/arbeit"; }
            }, "Noch nicht gesetzt — jetzt festlegen")])
      ]),

      faellig.length ? UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Fällig · " + faellig.length }),
        UI.el("div.gruppe", faellig.slice(0, 5).map(function (a) {
          return UI.zeile({ text: a.text, wert: a.projekt ? a.projekt.split(" ")[0] : null });
        }))
      ]) : null,

      /* Qur'an */
      UI.el("div.karte", [
        UI.el("span.etikett", { text: "Qur'an heute" }),
        UI.el("p.aurteil", {
          text: (d.neu ? "Neu: " + d.neu.de + " (" + d.neu.verse + " Verse). " : "") +
                (d.pruefung ? "Prüfungstag." : "Murājaʿa: " + d.verse + " Verse.")
        })
      ]),

      vers ? UI.el("div.karte.aya", [
        UI.el("div.a", { text: vers.ar, dir: "rtl", lang: "ar" }),
        UI.el("div.de", { text: "„" + vers.de + "“" }),
        UI.el("div.quelle", { text: vers.quelle })
      ]) : null,

      UI.el("button.cta", {
        type: "button", onclick: function () { location.hash = "#/heute"; }
      }, "Los geht's")
    ].filter(Boolean)));
  }

  function oeffnen(root) {
    wurzel = root;
    return Promise.all([Store.tag(), Store.letzteTage(30), Store.aufgaben(), Hifz.laden(), Ayat.laden()])
      .then(function (r) {
        tag = r[0];
        tage = r[1];
        aufgaben = r[2];
        zeichne();
      });
  }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();
