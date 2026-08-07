/* ============================================================
   data.js – Vokabeldaten, Decks, Hilfsfunktionen
   ============================================================ */
window.AR = window.AR || {};
(function (AR) {
  "use strict";

  var D = window.APPDATA || { vocab: [], sentences: [], idioms: [], grammar: {}, meta: {} };

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
    if (id === "weak") return { id: "weak", name: "Schwierige Wörter", emoji: "🔥", cards: weakCards };
    if (id === "fav") return { id: "fav", name: "Favoriten", emoji: "⭐", cards: favCards };
    var ds = decks();
    for (var i = 0; i < ds.length; i++) if (ds[i].id === id) return ds[i];
    return ds[0];
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

  function isVerb(c) { return c.type === "verb"; }

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
    var pool = allCards().filter(function (c) { return c.id !== card.id; });
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
    if (dir === "de2ar") return arText(card.fusha);
    return card.de;
  }
  function promptText(card, dir) {
    if (dir === "de2ar") return card.de;
    return arText(card.fusha);
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
    stripHarakat: stripHarakat, arText: arText, isVerb: isVerb,
    resolveDirection: resolveDirection, distractors: distractors,
    answerText: answerText, promptText: promptText, shuffle: shuffle, emoji: EMOJI
  };
})(window.AR);
