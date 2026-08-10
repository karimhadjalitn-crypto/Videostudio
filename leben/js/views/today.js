/* Mīzān – „Heute“. Der einzige Bildschirm, den du täglich siehst.
   Über das Datumsband erreichst du auch vergangene Tage und trägst
   dort genauso ein. */
var AnsichtHeute = (function () {
  "use strict";

  var tag = null, tage = [], zeiten = null, timer = null, wurzel = null, notizOffen = false;

  function setzeTief(obj, pfad, wert) {
    var t = pfad.split("."), z = obj;
    for (var i = 0; i < t.length - 1; i++) z = z[t[i]];
    z[t[t.length - 1]] = wert;
  }
  function holeTief(obj, pfad) {
    return pfad.split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, obj);
  }

  function speichern(neuZeichnen) {
    tag.score = Score.fuer(tag).wert;
    return Store.tagSpeichern(tag).then(function () {
      if (neuZeichnen !== false) zeichne();
    });
  }

  function gebetTippen(stufe) {
    var a = Gebetszeiten.aktuell(new Date());
    var k = Store.istHeute() ? a.key : "fajr";
    tag.gebete[k] = tag.gebete[k] === stufe ? null : stufe;
    speichern();
    UI.meldung(Gebetszeiten.NAMEN[k].de + " · " + stufe);
  }

  /* ---------- Gebete ---------- */
  function gebetsKarte() {
    var jetzt = new Date();
    var a = Gebetszeiten.aktuell(jetzt);
    var heute = Store.istHeute();

    // An vergangenen Tagen gibt es kein „nächstes Gebet“ — dort alle fünf
    if (!heute) {
      return UI.el("div.karte", [
        UI.el("span.etikett", { text: "Gebete an diesem Tag" }),
        UI.el("div.gruppe.blank", Gebetszeiten.PFLICHT.map(function (k) {
          var w = tag.gebete[k];
          return UI.el("div.mzeile", [
            UI.el("div.mkopf", [
              UI.el("span.zt", { text: Gebetszeiten.NAMEN[k].de }),
              UI.el("span.ar", { text: Gebetszeiten.NAMEN[k].ar }),
              UI.el("span.zw", { text: Gebetszeiten.uhr(zeiten[k]) })
            ]),
            UI.el("div.stufen", Score.GEBETSSTUFEN.map(function (s) {
              var an = w === s.key;
              return UI.el("button.stufe.f-" + s.farbe + (an ? ".an" : ""), {
                type: "button", title: s.lang,
                onclick: function () { tag.gebete[k] = an ? null : s.key; speichern(); }
              }, s.kurz);
            }))
          ]);
        }))
      ]);
    }

    var eingetragen = tag.gebete[a.key];
    var stufen = [
      { key: "puenktlich", text: "Gebetet" },
      { key: "moschee", text: "Moschee" },
      { key: "spaet", text: "Verspätet" }
    ];

    return UI.el("div.karte.held", [
      UI.el("span.etikett", { text: "Nächstes Gebet" }),
      UI.el("div.gebetzeile", [
        UI.el("span.gname", { text: a.name.de }),
        UI.el("span.ar", { text: a.name.ar }),
        UI.el("span.gzeit", { text: Gebetszeiten.restText(a.restMs) })
      ]),
      UI.balken(a.anteil),
      UI.el("div.chips", stufen.map(function (s) {
        return UI.el("button.chip" + (eingetragen === s.key ? ".an" : ""),
          { type: "button", onclick: function () { gebetTippen(s.key); } }, s.text);
      })),
      UI.el("div.gzeiten", Gebetszeiten.PFLICHT.map(function (k) {
        var w = tag.gebete[k];
        return UI.el("span.gz" + (w ? ".w-" + w : "") + (k === a.key ? ".jetzt" : ""), {
          onclick: function () { location.hash = "#/gebete"; }
        }, [
          UI.el("i", { text: Gebetszeiten.NAMEN[k].de }),
          UI.el("b", { text: Gebetszeiten.uhr(zeiten[k]) })
        ]);
      }))
    ]);
  }

  function scoreKarte() {
    var s = Score.fuer(tag);
    var schnitt = Score.schnitt(tage, tag.datum);
    var diff = schnitt == null ? null : s.wert - schnitt;
    return UI.el("div.karte.scorekarte", {
      onclick: function () { location.hash = "#/bereiche"; }
    }, [
      UI.ring(s.wert / 100, s.wert),
      UI.el("div.smeta", [
        UI.el("div.st", { text: "Tagesscore" }),
        UI.el("div.ss", diff == null
          ? [UI.el("span", { text: s.tagZu ? "Tag abgeschlossen" : "läuft noch" })]
          : [
              UI.el("span" + (diff >= 0 ? ".hoch" : ".tief"),
                { text: (diff >= 0 ? "▲ " : "▼ ") + Math.abs(diff) }),
              UI.el("span", { text: " " + (diff >= 0 ? "über" : "unter") + " deinem Schnitt" })
            ])
      ]),
      UI.el("span.bpfeil", { text: "›" })
    ]);
  }

  /* ---------- Tagespunkte: Erledigtes bleibt sichtbar ---------- */
  function punkteBlock() {
    var e = Store.einstellungen;
    var liste = Assistent.tagesliste(tag, e);
    var eigene = Punkte.alle().filter(function (p) { return p.aufHeute !== false; });

    var offen = liste.filter(function (x) { return !x.erledigt; }).length +
                eigene.filter(function (p) { return !Punkte.erledigt(tag, p); }).length;
    var gesamt = liste.length + eigene.length;

    function standardZeile(p) {
      if (p.ziel) {
        return UI.zeile({
          haken: p.erledigt, text: p.text, wert: p.wert,
          onclick: function () { location.hash = p.key; },
          rechts: UI.el("span.bpfeil.klein", { text: "›" })
        });
      }
      /* Zähler statt Haken: Tippen zählt hoch, „−“ nimmt zurück.
         Nichts verschwindet dabei aus der Liste. */
      var ZAEHLER = {
        wasser:          { hole: function () { return tag.wasser || 0; },
                           setz: function (n) { tag.wasser = Math.round(Math.max(0, n) * 100) / 100; },
                           schritt: 0.25 },
        "quran.gelesen": { hole: function () { return tag.quran.gelesen || 0; },
                           setz: function (n) { tag.quran.gelesen = Math.max(0, n); },
                           schritt: 1 },
        "dhikr.nachGebet": { hole: function () { return tag.dhikr.nachGebet || 0; },
                           setz: function (n) { tag.dhikr.nachGebet = Math.min(5, Math.max(0, n)); },
                           schritt: 1 }
      };
      var z = ZAEHLER[p.key];
      if (z) {
        return UI.zeile({
          haken: p.erledigt, text: p.text, ar: p.ar, wert: p.wert,
          onclick: function () { z.setz(z.hole() + z.schritt); speichern(); },
          rechts: z.hole() > 0 ? UI.el("button.mini.klein", {
            type: "button", "aria-label": "weniger",
            onclick: function (ev) {
              ev.stopPropagation();
              z.setz(z.hole() - z.schritt);
              speichern();
            }
          }, "−") : null
        });
      }

      return UI.zeile({
        haken: p.erledigt, text: p.text, ar: p.ar, wert: p.wert,
        onclick: function () {
          setzeTief(tag, p.key, !holeTief(tag, p.key));
          speichern();
        }
      });
    }

    var zeilen = liste.map(standardZeile)
      .concat(eigene.map(function (p) {
        return UI.punktZeile(tag, p, function () { speichern(); });
      }));

    return UI.el("div.block", [
      UI.el("div.blockkopf.mitknopf", [
        UI.el("span", { text: gesamt ? "Tagespunkte · " + (gesamt - offen) + " von " + gesamt : "Tagespunkte" }),
        UI.el("button.kopfknopf", {
          type: "button", onclick: function () { location.hash = "#/punkte"; }
        }, "Anpassen")
      ]),
      UI.el("div.gruppe", zeilen.length ? zeilen
        : [UI.el("div.zeile.leer", { text: "Keine Punkte gewählt — unter „Anpassen“ einrichten." })])
    ]);
  }

  function ayaKarte() {
    var v = Ayat.fuerHeute(tag);
    if (!v) return null;
    return UI.el("div.karte.aya", [
      UI.el("div.a", { text: v.ar, dir: "rtl", lang: "ar" }),
      UI.el("div.de", { text: "„" + v.de + "“" }),
      UI.el("div.quelle", { text: v.quelle })
    ]);
  }

  function ramadanKarte() {
    var r = Modi.ramadanInfo(Store.ausKey(tag.datum));
    if (!r || !r.aktiv) return null;
    return UI.el("div.karte.held.ramadan", [
      UI.el("span.etikett", { text: "Ramaḍān · Tag " + r.tag + (r.letzteZehn ? " · die letzten zehn" : "") }),
      UI.el("div.gzeiten", [
        UI.el("span.gz", [UI.el("i", { text: "Suḥūr bis" }), UI.el("b", { text: Gebetszeiten.uhr(r.suhurBis) })]),
        UI.el("span.gz", [UI.el("i", { text: "Ifṭār" }), UI.el("b", { text: Gebetszeiten.uhr(r.iftar) })]),
        UI.el("span.gz", [UI.el("i", { text: "Qur'an" }), UI.el("b", { text: "Juz' " + r.juzHeute })])
      ]),
      UI.el("div.chips", [
        UI.el("button.chip" + (tag.fasten ? ".an" : ""), {
          type: "button", onclick: function () { tag.fasten = !tag.fasten; speichern(); }
        }, tag.fasten ? "Gefastet" : "Ich faste"),
        UI.el("button.chip" + (tag.sunnah.tarawih ? ".an" : ""), {
          type: "button", onclick: function () { tag.sunnah.tarawih = !tag.sunnah.tarawih; speichern(); }
        }, "Tarāwīḥ")
      ]),
      r.ungeradeNacht ? UI.el("p.klein", {
        text: "Ungerade Nacht der letzten zehn — Laylat al-Qadr wird in ihnen gesucht."
      }) : null
    ].filter(Boolean));
  }

  function hinweisKarte() {
    var d = Store.ausKey(tag.datum);
    var h = Hijri.fuer(d);
    var punkte = [];
    var reise = Store.istHeute() ? Modi.reiseInfo() : null;
    if (reise) punkte.push(reise.satz);
    if (h.weisserTag) punkte.push("Weißer Tag — " + h.tag + ". " + h.monatName);
    if (d.getDay() === 5) {
      var sommer = d.getMonth() >= 3 && d.getMonth() <= 9;
      punkte.push("Jumuʿa um " + (sommer ? Store.einstellungen.jumua.sommer : Store.einstellungen.jumua.winter));
    }
    if (d.getDay() === 1 || d.getDay() === 4) punkte.push("Fastenvorschlag: Montag / Donnerstag");
    var termine = Termine.fuerTag(d);
    termine.forEach(function (t) { punkte.push(t.name + " · " + t.von); });
    (Store.einstellungen.eintraege || []).forEach(function (x) {
      if (x.datum === tag.datum) punkte.push(x.name + (x.von ? " · " + x.von : ""));
    });
    if (!punkte.length) return null;
    return UI.el("div.karte.hinweis", punkte.map(function (p) {
      return UI.el("div.hz", { text: p });
    }));
  }

  /* Notiz zum Tag. Beim Rückblick der wichtigste Punkt: was du in Zahlen
     nicht abbilden kannst, schreibst du hier hin, solange du es noch weißt. */
  function notizKarte() {
    if (!notizOffen && !tag.notiz) {
      return UI.el("div.block", [
        UI.el("div.gruppe", [
          UI.el("div.zeile.tippbar.hinzu", {
            onclick: function () { notizOffen = true; zeichne(); }
          }, [
            UI.el("span.zt.dehnbar", { text: "Notiz zu diesem Tag" }),
            UI.el("span.bpfeil.klein", { text: "›" })
          ])
        ])
      ]);
    }
    var feld = UI.el("textarea.notizfeld", {
      rows: 3,
      placeholder: Store.istHeute() ? "Was war heute?" : "Was war an dem Tag?",
      oninput: function () { tag.notiz = feld.value; },
      onblur: function () { speichern(false); }
    });
    feld.value = tag.notiz || "";
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Notiz zum Tag" }),
      feld
    ]);
  }

  function muhasabaKnopf() {
    if (tag.muhasaba) {
      return UI.el("div.karte.fertig.tippbar", {
        onclick: function () { location.hash = "#/muhasaba"; }
      }, [
        UI.el("div.ft", { text: "Abendabrechnung erledigt" }),
        UI.el("div.fs", { text: "Tagesscore " + tag.score + " · nochmal ansehen" })
      ]);
    }
    if (Store.istHeute() && new Date() < zeiten.maghrib) {
      return UI.el("div.notiz", {
        text: "Die Abendabrechnung öffnet ab Maghrib, " + Gebetszeiten.uhr(zeiten.maghrib) + "."
      });
    }
    return UI.el("button.cta", {
      type: "button", onclick: function () { location.hash = "#/muhasaba"; }
    }, Store.istHeute() ? "Abendabrechnung starten" : "Diesen Tag abrechnen");
  }

  /* ---------- Zeichnen ---------- */
  function zeichne() {
    if (!wurzel) return;
    var d = Store.ausKey(tag.datum);
    var h = Hijri.fuer(d);
    var heute = Store.istHeute();
    UI.leeren(wurzel);

    var kopf = UI.kopf(heute ? "Heute" : "Rückblick", UI.datumLang(d), h.textAr);
    if (heute && new Date() < zeiten.dhuhr) {
      kopf.classList.add("tippbar");
      kopf.addEventListener("click", function () { location.hash = "#/briefing"; });
      kopf.appendChild(UI.el("div.briefinghinweis", { text: "Morgenbriefing öffnen ›" }));
    }
    wurzel.appendChild(kopf);

    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(neuLaden),
      heute ? UI.el("div.assistent", { text: Assistent.satzZumVortag(tage, tag.datum) }) : null,
      gebetsKarte(),
      scoreKarte(),
      ramadanKarte(),
      hinweisKarte(),
      punkteBlock(),
      notizKarte(),
      heute ? ayaKarte() : null,
      muhasabaKnopf()
    ].filter(Boolean)));
  }

  function neuLaden() {
    return Promise.all([Store.tag(), Store.letzteTage(60), Ayat.laden(), Hifz.laden()])
      .then(function (r) {
        tag = r[0]; tage = r[1]; notizOffen = false;
        zeiten = Gebetszeiten.fuer(Store.ausKey(tag.datum));
        zeichne();
      });
  }

  function oeffnen(root) {
    wurzel = root;
    return neuLaden().then(function () {
      clearInterval(timer);
      timer = setInterval(function () {
        if (wurzel && wurzel.isConnected && Store.istHeute()) zeichne();
      }, 30000);
    });
  }

  function schliessen() { clearInterval(timer); wurzel = null; notizOffen = false; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
