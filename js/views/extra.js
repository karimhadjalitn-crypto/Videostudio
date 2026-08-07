/* ============================================================
   views/extra.js – Grammatik (Konjugation) & Vokabel-Browser
   ============================================================ */
window.AR = window.AR || {};
AR.views = AR.views || {};
(function (AR) {
  "use strict";
  var el = AR.ui.el, ui = AR.ui, store = AR.store, data = AR.data;

  /* -------- Grammatik: Konjugationsmodell -------- */
  function grammar(main) {
    var g = data.grammar || {};
    var rows = g.conjugation || [];
    var view = el("div", { class: "view" });
    view.appendChild(el("button", { class: "link", style: "margin-bottom:10px",
      onclick: function () { AR.app.go("home"); }, text: "‹ Zurück" }));
    view.appendChild(el("h2", { text: "Verben konjugieren" }));

    var mv = g.model_verb || {};
    view.appendChild(el("div", { class: "card stack center" }, [
      el("div", { class: "muted", text: "Beispielverb: „" + (mv.de || "gehen") + "“" }),
      el("div", { class: "verb-forms" }, [
        vf("Vergangenheit", mv.past), vf("Präsens", mv.present), vf("Zukunft", mv.future)
      ]),
      ui.speakButton(mv.present || "")
    ]));

    (g.notes || []).forEach(function (n) {
      view.appendChild(el("div", { class: "card muted", style: "font-size:14px;margin-top:10px", text: "• " + n }));
    });

    // Tabelle
    var tbl = el("table", { class: "preview", style: "margin-top:12px" }, [
      el("tr", {}, [
        el("th", { text: "" }), el("th", { text: "Person" }),
        el("th", { text: "Verg." }), el("th", { text: "Präsens" }), el("th", { text: "Zukunft" })
      ])
    ]);
    rows.forEach(function (r) {
      tbl.appendChild(el("tr", {}, [
        el("td", { class: "ar", style: "font-size:20px" }, ui.ar(r.pronoun)),
        el("td", { text: r.de }),
        el("td", { class: "ar" }, ui.ar(data.arText(r.past))),
        el("td", { class: "ar" }, ui.ar(data.arText(r.present))),
        el("td", { class: "ar" }, ui.ar(data.arText(r.future)))
      ]));
    });
    view.appendChild(el("div", { class: "card", style: "overflow-x:auto" }, tbl));

    AR.ui.clear(main).appendChild(view);
  }
  function vf(label, arabic) {
    return el("div", { class: "vf" }, [ el("small", { text: label }), ui.ar(arabic || "—") ]);
  }

  /* -------- Vokabel-Browser -------- */
  function browse(main) {
    var deckId = AR.app.browseDeckId || "mine";
    var d = data.deckById(deckId);
    var cards = d.cards();

    var view = el("div", { class: "view" });
    view.appendChild(el("button", { class: "link", style: "margin-bottom:10px",
      onclick: function () { AR.app.openDeck(deckId); }, text: "‹ Zurück" }));
    view.appendChild(el("h2", { text: d.emoji + " " + d.name }));

    var search = el("input", { type: "search", placeholder: "Suchen (Deutsch oder Arabisch)…", style: "margin-bottom:12px" });
    var listWrap = el("div", { class: "card" });
    view.appendChild(search); view.appendChild(listWrap);

    function draw(filter) {
      AR.ui.clear(listWrap);
      var f = (filter || "").trim().toLowerCase();
      var shown = cards.filter(function (c) {
        if (!f) return true;
        return c.de.toLowerCase().indexOf(f) >= 0 ||
          data.stripHarakat(c.fusha).indexOf(f) >= 0 || c.fusha.indexOf(f) >= 0;
      });
      if (!shown.length) { listWrap.appendChild(el("div", { class: "empty", text: "Nichts gefunden." })); return; }
      shown.forEach(function (c) {
        var row = el("div", { class: "row", style: "justify-content:space-between;border-bottom:1px solid var(--border);padding:8px 0;gap:10px" });
        var left = el("div", { style: "min-width:0" }, [
          el("div", { style: "font-weight:600", text: c.de }),
          el("div", { class: "row", style: "gap:8px" }, [
            ui.ar(data.arText(c.fusha), data.isVerb(c) ? "" : ""),
            data.isVerb(c) ? el("span", { class: "muted", style: "font-size:13px" }, ui.ar(data.arText(c.present))) : document.createComment("x")
          ])
        ]);
        var right = el("div", { class: "row", style: "gap:2px" }, [
          ui.statusChip(c.id), ui.speakButton(c.fusha), ui.starButton(c.id)
        ]);
        row.appendChild(left); row.appendChild(right);
        listWrap.appendChild(row);
      });
    }
    search.addEventListener("input", function () { draw(search.value); });
    draw("");

    AR.ui.clear(main).appendChild(view);
  }

  AR.views.grammar = { render: grammar };
  AR.views.browse = { render: browse };
})(window.AR);
