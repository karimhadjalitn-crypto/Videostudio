/* Mīzān – Erinnerungen einrichten.
   Kalenderdatei für die festen Zeiten, iOS-Kurzbefehle für alles andere. */
var AnsichtErinnerungen = (function () {
  "use strict";

  var wurzel = null;
  var opt = { gebete: "alle", monate: 3, alarmMin: 10, weisseTage: true, termine: true, jumua: true };

  function basis() { return location.href.split("#")[0]; }

  function kopieren(text, was) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        UI.meldung(was + " kopiert.");
      }).catch(function () { UI.meldung("Kopieren ging nicht — Adresse von Hand markieren."); });
    } else {
      UI.meldung("Kopieren ging nicht — Adresse von Hand markieren.");
    }
  }

  function adressZeile(beschriftung, pfad) {
    var voll = basis() + pfad;
    return UI.el("div.adresse", [
      UI.el("div.adrkopf", { text: beschriftung }),
      UI.el("code.adrtext", { text: voll }),
      UI.el("button.mini.breit", {
        type: "button", onclick: function () { kopieren(voll, "Adresse"); }
      }, "Adresse kopieren")
    ]);
  }

  /* Ein-/Ausschalter. Bewusst kein Haken: ein Haken heißt in dieser App
     „erledigt“ und graut die Zeile aus — hier wäre das genau verkehrt. */
  function schalter(text, schluessel) {
    var an = !!opt[schluessel];
    return UI.el("div.zeile.tippbar", {
      onclick: function () { opt[schluessel] = !an; zeichne(); }
    }, [
      UI.el("span.zt", { text: text }),
      UI.el("span.schalter" + (an ? ".an" : ""), { text: an ? "dabei" : "aus" })
    ]);
  }

  function schritte(liste) {
    return UI.el("ol.schrittliste", liste.map(function (s) {
      return UI.el("li", { html: s });
    }));
  }

  function auswahl(label, wert, optionen, beiAenderung) {
    var sel = UI.el("select.feld", { onchange: function () { beiAenderung(sel.value); } },
      optionen.map(function (o) {
        return UI.el("option", { value: o.wert, selected: String(o.wert) === String(wert) }, o.text);
      }));
    return UI.el("div.zeile", [UI.el("span.zt", { text: label }), sel]);
  }

  function zeichne() {
    if (!wurzel) return;
    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Erinnerungen", "Damit die App dich anstupst", "التذكير"));

    wurzel.appendChild(UI.el("div.inhalt", [

      UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Eine Web-App auf dem iPhone darf von sich aus keine Mitteilungen zu festen Zeiten schicken — das lässt Safari nicht zu, bei jeder Web-App. Deshalb übernehmen zwei andere Wege den Job: der iPhone-Kalender für alles Feste, Kurzbefehle für alles Übrige. Beides ohne Server; nichts verlässt dein Gerät."
        })
      ]),

      /* ---------- 1. Kalenderdatei ---------- */
      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "1 · Kalenderdatei" }),
        UI.el("div.gruppe", [
          auswahl("Gebetszeiten", opt.gebete, [
            { wert: "alle", text: "Alle fünf" },
            { wert: "eckpunkte", text: "Nur Fajr und Maghrib" },
            { wert: "keine", text: "Keine" }
          ], function (v) { opt.gebete = v; zeichne(); }),
          auswahl("Zeitraum", opt.monate, [
            { wert: 1, text: "1 Monat" },
            { wert: 3, text: "3 Monate" },
            { wert: 6, text: "6 Monate" },
            { wert: 12, text: "12 Monate" }
          ], function (v) { opt.monate = +v; zeichne(); }),
          auswahl("Alarm vorher", opt.alarmMin, [
            { wert: 0, text: "zur Zeit" },
            { wert: 5, text: "5 Minuten" },
            { wert: 10, text: "10 Minuten" },
            { wert: 20, text: "20 Minuten" }
          ], function (v) { opt.alarmMin = +v; zeichne(); }),
          schalter("Weiße Tage", "weisseTage"),
          schalter("Islamische Termine", "termine"),
          schalter("Jumuʿa freitags", "jumua")
        ])
      ]),

      UI.el("button.cta", {
        type: "button",
        onclick: function () {
          var n = ICS.herunterladen(opt);
          UI.meldung(n + " Termine erzeugt.");
        }
      }, "Kalenderdatei erzeugen"),

      UI.el("div.karte", [
        UI.el("span.etikett", { text: "So kommt sie in den Kalender" }),
        schritte([
          "Auf <b>Kalenderdatei erzeugen</b> tippen — Safari lädt <code>mizan-kalender.ics</code>.",
          "In der Ladeliste oben rechts auf die Datei tippen.",
          "<b>Alle hinzufügen</b> wählen und einen eigenen Kalender „Mīzān“ anlegen.",
          "Fertig — ab jetzt kommen die Alarme von iOS, auch bei geschlossener App."
        ]),
        UI.el("p.klein", {
          text: "Läuft der Zeitraum ab, hier einfach eine neue Datei erzeugen. Gleiche Termine werden ersetzt, nicht verdoppelt."
        })
      ]),

      /* ---------- 2. Kurzbefehle ---------- */
      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "2 · Kurzbefehle" }),
        UI.el("div.karte.hinweis", [
          UI.el("div.hz", {
            text: "Fertige Kurzbefehl-Dateien kann ich dir nicht liefern — Apple verlangt dafür eine Signatur, die nur auf einem Mac entsteht. Was ich liefern kann: die Adressen, die die Kurzbefehle aufrufen, und die Schritte dazu. Jeder ist in zwei Minuten angelegt."
          })
        ])
      ]),

      UI.el("div.karte", [
        UI.el("span.etikett", { text: "Fajr in einem Tipp eintragen" }),
        UI.el("p.aurteil", { text: "Ein Symbol auf dem Home-Bildschirm, das Fajr sofort als „in der Moschee“ einträgt." }),
        adressZeile("Adresse für den Kurzbefehl", "#/import?gebet=fajr&stufe=moschee"),
        schritte([
          "App <b>Kurzbefehle</b> öffnen → <b>+</b> → Aktion <b>„URL öffnen“</b> suchen.",
          "Die Adresse oben einsetzen.",
          "Oben auf den Namen tippen → <b>Zum Home-Bildschirm</b>.",
          "Für andere Gebete <code>fajr</code> ersetzen durch <code>dhuhr</code>, <code>asr</code>, <code>maghrib</code> oder <code>isha</code>; für die Stufe <code>moschee</code> durch <code>puenktlich</code>, <code>fenster</code>, <code>spaet</code> oder <code>verpasst</code>."
        ])
      ]),

      UI.el("div.karte", [
        UI.el("span.etikett", { text: "Der Tagesabschluss nach ʿIshā'" }),
        UI.el("p.aurteil", {
          text: "Der wichtigste Kurzbefehl: eine Erinnerung am Abend, die dich gleich in die richtige Ansicht bringt."
        }),
        adressZeile("Adresse", "#/abschluss"),
        schritte([
          "In <b>Kurzbefehle</b> auf <b>Automation</b> → <b>Neue Automation</b> → <b>Tageszeit</b>.",
          "Zeit wählen, z. B. <b>22:30</b>, täglich, <b>sofort ausführen</b> ohne Nachfrage.",
          "<b>Mitteilung anzeigen</b>: „Tag abschließen — eine Minute.“",
          "Zweite Aktion <b>URL öffnen</b> mit der Adresse oben."
        ])
      ]),

      UI.el("div.karte", [
        UI.el("span.etikett", { text: "Weitere Adressen" }),
        UI.el("p.aurteil", {
          text: "Alles, was ein Kurzbefehl direkt eintragen kann. Mehrere Werte lassen sich mit & verbinden."
        }),
        adressZeile("Adhkār erledigt", "#/import?dhikr=1"),
        adressZeile("Murājaʿa erledigt", "#/import?murajaa=1"),
        adressZeile("Fünf Seiten gelesen", "#/import?gelesen=5"),
        adressZeile("Trainiert", "#/import?training=1"),
        adressZeile("Gefastet", "#/import?fasten=1"),
        UI.el("p.klein", {
          text: "Mehrere auf einmal: #/import?dhikr=1&gelesen=5&training=1"
        })
      ]),



      UI.el("button.cta.leise", {
        type: "button", onclick: function () { location.hash = "#/mehr"; }
      }, "Zurück")
    ]));
  }

  function oeffnen(root) { wurzel = root; zeichne(); return Promise.resolve(); }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
