/* ============================================================
   data.js – Vokabeldaten, Decks, Hilfsfunktionen
   ============================================================ */
window.AR = window.AR || {};
(function (AR) {
  "use strict";

  var D = window.APPDATA || { vocab: [], sentences: [], idioms: [], grammar: {}, meta: {}, quran: null };

  var EMOJI = {
    "Verben": "🏃", "Familie und Menschen": "👪", "Haus und Alltag": "🏠",
    "Essen und Trinken": "🍽️", "Orte und Reisen": "🧭", "Religion und Moschee": "🕌",
    "Studium und Arbeit": "🎓", "Körper und Gesundheit": "🩺",
    "Natur, Wetter und Dinge": "🌤️", "Adjektive": "🎨",
    "Präpositionen & Orte": "📍", "Konjunktionen": "🔗",
    "Fragewörter & Pronomen": "❓", "Meine Wörter": "✍️"
  };

  function allCards() {
    return D.vocab.concat(AR.store.userCards());
  }
  function byId(id) {
    var all = allCards();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  /* Decks aufbauen (dynamisch, damit Benutzerkarten mitzählen) */
  function decks() {
    var list = [];
    // Feature-Deck: Mein Wortschatz (alle karim==true)
    list.push({
      id: "mine", name: "Mein Wortschatz", emoji: "⭐", feature: true,
      desc: "Deine Vokabeln",
      cards: function () { return allCards().filter(function (c) { return c.karim; }); }
    });
    // Kategorien in Meta-Reihenfolge
    (D.meta.categories || []).forEach(function (cat) {
      list.push({
        id: "cat:" + cat.name, name: cat.name, emoji: EMOJI[cat.name] || "📗",
        cards: (function (name) {
          return function () { return allCards().filter(function (c) { return c.category === name; }); };
        })(cat.name)
      });
    });
    // Alle
    list.push({
      id: "all", name: "Alle Vokabeln", emoji: "📚",
      cards: function () { return allCards(); }
    });
    return list;
  }

  function deckById(id) {
    if (id === "today") return { id: "today", name: "Heute", emoji: "☀️",
      cards: function () { return AR.path.todayPlan().cards; } };
    if (id === "weak") return { id: "weak", name: "Schwierige Wörter", emoji: "🔥", cards: weakCards };
    if (id === "fav") return { id: "fav", name: "Favoriten", emoji: "⭐", cards: favCards };
    if (id && id.indexOf("quran") === 0) return quranDeck(id);
    var ds = decks();
    for (var i = 0; i < ds.length; i++) if (ds[i].id === id) return ds[i];
    return ds[0];
  }

  /* ---------- Quran ----------
     Die Quranwörter werden als Karten im gewohnten Format bereitgestellt,
     damit Karteikarten, Quiz und Fortschritt unverändert damit arbeiten.
     Sie bleiben aber aus allCards() heraus: der Quran-Wortschatz soll den
     Alltagswortschatz nicht verwässern, er ist ein eigener Bereich. */
  var Q = D.quran || { words: [], texts: [], meta: {} };
  var LEVEL_NAMES = {
    1: "Die häufigsten Wörter",
    2: "Nomen",
    3: "Verben",
    4: "Eigenschaften & Gottesnamen",
    5: "Aus den Gebetstexten"
  };

  var quranCache = null;
  function quranCards() {
    if (quranCache) return quranCache;
    quranCache = (Q.words || []).map(function (w) {
      return {
        id: w.id, de: w.de, fusha: w.ar, type: "quran",
        category: "Quran – Stufe " + w.level,
        level: w.level, root: w.root, freq: w.freq, also: w.also
      };
    });
    return quranCache;
  }
  function quranLevels() {
    var counts = {};
    quranCards().forEach(function (c) { counts[c.level] = (counts[c.level] || 0) + 1; });
    return Object.keys(counts).sort().map(function (lv) {
      return { level: +lv, count: counts[lv], name: LEVEL_NAMES[lv] || ("Stufe " + lv) };
    });
  }
  function quranDeck(id) {
    var lv = id.indexOf(":") > 0 ? parseInt(id.split(":")[1], 10) : 0;
    if (!lv) {
      return { id: "quran", name: "Quran-Wortschatz", emoji: "📖",
        cards: function () { return quranCards(); } };
    }
    return {
      id: id, name: "Stufe " + lv + " – " + (LEVEL_NAMES[lv] || ""), emoji: "📖",
      cards: function () {
        return quranCards().filter(function (c) { return c.level === lv; });
      }
    };
  }
  function quranTexts() { return Q.texts || []; }
  function quranTextById(id) {
    var t = quranTexts();
    for (var i = 0; i < t.length; i++) if (t[i].id === id) return t[i];
    return null;
  }
  function quranWordById(id) {
    var w = quranCards();
    for (var i = 0; i < w.length; i++) if (w[i].id === id) return w[i];
    return null;
  }

  // Karten mit Fehlern oder niedriger Box (schwach), stärkste Schwäche zuerst
  function weakCards() {
    var now = Date.now();
    var arr = allCards().map(function (c) {
      var s = AR.store.cardState(c.id);
      return { c: c, s: s };
    }).filter(function (x) { return x.s.seen > 0 && (x.s.wrong > 0 || x.s.box <= 1); });
    arr.sort(function (a, b) {
      return (b.s.wrong - b.s.box) - (a.s.wrong - a.s.box);
    });
    return arr.slice(0, 40).map(function (x) { return x.c; });
  }

  function favCards() {
    return allCards().filter(function (c) { return AR.store.isFav(c.id); });
  }

  /* ---------- Anzeige-Helfer ---------- */
  var MARKS = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۨ-ۭـ]/g;
  function stripHarakat(s) { return (s || "").replace(MARKS, ""); }

  // Arabisch je nach Einstellung (mit/ohne Harakat)
  function arText(s) {
    return AR.store.get("showHarakat") ? s : stripHarakat(s);
  }
  /* Quran-Text immer vollständig vokalisiert – die Einstellung
     „Harakat ausblenden" gilt bewusst nur für den Alltagswortschatz. */
  function quranText(s) { return s; }

  function isVerb(c) { return c.type === "verb"; }
  function isQuran(c) { return c.type === "quran"; }

  /* Arabisch einer Karte: Quranwörter behalten ihre Vokalzeichen immer,
     beim Alltagswortschatz entscheidet die Einstellung. */
  function cardAr(card, s) {
    var txt = s || (card && card.fusha) || "";
    return (card && card.type === "quran") ? txt : arText(txt);
  }

  /* ---------- Befehlsform (Imperativ) aus dem Präsens ----------
     Gleiche Regeln wie tools/imperative.py: Präfix يـ weg, Jussiv bilden,
     bei Anlaut-Sukūn eine Hilfs-Hamza (اِ / اُ, bei Form IV أَ) davor. */
  var IM_FATHA = "َ", IM_DAMMA = "ُ", IM_KASRA = "ِ",
      IM_SUKUN = "ْ", IM_SHADDA = "ّ",
      IM_MARKS = "ًٌٍَُِّْٰ",
      IM_LONG = "اوي", IM_WEAK = "ىويا";
  var IM_EXC = { "يَأْخُذُ": "خُذْ", "يَأْكُلُ": "كُلْ", "يَجِيءُ": "جِئْ",
                 "يُشْفَى": null, "يُولَدُ": null };

  function imUnits(word) {
    var out = [];
    for (var i = 0; i < word.length; i++) {
      var ch = word.charAt(i);
      if (IM_MARKS.indexOf(ch) >= 0 && out.length) out[out.length - 1][1] += ch;
      else out.push([ch, ""]);
    }
    return out;
  }

  function deriveImperative(present) {
    if (!present) return null;
    present = String(present).trim();
    if (Object.prototype.hasOwnProperty.call(IM_EXC, present)) return IM_EXC[present];

    var u = imUnits(present);
    if (u.length < 2 || u[0][0] !== "ي") return null;
    var prefixDamma = u[0][1].indexOf(IM_DAMMA) >= 0;
    var stem = u.slice(1).map(function (x) { return [x[0], x[1]]; });
    if (!stem.length) return null;

    // Jussiv
    var last = stem[stem.length - 1];
    if (IM_WEAK.indexOf(last[0]) >= 0 && last[1] === "") {
      stem.pop();                                   // يَمْشِي -> اِمْشِ
      if (!stem.length) return null;
    } else if (last[1].indexOf(IM_SHADDA) >= 0) {
      last[1] = IM_SHADDA + IM_FATHA;               // يَظُنُّ -> ظُنَّ
    } else {
      last[1] = IM_SUKUN;
      var pen = stem[stem.length - 2];
      if (pen && IM_LONG.indexOf(pen[0]) >= 0 && pen[1] === "") {
        stem.splice(stem.length - 2, 1);            // hohl: يَقُولُ -> قُلْ
      }
    }
    if (!stem.length) return null;

    var first = stem[0];
    var formIIorIII = prefixDamma && first[1].indexOf(IM_FATHA) >= 0 && stem.length >= 2 &&
      (stem[1][1].indexOf(IM_SHADDA) >= 0 || (stem[1][0] === "ا" && stem[1][1] === ""));
    var body = stem.map(function (x) { return x[0] + x[1]; }).join("");
    var needsHamza = first[1].indexOf(IM_SUKUN) >= 0 || first[1].indexOf(IM_SHADDA) >= 0;

    if (prefixDamma && !formIIorIII) return "أ" + IM_FATHA + body;   // Form IV
    if (!needsHamza) return body;

    var stemVowel = "";
    for (var k = stem.length - 1; k >= 0 && !stemVowel; k--) {
      var mk = stem[k][1];
      for (var m = 0; m < mk.length; m++) {
        var c = mk.charAt(m);
        if (c === IM_FATHA || c === IM_DAMMA || c === IM_KASRA) stemVowel = c;
      }
    }
    return "ا" + (stemVowel === IM_DAMMA ? IM_DAMMA : IM_KASRA) + body;
  }

  /* Vorderseite/Rückseite abhängig von Richtung
     dir: "de2ar" (Deutsch zeigen, Arabisch erraten) | "ar2de" */
  function resolveDirection() {
    var d = AR.store.get("direction");
    if (d === "mix") return Math.random() < 0.5 ? "de2ar" : "ar2de";
    return d;
  }

  /* Distraktoren fürs Quiz: 3 andere Antworten, möglichst gleiche Wortart/Kategorie */
  function distractors(card, dir, n) {
    n = n || 3;
    // Falsche Antworten aus demselben Trakt ziehen: bei einer Quranvokabel
    // waeren Alltagswoerter als Ablenker zu leicht zu erkennen.
    var source = (card.type === "quran") ? quranCards() : allCards();
    var pool = source.filter(function (c) { return c.id !== card.id; });
    var correct = answerText(card, dir);
    function key(c) { return answerText(c, dir); }
    // bevorzugt gleiche Kategorie, dann gleicher Typ, dann Rest
    var sameCat = pool.filter(function (c) { return c.category === card.category; });
    var sameType = pool.filter(function (c) { return c.type === card.type && c.category !== card.category; });
    var rest = pool.filter(function (c) { return c.type !== card.type && c.category !== card.category; });
    var ordered = shuffle(sameCat).concat(shuffle(sameType)).concat(shuffle(rest));
    var out = [], seen = {};
    seen[normKey(correct)] = true;
    for (var i = 0; i < ordered.length && out.length < n; i++) {
      var t = key(ordered[i]); var k = normKey(t);
      if (!t || seen[k]) continue;
      seen[k] = true; out.push(t);
    }
    return out;
  }
  function normKey(s) { return (stripHarakat(s || "")).replace(/\s+/g, "").toLowerCase(); }

  // Text der "Antwortseite" für eine Richtung
  function answerText(card, dir) {
    if (dir === "de2ar") return cardAr(card);
    return card.de;
  }
  function promptText(card, dir) {
    if (dir === "de2ar") return card.de;
    return cardAr(card);
  }

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function sentenceByNr(nr) {
    var s = D.sentences || [];
    for (var i = 0; i < s.length; i++) if (s[i].nr === nr) return s[i];
    return null;
  }

  // Tokens für den Satz-Baukasten: bei sauberer Ausrichtung die vollen
  // Fuṣḥā-Tokens (mit allen Harakat, inkl. Endung), sonst die Wort-für-Wort-Tokens.
  function sentenceTokens(s) {
    var ft = (s.fusha || "").split(/\s+/).map(function (t) {
      return t.replace(/^[«»„“"']+|[.،؟!:«»„“"']+$/g, "");
    }).filter(function (t) { return t; });
    if (ft.length === s.words.length) {
      return s.words.map(function (w, i) { return { ar: ft[i], de: w.de, i: i }; });
    }
    return s.words.map(function (w, i) { return { ar: w.ar, de: w.de, i: i }; });
  }

  // Beispielsatz zu einer Vokabel (falls vorhanden)
  function exampleFor(card) {
    if (!card.ex || !card.ex.length) return null;
    return sentenceByNr(card.ex[0]);
  }

  AR.data = {
    raw: D,
    sentences: D.sentences || [],
    sentenceByNr: sentenceByNr, sentenceTokens: sentenceTokens, exampleFor: exampleFor,
    idioms: D.idioms || [],
    grammar: D.grammar || {},
    meta: D.meta || {},
    allCards: allCards, byId: byId,
    decks: decks, deckById: deckById, weakCards: weakCards, favCards: favCards,
    stripHarakat: stripHarakat, arText: arText, quranText: quranText,
    isVerb: isVerb, isQuran: isQuran, cardAr: cardAr,
    quran: Q, quranCards: quranCards, quranLevels: quranLevels,
    quranTexts: quranTexts, quranTextById: quranTextById,
    quranWordById: quranWordById,
    deriveImperative: deriveImperative,
    resolveDirection: resolveDirection, distractors: distractors,
    answerText: answerText, promptText: promptText, shuffle: shuffle, emoji: EMOJI
  };
})(window.AR);
