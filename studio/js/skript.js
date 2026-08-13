/* Sūq – Skript-Werkstatt.

   HINWEIS: Die gepflegte Fassung des Studios ist studio/artifact.html —
   eine einzelne Seite, die als Artifact in Claude läuft. Dort ist das
   Kurzformat mit zehn Sekunden der Normalfall, dort sitzt das Prompt-Feld,
   und dort wird weiterentwickelt. Diese modulare Fassung bleibt für den
   Betrieb als installierte Web-App auf dem Startbildschirm.

   Ein Verkaufsvideo hat sechs Teile, und sie stehen in dieser Reihenfolge,
   weil jeder den nächsten trägt:

     Hook      Warum jemand nicht weiterwischt.        0–3 s
     Problem   Warum ihn das überhaupt angeht.         3–8 s
     Produkt   Was es ist und was es löst.             8–18 s
     Beweis    Warum das stimmt und nicht nur klingt. 18–26 s
     Einwand   Was ihn noch abhält, vorweggenommen.   26–32 s
     CTA       Was er jetzt tun soll.                 32–38 s

   Das ist keine Kunstform. Wer den Beweis weglässt, verkauft nichts, und
   wer den Einwand nicht kennt, verkauft an der Absicht vorbei. Dass es
   Werbung ist, steht von Anfang an fest — das Video versucht gar nicht
   erst, etwas anderes zu sein. */
