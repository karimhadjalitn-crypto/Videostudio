/* ============================================================
   views/heute.js – Quran: Tagesrunde, freiwillige Wiederholung
   ============================================================ */
window.AR = window.AR || {};
AR.views = AR.views || {};
(function (AR) {
  "use strict";
  var el = AR.ui.el, ui = AR.ui, qp = AR.qplan;

  /* ---------- Übersicht ---------- */
  function render(main) {
    var t = qp.today();
    var view = el("div", { class: "view" });
    view.appendChild(ui.largeTitle("Heute", new Date().toLocaleDateString("de-DE",
      { weekday: "long", day: "numeric", month: "long" }),
      el("button", { class: "navbtn", "aria-label": "Einstellungen",
        onclick: function () { AR.app.go("settings"); }, html: ui.icon("gear") })));

    view.appendChild(todayCard(t, main));
    view.appendChild(reviewCard());
    view.appendChild(progressCard());

    AR.ui.clear(main).appendChild(view);
  }

  function todayCard(t, main) {
    var card = el("div", { class: "card hero stack" });
    if (!t.started) {
      card.appendChild(el("div", { class: "hero-k", text: "Dein Lernplan" }));
      card.appendChild(el("div", { class: "hero-t", text: "Start " + qp.startLabel() }));
      card.appendChild(el("p", { class: "muted", text: "Dann kommen jeden Tag " + qp.dailyNew() +
        " neue Wörter – die häufigsten Wörter des Quran zuerst." }));
      card.appendChild(el("button", { class: "btn btn-tinted block",
        onclick: function () { AR.app.go("grammatik"); } }, "Bis dahin: Grammatik ansehen"));
      return card;
    }
    if (!t.total) {
      card.appendChild(el("div", { class: "hero-t", text: "Alle Wörter gelernt 🎉" }));
      card.appendChild(el("p", { class: "muted", text: "Du hast den ganzen Wortschatz durch. Wiederholen hält ihn frisch." }));
      return card;
    }

    card.appendChild(el("div", { class: "row", style: "justify-content:space-between" }, [
      el("div", {}, [
        el("div", { class: "hero-k", text: "Neue Wörter" }),
        el("div", { class: "hero-t", text: t.complete ? "Geschafft ✓" : t.done + " von " + t.total })
      ]),
      ui.ring(t.total ? t.done / t.total : 0, t.done + "/" + t.total)
    ]));

    var list = el("div", { class: "today-words" });
    t.words.forEach(function (w) {
      var learned = qp.isLearned(w.id);
      list.appendChild(el("div", { class: "tw" + (learned ? " ok" : "") }, [
        el("span", { class: "tw-de", text: learned ? w.de : "?" }),
        ui.ar(w.ar, "tw-ar")
      ]));
    });
    card.appendChild(list);

    if (t.complete) {
      card.appendChild(el("p", { class: "muted", style: "margin:0",
        text: "Morgen kommen die nächsten " + qp.dailyNew() + "." }));
      card.appendChild(el("button", { class: "btn btn-tinted block",
        onclick: function () { startSession("today-again", t.words); } }, "Heutige Wörter nochmal ansehen"));
    } else {
      card.appendChild(el("button", { class: "btn btn-primary btn-lg block",
        onclick: function () { startSession("learn", t.open); } },
        t.done ? "Weiterlernen" : "Lernen starten"));
    }
    return card;
  }

  function reviewCard() {
    var learned = qp.learnedCount();
    var due = qp.dueWords();
    var card = el("div", { class: "card stack" });
    card.appendChild(el("div", { class: "row", style: "justify-content:space-between" }, [
      el("div", {}, [
        el("div", { class: "card-t", text: "Wiederholen" }),
        el("div", { class: "muted small", text: learned
          ? (due.length ? due.length + " Wörter wären jetzt dran – freiwillig" : "Gerade nichts fällig")
          : "Sobald du Wörter gelernt hast" })
      ]),
      due.length ? el("span", { class: "pill", text: due.length }) : null
    ]));
    if (learned) {
      card.appendChild(el("button", { class: "btn btn-tinted block", onclick: function () {
        if (due.length) startSession("review", due.slice(0, 30));
        else startSession("review", AR.data.shuffle(qp.learnedWords()).slice(0, 20));
      } }, due.length ? "Wiederholen" : "Gelernte Wörter üben"));
    }
    return card;
  }

  function progressCard() {
    var learned = qp.learnedCount(), total = qp.words().length, cov = qp.coverage();
    var streak = qp.streak();
    var card = el("div", { class: "card stack" });
    card.appendChild(el("div", { class: "card-t", text: "Fortschritt" }));
    card.appendChild(el("div", { class: "kpis" }, [
      kpi(learned, "von " + total + " Wörtern"),
      kpi(cov.pct.toLocaleString("de-DE") + " %", "des Quran-Textes"),
      kpi(streak, streak === 1 ? "Tag in Folge" : "Tage in Folge")
    ]));
    card.appendChild(el("p", { class: "muted small", style: "margin:0",
      text: "„des Quran-Textes“: Anteil aller Wortvorkommen im Quran, die deine gelernten Wörter abdecken." }));
    return card;
  }
  function kpi(n, l) {
    return el("div", { class: "kpi" }, [ el("div", { class: "n", text: n }), el("div", { class: "l", text: l }) ]);
  }

  /* ---------- Lernrunde ----------
     mode: "learn" (Tagesrunde), "review" (freiwillig), "today-again" */
  var S = null;
  function startSession(mode, words) {
    S = { mode: mode, queue: words.slice(), total: words.length, done: 0,
      current: null, flipped: false, missed: {} };
    nextCard();
    AR.app.go("lernen");
  }
  function nextCard() {
    S.flipped = false;
    S.current = S.queue.length ? S.queue.shift() : null;
  }

  function renderSession(main) {
    if (!S) { AR.app.go("heute"); return; }
    var view = el("div", { class: "view session" });
    var titles = { learn: "Neue Wörter", review: "Wiederholen", "today-again": "Heutige Wörter" };
    view.appendChild(el("div", { class: "session-bar" }, [
      el("button", { class: "navlink", onclick: function () { S = null; AR.app.go("heute"); } }, "Beenden"),
      el("div", { class: "session-title", text: titles[S.mode] }),
      el("span", { class: "progress-num muted", text: Math.min(S.done, S.total) + "/" + S.total })
    ]));
    view.appendChild(ui.progressBar(S.total ? S.done / S.total * 100 : 0));

    if (!S.current) { view.appendChild(doneScreen()); AR.ui.clear(main).appendChild(view); return; }

    view.appendChild(ui.qcard(S.current, S.flipped, function () { flip(); }));
    var controls = el("div", { class: "answer-row" });
    if (!S.flipped) {
      controls.appendChild(el("button", { class: "btn btn-lg block", onclick: flip }, "Umdrehen"));
    } else {
      controls.appendChild(el("button", { class: "btn btn-lg answer no", onclick: function () { answer(false); } }, "Wusste ich nicht"));
      controls.appendChild(el("button", { class: "btn btn-lg answer yes", onclick: function () { answer(true); } }, "Wusste ich"));
    }
    view.appendChild(controls);
    AR.ui.clear(main).appendChild(view);
  }

  function flip() {
    if (!S || !S.current || S.flipped) return;
    S.flipped = true;
    renderSession(document.getElementById("main"));
  }

  function answer(knew) {
    var w = S.current;
    if (knew) {
      if (S.mode === "learn") qp.markLearned(w.id);
      else if (S.mode === "review") AR.store.grade(w.id, "good");
      S.done++;
    } else {
      // Nicht gewusst: kommt in dieser Runde bald wieder
      if (S.mode !== "today-again") qp.markMissed(w.id);
      S.missed[w.id] = true;
      S.queue.splice(Math.min(3, S.queue.length), 0, w);
    }
    nextCard();
    renderSession(document.getElementById("main"));
  }

  function doneScreen() {
    var missed = Object.keys(S.missed).length;
    var msg = S.mode === "learn"
      ? "Die heutigen Wörter sitzen. Morgen kommen die nächsten " + qp.dailyNew() + "."
      : S.total + " Wörter durchgegangen" + (missed ? ", " + missed + " davon brauchten einen zweiten Anlauf." : ".");
    return ui.doneScreen({
      emoji: "✓", title: S.mode === "learn" ? "Heute geschafft" : "Fertig",
      subtitle: msg,
      buttons: [
        el("button", { class: "btn btn-primary block", onclick: function () { S = null; AR.app.go("heute"); } }, "Zur Übersicht")
      ]
    });
  }

  function onKey(e) {
    if (!S || !S.current) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (!S.flipped && (e.key === " " || e.key === "Enter")) { e.preventDefault(); flip(); }
    else if (S.flipped && (e.key === "1" || e.key === "ArrowLeft")) { e.preventDefault(); answer(false); }
    else if (S.flipped && (e.key === "2" || e.key === "ArrowRight" || e.key === " " || e.key === "Enter")) { e.preventDefault(); answer(true); }
  }

  function inSession() { return !!(S && S.current); }

  AR.views.heute = { render: render };
  AR.views.lernen = { render: renderSession, onKey: onKey, inSession: inSession };
})(window.AR);
