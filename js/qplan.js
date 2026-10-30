/* ============================================================
   qplan.js – Quran-Wortschatz: Tagesplan, Kategorien, Wiederholung

   Jeden Tag kommen die nächsten N Wörter nach Häufigkeit dran
   (N = Einstellung „Neue Wörter pro Tag", Standard 5). Ein verpasster
   Tag stapelt sich nicht: Am nächsten Tag gibt es wieder N – die
   liegengebliebenen sind einfach die ersten davon, weil sie in der
   Häufigkeitsreihenfolge vorne stehen.

   Wiederholen ist freiwillig. Fällige Wörter werden gezählt und
   angeboten, aber nie aufgezwungen.
   ============================================================ */
window.AR = window.AR || {};
(function (AR) {
  "use strict";

  var V = (window.QVOCAB && window.QVOCAB.words) || [];
  var byIdMap = {};
  V.forEach(function (w) { byIdMap[w.id] = w; });

  /* Vier Häufigkeitsstufen nach Vorkommen im Quran */
  var CATS = [
    { id: 1, name: "Sehr häufig", range: "100× und öfter", min: 100, max: Infinity },
    { id: 2, name: "Häufig",      range: "30–99×",         min: 30,  max: 99 },
    { id: 3, name: "Mittel",      range: "10–29×",         min: 10,  max: 29 },
    { id: 4, name: "Selten",      range: "unter 10×",      min: 0,   max: 9 }
  ];
  function catOf(w) {
    for (var i = 0; i < CATS.length; i++) {
      if (w.count >= CATS[i].min && w.count <= CATS[i].max) return CATS[i].id;
    }
    return 4;
  }

  function words() { return V; }
  function byId(id) { return byIdMap[id] || null; }
  function inCat(id) { return V.filter(function (w) { return catOf(w) === id; }); }

  /* ---------- Datum ---------- */
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function startKey() { return AR.store.get("qStart") || dayKey(); }
  function started() { return dayKey() >= startKey(); }
  function startLabel() {
    var p = startKey().split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    var heute = new Date(); heute.setHours(0, 0, 0, 0);
    var diff = Math.round((d - heute) / 864e5);
    if (diff === 1) return "morgen";
    return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  }

  function dailyNew() {
    var n = parseInt(AR.store.get("dailyNew"), 10);
    return isFinite(n) && n > 0 ? Math.min(n, 50) : 5;
  }
  function isLearned(id) { return !!AR.store.q().learned[id]; }

  /* ---------- Heutige Wörter ----------
     Einmal am Tag festgelegt und gespeichert, damit sich die Auswahl nicht
     verschiebt, während man lernt. Ändert sich die Zahl in den
     Einstellungen, wird die heutige Liste angepasst: aufgefüllt mit den
     nächsten Wörtern bzw. am Ende gekürzt (Gelerntes bleibt drin). */
  function todayIds() {
    if (!started()) return [];
    var q = AR.store.q(), key = dayKey(), n = dailyNew();
    var list = (q.days[key] || []).filter(function (id) { return byIdMap[id]; });
    var changed = !q.days[key];

    if (list.length < n) {
      var have = {};
      list.forEach(function (id) { have[id] = true; });
      for (var i = 0; i < V.length && list.length < n; i++) {
        var w = V[i];
        if (!have[w.id] && !isLearned(w.id)) { list.push(w.id); changed = true; }
      }
    } else if (list.length > n) {
      for (var j = list.length - 1; j >= 0 && list.length > n; j--) {
        if (!isLearned(list[j])) { list.splice(j, 1); changed = true; }
      }
    }
    if (changed) { q.days[key] = list; AR.store.save(); }
    return list;
  }
  function today() {
    var ids = todayIds();
    var open = ids.filter(function (id) { return !isLearned(id); });
    return {
      started: started(),
      ids: ids,
      words: ids.map(byId),
      open: open.map(byId),
      done: ids.length - open.length,
      total: ids.length,
      complete: ids.length > 0 && open.length === 0
    };
  }

  /* Ein Wort gilt als gelernt, sobald es in der Tagesrunde „gewusst" wurde */
  function markLearned(id) {
    var q = AR.store.q();
    if (!q.learned[id]) { q.learned[id] = dayKey(); }
    AR.store.grade(id, "good");
  }
  function markMissed(id) {
    AR.store.grade(id, "again");
  }

  /* ---------- Freiwillige Wiederholung ---------- */
  function learnedWords() { return V.filter(function (w) { return isLearned(w.id); }); }
  function dueWords() {
    var now = Date.now();
    return learnedWords().filter(function (w) {
      var s = AR.store.peek(w.id);
      return !s || s.due <= now;
    }).sort(function (a, b) {
      var sa = AR.store.peek(a.id) || { box: 0, wrong: 0 }, sb = AR.store.peek(b.id) || { box: 0, wrong: 0 };
      return (sa.box - sb.box) || (sb.wrong - sa.wrong);
    });
  }
  function learnedCount() { return Object.keys(AR.store.q().learned).filter(function (id) { return byIdMap[id]; }).length; }

  /* Wie viel des Qurantextes decken die gelernten Wörter ab? Gemessen an
     allen Wortvorkommen im Quran (ohne angehängte Vorsilben und Pronomen),
     nicht nur an der Liste – sonst wirkte der Anteil größer als er ist. */
  function coverage() {
    var meta = (window.QVOCAB && window.QVOCAB.meta) || {};
    var total = 0, known = 0;
    V.forEach(function (w) { total += w.count; if (isLearned(w.id)) known += w.count; });
    if (meta.totalOccurrences) total = meta.totalOccurrences;
    return { total: total, known: known, pct: total ? Math.round(known / total * 1000) / 10 : 0 };
  }

  /* Tage in Folge, an denen die Tagesrunde fertig wurde */
  function streak() {
    var q = AR.store.q(), d = new Date(), n = 0;
    function full(k) {
      var ids = q.days[k];
      return ids && ids.length && ids.every(function (id) { return q.learned[id]; });
    }
    if (!full(dayKey(d))) d.setDate(d.getDate() - 1);
    while (full(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  AR.qplan = {
    CATS: CATS, catOf: catOf, words: words, byId: byId, inCat: inCat,
    dayKey: dayKey, started: started, startLabel: startLabel,
    dailyNew: dailyNew, today: today, isLearned: isLearned,
    markLearned: markLearned, markMissed: markMissed,
    learnedWords: learnedWords, dueWords: dueWords, learnedCount: learnedCount,
    coverage: coverage, streak: streak
  };
})(window.AR);
