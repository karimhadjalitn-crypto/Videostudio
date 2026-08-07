/* ============================================================
   views/stats.js – Fortschritt & Statistik
   ============================================================ */
window.AR = window.AR || {};
AR.views = AR.views || {};
(function (AR) {
  "use strict";
  var el = AR.ui.el, ui = AR.ui, store = AR.store, data = AR.data;

  function render(main) {
    var all = data.allCards();
    var c = store.counts(all);
    var due = store.dueCount(all);
    var streak = store.streak();
    var reviews = store.stats().totalReviews || 0;

    var view = el("div", { class: "view" });
    view.appendChild(el("div", { class: "row", style: "justify-content:space-between" }, [
      el("h2", { text: "Fortschritt" }),
      el("button", { class: "link", onclick: function () { AR.app.go("home"); }, text: "Fertig" })
    ]));

    // Streak + fällig
    view.appendChild(el("div", { class: "card row", style: "justify-content:space-around" }, [
      miniStat(streak > 0 ? "🔥" : "🌙", streak, streak === 1 ? "Tag Serie" : "Tage Serie"),
      miniStat("📅", due, "heute fällig"),
      miniStat("🔁", reviews, "Wiederh. gesamt")
    ]));

    // Wissen-Verteilung
    view.appendChild(el("div", { class: "stat-grid", style: "margin-top:14px" }, [
      el("div", { class: "stat new" }, [el("div", { class: "n", text: c.neu }), el("div", { class: "l", text: "neu" })]),
      el("div", { class: "stat learning" }, [el("div", { class: "n", text: c.lernen }), el("div", { class: "l", text: "am Lernen" })]),
      el("div", { class: "stat known" }, [el("div", { class: "n", text: c.gekonnt }), el("div", { class: "l", text: "gekonnt" })])
    ]));
    var pct = c.total ? Math.round(c.gekonnt / c.total * 100) : 0;
    view.appendChild(el("div", { class: "card stack", style: "margin-top:12px" }, [
      el("div", { class: "row", style: "justify-content:space-between" }, [
        el("span", { style: "font-weight:600", text: "Gesamt gekonnt" }),
        el("span", { class: "muted", text: c.gekonnt + " / " + c.total + " · " + pct + "%" })
      ]),
      ui.progressBar(pct)
    ]));

    // Schwierige Wörter
    var weak = data.weakCards();
    view.appendChild(el("div", { class: "section-title", text: "Schwierige Wörter" }));
    if (!weak.length) {
      view.appendChild(el("div", { class: "card muted center", text: "Noch keine – lern ein paar Karten, dann erscheinen hier deine Wackelkandidaten." }));
    } else {
      var list = el("div", { class: "card stack" });
      weak.slice(0, 8).forEach(function (card) {
        var s = store.cardState(card.id);
        list.appendChild(el("div", { class: "row", style: "justify-content:space-between" }, [
          el("div", {}, [ el("div", { style: "font-weight:600", text: card.de }), ui.ar(data.arText(card.fusha)) ]),
          el("span", { class: "chip", text: s.wrong + "× falsch" })
        ]));
      });
      list.appendChild(el("button", { class: "btn btn-primary block", style: "margin-top:6px",
        onclick: function () { AR.app.setDeck("weak"); AR.app.go("flashcards"); } }, "🔥 Schwierige üben"));
      view.appendChild(list);
    }

    // Favoriten
    if (store.favCount() > 0) {
      view.appendChild(el("div", { class: "section-title", text: "Favoriten (" + store.favCount() + ")" }));
      view.appendChild(el("button", { class: "btn btn-lg block",
        onclick: function () { AR.app.setDeck("fav"); AR.app.go("flashcards"); } }, "⭐ Favoriten üben"));
    }

    // Fortschritt je Deck
    view.appendChild(el("div", { class: "section-title", text: "Nach Deck" }));
    var deckBox = el("div", { class: "card" });
    data.decks().forEach(function (d) {
      if (d.id === "all") return;
      var cc = store.counts(d.cards());
      var p = cc.total ? Math.round(cc.gekonnt / cc.total * 100) : 0;
      deckBox.appendChild(el("div", { class: "deckstat" }, [
        el("span", { class: "name", text: d.emoji + " " + d.name }),
        ui.progressBar(p),
        el("span", { class: "pct", text: p + "%" })
      ]));
    });
    view.appendChild(deckBox);

    AR.ui.clear(main).appendChild(view);
  }

  function miniStat(emoji, n, label) {
    return el("div", { class: "center" }, [
      el("div", { style: "font-size:24px", text: emoji }),
      el("div", { class: "n", style: "font-size:24px;font-weight:800", text: n }),
      el("div", { class: "muted", style: "font-size:12px", text: label })
    ]);
  }

  AR.views.stats = { render: render };
})(window.AR);
