/* Mīzān – Geschützter Bereich: Kämpfe, Tawba, Ehe & Familienplanung.
   Der Code wird nur als Prüfsumme abgelegt, nie im Klartext — auch
   nicht in der Sicherungsdatei. */
var Sperre = (function () {
  "use strict";

  function einfacherHash(text) {
    var h = 5381;
    for (var i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
    return "e" + h.toString(16);
  }

  function hash(text) {
    if (window.crypto && window.crypto.subtle && window.isSecureContext) {
      return window.crypto.subtle
        .digest("SHA-256", new TextEncoder().encode("mizan:" + text))
        .then(function (buf) {
          return "s" + Array.from(new Uint8Array(buf))
            .map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
        })
        .catch(function () { return einfacherHash(text); });
    }
    return Promise.resolve(einfacherHash(text));
  }

  function pruefen(text, gespeichert) {
    if (!gespeichert) return Promise.resolve(true);
    return hash(text).then(function (h) { return h === gespeichert; });
  }

  return { hash: hash, pruefen: pruefen };
})();


var AnsichtPrivat = (function () {
  "use strict";
  var wurzel = null, tag = null, tage = [], offen = false, tab = "kaempfe";
  var ausloeserFuer = null;

  function speichern(neu) {
    return Store.tagSpeichern(tag).then(function () { if (neu !== false) zeichne(); });
  }

  /* ---------- Code-Schleuse ---------- */
  function schleuse() {
    var e = Store.einstellungen;
    var feld = UI.el("input.codefeld", {
      type: "password", inputmode: "numeric", maxlength: 8,
      placeholder: "••••", autocomplete: "off",
      onkeydown: function (ev) { if (ev.key === "Enter") pruef(); }
    });
    function pruef() {
      Sperre.pruefen(feld.value, e.sperre.bereichCode).then(function (ok) {
        if (ok) { offen = true; zeichne(); }
        else { UI.meldung("Falscher Code."); feld.value = ""; }
      });
    }
    return UI.el("div.inhalt", [
      UI.el("div.karte.schloss", [
        UI.el("div.schlosssymbol", { text: "🔒" }),
        UI.el("span.etikett", { text: "Geschützter Bereich" }),
        UI.el("p.aurteil", { text: "Was hier drin steht, taucht nirgends sonst in der App auf." }),
        feld,
        UI.el("button.cta", { type: "button", onclick: pruef }, "Öffnen")
      ])
    ]);
  }

  /* ---------- Kämpfe ---------- */
  function tageFrei(kampfId) {
    var alle = tage.concat([tag]).sort(function (a, b) { return a.datum < b.datum ? 1 : -1; });
    var zaehler = 0;
    for (var i = 0; i < alle.length; i++) {
      var r = (alle[i].kaempfe && alle[i].kaempfe.rueckfall) || [];
      if (r.indexOf(kampfId) >= 0) return zaehler;
      zaehler++;
    }
    return zaehler;
  }

  function kampfKarte(k) {
    var heuteRueckfall = ((tag.kaempfe && tag.kaempfe.rueckfall) || []).indexOf(k.id) >= 0;
    var frei = tageFrei(k.id);

    return UI.el("div.karte" + (heuteRueckfall ? ".rueckfall" : (frei >= 7 ? ".held" : "")), [
      UI.el("div.kkopf", [
        UI.el("span.kname", { text: k.name }),
        UI.el("span.kfrei", { text: heuteRueckfall ? "heute" : frei + (frei === 1 ? " Tag" : " Tage") })
      ]),
      UI.el("div.kunter", { text: heuteRueckfall ? "Heute ein Rückfall." : "frei" }),
      UI.balken(Math.min(1, frei / 30)),
      UI.el("div.chips", [
        UI.el("button.chip" + (heuteRueckfall ? ".an" : ""), {
          type: "button",
          onclick: function () {
            if (!tag.kaempfe) tag.kaempfe = { rueckfall: [], ausloeser: {} };
            var r = tag.kaempfe.rueckfall;
            if (heuteRueckfall) {
              tag.kaempfe.rueckfall = r.filter(function (x) { return x !== k.id; });
              delete tag.kaempfe.ausloeser[k.id];
              ausloeserFuer = null;
            } else {
              tag.kaempfe.rueckfall = r.concat([k.id]);
              ausloeserFuer = k.id;
            }
            speichern();
          }
        }, heuteRueckfall ? "Doch nicht" : "Rückfall")
      ]),
      (heuteRueckfall && ausloeserFuer === k.id) ? ausloeserFeld(k) : null,
      (heuteRueckfall && tag.kaempfe.ausloeser[k.id] && ausloeserFuer !== k.id)
        ? UI.el("p.klein", { text: "Auslöser: " + tag.kaempfe.ausloeser[k.id] }) : null
    ].filter(Boolean));
  }

  function ausloeserFeld(k) {
    var feld = UI.el("input.aufgabenfeld", {
      type: "text", placeholder: "Was war der Auslöser? (freiwillig)",
      value: (tag.kaempfe.ausloeser && tag.kaempfe.ausloeser[k.id]) || "",
      onchange: function () {
        tag.kaempfe.ausloeser[k.id] = feld.value.trim();
        speichern(false);
      }
    });
    return UI.el("div.ausloeser", [
      feld,
      UI.el("button.mini", {
        type: "button", onclick: function () { ausloeserFuer = null; zeichne(); }
      }, "Fertig")
    ]);
  }

  function musterKarte() {
    var alle = tage.concat([tag]);
    var proWochentag = [0, 0, 0, 0, 0, 0, 0];
    var gesamtProTag = [0, 0, 0, 0, 0, 0, 0];
    var mitRueckfall = 0;

    alle.forEach(function (t) {
      var d = Store.ausKey(t.datum).getDay();
      gesamtProTag[d]++;
      var r = (t.kaempfe && t.kaempfe.rueckfall) || [];
      if (r.length) { proWochentag[d]++; mitRueckfall++; }
    });

    if (mitRueckfall < 5) {
      return UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Muster zeigt Mīzān erst, wenn genug Tage vorliegen. Mit dünner Datenlage würde sie raten — das tut sie nicht."
        })
      ]);
    }

    var quoten = proWochentag.map(function (n, i) {
      return { tag: i, quote: gesamtProTag[i] ? n / gesamtProTag[i] : 0, n: n };
    }).filter(function (x) { return gesamtProTag[x.tag] >= 3; });
    quoten.sort(function (a, b) { return b.quote - a.quote; });
    var schlimmster = quoten[0];

    var schlaf = alle.filter(function (t) { return t.schlaf && t.schlaf.bett; });
    var spaet = schlaf.filter(function (t) {
      var h = +t.schlaf.bett.split(":")[0];
      return h >= 0 && h < 5;
    });
    var spaetMitRueckfall = spaet.filter(function (t) {
      return ((t.kaempfe && t.kaempfe.rueckfall) || []).length;
    }).length;

    var saetze = [];
    if (schlimmster && schlimmster.quote > 0.3) {
      saetze.push(UI.WOCHENTAGE[schlimmster.tag] + " ist dein schwerster Tag: " +
        Math.round(schlimmster.quote * 100) + " % der " + UI.WOCHENTAGE[schlimmster.tag] +
        "e endeten mit einem Rückfall.");
    }
    if (spaet.length >= 4) {
      saetze.push("Nach Nächten, in denen du erst nach Mitternacht im Bett warst, gab es " +
        spaetMitRueckfall + " von " + spaet.length + " Mal einen Rückfall.");
    }

    return UI.el("div.karte.held", [
      UI.el("span.etikett", { text: "Was die Daten zeigen" }),
      saetze.length
        ? UI.el("div", saetze.map(function (s) { return UI.el("p.aurteil", { text: s }); }))
        : UI.el("p.aurteil", { text: "Noch kein klares Muster erkennbar." })
    ]);
  }

  function kaempfeAnsicht() {
    var e = Store.einstellungen;
    var aktive = (e.kaempfe || []).filter(function (k) { return k.aktiv; });
    return UI.el("div", [
      UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Kein Zwang zu Details. Ein Rückfall ist ein Antippen, kein Formular. Der Auslöser ist freiwillig — er hilft der App, dein Muster zu finden."
        })
      ])
    ].concat(aktive.map(kampfKarte)).concat([
      musterKarte(),
      UI.el("div.karte", [
        UI.el("span.etikett", { text: "Tawba" }),
        (function () {
          var feld = UI.el("textarea.notizfeld", {
            rows: 3, placeholder: "Was hast du dir vorgenommen?",
            oninput: function () { tag.notizen.tawba = feld.value; },
            onblur: function () { speichern(false); }
          });
          feld.value = (tag.notizen && tag.notizen.tawba) || "";
          return feld;
        })()
      ]),
      UI.el("button.cta.leise", {
        type: "button", onclick: function () { location.hash = "#/kaempfeVerwalten"; }
      }, "Kämpfe verwalten")
    ]));
  }

  /* ---------- Ehe & Familienplanung ---------- */
  function eheAnsicht() {
    var e = Store.einstellungen;
    var feld = UI.el("textarea.notizfeld", {
      rows: 8, placeholder: "Ziele, Vorbereitung, Gedanken, was zu klären ist …",
      oninput: function () { e.ehe.notiz = feld.value; },
      onblur: function () { Store.einstellungenSpeichern(); }
    });
    feld.value = e.ehe.notiz || "";

    var z = e.finanzen.sparziel;
    return UI.el("div", [
      UI.el("div.karte", [
        UI.el("span.etikett", { text: "Ehe & Familienplanung" }),
        feld
      ]),
      z.name ? UI.el("div.karte.held", [
        UI.el("span.etikett", { text: "Sparziel" }),
        UI.el("div.gebetzeile", [
          UI.el("span.gname.klein", { text: z.name }),
          UI.el("span.gzeit", {
            text: UI.zahl(e.finanzen.vermoegen, 0) + " von " + UI.zahl(z.betrag, 0) + " €"
          })
        ]),
        UI.balken(z.betrag ? e.finanzen.vermoegen / z.betrag : 0)
      ]) : UI.el("div.karte.hinweis", [
        UI.el("div.hz", { text: "Ein Sparziel dafür legst du unter Mehr → Finanzen an. Es erscheint dann hier." })
      ])
    ]);
  }

  function umschalter() {
    return UI.el("div.segment", [
      { k: "kaempfe", t: "Kämpfe" },
      { k: "ehe", t: "Ehe & Familie" }
    ].map(function (o) {
      return UI.el("button.segbtn" + (tab === o.k ? ".an" : ""), {
        type: "button", onclick: function () { tab = o.k; zeichne(); }
      }, o.t);
    }));
  }

  function zeichne() {
    if (!wurzel) return;
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Geschützt", offen ? "Nur für dich" : "Gesperrt", ""));
    if (!offen) { wurzel.appendChild(schleuse()); return; }
    wurzel.appendChild(UI.el("div.inhalt", [
      tab === "kaempfe" ? UI.datumsband(laden) : null,
      umschalter(),
      tab === "kaempfe" ? kaempfeAnsicht() : eheAnsicht()
    ].filter(Boolean)));
  }

  function laden() {
    return Promise.all([Store.tag(), Store.letzteTage(120)]).then(function (r) {
      tag = r[0];
      tage = r[1].filter(function (t) { return t.datum !== tag.datum; });
      // Ohne eingerichteten Code direkt öffnen
      if (!Store.einstellungen.sperre.bereichCode) offen = true;
      zeichne();
    });
  }
  function oeffnen(root) {
    wurzel = root;
    offen = false; ausloeserFuer = null;
    return laden();
  }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; offen = false; } };
})();


