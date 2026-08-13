/* Sūq – Rechtliches.
   Erzeugt die Bausteine, die unter jedes Video gehören. Kein Ersatz für
   Rechtsberatung, aber der Stand, den die Medienanstalten und die
   KI-Verordnung derzeit verlangen — an einer Stelle, damit du ihn nicht
   bei jedem Video neu zusammensuchst.

   Grundlagen:
   · Leitfaden der Medienanstalten zur Werbekennzeichnung bei Online-Medien.
     Anerkannt sind allein „Werbung“ und „Anzeige“. „Ad“, „Sponsored“,
     „Kooperation“ und „Paid Partnership“ genügen nicht. Die Kennzeichnung
     muss am Anfang stehen und darf nicht zwischen Hashtags verschwinden.
     Der plattformeigene Schalter allein reicht nach dieser Auffassung nicht.
   · Verordnung (EU) 2024/1689 (KI-Verordnung), Artikel 50: Transparenz bei
     synthetischen Inhalten. Gilt seit dem 2. August 2026. Eine mit KI
     erzeugte Stimme ist synthetisches Audio und wird gekennzeichnet.
   · Affiliate: Provisionshinweis unmittelbar am Link, nicht am Textende. */
var Recht = (function () {
  "use strict";

  /* ---------- Was ins Bild gehört ---------- */

  /* Sekunde 0 bis 3, oben, lesbar, nicht wegzuwischen. Ein kleines graues
     Wort in der Ecke ist nach dem Leitfaden keine Kennzeichnung. */
  function einblendung() {
    var r = Store.einstellungen.recht;
    if (!r.imBild) return null;
    return {
      text: r.wort,
      von: 0,
      bis: 3,
      lage: "oben",
      hinweis: "Deutlich lesbar, mit Hintergrund hinterlegt, nicht unter dem TikTok-Bedienfeld."
    };
  }

  /* ---------- Was gesprochen wird ---------- */
  function gesprochen() {
    var r = Store.einstellungen.recht;
    if (!r.gesprochen) return null;
    return r.wort === "Anzeige"
      ? "Anzeige."
      : "Werbung.";
  }

  /* ---------- Der Beschreibungstext ----------
     Reihenfolge ist Absicht: Kennzeichnung zuerst, Hashtags zuletzt.
     Wer die Kennzeichnung nach hinten schiebt, hat sie versteckt. */
  function beschreibung(v, p) {
    var r = Store.einstellungen.recht;
    var zeilen = [];

    zeilen.push(r.wort + ".");

    if (v && v.titel) zeilen.push(v.titel);

    if (r.provisionshinweis) {
      zeilen.push(
        "Affiliate-Link: Bei einem Kauf über diesen Link erhalte ich eine Provision. " +
        "Für dich ändert sich der Preis dadurch nicht."
      );
    }

    if (r.kiOffenlegung && v && v.stimme && v.stimme.erzeugt) {
      zeilen.push("Die Stimme in diesem Video wurde mit künstlicher Intelligenz erzeugt.");
    }

    if (p && p.preis) {
      zeilen.push("Preis zum Zeitpunkt der Aufnahme: " + preisText(p.preis) +
                  ". Preise können sich ändern.");
    }

    return zeilen.join("\n\n");
  }

  function preisText(n) {
    return Number(n).toLocaleString("de-DE", {
      style: "currency", currency: "EUR", minimumFractionDigits: 2
    });
  }

  /* ---------- Hashtags ----------
     Bewusst kurz. Hashtags sind kein Ort für Rechtliches, und dreißig
     Stück helfen dem Video nicht. */
  function hashtags(p) {
    var basis = ["#werbung"];
    var nachKategorie = {
      "Gebetsteppich": ["#gebetsteppich", "#salah", "#muslim"],
      "Kleidung": ["#abaya", "#modestfashion", "#hijabi"],
      "Duft & Attar": ["#attar", "#alkoholfrei", "#duft"],
      "Tasbīḥ & Dhikr": ["#tasbih", "#dhikr", "#muslim"],
      "Buch & Qurʾān": ["#islamischebücher", "#quran", "#lesen"],
      "Zuhause": ["#islamicart", "#zuhause", "#deko"],
      "Kinder": ["#muslimkids", "#kinder", "#erziehung"],
      "Reise": ["#reise", "#umrah", "#unterwegs"],
      "Sonstiges": ["#muslim", "#deen"]
    };
    var extra = (p && nachKategorie[p.kategorie]) || nachKategorie["Sonstiges"];
    return basis.concat(extra, ["#tiktokshop"]).join(" ");
  }

  /* ---------- Die Schalter in TikTok ----------
     Das sind die Haken, die man in der App selbst setzen muss. Sie ersetzen
     die Kennzeichnung im Video nicht, aber ohne sie fehlt etwas. */
  function schalter(v) {
    var liste = [
      {
        id: "branded",
        text: "„Branded Content“ bzw. Werbeoffenlegung aktivieren",
        warum: "Pflicht bei Provision. Ersetzt die Einblendung im Video aber nicht.",
        noetig: true
      },
      {
        id: "shop",
        text: "Produkt aus dem TikTok Shop im Video verknüpfen",
        warum: "Ohne Verknüpfung gibt es keine nachvollziehbare Provision.",
        noetig: true
      }
    ];
    if (v && v.stimme && v.stimme.erzeugt) {
      liste.push({
        id: "ki",
        text: "Schalter für KI-generierte Inhalte setzen",
        warum: "Synthetische Stimme. KI-Verordnung Art. 50, gilt seit 2. August 2026.",
        noetig: true
      });
    }
    return liste;
  }

  /* ---------- Vollständige Mappe ----------
     Das, was du beim Hochladen vor dir haben willst. */
  function mappe(v, p) {
    return {
      einblendung: einblendung(),
      gesprochen: gesprochen(),
      beschreibung: beschreibung(v, p),
      hashtags: hashtags(p),
      schalter: schalter(v)
    };
  }

  /* Für die Zwischenablage: alles in einem Rutsch. */
  function alsText(v, p) {
    var m = mappe(v, p);
    var out = [];
    out.push("— BESCHREIBUNG —");
    out.push(m.beschreibung);
    out.push("");
    out.push(m.hashtags);
    out.push("");
    out.push("— IM VIDEO —");
    out.push(m.einblendung
      ? "Einblendung „" + m.einblendung.text + "“, Sekunde " +
        m.einblendung.von + " bis " + m.einblendung.bis + ", oben."
      : "Keine Einblendung — die Kennzeichnung steht im Hook.");
    if (m.gesprochen) out.push("Gesprochen zu Beginn: „" + m.gesprochen + "“");
    out.push("");
    out.push("— IN TIKTOK SETZEN —");
    m.schalter.forEach(function (s) { out.push("[ ] " + s.text + "  (" + s.warum + ")"); });
    return out.join("\n");
  }

  return {
    einblendung: einblendung,
    gesprochen: gesprochen,
    beschreibung: beschreibung,
    hashtags: hashtags,
    schalter: schalter,
    mappe: mappe,
    alsText: alsText,
    preisText: preisText
  };
})();
