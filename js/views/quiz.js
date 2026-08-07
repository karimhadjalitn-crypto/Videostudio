/* ============================================================
   views/quiz.js – Multiple-Choice-Quiz (speist denselben SRS)
   ============================================================ */
window.AR = window.AR || {};
AR.views = AR.views || {};
(function (AR) {
  "use strict";
  var el = AR.ui.el, ui = AR.ui, store = AR.store, data = AR.data;

  var session = null;

  function start(deckId) {
    var deck = data.deckById(deckId);
    var cards = deck.cards();
    var queue = store.buildQueue(cards);
    session = { deckId: deckId, deckName: deck.name, remaining: queue.slice(),
      total: queue.length, right: 0, wrong: 0, answered: false, current: null, dir: null, options: null };
  }

  function render(main) {
    var deckId = AR.app.currentDeck || "mine";
    if (!session || session.deckId !== deckId) { start(deckId); nextQ(); }
    else if (!session.current && session.remaining.length) nextQ();
    draw(main);
  }

  function nextQ() {
    session.answered = false;
    if (session.remaining.length === 0) { session.current = null; return; }
    var c = session.remaining.shift();
    var dir = data.resolveDirection();
    var correct = data.answerText(c, dir);
    var opts = data.distractors(c, dir, 3).concat([correct]);
    session.current = c; session.dir = dir; session.correct = correct;
    session.options = data.shuffle(opts);
  }

  function draw(main) {
    var view = el("div", { class: "view" });
    var doneN = session.right + session.wrong;
    var pct = session.total ? Math.round(doneN / session.total * 100) : 0;

    view.appendChild(el("div", { class: "row", style: "justify-content:space-between;margin-bottom:8px" }, [
      el("button", { class: "chip", onclick: function () { AR.app.go("home"); }, text: "✕ Beenden" }),
      el("span", { class: "chip accent", text: "✓ " + session.right + "   ✗ " + session.wrong })
    ]));
    view.appendChild(el("div", { class: "session-top" }, [
      ui.progressBar(pct),
      el("span", { class: "progress-num muted", text: doneN + "/" + session.total })
    ]));

    if (!session.current) { view.appendChild(doneScreen()); AR.ui.clear(main).appendChild(view); return; }

    var c = session.current, dir = session.dir;
    var arPrompt = dir === "ar2de";
    var promptText = data.promptText(c, dir);
    var pcard = el("div", { class: "card" }, [
      el("div", { class: "row", style: "justify-content:center;gap:10px" }, [
        el("div", { class: "q-prompt" + (arPrompt ? " ar" : ""), text: promptText })
      ].concat(arPrompt ? [ui.speakButton(c.fusha)] : []))
    ]);
    if (arPrompt) { pcard.querySelector(".row").classList.add("wrap"); }
    view.appendChild(pcard);
    view.appendChild(el("div", { class: "muted center", style: "margin:10px 0",
      text: dir === "de2ar" ? "Wähle die arabische Übersetzung" : "Wähle die deutsche Bedeutung" }));

    var arOptions = dir === "de2ar";
    var opts = el("div", { class: "options" });
    session.options.forEach(function (opt) {
      var b = el("button", { class: "opt" + (arOptions ? " ar" : ""), text: opt });
      b.addEventListener("click", function () { pick(b, opt, main); });
      opts.appendChild(b);
    });
    view.appendChild(opts);

    if (session.answered) {
      view.appendChild(el("button", { class: "btn btn-primary btn-lg block", style: "margin-top:14px",
        onclick: function () { nextQ(); draw(main); } }, "Weiter"));
    }
    AR.ui.clear(main).appendChild(view);
  }

  function pick(btn, opt, main) {
    if (session.answered) return;
    session.answered = true;
    var correct = (data.stripHarakat(opt) === data.stripHarakat(session.correct));
    var wrap = btn.parentNode;
    Array.prototype.forEach.call(wrap.children, function (b) {
      b.disabled = true;
      if (data.stripHarakat(b.textContent) === data.stripHarakat(session.correct)) b.classList.add("correct");
    });
    if (!correct) btn.classList.add("wrong");
    store.grade(session.current.id, correct ? "good" : "again");
    if (correct) { session.right++; ui.toast("Richtig! 🎉"); }
    else { session.wrong++; }
    if (store.get("audio")) AR.audio.speak(session.current.fusha);
    draw(main);
  }

  function doneScreen() {
    var total = session.right + session.wrong;
    var q = total ? Math.round(session.right / total * 100) : 0;
    return ui.doneScreen({
      emoji: q >= 80 ? "🏆" : q >= 50 ? "👍" : "💪",
      title: session.right + " von " + total + " richtig",
      subtitle: q + "% Trefferquote",
      buttons: [
        el("button", { class: "btn btn-primary block", onclick: function () { start(session.deckId); render(document.getElementById("main")); } }, "Nochmal"),
        el("button", { class: "btn block", onclick: function () { AR.app.go("flashcards"); } }, "Zu den Karten"),
        el("button", { class: "btn btn-ghost block", onclick: function () { AR.app.go("home"); } }, "Startseite")
      ]
    });
  }

  AR.views.quiz = { render: render, reset: function () { session = null; } };
})(window.AR);
