/* Sūq – Einstellungen (Shots).

   Aus dem Skript wird eine Liste, nach der man drehen und schneiden kann.
   Zwei Regeln stecken fest darin:

   1. Schnitt alle zwei bis drei Sekunden. Länger hält auf TikTok kaum
      jemand aus, kürzer wird es hektisch und man sieht das Produkt nicht.
   2. In keiner einzigen Einstellung steht ein Mensch. Die Vorlagen unten
      kennen nur Produkt, Material, Licht, Fläche — und die eigene Hand
      am Produkt, ohne dass jemand ins Bild kommt.

   Das Bildmaterial kommt aus zwei Quellen: den freigegebenen Fotos des
   Sellers und dem, was du selbst mit dem Handy aufnimmst. Nichts davon
   wird erzeugt. Deswegen sieht es echt aus — es ist echt. */
var Shots = (function () {
  "use strict";

  var BEWEGUNGEN = {
    hinein:   "langsam hinein",
    heraus:   "langsam heraus",
    links:    "Schwenk nach links",
    rechts:   "Schwenk nach rechts",
    hoch:     "Schwenk nach oben",
    runter:   "Schwenk nach unten",
    still:    "starr"
  };

  var QUELLEN = {
    seller: "Sellerfoto",
    eigen:  "Selbst gedreht",
    makro:  "Makro, selbst"
  };

  /* ---------- Vorlagen ----------
     Je Kategorie eine Reihe von Einstellungen, grob in der Reihenfolge,
     in der man sie braucht. `rolle` sagt, in welchem Abschnitt sie sitzt. */
  var VORLAGEN = {
    "Gebetsteppich": [
      { rolle: "hook",    quelle: "makro",  bewegung: "hinein", was: "Makro auf den Flor, Licht von der Seite" },
      { rolle: "problem", quelle: "eigen",  bewegung: "runter", was: "Blanker Boden, harte Fliese, kaltes Licht" },
      { rolle: "produkt", quelle: "seller", bewegung: "heraus", was: "Teppich ausgerollt, Draufsicht, ganze Fläche" },
      { rolle: "produkt", quelle: "eigen",  bewegung: "hinein", was: "Kante im Querschnitt — die Dicke wird sichtbar" },
      { rolle: "beweis",  quelle: "makro",  bewegung: "links",  was: "Eigene Hand streicht über die Oberfläche, kein Gesicht im Bild" },
      { rolle: "beweis",  quelle: "makro",  bewegung: "hinein", was: "Unterseite: Noppen gegen das Rutschen" },
      { rolle: "einwand", quelle: "eigen",  bewegung: "still",  was: "Teppich zusammengerollt neben der Tasche, Größenvergleich" },
      { rolle: "cta",     quelle: "seller", bewegung: "hinein", was: "Produkt sauber im Bild, ruhig, Platz unten für den Korb" }
    ],
    "Kleidung": [
      { rolle: "hook",    quelle: "makro",  bewegung: "hinein", was: "Makro auf die Stickerei am Ärmel" },
      { rolle: "problem", quelle: "eigen",  bewegung: "still",  was: "Stoff gegen das Licht gehalten — man sieht, dass er nicht durchscheint" },
      { rolle: "produkt", quelle: "seller", bewegung: "heraus", was: "Auf dem Bügel, frontal, ganze Länge" },
      { rolle: "produkt", quelle: "eigen",  bewegung: "runter", was: "Auf der kopflosen Puppe: der Fall des Stoffs von oben nach unten" },
      { rolle: "beweis",  quelle: "makro",  bewegung: "links",  was: "Naht innen, Nahaufnahme — sauber versäubert" },
      { rolle: "beweis",  quelle: "eigen",  bewegung: "still",  was: "Stoff bewegt sich im Luftzug, seitliches Licht" },
      { rolle: "einwand", quelle: "eigen",  bewegung: "hinein", was: "Maßband am Saum, Zahl lesbar" },
      { rolle: "cta",     quelle: "seller", bewegung: "hinein", was: "Ganzes Stück ruhig im Bild, Platz unten frei" }
    ],
    "Duft & Attar": [
      { rolle: "hook",    quelle: "makro",  bewegung: "hinein", was: "Ein Tropfen am Glasstab, Gegenlicht" },
      { rolle: "problem", quelle: "eigen",  bewegung: "still",  was: "Andere Flakons stehen daneben, halb leer" },
      { rolle: "produkt", quelle: "seller", bewegung: "heraus", was: "Flakon auf Stein oder dunklem Holz" },
      { rolle: "produkt", quelle: "makro",  bewegung: "hoch",   was: "Deckel wird abgenommen, Nahaufnahme" },
      { rolle: "beweis",  quelle: "makro",  bewegung: "hinein", was: "Licht durch die Flüssigkeit — Farbe und Klarheit" },
      { rolle: "einwand", quelle: "eigen",  bewegung: "still",  was: "Etikett lesbar: alkoholfrei, Inhalt in Millilitern" },
      { rolle: "cta",     quelle: "seller", bewegung: "hinein", was: "Flakon mittig, ruhiger Hintergrund" }
    ],
    "Tasbīḥ & Dhikr": [
      { rolle: "hook",    quelle: "makro",  bewegung: "links",  was: "Perlen laufen durch die eigene Hand, nur Hand im Bild" },
      { rolle: "problem", quelle: "eigen",  bewegung: "still",  was: "Handy mit Zähler-App auf dem Tisch, Bildschirm an" },
      { rolle: "produkt", quelle: "seller", bewegung: "heraus", was: "Ganze Kette ausgelegt, Draufsicht" },
      { rolle: "beweis",  quelle: "makro",  bewegung: "hinein", was: "Einzelne Perle groß — Maserung und Bohrung" },
      { rolle: "einwand", quelle: "eigen",  bewegung: "still",  was: "Kette neben einer Handfläche als Größenvergleich" },
      { rolle: "cta",     quelle: "seller", bewegung: "hinein", was: "Produkt ruhig im Bild" }
    ],
    "Buch & Qurʾān": [
      { rolle: "hook",    quelle: "makro",  bewegung: "hinein", was: "Prägung auf dem Einband, streifendes Licht" },
      { rolle: "problem", quelle: "eigen",  bewegung: "still",  was: "Anderes Buch, viel zu dicht gesetzt, kleine Schrift" },
      { rolle: "produkt", quelle: "seller", bewegung: "heraus", was: "Buch aufgeschlagen, Doppelseite" },
      { rolle: "beweis",  quelle: "makro",  bewegung: "runter", was: "Seiten blättern durch, Papierstärke sichtbar" },
      { rolle: "einwand", quelle: "eigen",  bewegung: "still",  was: "Buch neben einem Alltagsgegenstand als Größenvergleich" },
      { rolle: "cta",     quelle: "seller", bewegung: "hinein", was: "Cover ruhig im Bild" }
    ],
    "*": [
      { rolle: "hook",    quelle: "makro",  bewegung: "hinein", was: "Auffälligstes Detail groß, seitliches Licht" },
      { rolle: "problem", quelle: "eigen",  bewegung: "still",  was: "Die Situation ohne das Produkt" },
      { rolle: "produkt", quelle: "seller", bewegung: "heraus", was: "Produkt ganz im Bild, ruhiger Hintergrund" },
      { rolle: "produkt", quelle: "eigen",  bewegung: "hinein", was: "Zweite Ansicht: Rückseite oder Innenseite" },
      { rolle: "beweis",  quelle: "makro",  bewegung: "links",  was: "Material aus der Nähe — Verarbeitung wird sichtbar" },
      { rolle: "einwand", quelle: "eigen",  bewegung: "still",  was: "Größenvergleich mit etwas Bekanntem" },
      { rolle: "cta",     quelle: "seller", bewegung: "hinein", was: "Produkt ruhig im Bild, Platz unten für den Korb" }
    ]
  };

  var MAX_SHOT = 3.0;   // länger wird es zäh
  var MIN_SHOT = 1.4;   // kürzer sieht man nichts

  function vorlagen(p) {
    var kat = p ? p.kategorie : "*";
    return VORLAGEN[kat] || VORLAGEN["*"];
  }

  /* Wie viele Einstellungen braucht ein Abschnitt von n Sekunden? */
  function anzahl(sek) {
    if (sek <= 0) return 0;
    return Math.max(1, Math.min(4, Math.ceil(sek / MAX_SHOT)));
  }

  /* ---------- Vorschlag ----------
     Die Einstellungen liegen auf der Zeitachse des Skripts. Damit ist der
     Schnitt später keine Suche mehr: jede Einstellung weiß, wann sie
     anfängt und wann sie aufhört. */
  function vorschlag(v, p) {
    var achse = Skript.zeitachse(v);
    var pool = vorlagen(p);
    var einbl = Recht.einblendung();
    var shots = [];
    var nr = 0;

    achse.forEach(function (a) {
      if (a.sek <= 0) return;
      var n = anzahl(a.sek);
      var dauer = Math.round((a.sek / n) * 10) / 10;

      /* Passende Vorlagen für diesen Abschnitt; wenn es zu wenige gibt,
         wird durchgereicht, statt eine fremde Rolle zu nehmen. */
      var passend = pool.filter(function (t) { return t.rolle === a.id; });
      if (!passend.length) passend = pool.filter(function (t) { return t.rolle === "produkt"; });
      if (!passend.length) passend = pool;

      for (var i = 0; i < n; i++) {
        var t = passend[i % passend.length];
        var von = Math.round((a.von + i * dauer) * 10) / 10;
        nr++;
        shots.push({
          nr: nr,
          abschnitt: a.id,
          abschnittName: a.name,
          von: von,
          dauer: Math.max(MIN_SHOT, dauer),
          quelle: t.quelle,
          bewegung: t.bewegung,
          was: t.was,
          bild: null,            // wird später mit einem Foto verknüpft
          einblendung: ""
        });
      }
    });

    /* Die Werbekennzeichnung sitzt auf der ersten Einstellung — dort, wo
       sie hingehört, und nicht irgendwo im Verlauf. */
    if (einbl && shots.length) {
      shots[0].einblendung = einbl.text;
    }
    return shots;
  }

  function gesamtdauer(shots) {
    return (shots || []).reduce(function (s, x) { return s + (x.dauer || 0); }, 0);
  }

  /* Nummern nach dem Umsortieren oder Löschen wieder geradeziehen, und
     die Startzeiten gleich mit. Ohne das zeigt die Liste Zeiten an, die
     mit dem Voiceover nichts mehr zu tun haben. */
  function neuNummerieren(shots) {
    var t = 0;
    shots.forEach(function (s, i) {
      s.nr = i + 1;
      s.von = Math.round(t * 10) / 10;
      t += s.dauer || 0;
    });
    return shots;
  }

  /* ---------- Ausgabe für den Schnitt ----------
     Genau die Beschreibung, die das Montagewerkzeug unter tools/ liest.

     Die Fotos stehen hier mit ihrem Dateinamen, nicht mit der internen
     Kennung: das Werkzeug läuft auf einem Rechner mit einem Ordner voller
     Bilder und kann mit einer Datenbank-Kennung nichts anfangen. */
  function alsBauplan(v, p) {
    var m = Recht.mappe(v, p);
    var namen = {};
    (p ? p.fotos : []).forEach(function (f) { namen[f.id] = f.name; });
    return {
      app: "suq",
      titel: v.titel || (p ? p.name : "Video"),
      breite: 1080,
      hoehe: 1920,
      bilder: 30,
      kennzeichnung: m.einblendung ? {
        text: m.einblendung.text, von: m.einblendung.von, bis: m.einblendung.bis
      } : null,
      stimme: v.stimme && v.stimme.datei ? v.stimme.datei : null,
      klang: Store.einstellungen.klang,
      szenen: (v.shots || []).map(function (s) {
        return {
          nr: s.nr,
          von: s.von,
          dauer: s.dauer,
          bewegung: s.bewegung,
          quelle: s.quelle,
          was: s.was,
          bild: s.bild ? (namen[s.bild] || null) : null,
          einblendung: s.einblendung || ""
        };
      }),
      /* Die Abschnitte des Skripts — daraus werden die Untertitel. */
      abschnitte: Skript.zeitachse(v).filter(function (a) { return a.text; })
    };
  }

  /* Zum Ausdrucken oder Abarbeiten am Drehort. */
  function alsText(v, p) {
    var out = [];
    out.push("DREHPLAN — " + (v.titel || (p ? p.name : "Video")));
    out.push("Gesamtlänge etwa " + gesamtdauer(v.shots).toFixed(1) + " Sekunden");
    out.push("Keine Menschen im Bild. Keine Musik.");
    out.push("");
    (v.shots || []).forEach(function (s) {
      out.push(
        String(s.nr).padStart(2, "0") + "  " +
        ("+" + s.von.toFixed(1) + "s").padEnd(8) +
        (s.dauer.toFixed(1) + "s").padEnd(7) +
        (QUELLEN[s.quelle] || s.quelle).padEnd(16) +
        (BEWEGUNGEN[s.bewegung] || s.bewegung)
      );
      out.push("      " + s.was);
      if (s.einblendung) out.push("      Einblendung: „" + s.einblendung + "“");
      out.push("");
    });
    return out.join("\n");
  }

  return {
    BEWEGUNGEN: BEWEGUNGEN,
    QUELLEN: QUELLEN,
    VORLAGEN: VORLAGEN,
    vorschlag: vorschlag,
    gesamtdauer: gesamtdauer,
    neuNummerieren: neuNummerieren,
    alsBauplan: alsBauplan,
    alsText: alsText
  };
})();
