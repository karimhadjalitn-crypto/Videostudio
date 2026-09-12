/* ============================================================
   store.js – Zustand, Einstellungen, Speicherung, Spaced Repetition
   ============================================================ */
window.AR = window.AR || {};
(function (AR) {
  "use strict";

  var KEY = "arabisch_lernen_v1";

  var DEFAULT_SETTINGS = {
    theme: "system",       // system | light | dark
    direction: "mix",      // de2ar | ar2de | mix
    showSpoken: true,      // Sprechform anzeigen
    showHarakat: true,     // Vokalzeichen anzeigen
    audio: true,           // Text-to-Speech
    voiceURI: "",           // gewählte Stimme für die Aussprache ("" = automatisch)
    sessionSize: 20,
    goal: 100,             // Lernziel: so viele Wörter sollen „gekonnt" werden
    pace: "normal",        // Tagesgröße: kurz | normal | viel
    pathStart: ""          // erster Tag mit Pfad (für den Soll-Ist-Abgleich)
  };

  var state = {
    version: 1,
    srs: {},          // cardId -> {box,due,seen,correct,wrong,last}
    userCards: [],    // selbst hinzugefügte Vokabeln
    favorites: {},    // cardId -> true (markierte Wörter)
    issues: [],       // gemeldete Fehler: {card,de,fusha,text,ts}
    settings: Object.assign({}, DEFAULT_SETTINGS),
    stats: { studyDates: {}, totalReviews: 0 }
  };

  /* ---------- Laden / Speichern ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        state.srs = d.srs || {};
        state.userCards = d.userCards || [];
        state.favorites = d.favorites || {};
        state.issues = d.issues || [];
        state.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings || {});
        state.stats = Object.assign({ studyDates: {}, totalReviews: 0 }, d.stats || {});
      }
    } catch (e) { console.warn("Konnte Fortschritt nicht laden:", e); }
  }

  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(state)); }
      catch (e) { console.warn("Speichern fehlgeschlagen:", e); }
    }, 120);
  }
  function saveNow() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------- Einstellungen ---------- */
  function get(k) { return state.settings[k]; }
  function set(k, v) { state.settings[k] = v; save(); if (k === "theme") applyTheme(); }

  function applyTheme() {
    var t = state.settings.theme;
    if (t === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var dark = t === "dark" || (t === "system" &&
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      meta.setAttribute("content", dark ? "#141310" : "#faf6ef");
    }
  }

  /* ---------- Statistik / Streak ---------- */
  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }
  function markStudied() {
    state.stats.studyDates[todayKey()] = (state.stats.studyDates[todayKey()] || 0) + 1;
    state.stats.totalReviews++;
    save();
  }
  function streak() {
    var n = 0, d = new Date();
    // Wenn heute noch nichts gelernt wurde, zählt ab gestern.
    if (!state.stats.studyDates[todayKey(d)]) d.setDate(d.getDate() - 1);
    while (state.stats.studyDates[todayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  /* ---------- SRS ---------- */
  // Intervalle je Box in Millisekunden (angelehnt an 1/3/7/14 Tage im Lernbuch)
  var HOUR = 3600e3, DAY = 24 * HOUR;
  var INTERVAL = { 1: 6 * HOUR, 2: 1 * DAY, 3: 3 * DAY, 4: 7 * DAY, 5: 14 * DAY, 6: 30 * DAY };
  var MAX_BOX = 6;
  var KNOWN_BOX = 2;   // ab hier gilt ein Wort als „gekonnt" (= 1× „Gut" oder „Leicht")
  var HARD_FACTOR = 0.6;

  function cardState(id) {
    var s = state.srs[id];
    if (!s) { s = { box: 0, due: 0, seen: 0, correct: 0, wrong: 0, hard: 0, last: 0 }; state.srs[id] = s; }
    if (s.hard == null) s.hard = 0;
    return s;
  }
  // Ist die Karte "gekonnt"? („Gut" und „Leicht" zählen, „Schwer" noch nicht)
  function status(id) {
    var s = state.srs[id];
    if (!s || s.seen === 0) return "new";
    if (s.box >= KNOWN_BOX) return "known";
    return "learning";
  }

  // Nächste Box für eine Bewertung – ohne etwas zu speichern
  function nextBox(box, g) {
    box = box || 0;
    if (g === "again") return 0;
    if (g === "hard") return Math.max(1, box);           // hält das Niveau, steigt nicht
    return Math.min(MAX_BOX, box + (g === "easy" ? 3 : 2));
  }
  function delayFor(box, g) {
    var ms = INTERVAL[box] || DAY;
    return g === "hard" ? Math.round(ms * HARD_FACTOR) : ms;
  }

  // grade: "again" | "hard" | "good" | "easy"
  function grade(id, g) {
    var s = cardState(id), now = Date.now();
    s.seen++; s.last = now;
    if (g === "again") {
      s.wrong++; s.box = 0; s.due = now; // gleich nochmal in dieser Sitzung
    } else {
      s.correct++;
      if (g === "hard") s.hard++;
      s.box = nextBox(s.box, g);
      s.due = now + delayFor(s.box, g);
    }
    markStudied();
    save();
    return s;
  }

  /* Vorschau „wann kommt die Karte wieder?" – für die Knopf-Beschriftung */
  function previewInterval(id, g) {
    if (g === "again") return "gleich wieder";
    var s = state.srs[id];
    var box = nextBox(s ? s.box : 0, g);
    return humanDelay(delayFor(box, g));
  }
  function humanDelay(ms) {
    var h = ms / HOUR;
    if (h < 22) return "in " + Math.max(1, Math.round(h)) + " Std.";
    var d = Math.round(ms / DAY);
    if (d < 7) return "in " + d + (d === 1 ? " Tag" : " Tagen");
    if (d < 28) { var w = Math.round(d / 7); return "in " + w + (w === 1 ? " Woche" : " Wochen"); }
    var m = Math.round(d / 30);
    return "in " + m + (m === 1 ? " Monat" : " Monaten");
  }

  /* Reihenfolge für eine Lernsitzung: fällige & schwache zuerst,
     dann neue – Schwache kommen dadurch öfter dran. */
  function buildQueue(cards, size) {
    var now = Date.now();
    size = size || state.settings.sessionSize || 20;
    var seen = [], fresh = [];
    cards.forEach(function (c) {
      var s = state.srs[c.id];
      if (!s || s.seen === 0) fresh.push(c);
      else seen.push({ c: c, s: s });
    });
    // Schwäche-Score: niedrige Box + viele Fehler + überfällig => zuerst
    seen.sort(function (a, b) {
      var wa = weakness(a.s, now), wb = weakness(b.s, now);
      return wb - wa;
    });
    var due = seen.filter(function (x) { return x.s.due <= now; }).map(function (x) { return x.c; });
    var future = seen.filter(function (x) { return x.s.due > now; }).map(function (x) { return x.c; });

    var queue = due.slice();
    // Neue Karten auffüllen
    var room = Math.max(size - queue.length, 0);
    var newCount = Math.min(fresh.length, room > 0 ? room : Math.max(6, Math.floor(size / 2)));
    queue = queue.concat(fresh.slice(0, newCount));
    // Falls noch Platz: künftig fällige (Vorlernen), schwächste zuerst
    if (queue.length < size) queue = queue.concat(future.slice(0, size - queue.length));
    return queue.slice(0, Math.max(size, queue.length ? queue.length : 0));
  }

  function weakness(s, now) {
    var overdue = Math.max(0, (now - s.due)) / DAY;
    return (MAX_BOX - s.box) * 3 + s.wrong * 2 + (s.hard || 0) * 1.2
      - s.correct * 0.5 + Math.min(overdue, 10);
  }

  /* Anzahl fälliger Karten in einer Kartenmenge */
  function dueCount(cards) {
    var now = Date.now(), n = 0;
    cards.forEach(function (c) {
      var s = state.srs[c.id];
      if (!s || s.seen === 0 || s.due <= now) n++;
    });
    return n;
  }

  function counts(cards) {
    var r = { total: cards.length, neu: 0, lernen: 0, gekonnt: 0 };
    cards.forEach(function (c) {
      var st = status(c.id);
      if (st === "known") r.gekonnt++;
      else if (st === "learning") r.lernen++;
      else r.neu++;
    });
    return r;
  }

  /* ---------- Lernziel ---------- */
  function goal() {
    var g = parseInt(state.settings.goal, 10);
    return (isFinite(g) && g > 0) ? g : DEFAULT_SETTINGS.goal;
  }
  function setGoal(n) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1) return goal();
    state.settings.goal = Math.min(9999, n);
    save();
    return state.settings.goal;
  }
  /* Fortschritt zum Ziel über den gesamten Wortschatz */
  function goalProgress(cards) {
    var g = goal(), known = 0;
    cards.forEach(function (c) { if (status(c.id) === "known") known++; });
    return { known: known, goal: g, pct: g ? Math.min(100, Math.round(known / g * 100)) : 0,
      reached: known >= g, left: Math.max(0, g - known) };
  }

  /* ---------- Benutzerkarten ---------- */
  function addUserCard(card) {
    // eindeutige ID
    var id = "u" + Date.now().toString(36) + Math.floor(Math.random() * 1000);
    card.id = id; card.karim = true; card.source = "user";
    if (!card.category) card.category = "Meine Wörter";
    if (!card.type) card.type = "user";
    state.userCards.push(card);
    save();
    return card;
  }
  function deleteUserCard(id) {
    state.userCards = state.userCards.filter(function (c) { return c.id !== id; });
    delete state.srs[id];
    save();
  }

  /* ---------- Gemeldete Fehler ----------
     Die Vokabeln sind aus Sprachwissen erzeugt, nicht aus einem geprüften
     Wörterbuch. Auffälliges soll direkt an der Karte markierbar sein. */
  function reportIssue(card, text) {
    state.issues.push({
      card: card.id, de: card.de, fusha: card.fusha,
      text: (text || "").trim(), ts: Date.now()
    });
    save();
  }
  function issues() { return state.issues; }
  function deleteIssue(i) { state.issues.splice(i, 1); save(); }
  function clearIssues() { state.issues = []; save(); }
  function issuesAsText() {
    return state.issues.map(function (x) {
      var d = new Date(x.ts);
      return "- " + x.de + " (" + x.fusha + ", " + x.card + "): " +
        (x.text || "ohne Beschreibung") +
        "  [" + d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear() + "]";
    }).join("\n");
  }

  /* ---------- Favoriten ---------- */
  function toggleFav(id) {
    if (state.favorites[id]) delete state.favorites[id];
    else state.favorites[id] = true;
    save();
    return !!state.favorites[id];
  }
  function isFav(id) { return !!state.favorites[id]; }
  function favCount() { return Object.keys(state.favorites).length; }

  function resetProgress() {
    state.srs = {}; state.stats = { studyDates: {}, totalReviews: 0 };
    saveNow();
  }
  function exportData() {
    return JSON.stringify({ srs: state.srs, userCards: state.userCards,
      favorites: state.favorites, settings: state.settings, stats: state.stats,
      issues: state.issues }, null, 2);
  }
  function importData(json) {
    var d = JSON.parse(json);
    if (d.srs) state.srs = d.srs;
    if (d.userCards) state.userCards = d.userCards;
    if (d.favorites) state.favorites = d.favorites;
    if (d.settings) state.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings);
    if (d.stats) state.stats = d.stats;
    if (d.issues) state.issues = d.issues;
    saveNow();
  }

  AR.store = {
    load: load, save: save, saveNow: saveNow,
    get: get, set: set, settings: function () { return state.settings; },
    applyTheme: applyTheme,
    markStudied: markStudied, streak: streak,
    cardState: cardState, status: status, grade: grade,
    previewInterval: previewInterval,
    goal: goal, setGoal: setGoal, goalProgress: goalProgress,
    buildQueue: buildQueue, dueCount: dueCount, counts: counts,
    userCards: function () { return state.userCards; },
    addUserCard: addUserCard, deleteUserCard: deleteUserCard,
    toggleFav: toggleFav, isFav: isFav, favCount: favCount,
    reportIssue: reportIssue, issues: issues, deleteIssue: deleteIssue,
    clearIssues: clearIssues, issuesAsText: issuesAsText,
    stats: function () { return state.stats; },
    resetProgress: resetProgress, exportData: exportData, importData: importData,
    _state: state
  };
})(window.AR);
