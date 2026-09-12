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
      hardSeen: {},   // wie oft wurde eine Karte in dieser Sitzung „Schwer" bewertet
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
        gradeBtn("again", "Nochmal", main),
        gradeBtn("hard", "Schwer", main),
        gradeBtn("good", "Gut", main),
        gradeBtn("easy", "Leicht", main)
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
      else doGrade(dy < 0 ? "easy" : "hard", mainEl());
    }, { passive: true });

    /* Vorderseite */
    var front = el("div", { class: "face front" });
    front.appendChild(el("span", { class: "tag" }, ui.statusChip(c.id)));
    if (dir === "de2ar") {
      front.appendChild(el("div", { class: "prompt-de", text: c.de }));
      front.appendChild(el("div", { class: "muted", text: typeLabel(c) }));
    } else {
      front.appendChild(ui.ar(data.cardAr(c), "prompt-ar"));
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
      if (c.prep || c.prepNote) box.appendChild(prepLine(c));
      box.appendChild(el("div", { class: "answer-de", text: c.de, style: small ? "display:none" : "" }));
    } else if (c.type === "quran") {
      // Quranwörter immer voll vokalisiert, dazu Wurzel und Häufigkeit
      box.appendChild(ui.ar(data.cardAr(c), small ? "prompt-ar" : "answer-ar"));
      var meta = [];
      if (c.root && c.root !== "—") {
        meta.push(el("span", { class: "chip" }, [
          el("span", { class: "muted", style: "font-size:11px", text: "Wurzel " }),
          ui.ar(c.root)
        ]));
      }
      if (c.freq) {
        meta.push(el("span", { class: "chip", text: c.freq + "× im Quran" }));
      }
      if (c.also) {
        meta.push(el("span", { class: "chip accent", text: "auch im Alltag" }));
      }
      if (meta.length) {
        box.appendChild(el("div", { class: "row", style: "gap:6px;flex-wrap:wrap;justify-content:center" }, meta));
      }
      box.appendChild(el("div", { class: "answer-de", text: c.de, style: small ? "display:none" : "" }));
    } else if (c.type === "adjective" && c.feminine) {
      box.appendChild(el("div", { class: "noun-forms" }, [
        nf("männlich", c.fusha, c.spoken),
        nf("weiblich", c.feminine, c.feminineSpoken)
      ]));
      box.appendChild(el("div", { class: "answer-de", text: c.de, style: small ? "display:none" : "" }));
    } else if (c.type === "noun" && (c.plural || c.genus)) {
      box.appendChild(nounForms(c));
      if (c.genus) box.appendChild(genusChip(c.genus));
      box.appendChild(el("div", { class: "answer-de", text: c.de, style: small ? "display:none" : "" }));
    } else {
      box.appendChild(ui.ar(data.cardAr(c), small ? "prompt-ar" : "answer-ar"));
      // Sprechform zeigen, sobald sie sich überhaupt unterscheidet. (Früher wurde
      // ohne Harakat verglichen – dadurch war sie fast immer „gleich" und blieb weg.)
      if (store.get("showSpoken") && c.spoken && c.spoken !== c.fusha) {
        box.appendChild(spokenLine(c.spoken));
      }
    }
    if (c.example) box.appendChild(el("div", { class: "muted", style: "font-size:13px;text-align:center", text: "z.B. " + c.example }));
    if (c.note) box.appendChild(noteLine(c.note));
    box.appendChild(el("div", { class: "row", style: "gap:10px;justify-content:center" }, [
      ui.speakButton(c.fusha),
      ui.reportButton(c)
    ]));
    return box;
  }
  function vf(label, arabic) {
    return el("div", { class: "vf" }, [
      el("small", { text: label }),
      ui.ar(data.arText(arabic || "—")),
    ]);
  }

  /* Nomen: Einzahl + Mehrzahl, je volles Fusha und Sprechform darunter */
  function nounForms(c) {
    var cells = [nf("Einzahl", c.fusha, c.spoken)];
    if (c.plural) cells.push(nf("Mehrzahl", c.plural, c.pluralSpoken));
    return el("div", { class: "noun-forms" }, cells);
  }
  function nf(label, fusha, spoken) {
    var cell = el("div", { class: "nf" }, [
      el("small", { text: label }),
      ui.ar(data.arText(fusha || "—"))
    ]);
    if (store.get("showSpoken") && spoken && spoken !== fusha) {
      cell.appendChild(ui.ar(data.arText(spoken), "nf-spoken"));
    }
    return cell;
  }
  /* Verb: verlangte Präposition bzw. Warnung, wenn Deutsch eine hat und Arabisch nicht */
  function prepLine(c) {
    if (c.prep) {
      return el("div", { class: "prep-line" }, [
        el("span", { class: "muted", text: "steht mit" }),
        ui.ar(data.arText(c.prep), "prep-ar")
      ]);
    }
    return el("div", { class: "prep-line warn" }, [
      el("span", { text: "⚠ " + c.prepNote })
    ]);
  }
  function genusChip(g) {
    return el("span", { class: "chip genus " + g,
      text: g === "f" ? "weiblich" : "männlich" });
  }
  /* Kurzer Hinweis unter der Karte. Die Hinweise mischen Deutsch und
     Arabisch – die arabischen Stellen brauchen ihre eigene Schrift und
     Leserichtung, sonst zerfaellt die Zeile. */
  var ARABIC = /[؀-ۿݐ-ݿﭐ-﻿][؀-ۿݐ-ݿﭐ-﻿\s]*/g;
  function noteLine(text) {
    var line = el("div", { class: "note-line" });
    var last = 0, m;
    ARABIC.lastIndex = 0;
    while ((m = ARABIC.exec(text)) !== null) {
      if (m.index > last) line.appendChild(document.createTextNode(text.slice(last, m.index)));
      line.appendChild(ui.ar(m[0].trim(), "note-ar"));
      last = m.index + m[0].length;
      if (/\s$/.test(m[0])) line.appendChild(document.createTextNode(" "));
    }
    if (last < text.length) line.appendChild(document.createTextNode(text.slice(last)));
    return line;
  }

  function spokenLine(spoken) {
    return el("div", { class: "row", style: "gap:8px" }, [
      el("span", { class: "muted", style: "font-size:13px", text: "gesprochen:" }),
      ui.ar(data.arText(spoken), "spoken")
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
      quran: "Quran-Wort", number: "Zahl", phrase: "Wendung",
      conjunction: "Konjunktion", question: "Frage/Pronomen" }[c.type] || "";
  }

  function flip(main) { session.flipped = true; draw(main); if (store.get("audio")) AR.audio.speak(session.current.fusha); }

  function gradeBtn(g, label, main) {
    var sub = store.previewInterval(session.current.id, g);
    return el("button", { class: "grade " + g, onclick: function () { doGrade(g, main); } },
      [ el("span", { text: label }), el("small", { text: sub }) ]);
  }

  function doGrade(g, main) {
    var c = session.current;
    store.grade(c.id, g);
    if (g === "again") {
      // sehr bald wieder – die Karte sitzt noch nicht
      session.remaining.splice(Math.min(2, session.remaining.length), 0, c);
    } else if (g === "hard" && (session.hardSeen[c.id] || 0) < 2) {
      // gewusst, aber mühsam: später in dieser Sitzung noch einmal
      session.hardSeen[c.id] = (session.hardSeen[c.id] || 0) + 1;
      session.remaining.splice(Math.min(8, session.remaining.length), 0, c);
    } else {
      session.done[c.id] = true;
    }
    next(); draw(main);
  }

  function doneScreen() {
    var deckCards = data.deckById(session.deckId).cards();
    var c = store.counts(deckCards);
    var g = store.goalProgress(data.allCards());
    return ui.doneScreen({
      emoji: "🎉", title: "Sitzung geschafft!",
      subtitle: Object.keys(session.done).length + " Karten gelernt · " +
        c.gekonnt + "/" + c.total + " im Deck gekonnt\n" +
        (g.reached ? "🏆 Lernziel erreicht: " + g.known + " Wörter!"
                   : "Lernziel: " + g.known + " von " + g.goal + " – noch " + g.left),
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

  // Tastatur: Leer/Enter = aufdecken bzw. „Gut"; 1=Nochmal, 2=Schwer, 3=Gut, 4=Leicht
  function onKey(e) {
    if (!session || !session.current) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    var k = e.key;
    if (!session.flipped) {
      if (k === " " || k === "Enter" || k === "ArrowUp" || k === "ArrowDown") { e.preventDefault(); flip(mainEl()); }
    } else {
      if (k === "1") { e.preventDefault(); doGrade("again", mainEl()); }
      else if (k === "2") { e.preventDefault(); doGrade("hard", mainEl()); }
      else if (k === "3" || k === " " || k === "Enter") { e.preventDefault(); doGrade("good", mainEl()); }
      else if (k === "4") { e.preventDefault(); doGrade("easy", mainEl()); }
    }
  }

  AR.views.flashcards = { render: render, onKey: onKey, reset: function () { session = null; } };
})(window.AR);
