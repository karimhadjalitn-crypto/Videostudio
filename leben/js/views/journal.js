/* Mīzān – Journal. Geschützt, leer, ohne Vorgaben.
   Hier fragt die App nichts. Du schreibst, was du schreiben willst.
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


var AnsichtJournal = (function () {
  "use strict";

  var wurzel = null, tag = null, offen = false, suche = "", feld = null;

  /* ---------- Code-Schleuse ---------- */
  function schleuse() {
    var e = Store.einstellungen;
    var eingabe = UI.el("input.codefeld", {
      type: "password", inputmode: "numeric", maxlength: 8,
      placeholder: "••••", autocomplete: "off",
      onkeydown: function (ev) { if (ev.key === "Enter") pruef(); }
    });
    function pruef() {
      Sperre.pruefen(eingabe.value, e.sperre.bereichCode).then(function (ok) {
        if (ok) { offen = true; laden(); }
        else { UI.meldung("Falscher Code."); eingabe.value = ""; }
      });
    }
    return UI.el("div.inhalt", [
      UI.el("div.karte.schloss", [
        UI.el("div.schlosssymbol", { text: "🔒" }),
        UI.el("span.etikett", { text: "Journal" }),
        UI.el("p.aurteil", { text: "Was hier steht, taucht nirgends sonst in der App auf." }),
        eingabe,
        UI.el("button.cta", { type: "button", onclick: pruef }, "Öffnen")
      ])
    ]);
  }

  /* ---------- Die Schreibfläche ---------- */
  function schreibKarte() {
    /* Das Feld wird beim Neuzeichnen nicht ersetzt, sondern
       weiterverwendet — sonst verliert man beim Tippen den Cursor. */
    if (!feld) {
      feld = UI.el("textarea.journalfeld", {
        placeholder: "",
        oninput: function () { tag.notiz = feld.value; },
        onblur: function () { sichern(); }
      });
    }
    if (document.activeElement !== feld) feld.value = tag.notiz || "";

    var zeichen = (tag.notiz || "").trim().length;
    return UI.el("div.karte.journal", [
      UI.el("div.jkopf", [
        UI.el("span.etikett", { text: UI.datumLang(Store.ausKey(tag.datum)) }),
        zeichen ? UI.el("span.jzahl", {
          text: UI.plural((tag.notiz || "").trim().split(/\s+/).length, "Wort", "Wörter")
        }) : null
      ].filter(Boolean)),
      feld,
      UI.el("div.zfknoepfe", [
        UI.el("button.mini.stark", {
          type: "button",
          onclick: function () { feld.blur(); sichern().then(function () { UI.meldung("Gespeichert."); }); }
        }, "Speichern"),
        zeichen ? UI.el("button.mini.gefahr", {
          type: "button",
          onclick: function () {
            tag.notiz = "";
            feld.value = "";
            sichern().then(function () { UI.meldung("Eintrag gelöscht."); zeichne(); });
          }
        }, "Löschen") : null
      ].filter(Boolean))
    ]);
  }

  function sichern() {
    return Store.tagSpeichern(tag);
  }

  /* ---------- Frühere Einträge ---------- */
  function eintraege() {
    var alle = Store.tageImSpeicher().filter(function (t) {
      return t.notiz && t.notiz.trim() && t.datum !== tag.datum;
    });
    alle.sort(function (a, b) { return a.datum < b.datum ? 1 : -1; });

    if (suche.trim()) {
      var q = suche.trim().toLowerCase();
      alle = alle.filter(function (t) { return t.notiz.toLowerCase().indexOf(q) >= 0; });
    }
    return alle;
  }

  function frueherBlock() {
    var alle = eintraege();
    var sucheFeld = UI.el("input.aufgabenfeld", {
      type: "search", value: suche, placeholder: "In deinen Einträgen suchen",
      oninput: function () { suche = sucheFeld.value; zeichneListe(); }
    });

    var liste = UI.el("div.gruppe");

    function zeichneListe() {
      var treffer = eintraege();
      UI.leeren(liste);
      if (!treffer.length) {
        liste.appendChild(UI.el("div.zeile.leer", {
          text: suche.trim() ? "Nichts gefunden." : "Noch keine früheren Einträge."
        }));
        return;
      }
      treffer.slice(0, 60).forEach(function (t) {
        var d = Store.ausKey(t.datum);
        var text = t.notiz.trim().replace(/\s+/g, " ");
        liste.appendChild(UI.el("div.zeile.tippbar.jzeile", {
          onclick: function () { Store.setzeDatum(t.datum); laden(); }
        }, [
          UI.el("div.jz", [
            UI.el("span.jzdatum", {
              text: UI.WOCHENTAGE[d.getDay()].slice(0, 2) + ", " + d.getDate() + ". " +
                    UI.MONATE[d.getMonth()] +
                    (d.getFullYear() !== new Date().getFullYear() ? " " + d.getFullYear() : "")
            }),
            UI.el("span.jztext", { text: text.length > 90 ? text.slice(0, 90) + " …" : text })
          ]),
          UI.el("span.bpfeil.klein", { text: "›" })
        ]));
      });
    }
    zeichneListe();

    return UI.el("div.block", [
      UI.el("div.blockkopf", { text: "Frühere Einträge" }),
      sucheFeld,
      liste
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    UI.leeren(wurzel);
    var anzahl = Store.tageImSpeicher().filter(function (t) {
      return t.notiz && t.notiz.trim();
    }).length;
    wurzel.appendChild(UI.kopf("Journal",
      anzahl ? UI.plural(anzahl, "Eintrag", "Einträge") : "Nur für dich", ""));

    if (!offen) { wurzel.appendChild(schleuse()); return; }

    wurzel.appendChild(UI.el("div.inhalt", [
      UI.datumsband(laden),
      schreibKarte(),
      frueherBlock()
    ]));
  }

  function laden() {
    feld = null;
    return Store.tag().then(function (t) { tag = t; zeichne(); });
  }

  function oeffnen(root) {
    wurzel = root;
    feld = null;
    suche = "";
    offen = !Store.einstellungen.sperre.bereichCode;
    return laden();
  }

  function schliessen() {
    // Beim Verlassen wieder zusperren
    if (feld && tag) { tag.notiz = feld.value; Store.tagSpeichern(tag); }
    wurzel = null; offen = false; feld = null;
  }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
