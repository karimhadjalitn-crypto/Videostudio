/* ============================================================
   path.js – Der tägliche Weg: Tagesprogramm und Zieltermine

   Grundgedanke: Die verfügbare Zeit schwankt stark. Statt eines festen
   Pensums, das man an schlechten Tagen reißt, gibt es drei Größen –
   und die kleinste hält den Fortschritt allein schon am Leben.

   Kein Streak, der bei einem ausgelassenen Tag bestraft. Stattdessen ein
   ehrlicher Soll-Ist-Abgleich gegen die beiden Zieltermine.
   ============================================================ */
window.AR = window.AR || {};
(function (AR) {
  "use strict";

  /* Drei Tagesgrößen. "fresh" = neue Wörter, "reviews" = fällige Karten. */
  var PACES = {
    kurz:   { id: "kurz",   label: "Kurz",       minutes: 5,  reviews: 10, fresh: 0 },
    normal: { id: "normal", label: "Normal",     minutes: 15, reviews: 25, fresh: 5 },
    viel:   { id: "viel",   label: "Lang",       minutes: 30, reviews: 50, fresh: 12 }
  };
  var ORDER = ["kurz", "normal", "viel"];

  /* Zieltermine aus dem Konzept. */
  var GOALS = [
    { id: "quran", label: "Quran bis Ramadan", short: "Ramadan",
      target: 600, deadline: "2027-02-18", track: "quran" },
    { id: "speak", label: "Reden bis Sommer", short: "Sommer",
      target: 1500, deadline: "2027-06-01", track: "alltag" }
  ];

  var DAY = 24 * 3600e3;

  function pace() {
    var p = AR.store.get("pace");
    return PACES[p] || PACES.normal;
  }
  function setPace(id) {
    if (PACES[id]) AR.store.set("pace", id);
    return pace();
  }
  function paces() { return ORDER.map(function (k) { return PACES[k]; }); }

  /* ---------- Welche Karten sind heute dran? ----------
     Fällige Wiederholungen zuerst – sie halten das Gelernte. Neue Wörter
     kommen nur dazu, wenn die gewählte Größe sie vorsieht. */
  function todayPlan() {
    var p = pace();
    var now = Date.now();
    var alltag = AR.data.allCards();
    var quran = AR.data.quranCards();

    function split(cards) {
      var due = [], fresh = [];
      cards.forEach(function (c) {
        var s = AR.store._state.srs[c.id];
        if (!s || s.seen === 0) fresh.push(c);
        else if (s.due <= now) due.push(c);
      });
      return { due: due, fresh: fresh };
    }
    var a = split(alltag), q = split(quran);

    // Fällige: schwächste zuerst, beide Trakte gemischt
    var reviews = a.due.concat(q.due).sort(function (x, y) {
      var sx = AR.store._state.srs[x.id], sy = AR.store._state.srs[y.id];
      return (sx.box - sy.box) || (sy.wrong - sx.wrong);
    }).slice(0, p.reviews);

    // Wie viele neue Wörter? Sind keine Wiederholungen fällig, würde die
    // kleinste Größe sonst ins Leere laufen – dann gibt es auch dort ein
    // paar neue, damit ein kurzer Tag trotzdem etwas bringt.
    var freshCount = p.fresh;
    if (reviews.length === 0 && freshCount === 0) freshCount = 3;

    // Neue Wörter: bis Ramadan liegt der Schwerpunkt auf dem Quran
    var quranShare = daysLeft("quran") > 0 ? 0.7 : 0.3;
    var nQuran = Math.round(freshCount * quranShare);
    var nAlltag = freshCount - nQuran;
    var fresh = q.fresh.slice(0, nQuran).concat(a.fresh.slice(0, nAlltag));
    // Wenn ein Trakt leer ist, den anderen auffüllen
    if (fresh.length < freshCount) {
      var rest = freshCount - fresh.length;
      fresh = fresh.concat(q.fresh.slice(nQuran, nQuran + rest))
                   .concat(a.fresh.slice(nAlltag, nAlltag + rest))
                   .slice(0, freshCount);
    }

    return {
      pace: p,
      reviews: reviews,
      fresh: fresh,
      cards: reviews.concat(fresh),
      dueTotal: a.due.length + q.due.length,
      done: doneToday()
    };
  }

  /* ---------- Zieltermine ---------- */
  function daysLeft(goalId) {
    var g = goalById(goalId);
    if (!g) return 0;
    return Math.ceil((Date.parse(g.deadline) - Date.now()) / DAY);
  }
  function goalById(id) {
    for (var i = 0; i < GOALS.length; i++) if (GOALS[i].id === id) return GOALS[i];
    return null;
  }

  /* Startdatum: der erste Tag, an dem der Pfad benutzt wurde. Ohne das
     ließe sich "im Plan" nicht berechnen. */
  function startDate() {
    var s = AR.store.get("pathStart");
    if (!s) { s = new Date().toISOString().slice(0, 10); AR.store.set("pathStart", s); }
    return s;
  }

  function goals() {
    var start = Date.parse(startDate());
    return GOALS.map(function (g) {
      var cards = g.track === "quran" ? AR.data.quranCards() : AR.data.allCards();
      var known = 0;
      cards.forEach(function (c) { if (AR.store.status(c.id) === "known") known++; });

      var end = Date.parse(g.deadline);
      var total = Math.max(1, Math.round((end - start) / DAY));
      var gone = Math.max(0, Math.round((Date.now() - start) / DAY));
      var left = Math.max(0, Math.round((end - Date.now()) / DAY));
      // Soll: linear über die Laufzeit verteilt
      var soll = Math.round(g.target * Math.min(1, gone / total));
      var perDay = left > 0 ? Math.max(0, (g.target - known) / left) : 0;

      return {
        id: g.id, label: g.label, short: g.short, target: g.target,
        known: known, soll: soll, daysLeft: left,
        pct: Math.min(100, Math.round(known / g.target * 100)),
        onTrack: known >= soll,
        perDay: Math.round(perDay * 10) / 10,
        reached: known >= g.target
      };
    });
  }

  /* ---------- Was ist heute schon gelaufen? ---------- */
  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }
  function doneToday() {
    return (AR.store.stats().studyDates || {})[todayKey()] || 0;
  }

  AR.path = {
    PACES: PACES, paces: paces, pace: pace, setPace: setPace,
    todayPlan: todayPlan, goals: goals, daysLeft: daysLeft,
    doneToday: doneToday, startDate: startDate
  };
})(window.AR);
