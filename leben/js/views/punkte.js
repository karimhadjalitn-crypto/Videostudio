/* Mīzān – Tagespunkte anpassen.
   Eigene Punkte anlegen, Standardpunkte ausblenden.
   Aufruf mit "#/punkte?b=business" öffnet gleich den richtigen Bereich. */
var AnsichtPunkte = (function () {
  "use strict";

  var wurzel = null, bearbeite = null, neuOffen = false, bereich = null;

  function bereichAusHash() {
    var teil = (location.hash || "").split("?")[1] || "";
    var treffer = /(?:^|&)b=([a-z]+)/.exec(teil);
    var b = treffer ? treffer[1] : null;
    return (b && Punkte.BEREICHE[b]) ? b : null;
  }

  /* ---------- Bereichsauswahl ---------- */
  function bereichsLeiste() {
    var alle = Object.keys(Punkte.BEREICHE);
    return UI.el("div.chips.umbruch.bereichswahl", [
      UI.el("button.chip" + (bereich === null ? ".an" : ""), {
        type: "button", onclick: function () { bereich = null; bearbeite = null; zeichne(); }
      }, "Alle")
    ].concat(alle.map(function (b) {
      var eigene = Punkte.alle(b).length;
      return UI.el("button.chip" + (bereich === b ? ".an" : ""), {
        type: "button", onclick: function () { bereich = b; bearbeite = null; zeichne(); }
      }, Punkte.BEREICHE[b] + (eigene ? " " + eigene : ""));
    })));
  }

  /* ---------- Neuen Punkt anlegen ---------- */
  function neuKarte() {
    if (!neuOffen) {
      return UI.el("button.cta", {
        type: "button", onclick: function () { neuOffen = true; zeichne(); }
      }, "＋  Eigenen Punkt anlegen");
    }

    var entwurf = { bereich: bereich || "religion", art: "haken" };

    var nameFeld = UI.el("input.aufgabenfeld.gross", {
      type: "text", placeholder: "Wie heißt der Punkt?",
      onkeydown: function (ev) { if (ev.key === "Enter") anlegen(); }
    });
    var arabischFeld = UI.el("input.aufgabenfeld", {
      type: "text", placeholder: "Arabisch (freiwillig)", dir: "rtl", lang: "ar"
    });
    var zielFeld = UI.el("input.aufgabenfeld", {
      type: "text", inputmode: "numeric", placeholder: "Tagesziel, z. B. 100", value: "10"
    });
    var einheitFeld = UI.el("input.aufgabenfeld", {
      type: "text", placeholder: "Einheit, z. B. Minuten"
    });

    var artChips = UI.el("div.chips.umbruch", Object.keys(Punkte.ARTEN).map(function (a) {
      return UI.el("button.chip", {
        type: "button", onclick: function () { entwurf.art = a; auffrischen(); }
      }, Punkte.ARTEN[a].name);
    }));
    var bereichChips = UI.el("div.chips.umbruch", Object.keys(Punkte.BEREICHE).map(function (b) {
      return UI.el("button.chip", {
        type: "button", onclick: function () { entwurf.bereich = b; auffrischen(); }
      }, Punkte.BEREICHE[b]);
    }));

    var hinweis = UI.el("p.klein");
    var extra = UI.el("div.extrafelder");

    function auffrischen() {
      Object.keys(Punkte.ARTEN).forEach(function (a, i) {
        artChips.children[i].classList.toggle("an", a === entwurf.art);
      });
      Object.keys(Punkte.BEREICHE).forEach(function (b, i) {
        bereichChips.children[i].classList.toggle("an", b === entwurf.bereich);
      });
      hinweis.textContent = Punkte.ARTEN[entwurf.art].hinweis +
        (entwurf.bereich === "sonstiges"
          ? "  ·  „Sonstiges“ zählt in die Produktivität."
          : "");
      UI.leeren(extra);
      if (entwurf.art === "zaehler") {
        extra.appendChild(UI.el("div.unterkopf", { text: "Tagesziel" }));
        extra.appendChild(zielFeld);
      }
      if (entwurf.art === "zahl") {
        extra.appendChild(UI.el("div.unterkopf", { text: "Einheit" }));
        extra.appendChild(einheitFeld);
      }
    }

    function anlegen() {
      var n = nameFeld.value.trim();
      if (!n) { UI.meldung("Der Punkt braucht einen Namen."); nameFeld.focus(); return; }
      var p = Punkte.neu(n, entwurf.bereich, entwurf.art);
      p.ar = arabischFeld.value.trim();
      if (entwurf.art === "zaehler") p.ziel = parseInt(zielFeld.value, 10) || 10;
      if (entwurf.art === "zahl") p.einheit = einheitFeld.value.trim();
      Punkte.hinzufuegen(p).then(function () {
        neuOffen = false;
        if (bereich && bereich !== entwurf.bereich) bereich = entwurf.bereich;
        UI.meldung("„" + n + "“ angelegt.");
        zeichne();
      });
    }

    var karte = UI.el("div.karte.held", [
      UI.el("span.etikett", { text: "Neuer Punkt" }),
      nameFeld, arabischFeld,
      UI.el("div.unterkopf", { text: "Wie willst du ihn erfassen?" }), artChips,
      hinweis, extra,
      UI.el("div.unterkopf", { text: "Zu welchem Bereich gehört er?" }), bereichChips,
      UI.el("div.zfknoepfe.abstand", [
        UI.el("button.mini.stark", { type: "button", onclick: anlegen }, "Anlegen"),
        UI.el("button.mini", {
          type: "button", onclick: function () { neuOffen = false; zeichne(); }
        }, "Abbrechen")
      ])
    ]);
    auffrischen();
    setTimeout(function () { nameFeld.focus(); }, 80);
    return karte;
  }

  /* ---------- Eigene Punkte ---------- */
  function eigeneBlock() {
    var liste = Punkte.alle(bereich).concat(
      (Store.einstellungen.eigenePunkte || []).filter(function (p) {
        return p.aktiv === false && (!bereich || p.bereich === bereich);
      })
    );

    if (!liste.length) {
      return UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: bereich
            ? "In " + Punkte.BEREICHE[bereich] + " hast du noch keinen eigenen Punkt."
            : "Noch keine eigenen Punkte. Sieben Erfassungsarten stehen bereit — nicht nur der Haken."
        })
      ]);
    }

    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Deine Punkte · " + liste.length }),
      UI.el("div.gruppe", liste.map(function (p) {
        if (bearbeite === p.id) return bearbeitenZeile(p);
        return UI.el("div.zeile.tippbar", {
          onclick: function () { bearbeite = p.id; zeichne(); }
        }, [
          UI.el("span.zt.dehnbar", { text: p.name }),
          p.ar ? UI.el("span.ar", { text: p.ar }) : null,
          UI.el("span.zw", {
            text: Punkte.ARTEN[p.art].name +
                  (bereich ? "" : " · " + Punkte.BEREICHE[p.bereich])
          }),
          UI.el("span.schalter" + (p.aktiv !== false ? ".an" : ""), {
            text: p.aktiv !== false ? "an" : "aus"
          })
        ].filter(Boolean));
      }))
    ]);
  }

  function bearbeitenZeile(p) {
    var nameFeld = UI.el("input.aufgabenfeld", { type: "text", value: p.name });
    var arFeld = UI.el("input.aufgabenfeld", {
      type: "text", value: p.ar || "", placeholder: "Arabisch (freiwillig)", dir: "rtl", lang: "ar"
    });
    var zielFeld = p.art === "zaehler" ? UI.el("input.aufgabenfeld", {
      type: "text", inputmode: "numeric", value: p.ziel || "", placeholder: "Tagesziel"
    }) : null;
    var einheitFeld = p.art === "zahl" ? UI.el("input.aufgabenfeld", {
      type: "text", value: p.einheit || "", placeholder: "Einheit"
    }) : null;

    function uebernehmen() {
      var n = nameFeld.value.trim();
      if (n) p.name = n;
      p.ar = arFeld.value.trim();
      if (zielFeld) p.ziel = parseInt(zielFeld.value, 10) || null;
      if (einheitFeld) p.einheit = einheitFeld.value.trim();
      bearbeite = null;
      Store.einstellungenSpeichern().then(zeichne);
    }

    return UI.el("div.zeile.bearbeiten", [
      UI.el("div.bearbeitenbox", [
        UI.el("div.unterkopf", { text: Punkte.ARTEN[p.art].name + " · " + Punkte.BEREICHE[p.bereich] }),
        nameFeld, arFeld, zielFeld, einheitFeld,
        UI.el("div.chips", [
          UI.el("button.chip" + (p.aktiv !== false ? ".an" : ""), {
            type: "button",
            onclick: function () {
              p.aktiv = p.aktiv === false;
              Store.einstellungenSpeichern().then(zeichne);
            }
          }, p.aktiv !== false ? "Aktiv" : "Ausgeschaltet"),
          UI.el("button.chip" + (p.aufHeute !== false ? ".an" : ""), {
            type: "button",
            onclick: function () {
              p.aufHeute = p.aufHeute === false;
              Store.einstellungenSpeichern().then(zeichne);
            }
          }, "Auf „Heute“ zeigen")
        ]),
        UI.el("div.zfknoepfe.abstand", [
          UI.el("button.mini.stark", { type: "button", onclick: uebernehmen }, "Fertig"),
          UI.el("button.mini", {
            type: "button", onclick: function () { bearbeite = null; zeichne(); }
          }, "Abbrechen"),
          UI.el("button.mini.gefahr", {
            type: "button",
            onclick: function () {
              Punkte.entfernen(p.id).then(function () {
                bearbeite = null;
                UI.meldung("Gelöscht. Alte Einträge bleiben in den Daten.");
                zeichne();
              });
            }
          }, "Löschen")
        ])
      ].filter(Boolean))
    ]);
  }

  /* ---------- Standardpunkte ---------- */
  function standardBlock() {
    var nachBereich = {};
    Sichtbar.KATALOG.forEach(function (k) {
      if (bereich && k.bereich !== bereich) return;
      (nachBereich[k.bereich] = nachBereich[k.bereich] || []).push(k);
    });
    var reihenfolge = Object.keys(Punkte.BEREICHE).filter(function (b) { return nachBereich[b]; });
    if (!reihenfolge.length) return null;

    var aus = (Store.einstellungen.ausgeblendet || []).length;

    return UI.el("div", [
      UI.el("div.blockkopf", {
        text: "Standardpunkte" + (aus ? " · " + aus + " ausgeblendet" : "")
      }),
      UI.el("p.klein", {
        text: "Was du hier ausschaltest, verschwindet aus der Tagesliste und zählt nicht mehr in den Score. Deine alten Einträge bleiben erhalten."
      })
    ].concat(reihenfolge.map(function (b) {
      return UI.el("div.block", [
        UI.el("div.blockkopf.leise", { text: Punkte.BEREICHE[b] || b }),
        UI.el("div.gruppe", nachBereich[b].map(function (k) {
          var an = Sichtbar.an(k.k);
          return UI.el("div.zeile.tippbar", {
            onclick: function () { Sichtbar.umschalten(k.k).then(zeichne); }
          }, [
            UI.el("span.zt.dehnbar", { text: k.name }),
            UI.el("span.schalter" + (an ? ".an" : ""), { text: an ? "an" : "aus" })
          ]);
        }))
      ]);
    })));
  }

  function zeichne() {
    if (!wurzel) return;
    var eigene = (Store.einstellungen.eigenePunkte || []).length;
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Tagespunkte",
      eigene ? UI.plural(eigene, "eigener Punkt", "eigene Punkte") : "Alles anpassbar", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      bereichsLeiste(),
      neuKarte(),
      eigeneBlock(),
      standardBlock(),
      UI.el("button.cta.leise", {
        type: "button",
        onclick: function () {
          if (history.length > 1) history.back(); else location.hash = "#/heute";
        }
      }, "Zurück")
    ].filter(Boolean)));
  }

  function oeffnen(root) {
    wurzel = root;
    bearbeite = null;
    neuOffen = false;
    bereich = bereichAusHash();
    zeichne();
    return Promise.resolve();
  }

  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();