var Skript = (function () {
  "use strict";

  /* ---------- Hooks ----------
     `kennzeichnet` heißt: der Hook trägt das Wort „Werbung“ selbst. Das ist
     der eleganteste Weg, die Kennzeichnungspflicht zu erfüllen — sie steht
     ganz vorn, sie ist nicht zu übersehen, und sie kostet keine Sekunde
     Aufmerksamkeit, weil sie Teil des Satzes ist. Offenheit wirkt auf
     TikTok ohnehin besser als das halb versteckte „Ad“ in der Ecke. */
  var HOOKS = [
    /* --- trägt die Kennzeichnung --- */
    { art: "kennzeichnung", kennzeichnet: true, kategorien: ["*"],
      text: "Werbung — aber für etwas, das seit Monaten bei mir liegt." },
    { art: "kennzeichnung", kennzeichnet: true, kategorien: ["*"],
      text: "Das hier ist Werbung. Trotzdem: schau dir die Nahaufnahme an." },
    { art: "kennzeichnung", kennzeichnet: true, kategorien: ["*"],
      text: "Werbung. Ich sag dir gleich auch, für wen das nichts ist." },
    { art: "kennzeichnung", kennzeichnet: true, kategorien: ["*"],
      text: "Anzeige — und der erste ehrliche Satz kommt sofort danach." },

    /* --- Widerspruch --- */
    { art: "widerspruch", kategorien: ["Kleidung"],
      text: "Das sieht teuer aus. Ist es nicht." },
    { art: "widerspruch", kategorien: ["Gebetsteppich"],
      text: "Ein Gebetsteppich, der dünner ist als deiner — und trotzdem weicher." },
    { art: "widerspruch", kategorien: ["Duft & Attar"],
      text: "Alkoholfrei. Und hält länger als das, was du gerade benutzt." },
    { art: "widerspruch", kategorien: ["*"],
      text: "Ich wollte das eigentlich zurückschicken." },

    /* --- eigenes Versäumnis --- */
    { art: "versaeumnis", kategorien: ["Gebetsteppich"],
      text: "Drei Jahre auf dem blanken Boden gebetet. Muss man nicht." },
    { art: "versaeumnis", kategorien: ["Tasbīḥ & Dhikr"],
      text: "Ich habe beim Dhikr immer das Handy benutzt. Bis ich das hier hatte." },
    { art: "versaeumnis", kategorien: ["Reise"],
      text: "Auf der letzten Reise habe ich im Hotelzimmer auf einem Handtuch gebetet." },
    { art: "versaeumnis", kategorien: ["*"],
      text: "Das hätte ich vor zwei Jahren gebraucht." },

    /* --- Zahl --- */
    { art: "zahl", kategorien: ["*"],
      text: "Drei Dinge, die ich hier nicht erwartet hätte." },
    { art: "zahl", kategorien: ["*"],
      text: "Ich habe vier davon bestellt. Einer ist geblieben." },
    { art: "zahl", kategorien: ["Zuhause", "Sonstiges"],
      text: "Fünf Sachen, die bei mir zu Hause jeder fragt, woher ich sie habe." },

    /* --- direkte Ansprache --- */
    { art: "ansprache", kategorien: ["Reise", "Gebetsteppich"],
      text: "Wenn du unterwegs betest, hör kurz zu." },
    { art: "ansprache", kategorien: ["Kleidung"],
      text: "Wenn du eine suchst, die nicht durchscheint — hier." },
    { art: "ansprache", kategorien: ["Kinder"],
      text: "Falls deine Kinder beim Beten nur danebenstehen: das hier hilft." },
    { art: "ansprache", kategorien: ["Buch & Qurʾān"],
      text: "Wenn du anfangen willst und nicht weißt womit — damit." },

    /* --- Detail --- */
    { art: "detail", kategorien: ["*"],
      text: "Schau dir kurz die Naht an. Da entscheidet sich alles." },
    { art: "detail", kategorien: ["Gebetsteppich"],
      text: "Das ist der Unterschied zwischen acht Millimetern und deinem Knie." },
    { art: "detail", kategorien: ["Duft & Attar"],
      text: "Ein Tropfen. Mehr braucht das nicht." },

    /* --- Preis --- */
    { art: "preis", kategorien: ["*"],
      text: "Unter {preis}. Deswegen liegt es überhaupt noch hier." },
    { art: "preis", kategorien: ["*"],
      text: "Was würdest du dafür schätzen? Warte kurz." }
  ];

  /* ---------- Bausteine für die übrigen Abschnitte ----------
     Sie sind Rohlinge, keine fertigen Sätze. Du überschreibst sie — aber
     du fängst nicht bei null an, und das ist der ganze Punkt. */
  var BAUSTEINE = {
    problem: {
      "Gebetsteppich": "Auf einem dünnen Teppich tut der Sujūd nach dem zweiten Rakʿa weh, und auf einem dicken rutscht du weg.",
      "Kleidung": "Das Meiste in dieser Preisklasse ist entweder zu dünn oder es sitzt nach der ersten Wäsche anders.",
      "Duft & Attar": "Die meisten alkoholfreien Düfte sind nach einer Stunde weg.",
      "Tasbīḥ & Dhikr": "Am Handy verzählt man sich, und man landet in den Nachrichten statt im Dhikr.",
      "Buch & Qurʾān": "Die meisten fangen mit einem Buch an, das für Fortgeschrittene geschrieben ist, und hören nach dreißig Seiten auf.",
      "Zuhause": "Man will es schön haben, ohne dass es kitschig wird. Das ist der schmale Grat.",
      "Kinder": "Kinder machen mit, wenn sie etwas Eigenes haben. Sonst stehen sie daneben.",
      "Reise": "Unterwegs hast du keinen sauberen Platz und keine Zeit zu suchen.",
      "Sonstiges": "Das Problem daran ist meistens nicht der Preis, sondern dass es nach vier Wochen kaputt ist."
    },
    produkt: "{name} — {merkmal}.",
    beweis: {
      "Gebetsteppich": "Ich benutze ihn seit {dauer}. Die Stellen unter den Knien sehen aus wie am ersten Tag.",
      "Kleidung": "Zweimal gewaschen bei dreißig Grad. Keine Falten, die bleiben, kein Ausbleichen.",
      "Duft & Attar": "Morgens aufgetragen, abends noch da. Das kannst du an mir nicht überprüfen — aber schau, wie wenig ich nehme.",
      "Tasbīḥ & Dhikr": "Die Perlen laufen ohne zu haken. Das hörst du im Ton.",
      "Buch & Qurʾān": "Ich zeige dir eine Seite, dann weißt du, ob die Sprache für dich passt.",
      "Zuhause": "Das Material ist keine Folie. Man sieht es an der Kante.",
      "Kinder": "Meine sind {alter}. Sie holen es sich inzwischen selbst.",
      "Reise": "Passt in die Seitentasche. Ich zeig dir, wie klein das wirklich wird.",
      "Sonstiges": "Ich benutze es seit {dauer}. Bisher nichts kaputt."
    },
    einwand: {
      "Gebetsteppich": "„Der ist doch bestimmt rutschig.“ — Ist er nicht, die Unterseite ist genoppt. Schau.",
      "Kleidung": "„In der Größe passt das nie.“ — Die Tabelle stimmt, ausnahmsweise. Ich hab nachgemessen.",
      "Duft & Attar": "„Alkoholfrei riecht immer streng.“ — Dieser nicht. Aber urteil selbst nach zwei Tagen.",
      "Tasbīḥ & Dhikr": "„Brauche ich nicht, ich zähl an den Fingern.“ — Kannst du. Bis du bei 33 rauskommst und nicht weißt, ob es die erste oder zweite Runde war.",
      "Buch & Qurʾān": "„Zu dick.“ — Es ist zum Nachschlagen gemacht, nicht zum Durchlesen.",
      "Zuhause": "„Sieht online immer anders aus.“ — Deswegen dieses Video bei Tageslicht, ungefiltert.",
      "Kinder": "„Damit spielen sie zwei Tage.“ — Meine seit {dauer}. Aber das musst du für dich einschätzen.",
      "Reise": "„Zu klein, um bequem zu sein.“ — Für unterwegs, nicht für zu Hause. Dafür hast du deinen normalen.",
      "Sonstiges": "„Klingt zu gut.“ — Für wen es nichts ist, sage ich dir jetzt: {fuerWen}."
    },
    cta: [
      "Der orange Korb unten. Da liegt es drin.",
      "Tipp auf den Korb, dann siehst du den aktuellen Preis.",
      "Unten im Korb — falls es weg ist, war es weg, ich kann da nichts machen.",
      "Korb unten links. Ich hab dir den Link drangehängt."
    ]
  };

  /* ---------- Sekunden schätzen ----------
     Deutsche Werbestimme in ruhigem Tempo liegt bei etwa 2,4 Wörtern
     pro Sekunde. Kurze Sätze brauchen zusätzlich ihre Pause — die zählt
     mit, sonst ist die Shotliste zu knapp und der Schnitt hetzt. */
  function sekunden(text) {
    if (!text || !text.trim()) return 0;
    var woerter = text.trim().split(/\s+/).length;
    var saetze = (text.match(/[.!?…]+/g) || []).length || 1;
    return Math.max(1.2, Math.round((woerter / 2.4 + saetze * 0.35) * 10) / 10);
  }

  var REIHE = ["hook", "problem", "produkt", "beweis", "einwand", "cta"];

  var ABSCHNITTE = [
    { id: "hook",    name: "Hook",         frage: "Warum wischt er nicht weiter?" },
    { id: "problem", name: "Problem",      frage: "Warum geht ihn das an?" },
    { id: "produkt", name: "Produkt",      frage: "Was ist es und was löst es?" },
    { id: "beweis",  name: "Beweis",       frage: "Warum stimmt das?" },
    { id: "einwand", name: "Einwand",      frage: "Was hält ihn noch ab?" },
    { id: "cta",     name: "Aufforderung", frage: "Was soll er jetzt tun?" }
  ];

  /* Sekunden am Text nachziehen — der Nutzer schreibt, das Timing folgt. */
  function timingNachziehen(v) {
    REIHE.forEach(function (k) {
      v.skript[k].sek = sekunden(v.skript[k].text);
    });
    return v;
  }

  function gesamt(v) {
    return REIHE.reduce(function (s, k) { return s + (v.skript[k].sek || 0); }, 0);
  }

  /* Start und Ende jedes Abschnitts auf der Zeitachse. Die Shotliste
     hängt daran, und der Schnitt später auch. */
  function zeitachse(v) {
    var t = 0;
    return REIHE.map(function (k) {
      var von = t;
      t += v.skript[k].sek || 0;
      return { id: k, name: ABSCHNITTE.filter(function (a) { return a.id === k; })[0].name,
               text: v.skript[k].text, von: Math.round(von * 10) / 10,
               bis: Math.round(t * 10) / 10, sek: v.skript[k].sek || 0 };
    });
  }

  /* ---------- Vorschlag ---------- */

  function passendeHooks(p) {
    var kat = p ? p.kategorie : "Sonstiges";
    return HOOKS.filter(function (h) {
      return h.kategorien.indexOf("*") >= 0 || h.kategorien.indexOf(kat) >= 0;
    });
  }

  function fuellen(text, p) {
    if (!p) return text;
    return text
      .replace(/\{name\}/g, p.name || "Das hier")
      .replace(/\{preis\}/g, p.preis ? Recht.preisText(p.preis) : "zwanzig Euro")
      .replace(/\{merkmal\}/g, (p.merkmale && p.merkmale[0]) || "…")
      .replace(/\{dauer\}/g, "vier Monaten")
      .replace(/\{alter\}/g, "vier und sieben")
      .replace(/\{fuerWen\}/g, (p.einwaende && p.einwaende[0]) || "…");
  }

  function baustein(feld, p) {
    var b = BAUSTEINE[feld];
    if (typeof b === "string") return fuellen(b, p);
    if (Array.isArray(b)) return fuellen(b[Math.floor(Math.random() * b.length)], p);
    var kat = p ? p.kategorie : "Sonstiges";
    return fuellen(b[kat] || b["Sonstiges"], p);
  }

  /* Erzeugt ein vollständiges Skript. `hookIndex` erlaubt es, denselben
     Vorschlag mit einem anderen Einstieg noch einmal zu holen — genau das
     macht man beim Schreiben ständig. */
  function vorschlag(p, hookIndex) {
    var hooks = passendeHooks(p);
    var h = hooks[((hookIndex || 0) % hooks.length + hooks.length) % hooks.length];

    var s = {
      hook:    { text: fuellen(h.text, p), sek: 0 },
      problem: { text: baustein("problem", p), sek: 0 },
      produkt: { text: baustein("produkt", p), sek: 0 },
      beweis:  { text: baustein("beweis", p), sek: 0 },
      einwand: { text: baustein("einwand", p), sek: 0 },
      cta:     { text: baustein("cta", p), sek: 0 }
    };
    REIHE.forEach(function (k) { s[k].sek = sekunden(s[k].text); });
    return { skript: s, hook: h };
  }

  /* ---------- Für die Stimme ----------
     Ein durchgehender Text. Die Abschnittsgrenzen werden zu Absätzen —
     ElevenLabs setzt dort von selbst eine Pause, und die brauchen wir
     für den Schnitt. */
  function fliesstext(v) {
    var vorn = Recht.gesprochen();
    var teile = REIHE.map(function (k) { return (v.skript[k].text || "").trim(); })
                     .filter(Boolean);
    if (vorn) teile.unshift(vorn);
    return teile.join("\n\n");
  }

  /* Zeichen zählen für die Abrechnung bei ElevenLabs — die rechnen nach
     Zeichen, und ein Kontingent ist schneller leer als man denkt. */
  function zeichen(v) { return fliesstext(v).length; }

  return {
    HOOKS: HOOKS,
    ABSCHNITTE: ABSCHNITTE,
    REIHE: REIHE,
    sekunden: sekunden,
    timingNachziehen: timingNachziehen,
    gesamt: gesamt,
    zeitachse: zeitachse,
    passendeHooks: passendeHooks,
    vorschlag: vorschlag,
    fliesstext: fliesstext,
    zeichen: zeichen
  };
})();
