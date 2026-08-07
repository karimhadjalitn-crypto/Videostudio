/* ============================================================
   views/sentences.js – Satzstrukturen üben
   Baukasten · Musterkarten · Wort ersetzen
   ============================================================ */
window.AR = window.AR || {};
AR.views = AR.views || {};
(function (AR) {
  "use strict";
  var el = AR.ui.el, ui = AR.ui, store = AR.store, data = AR.data;

  // Nur Sätze mit handhabbarer Wortzahl
  var ALL = (data.sentences || []).filter(function (s) { return s.words && s.words.length >= 2 && s.words.length <= 7; });
  var WORDBANK = [];
  ALL.forEach(function (s) { s.words.forEach(function (w) { WORDBANK.push(w); }); });

  var sub = "build";
  var st = { build: null, cards: { list: null, idx: 0, flipped: false }, cloze: null };

  function render(main) {
    var view = el("div", { class: "view" });
    view.appendChild(el("h2", { text: "Satzstrukturen" }));
    view.appendChild(el("div", { class: "seg", style: "margin:10px 0 16px" }, [
      segBtn("build", "🧩 Baukasten"),
      segBtn("cards", "🃏 Muster"),
      segBtn("cloze", "✍️ Ersetzen")
    ]));
    var body = el("div", {});
    view.appendChild(body);
    if (sub === "build") renderBuild(body);
    else if (sub === "cards") renderCards(body);
    else renderCloze(body);
    AR.ui.clear(main).appendChild(view);
  }
  function segBtn(id, label) {
    return el("button", { class: sub === id ? "active" : "", text: label,
      onclick: function () { sub = id; render(document.getElementById("main")); } });
  }
  function main() { return document.getElementById("main"); }

  /* ---------------- Baukasten ---------------- */
  function newBuild() {
    var s = ALL[Math.floor(Math.random() * ALL.length)];
    var tokens = s.words.map(function (w, i) { return { ar: w.ar, de: w.de, i: i }; });
    st.build = { s: s, bank: data.shuffle(tokens), placed: [], checked: false, ok: false };
  }
  function renderBuild(body) {
    if (!st.build) newBuild();
    var b = st.build, s = b.s;
    body.appendChild(el("div", { class: "card stack" }, [
      el("div", { class: "muted center", style: "font-size:13px", text: "Bring die Wörter in die richtige Reihenfolge:" }),
      el("div", { class: "sb-target", text: s.gesamt || s.de }),
      slotArea(b),
      bankArea(b)
    ]));

    var ctrl = el("div", { style: "margin-top:14px" });
    if (!b.checked) {
      ctrl.appendChild(el("button", { class: "btn btn-primary btn-lg block",
        disabled: b.placed.length !== s.words.length ? "disabled" : null,
        onclick: function () { checkBuild(); } }, "Prüfen"));
    } else {
      body.appendChild(resultBlock(b.ok, s));
      ctrl.appendChild(el("button", { class: "btn btn-primary btn-lg block",
        onclick: function () { newBuild(); render(main()); } }, "Nächster Satz"));
    }
    body.appendChild(ctrl);
  }
  function slotArea(b) {
    var slot = el("div", { class: "sb-slot" });
    b.placed.forEach(function (t, pos) {
      var cls = "token";
      if (b.checked) cls += (t.i === pos ? " correct" : " wrong");
      var tk = el("button", { class: cls, onclick: function () { if (!b.checked) { unplace(pos); } } },
        [ ui.ar(data.arText(t.ar)) ]);
      slot.appendChild(tk);
    });
    if (b.placed.length === 0) slot.appendChild(el("span", { class: "muted", text: "hier antippen…" }));
    return slot;
  }
  function bankArea(b) {
    var bank = el("div", { class: "sb-bank" });
    b.bank.forEach(function (t, idx) {
      var tk = el("button", { class: "token", onclick: function () { place(idx); } },
        [ ui.ar(data.arText(t.ar)) ]);
      bank.appendChild(tk);
    });
    if (b.bank.length === 0) bank.appendChild(el("span", { class: "muted", text: "—" }));
    return bank;
  }
  function place(idx) { var b = st.build; b.placed.push(b.bank.splice(idx, 1)[0]); render(main()); }
  function unplace(pos) { var b = st.build; b.bank.push(b.placed.splice(pos, 1)[0]); render(main()); }
  function checkBuild() {
    var b = st.build;
    b.checked = true;
    b.ok = b.placed.every(function (t, pos) { return t.i === pos; });
    store.grade("sent:" + b.s.nr, b.ok ? "good" : "again");
    if (store.get("audio")) AR.audio.speak(b.s.fusha);
    render(main());
  }

  /* ---------------- Musterkarten ---------------- */
  function renderCards(body) {
    var c = st.cards;
    if (!c.list) c.list = data.shuffle(ALL.slice());
    if (c.idx >= c.list.length) { c.idx = 0; c.list = data.shuffle(ALL.slice()); }
    var s = c.list[c.idx];

    var flash = el("div", { class: "flash-wrap" });
    var fl = el("div", { class: "flash" + (c.flipped ? " flipped" : "") });
    fl.addEventListener("click", function () { if (!c.flipped) { c.flipped = true; render(main()); if (store.get("audio")) AR.audio.speak(s.fusha); } });
    var front = el("div", { class: "face front" }, [
      el("span", { class: "tag" }, el("span", { class: "chip", text: "Satz " + s.nr + "/" + ALL.length })),
      el("div", { class: "prompt-de", text: s.gesamt || s.de }),
      el("div", { class: "tap-hint", text: "Tippen für den arabischen Satz" })
    ]);
    var back = el("div", { class: "face back stack", style: "justify-content:center" }, [
      ui.ar(data.arText(s.fusha), "prompt-ar"),
      store.get("showSpoken") && s.spoken ? el("div", { class: "row", style: "gap:8px;justify-content:center" }, [
        el("span", { class: "muted", style: "font-size:13px", text: "gesprochen:" }), ui.ar(s.spoken, "spoken")
      ]) : document.createComment("x"),
      ui.speakButton(s.fusha),
      wordMap(s)
    ]);
    fl.appendChild(front); fl.appendChild(back);
    flash.appendChild(fl);
    body.appendChild(flash);

    var ctrl = el("div", { style: "margin-top:16px" });
    if (!c.flipped) {
      ctrl.appendChild(el("button", { class: "btn btn-lg block", onclick: function () { c.flipped = true; render(main()); } }, "Satz zeigen"));
    } else {
      ctrl.appendChild(el("div", { class: "grade-row" }, [
        el("button", { class: "grade again", onclick: function () { grade("again"); } }, [el("span", { text: "Nochmal" })]),
        el("button", { class: "grade good", onclick: function () { grade("good"); } }, [el("span", { text: "Gut" })]),
        el("button", { class: "grade easy", onclick: function () { grade("easy"); } }, [el("span", { text: "Leicht" })])
      ]));
    }
    body.appendChild(ctrl);

    function grade(g) { store.grade("sent:" + s.nr, g); c.flipped = false; c.idx++; render(main()); }
  }
  function wordMap(s) {
    var wm = el("div", { class: "wordmap", style: "width:100%;margin-top:6px" });
    s.words.forEach(function (w) {
      wm.appendChild(el("div", { class: "wm" }, [ ui.ar(data.arText(w.ar)), el("span", { class: "muted", text: w.de }) ]));
    });
    return wm;
  }

  /* ---------------- Wort ersetzen (Lückentext) ---------------- */
  function newCloze() {
    var s = ALL[Math.floor(Math.random() * ALL.length)];
    // Zielwort: bevorzugt ein „inhaltliches“ Wort (letztes), nicht ganz kurz
    var idx = s.words.length - 1;
    for (var i = s.words.length - 1; i >= 0; i--) {
      if (data.stripHarakat(s.words[i].ar).length >= 3) { idx = i; break; }
    }
    var answer = s.words[idx];
    var opts = [answer.ar];
    var seen = {}; seen[key(answer.ar)] = true;
    var pool = data.shuffle(WORDBANK);
    for (var j = 0; j < pool.length && opts.length < 4; j++) {
      var k = key(pool[j].ar);
      if (seen[k]) continue; seen[k] = true; opts.push(pool[j].ar);
    }
    st.cloze = { s: s, idx: idx, answer: answer, options: data.shuffle(opts), picked: null };
  }
  function key(s) { return data.stripHarakat(s).replace(/\s/g, ""); }

  function renderCloze(body) {
    if (!st.cloze) newCloze();
    var z = st.cloze, s = z.s;

    // Satz mit Lücke
    var line = el("div", { class: "cloze ar" });
    s.words.forEach(function (w, i) {
      if (i === z.idx && z.picked == null) {
        line.appendChild(el("span", { class: "blank", text: " ___ " }));
      } else if (i === z.idx) {
        var okp = key(z.picked) === key(z.answer.ar);
        line.appendChild(ui.ar(data.arText(z.picked), okp ? "" : ""));
      } else {
        line.appendChild(document.createTextNode(" " + data.arText(w.ar) + " "));
      }
    });

    body.appendChild(el("div", { class: "card stack" }, [
      el("div", { class: "muted center", style: "font-size:13px", text: "Welches Wort fehlt?" }),
      el("div", { class: "sb-target", text: s.gesamt || s.de }),
      line
    ]));

    var opts = el("div", { class: "options", style: "margin-top:14px" });
    z.options.forEach(function (o) {
      var b = el("button", { class: "opt ar" }, [ ui.ar(data.arText(o)) ]);
      b.addEventListener("click", function () { pickCloze(b, o); });
      if (z.picked != null) {
        b.disabled = true;
        if (key(o) === key(z.answer.ar)) b.classList.add("correct");
        else if (key(o) === key(z.picked)) b.classList.add("wrong");
      }
      opts.appendChild(b);
    });
    body.appendChild(opts);

    if (z.picked != null) {
      // Variante zeigen (ein Wort ersetzen)
      body.appendChild(variantBlock(z));
      body.appendChild(el("button", { class: "btn btn-primary btn-lg block", style: "margin-top:12px",
        onclick: function () { newCloze(); render(main()); } }, "Nächster Satz"));
    }
  }
  function pickCloze(b, o) {
    var z = st.cloze;
    if (z.picked != null) return;
    z.picked = o;
    var ok = key(o) === key(z.answer.ar);
    store.grade("sent:" + z.s.nr, ok ? "good" : "again");
    if (ok) ui.toast("Richtig! 🎉");
    if (store.get("audio")) AR.audio.speak(z.s.fusha);
    render(main());
  }
  function variantBlock(z) {
    // Ersetze das Zielwort durch ein anderes Vokabel gleicher Art -> Muster sehen
    var repl = null, cands = data.shuffle(data.allCards().filter(function (c) {
      return c.type === "noun" && key(c.fusha) !== key(z.answer.ar);
    }));
    if (cands.length) repl = cands[0];
    var box = el("div", { class: "card stack", style: "margin-top:12px" });
    box.appendChild(el("div", { class: "section-title", style: "margin:0", text: "Wort-für-Wort" }));
    box.appendChild(wordMap(z.s));
    if (repl) {
      var newWords = z.s.words.map(function (w, i) { return i === z.idx ? { ar: repl.fusha, de: repl.de } : w; });
      var arSent = newWords.map(function (w) { return data.arText(w.ar); }).join(" ");
      box.appendChild(el("div", { class: "divider" }));
      box.appendChild(el("div", { class: "muted", style: "font-size:13px", text: "Variante – ein Wort ersetzt (" + repl.de + "):" }));
      box.appendChild(el("div", { class: "row", style: "justify-content:center;gap:8px" }, [ ui.ar(arSent, "prompt-ar"), ui.speakButton(arSent) ]));
    }
    return box;
  }

  function resultBlock(ok, s) {
    return el("div", { class: "card stack center", style: "margin-top:12px" }, [
      el("div", { class: "result-check", text: ok ? "✅" : "❌" }),
      el("div", { style: "font-weight:700", text: ok ? "Richtig!" : "Richtige Reihenfolge:" }),
      ui.ar(data.arText(s.fusha), "prompt-ar"),
      ui.speakButton(s.fusha),
      wordMap(s)
    ]);
  }

  AR.views.sentences = { render: render };
})(window.AR);