/* ==================== Kämpfe verwalten ==================== */
var AnsichtKaempfeVerwalten = (function () {
  "use strict";
  var wurzel = null;

  function zeichne() {
    if (!wurzel) return;
    var e = Store.einstellungen;
    var eingabe = UI.el("input.aufgabenfeld.gross", {
      type: "text", placeholder: "Eigenen Kampf hinzufügen …",
      onkeydown: function (ev) { if (ev.key === "Enter") anlegen(); }
    });
    function anlegen() {
      var t = eingabe.value.trim();
      if (!t) return;
      e.kaempfe.push({ id: "k" + Date.now().toString(36), name: t, aktiv: true });
      Store.einstellungenSpeichern().then(zeichne);
    }

    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Kämpfe", "Was du bekämpfst", ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.el("div.karte", [
        UI.el("div.zeitreihe", [eingabe, UI.el("button.mini", { type: "button", onclick: anlegen }, "+")])
      ]),
      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Tippen schaltet ein oder aus" }),
        UI.el("div.gruppe", e.kaempfe.map(function (k, i) {
          return UI.el("div.zeile.tippbar", {
            onclick: function () {
              k.aktiv = !k.aktiv;
              Store.einstellungenSpeichern().then(zeichne);
            }
          }, [
            UI.el("span.zt.dehnbar", { text: k.name }),
            UI.el("span.schalter" + (k.aktiv ? ".an" : ""), { text: k.aktiv ? "aktiv" : "aus" }),
            UI.el("button.loeschen", {
              type: "button",
              onclick: function (ev) {
                ev.stopPropagation();
                e.kaempfe.splice(i, 1);
                Store.einstellungenSpeichern().then(zeichne);
              }
            }, "×")
          ]);
        }))
      ]),
      UI.el("p.klein", {
        text: "Die Namen sieht nur du. Nenn sie, wie du willst — die App versteht sie nicht, sie zählt nur."
      }),
      UI.el("button.cta.leise", {
        type: "button", onclick: function () { location.hash = "#/privat"; }
      }, "Zurück")
    ]));
  }

  function oeffnen(root) { wurzel = root; zeichne(); return Promise.resolve(); }
  return { oeffnen: oeffnen, schliessen: function () { wurzel = null; } };
})();
