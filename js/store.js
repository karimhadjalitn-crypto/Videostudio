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
    sessionSize: 20
  };

  var state = {
    version: 1,
    srs: {},          // cardId -> {box,due,seen,correct,wrong,last}
    userCards: [],    // selbst hinzugefügte Vokabeln
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
      meta.setAttribute("content", dark ? "#141310" : "#12857c");
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
  var INTERVAL = { 1: 8 * HOUR, 2: 1 * DAY, 3: 3 * DAY, 4: 7 * DAY, 5: 14 * DAY };
  var MAX_BOX = 5;

  function cardState(id) {
    var s = state.srs[id];
    if (!s) { s = { box: 0, due: 0, seen: 0, correct: 0, wrong: 0, last: 0 }; state.srs[id] = s; }
    return s;
  }
  // Ist die Karte "gekonnt"? (Box 4–5)
  function status(id) {
    var s = state.srs[id];
    if (!s || s.seen === 0) return "new";
    if (s.box >= 4) return "known";
    return "learning";
  }

  // grade: "again" | "good" | "easy"
  function grade(id, g) {
    var s = cardState(id), now = Date.now();
    s.seen++; s.last = now;
    if (g === "again") {
      s.wrong++; s.box = 0; s.due = now; // gleich nochmal in dieser Sitzung
    } else {
      s.correct++;
      s.box = Math.min(MAX_BOX, s.box + (g === "easy" ? 2 : 1));
      s.due = now + (INTERVAL[s.box] || DAY);
    }
    markStudied();
    save();
    return s;
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
    return (5 - s.box) * 3 + s.wrong * 2 - s.correct * 0.5 + Math.min(overdue, 10);
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

  function resetProgress() {
    state.srs = {}; state.stats = { studyDates: {}, totalReviews: 0 };
    saveNow();
  }
  function exportData() {
    return JSON.stringify({ srs: state.srs, userCards: state.userCards,
      settings: state.settings, stats: state.stats }, null, 2);
  }
  function importData(json) {
    var d = JSON.parse(json);
    if (d.srs) state.srs = d.srs;
    if (d.userCards) state.userCards = d.userCards;
    if (d.settings) state.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings);
    if (d.stats) state.stats = d.stats;
    saveNow();
  }

  AR.store = {
    load: load, save: save, saveNow: saveNow,
    get: get, set: set, settings: function () { return state.settings; },
    applyTheme: applyTheme,
    markStudied: markStudied, streak: streak,
    cardState: cardState, status: status, grade: grade,
    buildQueue: buildQueue, dueCount: dueCount, counts: counts,
    userCards: function () { return state.userCards; },
    addUserCard: addUserCard, deleteUserCard: deleteUserCard,
    stats: function () { return state.stats; },
    resetProgress: resetProgress, exportData: exportData, importData: importData,
    _state: state
  };
})(window.AR);
