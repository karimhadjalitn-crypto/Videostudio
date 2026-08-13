/* Sūq – Stimme.

   Ruft ElevenLabs direkt aus dem Browser. Der Schlüssel liegt auf diesem
   Gerät und geht an niemanden außer ElevenLabs; er wandert auch nicht in
   die Sicherungsdatei. Das ist derselbe Grundsatz wie in Mīzān: es gibt
   keinen Server dazwischen, weil es keinen geben muss.

   Die erzeugte Datei wird nicht in der Datenbank abgelegt. Sie wird
   heruntergeladen — sie gehört in den Ordner, in dem du schneidest, nicht
   in einen Browser-Speicher, aus dem du sie nicht wieder herausbekommst. */
var Stimme = (function () {
  "use strict";

  var BASIS = "https://api.elevenlabs.io/v1";

  function schluessel() {
    return (Store.einstellungen.stimme.schluessel || "").trim();
  }

  function eingerichtet() {
    return !!schluessel() && !!Store.einstellungen.stimme.stimmeId;
  }

  function anfrage(pfad, opt) {
    opt = opt || {};
    var k = schluessel();
    if (!k) return Promise.reject(new Error("Kein ElevenLabs-Schlüssel hinterlegt."));
    var kopf = { "xi-api-key": k };
    if (opt.json) kopf["Content-Type"] = "application/json";
    return fetch(BASIS + pfad, {
      method: opt.method || "GET",
      headers: kopf,
      body: opt.json ? JSON.stringify(opt.json) : undefined
    }).then(function (a) {
      if (a.ok) return a;
      /* ElevenLabs antwortet im Fehlerfall mit JSON, aber nicht immer.
         Erst lesen, dann urteilen — sonst steht da nur "Fehler 401". */
      return a.text().then(function (t) {
        var grund = t;
        try {
          var j = JSON.parse(t);
          grund = (j.detail && (j.detail.message || j.detail.status)) || j.message || t;
        } catch (e) { /* dann eben der Rohtext */ }
        if (a.status === 401) grund = "Der Schlüssel wird nicht akzeptiert.";
        if (a.status === 429) grund = "Zu viele Anfragen oder Kontingent aufgebraucht.";
        throw new Error(grund || ("Fehler " + a.status));
      });
    });
  }

  /* ---------- Stimmen ---------- */
  function stimmen() {
    return anfrage("/voices").then(function (a) { return a.json(); })
      .then(function (d) {
        return (d.voices || []).map(function (v) {
          return {
            id: v.voice_id,
            name: v.name,
            art: v.category || "",
            /* Für deutsche Werbetexte taugen nicht alle. Die Kennzeichnung
               hilft beim Aussuchen, mehr nicht — hören musst du selbst. */
            beschreibung: (v.labels && [v.labels.gender, v.labels.age, v.labels.accent]
                            .filter(Boolean).join(", ")) || ""
          };
        });
      });
  }

  /* ---------- Kontingent ----------
     Bevor du fünfzig Skripte schreibst, willst du wissen, wie viele
     Zeichen noch übrig sind. */
  function kontingent() {
    return anfrage("/user/subscription").then(function (a) { return a.json(); })
      .then(function (d) {
        return {
          benutzt: d.character_count || 0,
          grenze: d.character_limit || 0,
          uebrig: Math.max(0, (d.character_limit || 0) - (d.character_count || 0)),
          zurueckgesetzt: d.next_character_count_reset_unix
            ? new Date(d.next_character_count_reset_unix * 1000) : null
        };
      });
  }

  /* ---------- Erzeugen ---------- */
  function erzeugen(text, opt) {
    opt = opt || {};
    var e = Store.einstellungen.stimme;
    var id = opt.stimmeId || e.stimmeId;
    if (!id) return Promise.reject(new Error("Keine Stimme ausgewählt."));
    if (!text || !text.trim()) return Promise.reject(new Error("Kein Text vorhanden."));

    return anfrage("/text-to-speech/" + id + "?output_format=mp3_44100_128", {
      method: "POST",
      json: {
        text: text,
        model_id: e.modell || "eleven_multilingual_v2",
        language_code: "de",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          /* Werbetexte vertragen etwas Ausdruck, aber nicht zu viel —
             sonst klingt es nach Hörspiel statt nach jemandem, der ein
             Produkt in der Hand hält. */
          style: 0.25,
          use_speaker_boost: true,
          speed: e.tempo || 1.0
        }
      }
    }).then(function (a) { return a.blob(); });
  }

  /* Erzeugt und legt die Datei gleich im Download-Ordner ab. */
  function erzeugenUndSichern(v, p) {
    var text = Skript.fliesstext(v);
    return erzeugen(text).then(function (blob) {
      var name = dateiname(v, p);
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 3000);

      v.stimme.erzeugt = new Date().toISOString();
      v.stimme.datei = name;
      v.stimme.stimmeId = Store.einstellungen.stimme.stimmeId;
      if (v.stand === "skript" || v.stand === "idee") v.stand = "stimme";
      return Store.videoSpeichern(v).then(function () { return name; });
    });
  }

  /* Dateinamen ohne Umlaute und Leerzeichen — die machen beim Schneiden
     auf der Kommandozeile nur Ärger. */
  function dateiname(v, p) {
    var roh = (v.titel || (p && p.name) || "stimme");
    var sauber = roh.toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "stimme";
    return "suq-" + sauber + ".mp3";
  }

  /* ---------- Probe ----------
     Ein kurzer Satz, um eine Stimme zu beurteilen, ohne ein ganzes Skript
     durch das Kontingent zu jagen. */
  function probe(stimmeId) {
    return erzeugen(
      "Schau dir kurz die Naht an. Da entscheidet sich, ob das hält.",
      { stimmeId: stimmeId }
    ).then(function (blob) {
      var url = URL.createObjectURL(blob);
      var audio = new Audio(url);
      audio.addEventListener("ended", function () { URL.revokeObjectURL(url); });
      return audio.play().then(function () { return audio; });
    });
  }

  return {
    eingerichtet: eingerichtet,
    stimmen: stimmen,
    kontingent: kontingent,
    erzeugen: erzeugen,
    erzeugenUndSichern: erzeugenUndSichern,
    probe: probe,
    dateiname: dateiname
  };
})();
