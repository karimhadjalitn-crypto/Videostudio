/* ============================================================
   qplan.js – Quran-Wortschatz: Tagesplan, Kategorien, Wiederholung

   Jeden Tag kommen die nächsten N Wörter dran (N = Einstellung „Neue
   Wörter pro Tag", Standard 10): zuerst die eigene Liste in ihrer
   Reihenfolge, danach die übrigen nach Häufigkeit. Ein verpasster
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
  /* Die eigene Liste (Liste 1 und 2, 10er-Gruppen) kommt vor allen anderen
     Wörtern dran, in ihrer Reihenfolge. Danach geht es mit dem
     Häufigkeitswortschatz weiter.
     Steht ein Listenwort auch im Häufigkeitsteil (Feld „qv“), haben beide
     einen gemeinsamen Fortschritt (AR.store.canon): Was auf der einen Seite
     gelernt ist, gilt auf der anderen auch als gelernt. Ein Wort des
     Häufigkeitsteils kommt dann nicht noch einmal als neues Wort; ein Wort
     der eigenen Liste kommt trotzdem an seinem Tag dran (wie eine
     Wiederholung), damit die Liste vollständig durchläuft. */
  var L = (window.QLIST && window.QLIST.words) || [];
  var SEQ = L.concat(V);
  var byIdMap = {};
  SEQ.forEach(function (w) { byIdMap[w.id] = w; });
  function canon(id) { return AR.store.canon(id); }
  /* Jedes echte Wort genau einmal (bei Paaren das Listenwort, weil es zuerst
     kommt) – für Gesamtzahl, Wiederholung und Zählungen */
  var UNIQ = [], seenC = {};
  SEQ.forEach(function (w) {
    var c = canon(w.id);
    if (!seenC[c]) { seenC[c] = true; UNIQ.push(w); }
  });

  /* Vier Häufigkeitsstufen nach Vorkommen im Quran */
  var CATS = [
    { id: 1, name: "Sehr häufig", range: "100× und öfter", min: 100, max: Infinity },
    { id: 2, name: "Häufig",      range: "30–99×",         min: 30,  max: 99 },
    { id: 3, name: "Mittel",      range: "10–29×",         min: 10,  max: 29 },
    { id: 4, name: "Selten",      range: "unter 10×",      min: 0,   max: 9 }
  ];
  function catOf(w) {
    if (w.list) return w.cat || 4;   // Listenwörter: Stufe steht in den Daten
    for (var i = 0; i < CATS.length; i++) {
      if (w.count >= CATS[i].min && w.count <= CATS[i].max) return CATS[i].id;
    }
    return 4;
  }

  function catName(w) { return CATS[catOf(w) - 1].name; }

  function words() { return V; }
  function listWords() { return L; }
  function allWords() { return SEQ; }
  function uniqueWords() { return UNIQ; }
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
    return isFinite(n) && n > 0 ? Math.min(n, 50) : 10;
  }
  function isLearned(id) { return !!AR.store.q().learned[canon(id)]; }

  /* ---------- Beantwortet ----------
     Getrennt von „gelernt“: q.answered[Tag] hält die Kennungen, die an
     diesem Tag in der Tagesrunde gewusst wurden. Daran hängt, ob ein Wort
     heute noch offen ist und ob der Tag fertig ist. */
  function answeredOn(k) {
    var a = AR.store.q().answered;
    return (a && Array.isArray(a[k])) ? a[k] : [];
  }
  function isAnsweredToday(id) { return answeredOn(dayKey()).indexOf(id) >= 0; }
  /* Listenwörter, die schon an irgendeinem Tag beantwortet wurden */
  function answeredEver() {
    var a = AR.store.q().answered || {}, set = {};
    Object.keys(a).forEach(function (k) {
      if (Array.isArray(a[k])) a[k].forEach(function (id) { set[id] = true; });
    });
    return set;
  }
  function markAnswered(id) {
    var q = AR.store.q(), key = dayKey();
    if ((q.days[key] || []).indexOf(id) < 0) return;   // nur Wörter des heutigen Plans
    if (!q.answered || typeof q.answered !== "object" || Array.isArray(q.answered)) q.answered = {};
    var a = Array.isArray(q.answered[key]) ? q.answered[key] : (q.answered[key] = []);
    if (a.indexOf(id) < 0) { a.push(id); AR.store.save(); }
  }

  /* ---------- Heutige Wörter ----------
     Einmal am Tag festgelegt und gespeichert, damit sich die Auswahl nicht
     verschiebt, während man lernt. Ändert sich die Zahl in den
     Einstellungen, wird die heutige Liste angepasst: aufgefüllt mit den
     nächsten Wörtern bzw. am Ende gekürzt (heute Beantwortetes bleibt drin).
     Die eigene Liste kommt vollständig und in ihrer Reihenfolge dran – auch
     ein Listenwort, das über seinen Partner schon gelernt ist; übersprungen
     wird nur, was als Listenwort schon an einem Tag beantwortet wurde.
     Wörter des Häufigkeitsteils kommen nicht, wenn sie (auch über den
     Partner) schon gelernt sind oder ihr Partner heute schon dran ist. */
  function todayIds() {
    if (!started()) return [];
    var q = AR.store.q(), key = dayKey(), n = dailyNew();
    var list = (q.days[key] || []).filter(function (id) { return byIdMap[id]; });
    var changed = !q.days[key];

    if (list.length < n) {
      var haveId = {}, haveC = {}, done = answeredEver();
      list.forEach(function (id) { haveId[id] = true; haveC[canon(id)] = true; });
      for (var i = 0; i < SEQ.length && list.length < n; i++) {
        var w = SEQ[i], c = canon(w.id);
        var take = w.list ? (!haveId[w.id] && !done[w.id])
                          : (!haveC[c] && !isLearned(w.id));
        if (take) { list.push(w.id); haveId[w.id] = true; haveC[c] = true; changed = true; }
      }
    } else if (list.length > n) {
      var ans = answeredOn(key);
      for (var j = list.length - 1; j >= 0 && list.length > n; j--) {
        if (ans.indexOf(list[j]) < 0) { list.splice(j, 1); changed = true; }
      }
    }
    if (changed) { q.days[key] = list; AR.store.save(); }
    return list;
  }
  function today() {
    var ids = todayIds(), ans = answeredOn(dayKey());
    var open = ids.filter(function (id) { return ans.indexOf(id) < 0; });
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
    var q = AR.store.q(), c = canon(id);
    if (!q.learned[c]) { q.learned[c] = dayKey(); }
    AR.store.grade(id, "good");
  }
  function markMissed(id) {
    AR.store.grade(id, "again");
  }

  /* ---------- Freiwillige Wiederholung ---------- */
  function learnedWords() { return UNIQ.filter(function (w) { return isLearned(w.id); }); }
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
  /* Jedes echte Wort zählt einmal: alte Einträge unter der Listenkennung
     eines Paares zählen nicht extra (ihr Stand liegt beim Partner). */
  function learnedCount() {
    return Object.keys(AR.store.q().learned).filter(function (id) {
      return byIdMap[id] && canon(id) === id;
    }).length;
  }

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

  /* Tage in Folge, an denen die Tagesrunde fertig wurde: jedes Wort des
     Tagesplans wurde an genau diesem Tag beantwortet (q.answered). Ein
     liegengebliebener Tag wird nicht nachträglich „fertig“, wenn seine
     Reste am Folgetag drankommen. */
  function streak() {
    var q = AR.store.q(), d = new Date(), n = 0;
    function full(k) {
      var ids = q.days[k], ans = answeredOn(k);
      return !!(ids && ids.length && ids.every(function (id) { return ans.indexOf(id) >= 0; }));
    }
    if (!full(dayKey(d))) d.setDate(d.getDate() - 1);
    while (full(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  AR.qplan = {
    CATS: CATS, catOf: catOf, catName: catName, words: words, listWords: listWords,
    allWords: allWords, uniqueWords: uniqueWords, canon: canon,
    byId: byId, inCat: inCat,
    dayKey: dayKey, started: started, startLabel: startLabel,
    dailyNew: dailyNew, today: today, isLearned: isLearned,
    markLearned: markLearned, markMissed: markMissed,
    markAnswered: markAnswered, isAnsweredToday: isAnsweredToday,
    learnedWords: learnedWords, dueWords: dueWords, learnedCount: learnedCount,
    coverage: coverage, streak: streak
  };
})(window.AR);
