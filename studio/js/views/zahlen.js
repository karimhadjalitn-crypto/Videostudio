/* Sūq – Zahlen.

   Das hier ist der Apparat, mit dem ein Winning Product gefunden wird.
   Ohne ihn suchst du im Dunkeln, und die ersten Monate sind lang genug.

   Die entscheidende Größe ist nicht die Provision und auch nicht die
   Reichweite, sondern die Provision je tausend Aufrufe. Ein Video mit
   4.000 Views und zwei Verkäufen schlägt eines mit 90.000 Views und
   einem — und ohne diese Zahl siehst du genau das nicht.

   Die App rechnet nichts schön. Bei kleinen Zahlen sagt sie, dass es
   kleine Zahlen sind. */
var AnsichtZahlen = (function () {
  "use strict";

  var wurzel = null;
  var offen = null;   // Video, dessen Zahlen gerade bearbeitet werden

  /* ---------- Rechnen ---------- */

  function ausVideo(v) {
    var z = v.zahlen;
    return {
      views: z.views || 0,
      klicks: z.klicks || 0,
      bestellungen: z.bestellungen || 0,
      provision: z.provision || 0
    };
  }

  function summe(videos) {
    return videos.reduce(function (s, v) {
      var z = ausVideo(v);
      s.views += z.views; s.klicks += z.klicks;
      s.bestellungen += z.bestellungen; s.provision += z.provision;
      return s;
    }, { views: 0, klicks: 0, bestellungen: 0, provision: 0 });
  }

  /* Provision je tausend Aufrufe. Der einzige faire Vergleich zwischen
     einem Video, das lief, und einem, das nicht lief. */
  function rpm(s) {
    return s.views ? (s.provision / s.views) * 1000 : null;
  }

  function anteil(a, b) { return b ? a / b : null; }

  function prozent(x, stellen) {
    if (x == null) return "—";
    return (x * 100).toLocaleString("de-DE", {
      minimumFractionDigits: stellen == null ? 1 : stellen,
      maximumFractionDigits: stellen == null ? 1 : stellen
    }) + " %";
  }

  /* ---------- Monat ---------- */
  function monatsSumme() {
    var jetzt = new Date();
    var start = new Date(jetzt.getFullYear(), jetzt.getMonth(), 1).toISOString();
    return summe(Store.videos().filter(function (v) {
      return v.gepostetAm && v.gepostetAm >= start;
    }));
  }

  /* ---------- Urteil ----------
     Hier steht bewusst kein Zuspruch. Der Wert dieser Zeile liegt darin,
     dass sie stimmt. */
  function einschaetzung(gepostet, ges) {
    if (gepostet < 5) {
      return "Zu wenige Videos, um irgendetwas abzulesen. Unter zwanzig geposteten Videos " +
             "sind alle Zahlen hier Zufall.";
    }
    if (gepostet < 20) {
      return gepostet + " Videos gepostet. Das ist ein Anfang, aber noch keine Grundlage: " +
             "welches Produkt trägt, zeigt sich erfahrungsgemäß erst danach.";
    }
    if (!ges.bestellungen) {
      return gepostet + " Videos, keine Bestellung. Das liegt selten am Schnitt. " +
             "Meistens liegt es am Produkt oder daran, dass der Hook nicht das Problem trifft.";
    }
    var r = rpm(ges);
    if (r != null && r < 1) {
      return "Es läuft, aber dünn: " + UI.euro(r) + " je tausend Aufrufe. " +
             "Schau, welches Produkt oben in der Liste steht, und mach davon mehr.";
    }
    return "Ein Produkt trägt erkennbar. Alles, was jetzt zählt, ist Wiederholung — " +
           "nicht Abwechslung.";
  }

  /* ---------- Produktrangliste ---------- */
  function rangliste() {
    var reihen = Store.produkte().map(function (p) {
      var videos = Store.videosZu(p.id).filter(function (v) { return v.stand === "gepostet"; });
      var s = summe(videos);
      return { p: p, n: videos.length, s: s, rpm: rpm(s) };
    }).filter(function (r) { return r.n > 0; });

    /* Ohne Aufrufe kein Rang — sonst steht ein ungetestetes Produkt oben,
       nur weil es nirgends schlecht war. */
    reihen.sort(function (a, b) {
      if (a.rpm == null && b.rpm == null) return b.s.views - a.s.views;
      if (a.rpm == null) return 1;
      if (b.rpm == null) return -1;
      return b.rpm - a.rpm;
    });
    return reihen;
  }

  /* ---------- Zahlen eintragen ---------- */
  function eintragen(v) {
    function zahlFeld(feld, name, platzhalter) {
      return UI.beschriftet(name, UI.feld({
        wert: v.zahlen[feld], typ: "number", inputmode: "decimal",
        platzhalter: platzhalter,
        onchange: function (e) {
          v.zahlen[feld] = e.target.value === "" ? null : parseFloat(e.target.value);
          Store.videoSpeichern(v);
        }
      }));
    }
    return UI.el("div.gruppe.eintrag", [
      zahlFeld("views", "Aufrufe", "0"),
      zahlFeld("klicks", "Klicks auf das Produkt", "0"),
      zahlFeld("bestellungen", "Bestellungen", "0"),
      zahlFeld("provision", "Provision in Euro", "0,00"),
      UI.beschriftet("Gepostet am", UI.feld({
        typ: "date",
        wert: v.gepostetAm ? v.gepostetAm.slice(0, 10) : "",
        onchange: function (e) {
          v.gepostetAm = e.target.value ? new Date(e.target.value).toISOString() : null;
          if (v.gepostetAm) v.stand = "gepostet";
          Store.videoSpeichern(v).then(zeichne);
        }
      }))
    ]);
  }

  /* ---------- Zeichnen ---------- */
  function zeichne() {
    UI.leeren(wurzel);

    var gepostet = Store.videos().filter(function (v) { return v.stand === "gepostet"; });
    var ges = summe(gepostet);
    var monat = monatsSumme();
    var ziel = Store.einstellungen.ziel.provisionProMonat;

    wurzel.appendChild(UI.kopf("Zahlen",
      UI.plural(gepostet.length, "Video gepostet", "Videos gepostet"), ""));

    var kacheln = [
      { wert: UI.zahl(ges.views), name: "Aufrufe" },
      { wert: prozent(anteil(ges.klicks, ges.views)), name: "Klickrate" },
      { wert: prozent(anteil(ges.bestellungen, ges.klicks)), name: "Kaufrate" },
      { wert: rpm(ges) == null ? "—" : UI.euro(rpm(ges)), name: "je 1.000 Aufrufe" }
    ];

    wurzel.appendChild(UI.el("div.inhalt", [
      /* Der Monat gegen das Ziel */
      UI.karte("monat", [
        UI.el("div.mkopf2", [
          UI.el("span.mt2", { text: "Diesen Monat" }),
          UI.el("span.mw", { text: UI.euro(monat.provision) })
        ]),
        UI.balken(ziel ? monat.provision / ziel : 0),
        UI.el("div.mziel", {
          text: "Ziel " + UI.euro(ziel) +
                (monat.provision >= ziel ? " — erreicht."
                  : " — es fehlen " + UI.euro(ziel - monat.provision) + ".")
        })
      ]),

      UI.el("div.kacheln", kacheln.map(function (k) {
        return UI.el("div.kachel", [
          UI.el("span.kw", { text: k.wert }),
          UI.el("span.kn", { text: k.name })
        ]);
      })),

      UI.karte("hinweis", [
        UI.el("div.hz", { text: einschaetzung(gepostet.length, ges) })
      ]),

      /* Rangliste — das ist die Seite, wegen der es diese Ansicht gibt */
      rangliste().length
        ? UI.el("div.block", [
            UI.el("div.blockkopf", [
              UI.el("span", { text: "Produkte nach Ertrag" }),
              UI.el("span.bhinweis", { text: "je 1.000 Aufrufe" })
            ]),
            UI.el("div.gruppe", rangliste().map(function (r, i) {
              return UI.el("div.zeile.rang.tippbar", {
                onclick: function () { location.hash = "#/produkt?id=" + r.p.id; }
              }, [
                UI.el("span.rnr" + (i === 0 ? ".erster" : ""), { text: String(i + 1) }),
                UI.el("div.rt", [
                  UI.el("span.rname", { text: r.p.name || "Ohne Namen" }),
                  UI.el("span.rmeta", {
                    text: UI.plural(r.n, "Video", "Videos") + " · " +
                          UI.zahl(r.s.views) + " Aufrufe · " +
                          UI.plural(r.s.bestellungen, "Bestellung", "Bestellungen")
                  })
                ]),
                UI.el("div.rw", [
                  UI.el("span.rwert", { text: r.rpm == null ? "—" : UI.euro(r.rpm) }),
                  UI.el("span.rges", { text: UI.euro(r.s.provision) })
                ])
              ]);
            }))
          ])
        : null,

      /* Eintragen — je Video, aufklappbar */
      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Zahlen nachtragen" }),
        UI.el("div.gruppe", Store.videos().length
          ? Store.videos().map(function (v) {
              var z = ausVideo(v);
              var zeile = UI.zeile({
                text: v.titel || "Ohne Titel",
                dehnbar: true,
                unter: v.gepostetAm ? UI.datum(v.gepostetAm) : Store.STUFEN_NAME[v.stand],
                wert: z.views ? UI.zahl(z.views) + " · " + UI.euro(z.provision) : "—",
                onclick: function () {
                  offen = (offen === v.id) ? null : v.id;
                  zeichne();
                }
              });
              if (offen === v.id) {
                var huelle = UI.el("div", [zeile, eintragen(v)]);
                return huelle;
              }
              return zeile;
            })
          : [UI.el("div.zeile.leer", { text: "Noch kein Video." })])
      ])
    ].filter(Boolean)));
  }

  function oeffnen(root) { wurzel = root; zeichne(); }
  function schliessen() { wurzel = null; offen = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
