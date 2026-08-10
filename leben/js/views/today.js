/* Mīzān – „Heute“. Der einzige Bildschirm, den du täglich siehst. */
var AnsichtHeute = (function () {
  "use strict";

  var tag = null, tage = [], zeiten = null, timer = null;

  function setzeTief(obj, pfad, wert) {
    var t = pfad.split("."), z = obj;
    for (var i = 0; i < t.length - 1; i++) z = z[t[i]];
    z[t[t.length - 1]] = wert;
  }
  function holeTief(obj, pfad) {
    return pfad.split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, obj);
  }

  function speichern(neuZeichnen) {
    var s = Score.fuer(tag);
    tag.score = s.wert;
    return Store.tagSpeichern(tag).then(function () {
      if (neuZeichnen !== false) zeichne();
    });
  }

  function gebetTippen(stufe) {
    var a = Gebetszeiten.aktuell(new Date());
    tag.gebete[a.key] = tag.gebete[a.key] === stufe ? null : stufe;
    speichern();
    UI.meldung(Gebetszeiten.NAMEN[a.key].de + " · " + stufe);
  }

  /* ---------- Bausteine ---------- */
  function gebetsKarte() {
    var jetzt = new Date();
    var a = Gebetszeiten.aktuell(jetzt);
    var eingetragen = tag.gebete[a.key];
    // Die drei häufigsten Fälle. Alle fünf Stufen gibt es im Reiter „Gebete“.
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
        return UI.el("span.gz" + (w ? ".w-" + w : "") + (k === a.key ? ".jetzt" : ""), [
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
    return UI.el("div.karte.scorekarte", [
      UI.ring(s.wert / 100, s.wert),
      UI.el("div.smeta", [
        UI.el("div.st", { text: "Tagesscore" }),
        UI.el("div.ss", diff == null
          ? [UI.el("span", { text: "noch kein Vergleich" })]
          : [
              UI.el("span" + (diff >= 0 ? ".hoch" : ".tief"),
                { text: (diff >= 0 ? "▲ " : "▼ ") + Math.abs(diff) }),
              UI.el("span", { text: " " + (diff >= 0 ? "über" : "unter") + " deinem Schnitt" })
            ])
      ])
    ]);
  }

  function offenBlock() {
    var e = Store.einstellungen;
    var liste = Assistent.offen(tag, e);
    if (!liste.length) {
      return UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Offen heute" }),
        UI.el("div.gruppe", [UI.el("div.zeile.leer", { text: "Nichts mehr offen. Alḥamdulillāh." })])
      ]);
    }
    var zeilen = liste.slice(0, 8).map(function (p) {
      if (p.key === "wasser") {
        return UI.zeile({
          haken: false, text: p.text, wert: p.wert,
          onclick: function () { tag.wasser = Math.round(((tag.wasser || 0) + 0.25) * 100) / 100; speichern(); }
        });
      }
      return UI.zeile({
        haken: false, text: p.text, ar: p.ar, wert: p.wert,
        onclick: function () {
          var alt = holeTief(tag, p.key);
          setzeTief(tag, p.key, p.key === "quran.gelesen" ? (alt ? 0 : 1) : !alt);
          speichern();
        }
      });
    });
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Offen heute · " + liste.length }),
      UI.el("div.gruppe", zeilen)
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

  function hinweisKarte() {
    var h = Hijri.fuer(new Date());
    var jetzt = new Date();
    var punkte = [];
    if (h.weisserTag) punkte.push("Weißer Tag — " + h.tag + ". " + h.monatName);
    if (h.ramadan) punkte.push(h.letzteZehn ? "Ramaḍān · die letzten zehn Nächte" : "Ramaḍān");
    if (jetzt.getDay() === 5) {
      var sommer = jetzt.getMonth() >= 3 && jetzt.getMonth() <= 9;
      punkte.push("Jumuʿa um " + (sommer ? Store.einstellungen.jumua.sommer : Store.einstellungen.jumua.winter));
    }
    if (jetzt.getDay() === 1 || jetzt.getDay() === 4) punkte.push("Fastenvorschlag: Montag / Donnerstag");
    if (!punkte.length) return null;
    return UI.el("div.karte.hinweis", punkte.map(function (p) {
      return UI.el("div.hz", { text: p });
    }));
  }

  function muhasabaKnopf() {
    var jetzt = new Date();
    if (tag.muhasaba) {
      return UI.el("div.karte.fertig", [
        UI.el("div.ft", { text: "Abendabrechnung erledigt" }),
        UI.el("div.fs", { text: "Tagesscore " + tag.score + " · abgeschlossen" })
      ]);
    }
    if (jetzt < zeiten.maghrib) {
      return UI.el("div.notiz", { text: "Die Abendabrechnung öffnet ab Maghrib, " + Gebetszeiten.uhr(zeiten.maghrib) + "." });
    }
    return UI.el("button.cta", {
      type: "button", onclick: function () { location.hash = "#/muhasaba"; }
    }, "Abendabrechnung starten");
  }

  /* ---------- Zeichnen ---------- */
  var wurzel = null;
  function zeichne() {
    if (!wurzel) return;
    var jetzt = new Date();
    var h = Hijri.fuer(jetzt);
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Heute", UI.datumLang(jetzt), h.textAr));
    var inhalt = UI.el("div.inhalt", [
      UI.el("div.assistent", { text: Assistent.satzZumVortag(tage, tag.datum) }),
      gebetsKarte(),
      scoreKarte(),
      hinweisKarte(),
      offenBlock(),
      ayaKarte(),
      muhasabaKnopf()
    ]);
    wurzel.appendChild(inhalt);
  }

  function oeffnen(root) {
    wurzel = root;
    return Promise.all([Store.tag(), Store.letzteTage(60), Ayat.laden()]).then(function (r) {
      tag = r[0]; tage = r[1];
      zeiten = Gebetszeiten.fuer(new Date());
      zeichne();
      clearInterval(timer);
      timer = setInterval(function () { if (wurzel && wurzel.isConnected) zeichne(); }, 30000);
    });
  }

  function schliessen() { clearInterval(timer); wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
