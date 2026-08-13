/* Sūq – der Wächter.
   Er prüft Skripte und Einstellungen gegen die Grenzen, die für diesen
   Kanal gelten. Er ist absichtlich streng und absichtlich erklärend:
   ein Verbot ohne Vorschlag ist nur im Weg. Jeder Befund trägt darum
   einen sauberen Ersatz mit sich.

   Zwei Stufen:
     "sperre"  – so wird nicht gedreht. Der Befund muss weg.
     "hinweis" – kann so bleiben, sollte aber jemand angeschaut haben.

   Wichtig zum Verständnis der Bauart: die härteste Grenze — keine
   generierten Menschen — hält dieses Regelwerk gar nicht allein. Sūq
   erzeugt keine Bilder. Gearbeitet wird mit echten Produktfotos und
   eigenem Material. Was nicht erzeugt wird, kann nicht falsch entstehen.
   Diese Regeln fangen ab, was über die Sprache hineinrutscht. */
var Halal = (function () {
  "use strict";

  /* Wortgrenzen (\b) überall, sonst schlägt "Personal" bei "Person" an
     und "Manschette" bei "Mann". Das nervt und macht den Wächter unglaubwürdig. */
  var REGELN = [
    {
      id: "personen",
      grenze: "keinePersonen",
      stufe: "sperre",
      gilt: ["shot", "skript"],
      muster: /\b(gesicht(er)?|portr[äa]t|selfie|l[äa]chel\w*|augen|wimpern|lippen|haut(bild|ton)?|haare?|frisur|model(s)?|schauspieler\w*|person(en)?\b|mensch(en)?\b|leute)\b/i,
      warum: "Keine Menschen und keine Gesichter im Bild.",
      ersatz: "Zeig das Produkt allein, oder eine Hand am Produkt ohne Arm und ohne Gesicht im Bild."
    },
    {
      id: "frauen",
      grenze: "keineFrauen",
      stufe: "sperre",
      gilt: ["shot", "skript"],
      muster: /\b(frau(en)?|dame(n)?|m[äa]dchen|sie tr[äa]gt|schwester tr[äa]gt|weiblich\w*|figur|silhouette|k[öo]rperform|taille|dekollet[ée])\b/i,
      warum: "Keine weiblichen Darstellungen, auch nicht angedeutet.",
      ersatz: "Kleidung auf dem Bügel, flach ausgelegt oder auf der kopflosen Puppe zeigen."
    },
    {
      id: "amKoerper",
      grenze: "keineFrauen",
      stufe: "sperre",
      gilt: ["shot"],
      muster: /\b(am k[öo]rper|angezogen|anprobier\w*|vorf[üu]hr\w*|tr[äa]gt die|getragen von|trag[et]\w* sie|beim tragen)\b/i,
      warum: "Kleidung wird nicht am Menschen gezeigt.",
      ersatz: "Bügel, Flatlay, Stofffall im Luftzug, Nahaufnahme der Naht und der Stickerei."
    },
    {
      id: "musik",
      grenze: "keineMusik",
      stufe: "sperre",
      gilt: ["shot", "skript"],
      muster: /\b(musik|beat(s)?\b|song|lied|melodie|instrumental|gitarre|klavier|piano|geige|trommel|drum(s)?\b|bass|trap|lo-?fi|soundtrack|remix|refrain)\b/i,
      warum: "Keine Musik.",
      ersatz: "Nasheed ohne Instrumente, nur die Stimme, oder Ambient: Stoffrascheln, Schritte, Raumton, Papier."
    },
    {
      id: "heilversprechen",
      grenze: "keineUebertreibung",
      stufe: "sperre",
      gilt: ["skript"],
      muster: /\b(heilt|heilung|heilend|kuriert|therapiert|lindert krankheit|medizinisch bewiesen|klinisch bewiesen|gegen (schmerzen|krankheit|arthrose|rheuma))\b/i,
      warum: "Gesundheitsversprechen sind bei diesen Produkten nicht belegbar und rechtlich heikel.",
      ersatz: "Beschreib die Eigenschaft statt der Wirkung: „acht Millimeter Polsterung“ statt „gut für die Knie“."
    },
    {
      id: "uebertreibung",
      grenze: "keineUebertreibung",
      stufe: "hinweis",
      gilt: ["skript"],
      muster: /\b(beste[rsn]? (der welt|aller zeiten)|garantiert|100 ?%|zu 100|nie wieder\b|f[üu]r immer|wunder\w*|unschlagbar|perfekt\w*|revolution[äa]r)\b/i,
      warum: "Superlative ohne Beleg fallen unter irreführende Werbung — und sie wirken auch nicht.",
      ersatz: "Nenn eine überprüfbare Zahl oder ein Detail. Konkret verkauft besser als groß."
    },
    {
      id: "riba",
      grenze: "keinRiba",
      stufe: "hinweis",
      gilt: ["skript", "shot"],
      muster: /\b(ratenzahlung|raten|kredit|finanzier\w*|zins\w*|klarna|jetzt kaufen.{0,12}sp[äa]ter zahlen|teilzahlung)\b/i,
      warum: "Zinsbehaftete Zahlungsarten bewirbst du nicht mit.",
      ersatz: "Den Preis nennen und dabei bleiben. Zahlungsart ist nicht dein Thema."
    },
    {
      id: "druck",
      grenze: null,
      stufe: "hinweis",
      gilt: ["skript"],
      muster: /\b(nur noch heute|letzte chance|nur (\d+) st[üu]ck|beeil|schnell zugreifen|bevor es zu sp[äa]t)\b/i,
      warum: "Künstliche Knappheit ist erfunden, wenn du sie nicht belegen kannst.",
      ersatz: "Lass es weg. Wenn der Vorrat wirklich knapp ist, sag woher du das weißt."
    }
  ];

  /* Zusammenstellung für Bild-KI, falls du später doch ein Video-Modell
     nutzt. Nicht als Bitte formuliert — Modelle lesen Negativlisten besser
     als höfliche Sätze. */
  function negativPrompt() {
    return [
      "person", "people", "human", "face", "portrait", "woman", "women", "girl",
      "man", "boy", "child", "hands with visible face", "model", "mannequin head",
      "skin", "hair", "eyes", "smile", "crowd", "dancing",
      "text overlay", "watermark", "logo", "fake arabic script", "distorted text",
      "music notes", "instruments", "warping fabric", "melting pattern"
    ].join(", ");
  }

  /* ---------- Prüfung ---------- */

  function aktiv(regel) {
    var g = Store.einstellungen.grenzen;
    if (!regel.grenze) return true;
    return !!g[regel.grenze];
  }

  /* Die kopflose Puppe ist freigegeben — also darf sie auch genannt werden,
     ohne dass die Personen-Regel anschlägt. Ohne diese Ausnahme wäre der
     einzige erlaubte Weg, Kleidung zu zeigen, gleichzeitig gesperrt. */
  function puppenAusnahme(text) {
    if (!Store.einstellungen.grenzen.puppeErlaubt) return text;
    return text.replace(/\b(kopflose[rn]? )?(schneider)?puppe\b|\bb[üu]ste\b|\bkleiderst[äa]nder\b|\btorso\b/gi, "");
  }

  /* Verneinungen ausnehmen.

     „Eigene Hand am Produkt, kein Gesicht im Bild“ ist die Beschreibung
     einer erlaubten Einstellung — und wäre ohne diese Prüfung gesperrt,
     weil das Wort „Gesicht“ darin vorkommt. Genauso „ohne Personen“ oder
     „nicht am Körper“. Ein Wächter, der die richtige Formulierung
     bemängelt, wird nach dem dritten Mal ignoriert, und dann bemerkt er
     auch das Falsche nicht mehr. */
  var VERNEINUNG = /\b(kein|keine|keinen|keiner|keinem|ohne|nicht|niemals|niemand|statt|anstatt)\b[^.!?;]{0,26}$/i;

  function istVerneint(text, index) {
    return VERNEINUNG.test(text.slice(0, index));
  }

  function pruefeText(text, art, wo) {
    if (!text || !text.trim()) return [];
    var geprueft = art === "shot" ? puppenAusnahme(text) : text;
    var befunde = [];
    REGELN.forEach(function (r) {
      if (r.gilt.indexOf(art) < 0) return;
      if (!aktiv(r)) return;

      /* Global durchgehen: ein verneinter Treffer darf einen echten
         weiter hinten im Satz nicht verdecken. */
      var muster = new RegExp(r.muster.source, "gi");
      var treffer;
      while ((treffer = muster.exec(geprueft)) !== null) {
        if (istVerneint(geprueft, treffer.index)) continue;
        befunde.push({
          regel: r.id,
          stufe: r.stufe,
          wo: wo,
          wort: treffer[0],
          warum: r.warum,
          ersatz: r.ersatz
        });
        return;   // eine Meldung je Regel reicht
      }
    });
    return befunde;
  }

  var ABSCHNITT_NAME = {
    hook: "Hook", problem: "Problem", produkt: "Produkt",
    beweis: "Beweis", einwand: "Einwand", cta: "Aufforderung"
  };

  /* ---------- Rechtliche Pflichtprüfungen ----------
     Die stehen hier und nicht im Rechtsmodul, weil sie dieselbe Antwort
     brauchen wie die Grenzen: darf dieses Video raus, ja oder nein. */
  function pruefeRecht(v) {
    var r = Store.einstellungen.recht;
    var befunde = [];
    var hook = (v.skript.hook.text || "").toLowerCase();
    var traegtWort = /\b(werbung|anzeige)\b/.test(hook);

    if (!r.imBild && !traegtWort) {
      befunde.push({
        regel: "kennzeichnung", stufe: "sperre", wo: "Rechtliches",
        wort: "",
        warum: "Die Werbekennzeichnung fehlt am Anfang des Videos.",
        ersatz: "Einblendung ab Sekunde 0 einschalten — oder das Wort „Werbung“ in den Hook nehmen. " +
                "Nur „Werbung“ und „Anzeige“ gelten; „Ad“, „Sponsored“ und „Kooperation“ reichen nicht."
      });
    }
    if (r.imBild && r.wort !== "Werbung" && r.wort !== "Anzeige") {
      befunde.push({
        regel: "kennzeichnung", stufe: "sperre", wo: "Rechtliches", wort: r.wort,
        warum: "Dieses Wort ist als Kennzeichnung nicht anerkannt.",
        ersatz: "Nimm „Werbung“ oder „Anzeige“."
      });
    }
    if (!r.provisionshinweis) {
      befunde.push({
        regel: "provision", stufe: "sperre", wo: "Rechtliches", wort: "",
        warum: "Der Provisionshinweis zum Affiliate-Link fehlt.",
        ersatz: "Einschalten. Er gehört direkt an den Link, nicht ans Ende der Hashtags."
      });
    }
    if (v.stimme.erzeugt && !r.kiOffenlegung) {
      befunde.push({
        regel: "ki", stufe: "sperre", wo: "Rechtliches", wort: "",
        warum: "Die Stimme ist mit KI erzeugt und nicht als solche gekennzeichnet. " +
               "Seit dem 2. August 2026 verlangt Artikel 50 der KI-Verordnung das.",
        ersatz: "KI-Offenlegung einschalten und in TikTok den Schalter für KI-Inhalte setzen."
      });
    }
    return befunde;
  }

  /* Das Produkt selbst: ohne Freigabe des Sellers wird nicht gedreht. */
  function pruefeProdukt(p) {
    if (!p) return [];
    if (p.freigabe && p.freigabe.erteilt) return [];
    return [{
      regel: "freigabe", stufe: "sperre", wo: "Produkt", wort: "",
      warum: "Für die Bilder dieses Sellers liegt keine Freigabe vor.",
      ersatz: "Freigabe beim Seller einholen und im Produkt eintragen — mit Datum und auf welchem Weg."
    }];
  }

  /* ---------- Gesamturteil ---------- */
  function pruefe(v, p) {
    var befunde = [];

    Object.keys(v.skript).forEach(function (k) {
      befunde = befunde.concat(
        pruefeText(v.skript[k].text, "skript", ABSCHNITT_NAME[k] || k)
      );
    });

    (v.shots || []).forEach(function (s, i) {
      var text = [s.was, s.bewegung, s.einblendung].filter(Boolean).join(" · ");
      befunde = befunde.concat(pruefeText(text, "shot", "Einstellung " + (i + 1)));
    });

    befunde = befunde.concat(pruefeRecht(v)).concat(pruefeProdukt(p));

    var sperren = befunde.filter(function (b) { return b.stufe === "sperre"; });
    return {
      befunde: befunde,
      sperren: sperren,
      hinweise: befunde.filter(function (b) { return b.stufe === "hinweis"; }),
      frei: sperren.length === 0
    };
  }

  /* Kurzfassung für die Liste: reicht ein Blick, um zu sehen, wo es klemmt. */
  function urteil(v, p) {
    var e = pruefe(v, p);
    if (!e.frei) return { text: e.sperren.length + " × gesperrt", klasse: "sperre" };
    if (e.hinweise.length) return { text: e.hinweise.length + " × prüfen", klasse: "hinweis" };
    return { text: "frei", klasse: "frei" };
  }

  return {
    REGELN: REGELN,
    pruefe: pruefe,
    pruefeText: pruefeText,
    urteil: urteil,
    negativPrompt: negativPrompt
  };
})();
