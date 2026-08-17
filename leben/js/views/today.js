/* Mīzān – „Heute". Eine ruhige Übersicht, keine Liste zum Abarbeiten.
   Wer tagsüber etwas eintragen will, kann es. Wer es abends in einem
   Rutsch macht, geht über „Tag abschließen". */
var AnsichtHeute = (function () {
  "use strict";

  var tag = null, tage = [], zeiten = null, timer = null, wurzel = null;

  function sichern() {
    return Store.tagSpeichern(tag).then(zeichne);
  }

  /* ---------- Nächstes Gebet ---------- */
  function gebetsKarte() {
    var heute = Store.istHeute();
    var gehalten = Gebetszeiten.PFLICHT.filter(function (k) {
      return tag.gebete[k] && tag.gebete[k] !== "verpasst";
    }).length;

    if (!heute) {
      return UI.el("div.karte.tippbar", {
        onclick: function () { location.hash = "#/gebete"; }
      }, [
        UI.el("span.etikett", { text: "Gebete an diesem Tag" }),
        UI.el("div.gebetzeile", [
          UI.el("span.gname.klein", { text: gehalten + " von 5" }),
          UI.el("span.gzeit", { text: "gehalten" })
        ]),
        gebetsPunkte(),
        UI.el("span.bpfeil", { text: "›" })
      ]);
    }

    var a = Gebetszeiten.aktuell(new Date());
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
        return UI.el("button.chip" + (eingetragen === s.key ? ".an" : ""), {
          type: "button",
          onclick: function () {
            tag.gebete[a.key] = eingetragen === s.key ? null : s.key;
            sichern();
            UI.meldung(Gebetszeiten.NAMEN[a.key].de + " · " + s.text);
          }
        }, s.text);
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

  /* Fünf Punkte für die fünf Gebete, in der Farbe ihrer Stufe */
  function gebetsPunkte() {
    return UI.el("div.gzeiten", Gebetszeiten.PFLICHT.map(function (k) {
      var w = tag.gebete[k];
      return UI.el("span.gz" + (w ? ".w-" + w : ""), [
        UI.el("i", { text: Gebetszeiten.NAMEN[k].de }),
        UI.el("b", { text: Gebetszeiten.uhr(zeiten[k]) })
      ]);
    }));
  }

  /* ---------- Was heute ansteht ---------- */
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
    if (Fasten.geplant(tag.datum)) punkte.push("Fastentag — von dir vorgemerkt");
    else if (d.getDay() === 1 || d.getDay() === 4) punkte.push("Fastenvorschlag: Montag / Donnerstag");
    Termine.fuerTag(d).forEach(function (t) { punkte.push(t.name + " · " + t.von); });
    (Store.einstellungen.eintraege || []).forEach(function (x) {
      if (x.datum === tag.datum) punkte.push(x.name + (x.von ? " · " + x.von : ""));
    });
    if (!punkte.length) return null;
    return UI.el("div.karte.hinweis", punkte.map(function (p) {
      return UI.el("div.hz", { text: p });
    }));
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
          type: "button", onclick: function () { tag.fasten = !tag.fasten; sichern(); }
        }, tag.fasten ? "Gefastet" : "Ich faste"),
        UI.el("button.chip" + (tag.sunnah.tarawih ? ".an" : ""), {
          type: "button", onclick: function () { tag.sunnah.tarawih = !tag.sunnah.tarawih; sichern(); }
        }, "Tarāwīḥ")
      ]),
      r.ungeradeNacht ? UI.el("p.klein", {
        text: "Ungerade Nacht der letzten zehn — Laylat al-Qadr wird in ihnen gesucht."
      }) : null
    ].filter(Boolean));
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

  /* ---------- Der Weg in den Abschluss ---------- */
  function abschlussKarte() {
    var gehalten = Gebetszeiten.PFLICHT.filter(function (k) { return tag.gebete[k]; }).length;
    if (tag.muhasaba) {
      return UI.el("div.karte.fertig.tippbar", {
        onclick: function () { location.hash = "#/abschluss"; }
      }, [
        UI.el("div.ft", { text: "Tag abgeschlossen" }),
        UI.el("div.fs", { text: "Antippen, um noch etwas zu ändern" })
      ]);
    }
    return UI.el("div", [
      UI.el("button.cta", {
        type: "button", onclick: function () { location.hash = "#/abschluss"; }
      }, Store.istHeute() ? "Tag abschließen" : "Diesen Tag nachtragen"),
      Store.istHeute() && gehalten < 5 && new Date() < zeiten.maghrib
        ? UI.el("p.klein", { text: "Geht jederzeit — gedacht ist es für nach ʿIshā'." })
        : null
    ].filter(Boolean));
  }

  /* ---------- Zeichnen ---------- */
  function zeichne() {
    if (!wurzel) return;
    var d = Store.ausKey(tag.datum);
    var h = Hijri.fuer(d);
    var heute = Store.istHeute();
    UI.leeren(wurzel);

    var kopf = UI.kopf(heute ? "Heute" : "Rückblick", UI.datumLang(d), h.textAr);
    kopf.appendChild(UI.el("button.zahnrad", {
      type: "button", "aria-label": "Einstellungen",
      onclick: function () { location.hash = "#/mehr"; }
    }, "⚙"));
    wurzel.appendChild(kopf);

    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(neuLaden),
      heute ? UI.el("div.assistent", { text: Assistent.satzZumVortag(tage, tag.datum) }) : null,
      gebetsKarte(),
      ramadanKarte(),
      hinweisKarte(),
      abschlussKarte(),
      heute ? ayaKarte() : null
    ].filter(Boolean)));
  }

  function neuLaden() {
    return Promise.all([Store.tag(), Store.letzteTage(30), Ayat.laden(), Hifz.laden()])
      .then(function (r) {
        tag = r[0]; tage = r[1];
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

  function schliessen() { clearInterval(timer); wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
