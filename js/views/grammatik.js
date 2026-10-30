/* ============================================================
   views/grammatik.js – Grundgrammatik für den Quran:
   Lektionen mit Beispielen aus dem Quran und kurzen Übungen
   ============================================================ */
window.AR = window.AR || {};
AR.views = AR.views || {};
(function (AR) {
  "use strict";
  var el = AR.ui.el, ui = AR.ui;

  var G = (window.QGRAMMAR && window.QGRAMMAR.lessons) || [];
  var CATS = ["Präfixe & Suffixe", "Verbkonjugation", "Nomen-Grundlagen"];
  var current = null;     // geöffnete Lektion
  var ex = null;          // laufende Übung

  function progress() { return AR.store.q().grammar; }
  function lessonById(id) {
    for (var i = 0; i < G.length; i++) if (G[i].id === id) return G[i];
    return null;
  }

  /* ---------- Übersicht ---------- */
  function render(main) {
    if (current) { renderLesson(main); return; }
    var done = G.filter(function (l) { return progress()[l.id]; }).length;
    var view = el("div", { class: "view" });
    view.appendChild(ui.largeTitle("Grammatik", done + " von " + G.length + " Lektionen abgeschlossen"));

    CATS.forEach(function (c) {
      var rows = G.filter(function (l) { return l.category === c; }).map(function (l) {
        var p = progress()[l.id];
        return ui.listRow({
          title: l.title, sub: l.summary,
          right: p ? el("span", { class: "lr-check", html: ui.icon("check") }) : null,
          onclick: function () { current = l.id; ex = null; AR.app.go("grammatik"); }
        });
      });
      if (rows.length) view.appendChild(ui.list(rows, c));
    });
    if (!G.length) view.appendChild(el("div", { class: "empty", text: "Keine Lektionen gefunden." }));
    AR.ui.clear(main).appendChild(view);
  }

  /* ---------- Lektion ---------- */
  function renderLesson(main) {
    var l = lessonById(current);
    if (!l) { current = null; render(main); return; }
    if (ex) { renderExercise(main, l); return; }

    var view = el("div", { class: "view lesson" });
    view.appendChild(ui.backBar("Grammatik", function () { current = null; AR.app.go("grammatik"); }));
    view.appendChild(el("div", { class: "lesson-cat", text: l.category }));
    view.appendChild(ui.mixed(l.title, "h1", "lesson-title"));

    var body = el("article", { class: "card lesson-body" });
    (l.blocks || []).forEach(function (b) { body.appendChild(block(b)); });
    view.appendChild(body);

    var n = (l.exercises || []).length;
    var p = progress()[l.id];
    if (n) {
      view.appendChild(el("button", { class: "btn btn-primary btn-lg block", style: "margin-top:16px",
        onclick: function () { ex = { i: 0, right: 0, picked: null, order: AR.data.shuffle(l.exercises) }; renderLesson(main); } },
        p ? "Übungen wiederholen" : "Übungen starten (" + n + ")"));
      if (p) view.appendChild(el("div", { class: "muted small center", style: "margin-top:8px",
        text: "Zuletzt: " + p.right + " von " + p.total + " richtig" }));
    }
    AR.ui.clear(main).appendChild(view);
  }

  function block(b) {
    if (b.type === "p") return el("p", { html: rich(b.text) });
    if (b.type === "tip") return el("div", { class: "tip", html: rich(b.text) });
    if (b.type === "table") {
      var t = el("table", { class: "gtable" });
      t.appendChild(el("tr", {}, (b.head || []).map(function (h) { return el("th", { html: rich(h) }); })));
      (b.rows || []).forEach(function (r) {
        t.appendChild(el("tr", {}, r.map(function (c) { return el("td", { html: rich(c) }); })));
      });
      return el("div", { class: "gtable-wrap" }, t);
    }
    if (b.type === "example") {
      var arEl = el("div", { class: "ar ex-quran" });
      // Quranzitate wie im Madina-Mushaf: Sukun als ۡ (so kodiert der King-Fahd-Text)
      var txt = mushaf(b.ar), hl = mushaf(b.highlight);
      var k = hl ? txt.indexOf(hl) : -1;
      if (k >= 0) {
        arEl.appendChild(document.createTextNode(txt.slice(0, k)));
        arEl.appendChild(el("mark", { text: hl }));
        arEl.appendChild(document.createTextNode(txt.slice(k + hl.length)));
      } else arEl.textContent = txt;
      return el("figure", { class: "qexample" }, [
        arEl,
        el("figcaption", {}, [
          el("span", { text: b.de }),
          el("span", { class: "ref", text: refLabel(b.ref) })
        ])
      ]);
    }
    return el("p", { text: b.text || "" });
  }
  /* Zitate kommen aus dem Tanzil-Text; die KFGQPC-Schrift erwartet die
     Kodierung des King-Fahd-Textes: Sukun U+06E1, das runde Null-Zeichen über
     stummen Buchstaben U+0652 (Tanzil U+06DF), Ya als U+064A, wo Tanzil
     das punktlose U+0649 setzt (ى bleibt nur Alif maqsura). */
  function mushaf(s) {
    return String(s || "").replace(/﻿/g, "")
      .replace(/ْ/g, "ۡ").replace(/۟/g, "ْ")
      .replace(/ى(?=[ٍِّْۡ])/g, "ي")
      .replace(/(ِّ?|ِّ)ى/g, "$1ي");
  }
  function refLabel(ref) { return ref ? "Sure " + String(ref).replace(":", ", Vers ") : ""; }

  /* [ar]…[/ar] → arabische Schrift, **…** → fett. Alles andere wird escaped. */
  function rich(s) {
    var h = String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    h = h.replace(/\[ar\]([\s\S]*?)\[\/ar\]/g, '<span class="ar">$1</span>');
    h = h.replace(/\*\*([\s\S]+?)\*\*/g, "<b>$1</b>");
    return h;
  }

  /* ---------- Übungen ---------- */
  function renderExercise(main, l) {
    var view = el("div", { class: "view lesson" });
    var total = ex.order.length;
    view.appendChild(el("div", { class: "session-bar" }, [
      el("button", { class: "navlink", onclick: function () { ex = null; renderLesson(main); } }, "Abbrechen"),
      ui.mixed(l.title, "div", "session-title"),
      el("span", { class: "progress-num muted", text: Math.min(ex.i + 1, total) + "/" + total })
    ]));
    view.appendChild(ui.progressBar(ex.i / total * 100));

    if (ex.i >= total) {
      var res = { right: ex.right, total: total, ts: Date.now() };
      progress()[l.id] = res; AR.store.save();
      view.appendChild(ui.doneScreen({
        emoji: ex.right === total ? "🏆" : "✓",
        title: ex.right + " von " + total + " richtig",
        subtitle: ex.right === total ? "Alles richtig – Lektion abgeschlossen." : "Lektion abgeschlossen. Die Erklärungen kannst du jederzeit nachlesen.",
        buttons: [
          el("button", { class: "btn btn-primary block", onclick: function () { ex = null; current = null; AR.app.go("grammatik"); } }, "Zur Übersicht"),
          el("button", { class: "btn btn-tinted block", onclick: function () { ex = null; renderLesson(main); } }, "Lektion nochmal lesen")
        ]
      }));
      AR.ui.clear(main).appendChild(view); return;
    }

    var q = ex.order[ex.i];
    view.appendChild(el("div", { class: "card ex-q", html: rich(q.prompt) }));
    var opts = el("div", { class: "options" });
    q.options.forEach(function (o, idx) {
      var b = el("button", { class: "opt" + (/[؀-ۿ]/.test(o) && !/[a-zäöüß]/i.test(o) ? " ar" : ""), html: rich(o) });
      if (ex.picked != null) {
        b.disabled = true;
        if (idx === q.answer) b.classList.add("correct");
        else if (idx === ex.picked) b.classList.add("wrong");
      } else {
        b.addEventListener("click", function () {
          ex.picked = idx; if (idx === q.answer) ex.right++; renderExercise(main, l);
        });
      }
      opts.appendChild(b);
    });
    view.appendChild(opts);
    if (ex.picked != null) {
      view.appendChild(el("div", { class: "tip", style: "margin-top:14px",
        html: (ex.picked === q.answer ? "<b>Richtig.</b> " : "<b>Nicht ganz.</b> ") + rich(q.explain) }));
      view.appendChild(el("button", { class: "btn btn-primary btn-lg block", style: "margin-top:14px",
        onclick: function () { ex.i++; ex.picked = null; renderExercise(main, l); } }, "Weiter"));
    }
    AR.ui.clear(main).appendChild(view);
  }

  AR.views.grammatik = { render: render, reset: function () { current = null; ex = null; },
    inSession: function () { return !!ex; } };
})(window.AR);
