/* Mīzān – Finanzen, Soziales, Innenleben, geschützter Bereich. */

/* ==================== Finanzen ==================== */
var AnsichtFinanzen = (function () {
  "use strict";
  var wurzel = null, tag = null, tage = [], kategorie = null;

  function speichern(neu) {
    tag.score = Score.fuer(tag).wert;
    return Store.tagSpeichern(tag).then(function () { if (neu !== false) zeichne(); });
  }
  function euro(n) { return UI.zahl(n || 0, 2).replace(".", ",") + " €"; }

  function monatsAusgaben() {
    var jetzt = new Date();
    var praefix = jetzt.getFullYear() + "-" + String(jetzt.getMonth() + 1).padStart(2, "0");
    return tage.concat([tag]).filter(function (t) { return t.datum.indexOf(praefix) === 0; });
  }

  function eingabeKarte() {
    var e = Store.einstellungen;
    var betragFeld = UI.el("input.aufgabenfeld.gross", {
      type: "text", inputmode: "decimal", placeholder: "Betrag in €",
      onkeydown: function (ev) { if (ev.key === "Enter") anlegen(); }
    });
    var notizFeld = UI.el("input.aufgabenfeld", { type: "text", placeholder: "Wofür? (freiwillig)" });

    function anlegen() {
      var betrag = parseFloat(betragFeld.value.replace(",", "."));
      if (isNaN(betrag) || betrag <= 0) { UI.meldung("Betrag fehlt."); return; }
      if (!kategorie) { UI.meldung("Kategorie wählen."); return; }
      tag.ausgaben.push({ betrag: Math.round(betrag * 100) / 100, kategorie: kategorie, notiz: notizFeld.value.trim() });
      if (kategorie === "Sadaqa") tag.sadaqa = (tag.sadaqa || 0) + betrag;
      betragFeld.value = ""; notizFeld.value = "";
      UI.meldung(euro(betrag) + " erfasst.");
      speichern();
    }

    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Ausgabe erfassen · ab " + e.finanzen.schwelle + " €" }),
      betragFeld, notizFeld,
      UI.el("div.chips.umbruch", { style: "margin-top:.6rem" }, e.finanzen.kategorien.map(function (k) {
        return UI.el("button.chip" + (kategorie === k ? ".an" : ""), {
          type: "button", onclick: function () { kategorie = kategorie === k ? null : k; zeichne(); }
        }, k);
      })),
      UI.el("button.cta.schmal", { type: "button", onclick: anlegen, style: "margin-top:.7rem" }, "Eintragen"),
      UI.el("p.klein", {
        text: "Kleineres als " + e.finanzen.schwelle + " € trägst du nicht einzeln ein — dafür gibt es unten die Wochenpauschale."
      })
    ]);
  }

  function heuteBlock() {
    var liste = tag.ausgaben || [];
    if (!liste.length) return null;
    var summe = liste.reduce(function (a, x) { return a + x.betrag; }, 0);
    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: UI.tagWort() + " · " + euro(summe) }),
      UI.el("div.gruppe", liste.map(function (x, i) {
        return UI.el("div.zeile", [
          UI.el("span.zt", { text: x.kategorie }),
          x.notiz ? UI.el("span.zw.leise", { text: x.notiz }) : null,
          UI.el("span.zw", { text: euro(x.betrag) }),
          UI.el("button.loeschen", {
            type: "button",
            onclick: function () {
              if (x.kategorie === "Sadaqa") tag.sadaqa = Math.max(0, (tag.sadaqa || 0) - x.betrag);
              tag.ausgaben.splice(i, 1);
              speichern();
            }
          }, "×")
        ].filter(Boolean));
      }))
    ]);
  }

  function monatKarte() {
    var e = Store.einstellungen;
    var monat = monatsAusgaben();
    var alle = [];
    monat.forEach(function (t) { alle = alle.concat(t.ausgaben || []); });
    var summe = alle.reduce(function (a, x) { return a + x.betrag; }, 0);
    var sadaqa = monat.reduce(function (a, t) { return a + (t.sadaqa || 0); }, 0);

    var proKategorie = {};
    alle.forEach(function (x) { proKategorie[x.kategorie] = (proKategorie[x.kategorie] || 0) + x.betrag; });
    var sortiert = Object.keys(proKategorie).sort(function (a, b) { return proKategorie[b] - proKategorie[a]; });
    var groesste = sortiert.length ? proKategorie[sortiert[0]] : 1;

    return UI.el("div.karte", [
      UI.el("span.etikett", { text: UI.MONATE[new Date().getMonth()] }),
      UI.el("div.gebetzeile", [
        UI.el("span.gname.klein", { text: euro(summe) }),
        UI.el("span.gzeit", {
          text: e.finanzen.budget > 0 ? "von " + euro(e.finanzen.budget) : "kein Budget gesetzt"
        })
      ]),
      e.finanzen.budget > 0 ? UI.balken(summe / e.finanzen.budget) : null,
      sortiert.length ? UI.el("div.verteilung", sortiert.map(function (k) {
        return UI.el("div.vz", [
          UI.el("span.vt", { text: k }),
          UI.el("div.vbalken", [
            UI.el("i" + (k === "Sadaqa" ? ".f-jade" : ".f-jade-dim"),
              { style: "width:" + (proKategorie[k] / groesste * 100) + "%" })
          ]),
          UI.el("span.vw", { text: UI.zahl(proKategorie[k], 0) })
        ]);
      })) : UI.el("p.klein", { text: "Diesen Monat noch nichts erfasst." }),
      sadaqa > 0 ? UI.el("p.klein", { text: "Davon Sadaqa: " + euro(sadaqa) }) : null
    ].filter(Boolean));
  }

  function sadaqaKarte() {
    var e = Store.einstellungen;
    var anzeige = UI.el("div.zfwert", { text: euro(tag.sadaqa) });
    function dazu(n) {
      tag.sadaqa = Math.max(0, Math.round(((tag.sadaqa || 0) + n) * 100) / 100);
      anzeige.textContent = euro(tag.sadaqa);
      speichern(false);
    }
    var monat = monatsAusgaben().reduce(function (a, t) { return a + (t.sadaqa || 0); }, 0);
    return UI.el("div.karte.held", [
      UI.el("span.etikett", { text: "Sadaqa " + UI.tagWortKlein() }),
      anzeige,
      UI.el("div.zfknoepfe", [1, 2, 5, 10, 20].map(function (n) {
        return UI.el("button.mini", { type: "button", onclick: function () { dazu(n); } }, "+" + n);
      }).concat([
        UI.el("button.mini.null", { type: "button", onclick: function () { tag.sadaqa = 0; speichern(); } }, "0")
      ])),
      e.finanzen.sadaqaZielMonat > 0
        ? UI.balken(monat / e.finanzen.sadaqaZielMonat)
        : null,
      UI.el("p.klein", {
        text: e.finanzen.sadaqaZielMonat > 0
          ? euro(monat) + " von " + euro(e.finanzen.sadaqaZielMonat) + " diesen Monat"
          : euro(monat) + " diesen Monat. Ein Monatsziel setzt du unter Mehr."
      })
    ].filter(Boolean));
  }

  function vermoegenKarte() {
    var e = Store.einstellungen;
    var z = e.finanzen.sparziel;
    var anzeige = UI.el("div.zfwert", { text: euro(e.finanzen.vermoegen) });
    function setz(n) {
      e.finanzen.vermoegen = Math.max(0, Math.round((e.finanzen.vermoegen + n) * 100) / 100);
      anzeige.textContent = euro(e.finanzen.vermoegen);
      Store.einstellungenSpeichern();
    }
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Vermögen" }),
      anzeige,
      UI.el("div.zfknoepfe", [50, 100, 500, -50, -100].map(function (n) {
        return UI.el("button.mini", { type: "button", onclick: function () { setz(n); } },
          (n > 0 ? "+" : "") + n);
      })),
      z.name ? UI.el("div", [
        UI.balken(z.betrag ? e.finanzen.vermoegen / z.betrag : 0),
        UI.el("p.klein", { text: z.name + ": " + euro(e.finanzen.vermoegen) + " von " + euro(z.betrag) })
      ]) : UI.el("p.klein", { text: "Ein Sparziel legst du unter Mehr → Finanzen an." })
    ]);
  }

  function keineZakatKarte() {
    return UI.el("div.karte.hinweis", [
      UI.el("div.hz", {
        text: "Eine Zakāt-Berechnung ist bewusst nicht eingebaut — du wolltest nur Sadaqa. " +
              "Wenn du das später doch brauchst, kommt sie mit Niṣāb und Mondjahr-Erinnerung dazu."
      })
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    UI.leeren(wurzel);
    var monat = monatsAusgaben();
    var summe = monat.reduce(function (a, t) {
      return a + (t.ausgaben || []).reduce(function (x, y) { return x + y.betrag; }, 0);
    }, 0);
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Finanzen", euro(summe) + " diesen Monat", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(laden),
      sadaqaKarte(), eingabeKarte(), heuteBlock(), monatKarte(), vermoegenKarte(),
      Eigene.block("finanzen", tag, laden),
      keineZakatKarte()
    ].filter(Boolean)));
  }

  function laden() {
    return Promise.all([Store.tag(), Store.letzteTage(90)]).then(function (r) {
      tag = r[0];
      tage = r[1].filter(function (t) { return t.datum !== tag.datum; });
      zeichne();
    });
  }
  function oeffnen(root) { wurzel = root; return laden(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();


/* ==================== Soziales & Familie ==================== */
var AnsichtSoziales = (function () {
  "use strict";
  var wurzel = null, tag = null, tage = [];

  function speichern() {
    tag.score = Score.fuer(tag).wert;
    return Store.tagSpeichern(tag).then(zeichne);
  }

  function letzteKontakte() { return Score.letzteKontakte(tag); }

  function zeichne() {
    if (!wurzel) return;
    var e = Store.einstellungen;
    var letzte = letzteKontakte();
    var heute = Store.ausKey(tag.datum);

    var zeilen = (e.kontakte || []).map(function (k) {
      var heuteErreicht = !!(tag.kontakte && tag.kontakte[k.name]);
      var l = letzte[k.name];
      var tageHer = l ? Math.round((heute - Store.ausKey(l)) / 86400000) : null;
      var faellig = !heuteErreicht && (tageHer === null || tageHer >= k.intervall);

      var wert;
      if (heuteErreicht) wert = "heute";
      else if (tageHer === null) wert = "noch nie erfasst";
      else if (tageHer === 0) wert = "heute";
      else if (tageHer === 1) wert = "gestern";
      else wert = "vor " + tageHer + " Tagen";

      return UI.zeile({
        haken: heuteErreicht, text: k.name, wert: wert,
        onclick: function () {
          if (!tag.kontakte) tag.kontakte = {};
          tag.kontakte[k.name] = !tag.kontakte[k.name];
          speichern();
        },
        rechts: faellig ? UI.el("span.schalter.warn", { text: "dran" }) : null
      });
    });

    var faelligeAnzahl = (e.kontakte || []).filter(function (k) {
      if (tag.kontakte && tag.kontakte[k.name]) return false;
      var l = letzte[k.name];
      if (!l) return true;
      return Math.round((heute - Store.ausKey(l)) / 86400000) >= k.intervall;
    }).length;

    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Soziales", faelligeAnzahl ? faelligeAnzahl + " wären dran" : "Alle im Takt", "صلة الرحم"));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(laden),
      UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Silat ar-Raḥim und Birr al-Wālidayn verfallen leise. Mīzān erinnert dich, wenn ein Abstand zu lang wird — die Abstände stellst du unter Mehr ein."
        })
      ]),
      UI.el("div.block", [
        UI.el("div.blockkopf", { text: (Store.istHeute() ? "Heute" : "An diesem Tag") + " erreicht?" }),
        UI.el("div.gruppe", zeilen)
      ]),
      Eigene.block("soziales", tag, laden),
      UI.el("p.klein", {
        text: "Ein Anruf zählt. Eine Nachricht zählt. Es geht um den Kontakt, nicht um die Länge."
      })
    ]));
  }

  function laden() {
    return Promise.all([Store.tag(), Store.letzteTage(120)]).then(function (r) {
      tag = r[0];
      tage = r[1].filter(function (t) { return t.datum !== tag.datum; });
      zeichne();
    });
  }
  function oeffnen(root) { wurzel = root; return laden(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();


/* ==================== Innenleben ==================== */
var AnsichtInnen = (function () {
  "use strict";
  var wurzel = null, tag = null, tage = [];

  function speichern(neu) {
    tag.score = Score.fuer(tag).wert;
    return Store.tagSpeichern(tag).then(function () { if (neu !== false) zeichne(); });
  }

  function stimmungKarte() {
    var stufen = ["Sehr schlecht", "Schlecht", "Geht so", "Gut", "Sehr gut"];
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Stimmung " + UI.tagWortKlein() }),
      UI.el("div.fragen", { style: "margin-top:.6rem" }, stufen.map(function (t, i) {
        var an = tag.stimmung === i + 1;
        return UI.el("button.fbtn" + (an ? ".an" : ""), {
          type: "button",
          onclick: function () { tag.stimmung = an ? null : i + 1; speichern(); }
        }, t);
      }))
    ]);
  }

  function dankbarKarte() {
    var liste = tag.dankbar || [];
    var eingabe = UI.el("input.aufgabenfeld.gross", {
      type: "text", placeholder: "Wofür bist du dankbar?",
      onkeydown: function (ev) { if (ev.key === "Enter") dazu(); }
    });
    function dazu() {
      var t = eingabe.value.trim();
      if (!t) return;
      tag.dankbar = liste.concat([t]);
      eingabe.value = "";
      speichern();
    }
    return UI.el("div.karte" + (liste.length ? ".held" : ""), [
      UI.el("span.etikett", { text: "Dankbarkeit · " + liste.length }),
      UI.el("div.zeitreihe", [eingabe, UI.el("button.mini", { type: "button", onclick: dazu }, "+")]),
      liste.length ? UI.el("div.gruppe.blank", liste.map(function (t, i) {
        return UI.el("div.zeile", [
          UI.el("span.zt.dehnbar", { text: "· " + t }),
          UI.el("button.loeschen", {
            type: "button",
            onclick: function () { tag.dankbar.splice(i, 1); speichern(); }
          }, "×")
        ]);
      })) : null
    ].filter(Boolean));
  }

  function journalKarte() {
    var feld = UI.el("textarea.notizfeld", {
      rows: 5, placeholder: Store.istHeute() ? "Was war heute?" : "Was war an dem Tag?",
      oninput: function () { tag.notiz = feld.value; },
      onblur: function () { speichern(false); }
    });
    feld.value = tag.notiz || "";
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Journal" }),
      feld
    ]);
  }

  function verlaufKarte() {
    var alle = Store.fensterBis(tag.datum, 30, tag).filter(function (t) { return t.stimmung; });
    if (alle.length < 3) return null;
    var schnitt = alle.reduce(function (a, t) { return a + t.stimmung; }, 0) / alle.length;
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Stimmung über 30 Tage" }),
      UI.el("div.streifen", alle.slice(-21).map(function (t) {
        return UI.el("div.tagsaeule", [
          UI.el("div.saeule", [
            UI.el("i.f-jade", { style: "height:" + (t.stimmung * 0.42) + "rem" })
          ])
        ]);
      })),
      UI.el("p.klein", { text: "Schnitt: " + UI.zahl(schnitt, 1).replace(".", ",") + " von 5" })
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Innenleben", "Stimmung, Dankbarkeit, Journal", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(laden),
      stimmungKarte(), dankbarKarte(), journalKarte(),
      Eigene.block("innen", tag, laden),
      verlaufKarte()
    ].filter(Boolean)));
  }

  function laden() {
    return Promise.all([Store.tag(), Store.letzteTage(60)]).then(function (r) {
      tag = r[0];
      tage = r[1].filter(function (t) { return t.datum !== tag.datum; });
      zeichne();
    });
  }
  function oeffnen(root) { wurzel = root; return laden(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();
