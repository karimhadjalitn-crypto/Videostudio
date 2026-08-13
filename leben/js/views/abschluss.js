/* Mīzān – „Tag abschließen".
   Der einzige Weg, den du wirklich jeden Tag gehst. Alles auf einem
   Bildschirm: runterscrollen, antippen, fertig. Kein Durchklicken,
   keine Schritte, keine Fragen, die du beantworten musst. */
var AnsichtAbschluss = (function () {
  "use strict";

  var wurzel = null, tag = null, zeiten = null;

  function sichern(neuZeichnen) {
    return Store.tagSpeichern(tag).then(function () {
      if (neuZeichnen !== false) zeichne();
    });
  }

  /* ---------- Gebete: alle fünf mit ihren Stufen ---------- */
  function gebeteBlock() {
    var gehalten = Gebetszeiten.PFLICHT.filter(function (k) {
      return tag.gebete[k] && tag.gebete[k] !== "verpasst";
    }).length;

    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Die fünf Gebete · " + gehalten + " von 5" }),
      UI.el("div.gruppe", Gebetszeiten.PFLICHT.map(function (k) {
        var w = tag.gebete[k];
        return UI.el("div.mzeile", [
          UI.el("div.mkopf", [
            UI.el("span.zt", { text: Gebetszeiten.NAMEN[k].de }),
            UI.el("span.ar", { text: Gebetszeiten.NAMEN[k].ar }),
            UI.el("span.zw", { text: Gebetszeiten.uhr(zeiten[k]) })
          ]),
          UI.el("div.stufen", Gebetszeiten.STUFEN.map(function (s) {
            var an = w === s.key;
            return UI.el("button.stufe.f-" + s.farbe + (an ? ".an" : ""), {
              type: "button", title: s.lang,
              onclick: function () { tag.gebete[k] = an ? null : s.key; sichern(); }
            }, s.kurz);
          }))
        ]);
      }))
    ]);
  }

  /* ---------- Alles andere: eine Liste, ein Tipp pro Zeile ---------- */
  function restBlock() {
    var zeilen = [];

    function haken(k, text, opt) {
      if (Sichtbar.aus(k)) return;
      opt = opt || {};
      zeilen.push(UI.zeile({
        haken: !!opt.an, text: text, ar: opt.ar || null, wert: opt.wert || null,
        onclick: opt.onclick, rechts: opt.rechts || null
      }));
    }

    /* Qur'an */
    var dran = Hifz.aktuelle ? Hifz.heuteDran(Store.ausKey(tag.datum)) : null;
    haken("quran.murajaa", "Murājaʿa", {
      an: tag.quran.murajaa,
      wert: dran ? (dran.pruefung ? "Prüfungstag" : dran.verse + " Verse") : null,
      onclick: function () { tag.quran.murajaa = !tag.quran.murajaa; sichern(); }
    });
    haken("quran.hifz", "Neu gelernt", {
      an: tag.quran.hifz,
      wert: dran && dran.neu ? dran.neu.de : null,
      onclick: function () { tag.quran.hifz = !tag.quran.hifz; sichern(); }
    });
    haken("quran.gelesen", "Qur'an gelesen", {
      an: tag.quran.gelesen > 0,
      wert: (tag.quran.gelesen || 0) + (tag.quran.gelesen === 1 ? " Seite" : " Seiten"),
      onclick: function () { tag.quran.gelesen = (tag.quran.gelesen || 0) + 1; sichern(); },
      rechts: (tag.quran.gelesen || 0) > 0 ? UI.el("button.mini.klein", {
        type: "button", "aria-label": "eine Seite weniger",
        onclick: function (ev) {
          ev.stopPropagation();
          tag.quran.gelesen = Math.max(0, (tag.quran.gelesen || 0) - 1);
          sichern();
        }
      }, "−") : null
    });

    /* Adhkār – ein Haken, ohne Vorgabe welche */
    haken("dhikr", "Adhkār", {
      an: tag.dhikr.gemacht, ar: "الأذكار",
      onclick: function () { tag.dhikr.gemacht = !tag.dhikr.gemacht; sichern(); }
    });

    /* Freiwillige Gebete */
    [["rawatib", "Sunan Rawātib", "12 Rakʿa"], ["witr", "Witr", null],
     ["duha", "Ḍuḥā", null], ["ishraq", "Ishrāq", null], ["tahajjud", "Tahajjud", null]
    ].forEach(function (x) {
      haken("sunnah." + x[0], x[1], {
        an: tag.sunnah[x[0]], wert: x[2],
        onclick: function () { tag.sunnah[x[0]] = !tag.sunnah[x[0]]; sichern(); }
      });
    });

    /* Sport */
    haken("training", "Trainiert", {
      an: (tag.training.arten || []).length > 0,
      wert: (tag.training.arten || []).join(", ") || null,
      onclick: function () {
        tag.training.arten = (tag.training.arten || []).length ? [] : ["Training"];
        sichern();
      }
    });

    /* Fasten */
    haken("fasten", "Gefastet", {
      an: tag.fasten, ar: "الصيام",
      onclick: function () { tag.fasten = !tag.fasten; sichern(); }
    });

    /* Eigene Punkte */
    Punkte.alle().forEach(function (p) {
      zeilen.push(UI.punktZeile(tag, p, function () { sichern(); }));
    });

    return UI.el("div.block", [
      UI.el("div.blockkopf.mitknopf", [
        UI.el("span", { text: "Der Rest" }),
        UI.el("button.kopfknopf", {
          type: "button", onclick: function () { location.hash = "#/punkte"; }
        }, "Anpassen")
      ]),
      UI.el("div.gruppe", zeilen.length ? zeilen
        : [UI.el("div.zeile.leer", { text: "Nichts eingerichtet — oben unter „Anpassen“ wählen." })])
    ]);
  }

  /* ---------- Trainingsarten, wenn trainiert wurde ---------- */
  function sportKarte() {
    if (Sichtbar.aus("training")) return null;
    var arten = tag.training.arten || [];
    if (!arten.length) return null;
    var moeglich = Store.einstellungen.sport.arten || [];
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Was war es?" }),
      UI.el("div.chips.umbruch", moeglich.map(function (a) {
        var an = arten.indexOf(a) >= 0;
        return UI.el("button.chip" + (an ? ".an" : ""), {
          type: "button",
          onclick: function () {
            var l = (tag.training.arten || []).filter(function (x) { return x !== "Training"; });
            tag.training.arten = an ? l.filter(function (x) { return x !== a; }) : l.concat([a]);
            if (!tag.training.arten.length) tag.training.arten = ["Training"];
            sichern();
          }
        }, a);
      }))
    ]);
  }

  /* ---------- Journal ---------- */
  function journalKarte() {
    var vorhanden = (tag.notiz || "").trim();
    return UI.el("div.karte.tippbar", {
      onclick: function () { location.hash = "#/journal"; }
    }, [
      UI.el("span.etikett", { text: "Journal" }),
      UI.el("p.aurteil", {
        text: vorhanden
          ? "Du hast heute schon etwas geschrieben."
          : "Wenn du etwas aufschreiben willst — hier ist Platz."
      }),
      UI.el("span.bpfeil", { text: "›" })
    ]);
  }

  function fertigKnopf() {
    return UI.el("div", [
      UI.el("button.cta", {
        type: "button",
        onclick: function () {
          tag.muhasaba = true;
          Store.tagSpeichern(tag).then(function () {
            UI.meldung(Store.istHeute() ? "Tag abgeschlossen." : "Nachgetragen.");
            Store.setzeDatum(Store.heute());
            location.hash = "#/heute";
          });
        }
      }, tag.muhasaba ? "Fertig" : "Tag abschließen"),
      UI.el("p.klein", {
        text: "Du kannst jederzeit zurückkommen und etwas ändern — auch in ein paar Tagen noch."
      })
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    var d = Store.ausKey(tag.datum);
    var h = Hijri.fuer(d);
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf(
      Store.istHeute() ? "Dein Tag" : "Nachtragen",
      UI.datumLang(d), h.textAr));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(laden),
      gebeteBlock(),
      restBlock(),
      sportKarte(),
      journalKarte(),
      fertigKnopf()
    ].filter(Boolean)));
  }

  function laden() {
    return Promise.all([Store.tag(), Hifz.laden()]).then(function (r) {
      tag = r[0];
      zeiten = Gebetszeiten.fuer(Store.ausKey(tag.datum));
      zeichne();
    });
  }

  function oeffnen(root) { wurzel = root; return laden(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();
