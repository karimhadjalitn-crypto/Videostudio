/* ============================================================
   views/flashcards.js – Karteikarten mit Selbsteinschätzung (SRS)
   ============================================================ */
window.AR = window.AR || {};
AR.views = AR.views || {};
(function (AR) {
  "use strict";
  var el = AR.ui.el, ui = AR.ui, store = AR.store, data = AR.data;

  var session = null;
  function mainEl() { return document.getElementById("main"); }

  function start(deckId) {
    var deck = data.deckById(deckId);
    var cards = deck.cards();
    var queue = store.buildQueue(cards);
    session = {
      deckId: deckId, deckName: deck.name,
      queue: queue, remaining: queue.slice(),
      done: {}, total: queue.length, flipped: false,
      current: null, dir: null
    };
  }

  function render(main) {
    var deckId = AR.app.currentDeck || "mine";
    if (!session || session.deckId !== deckId) { start(deckId); next(); }
    else if (!session.current && session.remaining.length) next();
    draw(main);
  }

  function next() {
    session.flipped = false;
    if (session.remaining.length === 0) { session.current = null; return; }
    session.current = session.remaining.shift();
    session.dir = data.resolveDirection();
  }

  function draw(main) {
    var view = el("div", { class: "view" });
    view.appendChild(header());

    if (!session.current) { view.appendChild(doneScreen()); AR.ui.clear(main).appendChild(view); return; }

    var c = session.current, dir = session.dir;
    var flash = el("div", { class: "flash-wrap" }, buildCard(c, dir));
    flash.appendChild(ui.starButton(c.id));
    view.appendChild(flash);

    // Steuerung unter der Karte
    var controls = el("div", { style: "margin-top:16px" });
    if (!session.flipped) {
      controls.appendChild(el("button", { class: "btn btn-lg block",
        onclick: function () { flip(main); } }, "Antwort zeigen"));
    } else {
      controls.appendChild(el("div", { class: "grade-row" }, [
        gradeBtn("again", "Nochmal", "gleich wieder", main),
        gradeBtn("good", "Gut", "in Kürze", main),
        gradeBtn("easy", "Leicht", "später", main)
      ]));
    }
    view.appendChild(controls);
    AR.ui.clear(main).appendChild(view);
  }

  function header() {
    var doneN = Object.keys(session.done).length;
    var pct = session.total ? Math.round(doneN / session.total * 100) : 0;
    var dirLabel = { de2ar: "DE → AR", ar2de: "AR → DE", mix: "Gemischt" }[store.get("direction")];
    return el("div", {}, [
      el("div", { class: "row", style: "justify-content:space-between;margin-bottom:8px" }, [
        el("button", { class: "chip", onclick: openDeckPick }, [session.deckName + "  ▾"]),
        el("button", { class: "chip accent", onclick: cycleDir }, [dirLabel])
      ]),
      el("div", { class: "session-top" }, [
        ui.progressBar(pct),
        el("span", { class: "progress-num muted", text: doneN + "/" + session.total })
      ])
    ]);
  }

  function buildCard(c, dir) {
    var flash = el("div", { class: "flash" + (session.flipped ? " flipped" : "") });
    var touched = false;
    flash.addEventListener("click", function () { if (touched) return; if (!session.flipped) flip(mainEl()); });
    // Wischgesten: nicht umgedreht -> aufdecken; umgedreht -> rechts=Gut, links=Nochmal, hoch=Leicht
    var sx = 0, sy = 0;
    flash.addEventListener("touchstart", function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
    flash.addEventListener("touchend", function (e) {
      var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 45 && Math.abs(dy) < 45) return; // Tap -> click übernimmt
      touched = true; setTimeout(function () { touched = false; }, 500);
      if (!session.flipped) { flip(mainEl()); return; }
      if (Math.abs(dx) > Math.abs(dy)) doGrade(dx > 0 ? "good" : "again", mainEl());
      else if (dy < 0) doGrade("easy", mainEl());
    }, { passive: true });

    /* Vorderseite */
    var front = el("div", { class: "face front" });
    front.appendChild(el("span", { class: "tag" }, ui.statusChip(c.id)));
    if (dir === "de2ar") {
      front.appendChild(el("div", { class: "prompt-de", text: c.de }));
      front.appendChild(el("div", { class: "muted", text: typeLabel(c) }));
    } else {
      front.appendChild(ui.ar(data.arText(c.fusha), "prompt-ar"));
      front.appendChild(ui.speakButton(c.fusha));
    }
    front.appendChild(el("div", { class: "tap-hint", text: "Tippen zum Umdrehen" }));

    /* Rückseite */
    var back = el("div", { class: "face back" });
    back.appendChild(el("span", { class: "tag" }, el("span", { class: "chip", text: c.category })));
    if (dir === "de2ar") {
      back.appendChild(fillAnswer(c));
    } else {
      back.appendChild(el("div", { class: "answer-de", text: c.de }));
      back.appendChild(el("div", { class: "divider" }));
      back.appendChild(fillAnswer(c, true));
    }
    var ex = data.exampleFor(c);
    if (ex && !data.isVerb(c)) back.appendChild(exampleBlock(ex, c));
    flash.appendChild(front); flash.appendChild(back);
    return flash;
  }

  // Arabische Antwort (+ Verbformen, Sprechform, Audio)
  function fillAnswer(c, small) {
    var box = el("div", { class: "stack", style: "align-items:center" });
    if (data.isVerb(c)) {
      var forms = [vf("Vergangenheit", c.fusha), vf("Präsens", c.present), vf("Zukunft", c.future)];
      if (c.imperative) forms.push(vf("Befehlsform", c.imperative));
      box.appendChild(el("div", { class: "verb-forms" }, forms));
      box.appendChild(el("div", { class: "answer-de", text: c.de, style: small ? "display:none" : "" }));
    } else {
      box.appendChild(ui.ar(data.arText(c.fusha), small ? "prompt-ar" : "answer-ar"));
      if (store.get("showSpoken") && c.spoken && data.stripHarakat(c.spoken) !== data.stripHarakat(c.fusha)) {
        box.appendChild(el("div", { class: "row", style: "gap:8px" }, [
          el("span", { class: "muted", style: "font-size:13px", text: "gesprochen:" }),
          ui.ar(c.spoken, "spoken")
        ]));
      }
    }
    if (c.example) box.appendChild(el("div", { class: "muted", style: "font-size:13px;text-align:center", text: "z.B. " + c.example }));
    box.appendChild(ui.speakButton(c.fusha));
    return box;
  }
  function vf(label, arabic) {
    return el("div", { class: "vf" }, [
      el("small", { text: label }),
      ui.ar(data.arText(arabic || "—")),
    ]);
  }

  // Beispielsatz auf der Rückseite (Zielwort hervorgehoben)
  function exampleBlock(ex, card) {
    function keyOf(s) {
      s = data.stripHarakat(s || "").replace(/[.،؟!:«»„“"']/g, "");
      if (s.indexOf("ال") === 0) s = s.slice(2);
      return s;
    }
    var ck = keyOf(card.fusha);
    var line = el("div", { class: "ar ex-ar" });
    (ex.fusha || "").split(/\s+/).forEach(function (tok) {
      var span = el("span", { text: data.arText(tok) + " " });
      if (keyOf(tok) === ck) span.className = "ex-hl";
      line.appendChild(span);
    });
    var box = el("div", { class: "example" }, [
      el("div", { class: "row", style: "justify-content:center;gap:8px" }, [
        el("span", { class: "ex-label", text: "Im Satz" }), AR.ui.speakButton(ex.fusha)
      ]),
      line,
      el("div", { class: "ex-de", text: ex.gesamt || ex.de })
    ]);
    return box;
  }

  function typeLabel(c) {
    return { verb: "Verb", noun: "Nomen", adjective: "Adjektiv", preposition: "Präposition",
      conjunction: "Konjunktion", question: "Frage/Pronomen" }[c.type] || "";
  }

  function flip(main) { session.flipped = true; draw(main); if (store.get("audio")) AR.audio.speak(session.current.fusha); }

  function gradeBtn(g, label, sub, main) {
    var cls = g === "again" ? "again" : g === "easy" ? "easy" : "good";
    return el("button", { class: "grade " + cls, onclick: function () { doGrade(g, main); } },
      [ el("span", { text: label }), el("small", { text: sub }) ]);
  }

  function doGrade(g, main) {
    var c = session.current;
    store.grade(c.id, g);
    if (g === "again") {
      var pos = Math.min(3, session.remaining.length);
      session.remaining.splice(pos, 0, c);
    } else {
      session.done[c.id] = true;
    }
    next(); draw(main);
  }

  function doneScreen() {
    var deckCards = data.deckById(session.deckId).cards();
    var c = store.counts(deckCards);
    return ui.doneScreen({
      emoji: "🎉", title: "Sitzung geschafft!",
      subtitle: Object.keys(session.done).length + " Karten gelernt · " +
        c.gekonnt + "/" + c.total + " im Deck gekonnt",
      buttons: [
        el("button", { class: "btn btn-primary block", onclick: function () {
          start(session.deckId); render(document.getElementById("main"));
        } }, "Weiter lernen"),
        el("button", { class: "btn block", onclick: function () { AR.app.go("quiz"); } }, "Zum Quiz"),
        el("button", { class: "btn btn-ghost block", onclick: function () { AR.app.go("home"); } }, "Zur Startseite")
      ]
    });
  }

  /* Deck-Auswahl per Prompt (native select im Sheet) */
  function openDeckPick() {
    var ds = data.decks();
    var sel = el("select", { onchange: function () { AR.app.setDeck(sel.value); start(sel.value); render(document.getElementById("main")); } });
    ds.forEach(function (d) {
      var o = el("option", { value: d.id, text: d.emoji + " " + d.name });
      if (d.id === session.deckId) o.selected = true;
      sel.appendChild(o);
    });
    AR.app.sheet("Deck wählen", sel);
  }
  function cycleDir() {
    var order = ["mix", "de2ar", "ar2de"];
    var cur = store.get("direction");
    var nextDir = order[(order.indexOf(cur) + 1) % order.length];
    store.set("direction", nextDir);
    session.dir = data.resolveDirection();
    draw(document.getElementById("main"));
  }

  // Tastatur: Leer/Enter = aufdecken bzw. „Gut"; 1=Nochmal, 2=Gut, 3=Leicht
  function onKey(e) {
    if (!session || !session.current) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    var k = e.key;
    if (!session.flipped) {
      if (k === " " || k === "Enter" || k === "ArrowUp" || k === "ArrowDown") { e.preventDefault(); flip(mainEl()); }
    } else {
      if (k === "1") { e.preventDefault(); doGrade("again", mainEl()); }
      else if (k === "2" || k === " " || k === "Enter") { e.preventDefault(); doGrade("good", mainEl()); }
      else if (k === "3") { e.preventDefault(); doGrade("easy", mainEl()); }
    }
  }

  AR.views.flashcards = { render: render, onKey: onKey, reset: function () { session = null; } };
})(window.AR);
