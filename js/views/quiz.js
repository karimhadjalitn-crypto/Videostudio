/* ============================================================
   views/quiz.js – Multiple-Choice-Quiz (speist denselben SRS)
   ============================================================ */
window.AR = window.AR || {};
AR.views = AR.views || {};
(function (AR) {
  "use strict";
  var el = AR.ui.el, ui = AR.ui, store = AR.store, data = AR.data;

  var session = null;
  var qmode = "see"; // see = Multiple Choice sehen | hear = Hörquiz
  function mainEl() { return document.getElementById("main"); }

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
    session.answered = false; session.picked = null;
    if (session.remaining.length === 0) { session.current = null; return; }
    var c = session.remaining.shift();
    // Im Hörquiz hört man Arabisch und wählt die deutsche Bedeutung
    var dir = qmode === "hear" ? "ar2de" : data.resolveDirection();
    var correct = data.answerText(c, dir);
    var opts = data.distractors(c, dir, 3).concat([correct]);
    session.current = c; session.dir = dir; session.correct = correct;
    session.options = data.shuffle(opts); session._spoke = null;
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

    // Modus-Umschalter: Sehen / Hören
    view.appendChild(el("div", { class: "seg", style: "margin:0 0 14px" }, [
      segBtn("see", "👁 Sehen", main), segBtn("hear", "🔊 Hören", main)
    ]));

    if (!session.current) { view.appendChild(doneScreen()); AR.ui.clear(main).appendChild(view); return; }

    var c = session.current, dir = session.dir, pcard, instr;
    if (qmode === "hear") {
      var play = el("button", { class: "btn btn-primary btn-lg", style: "min-width:190px;font-size:18px",
        onclick: function () { AR.audio.speak(c.fusha); } }, "🔊  Anhören");
      var inner = el("div", { class: "center stack", style: "align-items:center" }, [play]);
      if (session.answered) {
        inner.appendChild(ui.ar(data.arText(c.fusha), "prompt-ar"));
        if (store.get("showSpoken") && c.spoken && data.stripHarakat(c.spoken) !== data.stripHarakat(c.fusha))
          inner.appendChild(ui.ar(c.spoken, "spoken"));
      } else {
        inner.appendChild(el("div", { class: "muted", style: "font-size:13px", text: "Tippe zum Anhören" }));
      }
      pcard = el("div", { class: "card" }, inner);
      instr = "Welches Wort hörst du?";
      if (!session.answered && session._spoke !== c.id) { session._spoke = c.id; AR.audio.speak(c.fusha); }
    } else {
      var arPrompt = dir === "ar2de";
      pcard = el("div", { class: "card" }, [
        el("div", { class: "row wrap", style: "justify-content:center;gap:10px" }, [
          el("div", { class: "q-prompt" + (arPrompt ? " ar" : ""), text: data.promptText(c, dir) })
        ].concat(arPrompt ? [ui.speakButton(c.fusha)] : []))
      ]);
      instr = dir === "de2ar" ? "Wähle die arabische Übersetzung" : "Wähle die deutsche Bedeutung";
    }
    view.appendChild(pcard);
    view.appendChild(el("div", { class: "muted center", style: "margin:10px 0", text: instr }));

    var arOptions = dir === "de2ar";
    var opts = el("div", { class: "options" });
    session.options.forEach(function (opt) {
      var b = el("button", { class: "opt" + (arOptions ? " ar" : ""), text: opt });
      if (session.answered) {
        b.disabled = true;
        if (data.stripHarakat(opt) === data.stripHarakat(session.correct)) b.classList.add("correct");
        else if (data.stripHarakat(opt) === data.stripHarakat(session.picked || "")) b.classList.add("wrong");
      } else {
        b.addEventListener("click", function () { pick(opt, main); });
      }
      opts.appendChild(b);
    });
    view.appendChild(opts);

    if (session.answered) {
      view.appendChild(el("button", { class: "btn btn-primary btn-lg block", style: "margin-top:14px",
        onclick: function () { nextQ(); draw(main); } }, "Weiter"));
    }
    AR.ui.clear(main).appendChild(view);
  }

  function segBtn(id, label, main) {
    return el("button", { class: qmode === id ? "active" : "", text: label,
      onclick: function () {
        if (id === qmode) return;
        if (id === "hear" && !AR.audio.available()) { ui.toast("Audio auf diesem Gerät nicht verfügbar"); return; }
        qmode = id; start(session.deckId); nextQ(); draw(main);
      } });
  }

  function pick(opt, main) {
    if (session.answered) return;
    session.answered = true;
    session.picked = opt;
    var correct = (data.stripHarakat(opt) === data.stripHarakat(session.correct));
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

  // Tastatur: 1–4 = Antwort wählen; Leer/Enter = Weiter
  function onKey(e) {
    if (!session || !session.current) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (!session.answered) {
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= (session.options || []).length) {
        var opts = document.querySelectorAll(".opt");
        if (opts[n - 1]) opts[n - 1].click();
      }
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault(); nextQ(); draw(mainEl());
    }
  }

  AR.views.quiz = { render: render, onKey: onKey, reset: function () { session = null; } };
})(window.AR);
