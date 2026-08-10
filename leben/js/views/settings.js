/* Mīzān – Mehr / Einstellungen. */
var AnsichtMehr = (function () {
  "use strict";

  var wurzel = null;

  function e() { return Store.einstellungen; }
  function sichern(neu) {
    return Store.einstellungenSpeichern().then(function () { if (neu !== false) zeichne(); });
  }

  function auswahl(label, wert, optionen, beiAenderung) {
    var sel = UI.el("select.feld", {
      onchange: function () { beiAenderung(sel.value); }
    }, optionen.map(function (o) {
      return UI.el("option", { value: o.wert, selected: o.wert === wert }, o.text);
    }));
    return UI.el("div.zeile", [UI.el("span.zt", { text: label }), sel]);
  }

  function zahlZeile(label, wert, schritt, min, max, beiAenderung, einheit) {
    var anzeige = UI.el("span.zw", { text: wert + (einheit || "") });
    function setz(v) {
      v = Math.max(min, Math.min(max, Math.round(v * 100) / 100));
      anzeige.textContent = v + (einheit || "");
      beiAenderung(v);
    }
    return UI.el("div.zeile", [
      UI.el("span.zt", { text: label }),
      anzeige,
      UI.el("div.stepper", [
        UI.el("button.mini", { type: "button", onclick: function () { setz((+anzeige.textContent.replace(einheit || "", "")) - schritt); } }, "−"),
        UI.el("button.mini", { type: "button", onclick: function () { setz((+anzeige.textContent.replace(einheit || "", "")) + schritt); } }, "+")
      ])
    ]);
  }

  function textZeile(label, wert, beiAenderung, platzhalter) {
    var inp = UI.el("input.feld", {
      type: "text", value: wert || "", placeholder: platzhalter || "",
      onchange: function () { beiAenderung(inp.value); }
    });
    return UI.el("div.zeile", [UI.el("span.zt", { text: label }), inp]);
  }

  function importKnopf() {
    var inp = UI.el("input", {
      type: "file", accept: "application/json", style: "display:none",
      onchange: function () {
        var f = inp.files[0]; if (!f) return;
        var leser = new FileReader();
        leser.onload = function () {
          try {
            Store.importieren(JSON.parse(leser.result)).then(function () {
              UI.meldung("Sicherung eingelesen — die App startet neu.");
              // Neu laden, damit Hifz-Bestand, Thema und alle Ansichten
              // wirklich auf dem eingelesenen Stand aufsetzen.
              setTimeout(function () { location.reload(); }, 900);
            }).catch(function () { UI.meldung("Der Import ist fehlgeschlagen."); });
          } catch (err) { UI.meldung("Konnte die Datei nicht lesen."); }
        };
        leser.readAsText(f);
      }
    });
    var z = UI.zeile({ text: "Sicherung einlesen", onclick: function () { inp.click(); } });
    z.appendChild(inp);
    return z;
  }

  function zeichne() {
    if (!wurzel) return;
    var s = e();
    var z = Gebetszeiten.fuer(new Date());
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Mehr", "Einstellungen", "الإعدادات"));

    var methodenOpt = Object.keys(Gebetszeiten.METHODEN).map(function (k) {
      return { wert: k, text: Gebetszeiten.METHODEN[k].name };
    });

    wurzel.appendChild(UI.el("div.inhalt", [

      UI.el("div.karte.hinweis", [
        UI.el("div.hz", { text: "Deine Gebetsapp bleibt die Autorität. Diese Zeiten dienen nur den Erinnerungsfenstern — weicht etwas ab, schieb es unten zurecht." })
      ]),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Erscheinungsbild" }),
        UI.el("div.gruppe", [
          auswahl("Ton des Assistenten", s.ton, [
            { wert: "fordernd", text: "Direkt und fordernd (Standard)" },
            { wert: "hart", text: "Hart — ohne Rücksicht" },
            { wert: "sanft", text: "Sanft und ermutigend" }
          ], function (v) { s.ton = v; Store.einstellungenSpeichern().then(zeichne); }),
          auswahl("Darstellung", s.thema, [
            { wert: "dunkel", text: "Dunkel (Standard)" },
            { wert: "hell", text: "Hell" },
            { wert: "system", text: "Automatisch — folgt dem iPhone" }
          ], function (v) {
            s.thema = v;
            Store.einstellungenSpeichern().then(function () {
              UI.themaAnwenden(v);
              zeichne();
            });
          })
        ])
      ]),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Gebetszeiten" }),
        UI.el("div.gruppe", [
          textZeile("Ort", s.ort.label, function (v) { s.ort.label = v; sichern(false); }),
          auswahl("Methode", s.methode, methodenOpt, function (v) { s.methode = v; sichern(); }),
          auswahl("ʿAṣr", s.asr, [
            { wert: "standard", text: "Standard (Shāfiʿī)" },
            { wert: "hanafi", text: "Ḥanafī" }
          ], function (v) { s.asr = v; sichern(); }),
          auswahl("Sommerregel (Hochbreiten)", s.hochbreiten, [
            { wert: "winkel", text: "Winkelbasiert" },
            { wert: "mitte", text: "Mitte der Nacht" },
            { wert: "siebtel", text: "Siebtel der Nacht" }
          ], function (v) { s.hochbreiten = v; sichern(); })
        ])
      ]),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Feinjustierung in Minuten" }),
        UI.el("div.gruppe", ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"].map(function (k) {
          var name = k === "sunrise" ? "Shurūq" : Gebetszeiten.NAMEN[k].de;
          return zahlZeile(name + " · " + Gebetszeiten.uhr(z[k]), s.korrektur[k], 1, -60, 60,
            function (v) { s.korrektur[k] = v; Store.einstellungenSpeichern(); }, " Min");
        }))
      ]),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Hijri" }),
        UI.el("div.gruppe", [
          UI.el("div.zeile", [
            UI.el("span.zt", { text: "Heute" }),
            UI.el("span.zw", { text: Hijri.fuer(new Date()).text })
          ]),
          zahlZeile("Versatz", s.hijriOffset, 1, -2, 2, function (v) {
            s.hijriOffset = v; Store.einstellungenSpeichern();
          }, " Tage")
        ])
      ]),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Ziele" }),
        UI.el("div.gruppe", [
          zahlZeile("Wasser am Tag", s.wasserZiel, 0.25, 0.5, 6,
            function (v) { s.wasserZiel = v; Store.einstellungenSpeichern(); }, " l"),
          zahlZeile("Moschee pro Woche", s.moscheeZielWoche, 1, 0, 35,
            function (v) { s.moscheeZielWoche = v; Store.einstellungenSpeichern(); }, "×"),
          UI.zeile({
            text: "Hifz-Bestand", wert: "unter Religion → Qur'an",
            onclick: function () { location.hash = "#/quran"; }
          })
        ])
      ]),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Jumuʿa" }),
        UI.el("div.gruppe", [
          textZeile("Sommer", s.jumua.sommer, function (v) { s.jumua.sommer = v; Store.einstellungenSpeichern(); }, "14:45"),
          textZeile("Winter", s.jumua.winter, function (v) { s.jumua.winter = v; Store.einstellungenSpeichern(); }, "13:30")
        ])
      ]),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Einrichten" }),
        UI.el("div.gruppe", [
          UI.zeile({
            text: "Gewichtung des Tagesscores",
            wert: "Religion " + s.gewichte.religion + " %",
            onclick: function () { location.hash = "#/gewichtung"; }
          }),
          UI.zeile({
            text: "Ziele & Listen", wert: "Sport, Essen, Finanzen, Kontakte",
            onclick: function () { location.hash = "#/ziele"; }
          }),
          UI.zeile({
            text: "Morgenbriefing", wert: "ansehen",
            onclick: function () { location.hash = "#/briefing"; }
          }),
          UI.zeile({
            text: "Wiederkehrende Termine", wert: (s.termine || []).length + " angelegt",
            onclick: function () { location.hash = "#/termine"; }
          }),
          UI.zeile({
            text: "Erinnerungen", wert: "Kalender & Kurzbefehle",
            onclick: function () { location.hash = "#/erinnerungen"; }
          }),
          UI.zeile({
            text: "Sperre", wert: (s.sperre.appCode ? "App" : "") +
              (s.sperre.appCode && s.sperre.bereichCode ? " + " : "") +
              (s.sperre.bereichCode ? "Bereich" : "") || "kein Code",
            onclick: function () { location.hash = "#/sperre"; }
          }),
          UI.zeile({
            text: "Reisemodus", wert: s.reise.aktiv ? (s.reise.ort || "aktiv") : "aus",
            onclick: function () { location.hash = "#/reise"; }
          })
        ])
      ]),

      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Deine Daten" }),
        UI.el("div.gruppe", [
          UI.zeile({
            text: "Sicherung herunterladen",
            wert: s.letztesBackup ? "zuletzt " + new Date(s.letztesBackup).toLocaleDateString("de-DE") : "noch nie",
            onclick: function () { Store.exportDatei().then(function () { UI.meldung("Sicherung gespeichert."); zeichne(); }); }
          }),
          importKnopf()
        ])
      ]),

      UI.el("div.karte.hinweis", [
        UI.el("div.hz", { text: "Alles liegt nur auf diesem Gerät. Es gibt keinen Server und kein Konto — wenn du das iPhone verlierst, sind die Daten weg. Lad dir die Sicherung regelmäßig herunter." })
      ]),

      UI.el("div.karte.hinweis", [
        UI.el("div.hz", { text: "Aufs iPhone: Seite in Safari öffnen → Teilen → „Zum Home-Bildschirm“. Danach läuft Mīzān im Vollbild und offline." })
      ]),

      UI.el("p.fuss", { text: "Mīzān · Phase 1 · Gebete, Gebetszeiten, Hijri, Score, Abendabrechnung" })
    ]));
  }

  function oeffnen(root) { wurzel = root; zeichne(); return Promise.resolve(); }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
