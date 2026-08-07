/* ============================================================
   views/home.js – Startseite: Decks, Fortschritt, Schnellstart
   ============================================================ */
window.AR = window.AR || {};
AR.views = AR.views || {};
(function (AR) {
  "use strict";
  var el = AR.ui.el, ui = AR.ui, store = AR.store, data = AR.data;

  function render(main) {
    var mine = data.deckById("mine");
    var mineCards = mine.cards();
    var c = store.counts(mineCards);
    var due = store.dueCount(mineCards);
    var pct = c.total ? Math.round(c.gekonnt / c.total * 100) : 0;
    var streak = store.streak();

    var view = el("div", { class: "view" });

    /* Kopf: Streak + Fortschritt */
    view.appendChild(el("div", { class: "card stack" }, [
      el("div", { class: "row" }, [
        el("div", { class: "streak" }, [
          el("span", { class: "flame", text: streak > 0 ? "🔥" : "🌙" }),
          el("div", {}, [
            el("div", { class: "n", text: streak }),
            el("div", { class: "muted", style: "font-size:12px", text: streak === 1 ? "Tag Serie" : "Tage Serie" })
          ])
        ]),
        el("span", { class: "spacer", style: "flex:1" }),
        el("div", { class: "center" }, [
          el("div", { class: "n progress-num", style: "font-size:26px;font-weight:800",
            text: due }),
          el("div", { class: "muted", style: "font-size:12px", text: "Karten fällig" })
        ])
      ]),
      ui.progressBar(pct),
      el("div", { class: "row", style: "justify-content:space-between" }, [
        el("span", { class: "muted", style: "font-size:13px",
          text: c.gekonnt + " von " + c.total + " gekonnt" }),
        el("span", { class: "muted", style: "font-size:13px", text: pct + "%" })
      ])
    ]));

    /* Schnellstart */
    view.appendChild(el("button", { class: "btn btn-primary btn-lg block", style: "margin-top:14px",
      onclick: function () { AR.app.setDeck("mine"); AR.app.go("flashcards"); } },
      [ due > 0 ? (due + " Karten lernen") : "Wortschatz üben" ]));

    var quick = el("div", { class: "row", style: "gap:10px;margin-top:10px" }, [
      el("button", { class: "btn block", onclick: function () { AR.app.setDeck("mine"); AR.app.go("quiz"); } }, "🎯 Quiz"),
      el("button", { class: "btn block", onclick: function () { AR.app.go("sentences"); } }, "💬 Sätze")
    ]);
    view.appendChild(quick);

    /* Decks */
    view.appendChild(el("div", { class: "section-title", text: "Decks" }));
    var grid = el("div", { class: "decks" });
    data.decks().forEach(function (d) {
      if (d.id === "mine" || d.id === "all") return; // Feature/Alle separat
      grid.appendChild(deckCard(d));
    });
    // Feature-Deck oben einfügen
    grid.insertBefore(featureDeck(mine, mineCards, c), grid.firstChild);
    // "Alle" ans Ende
    grid.appendChild(deckCard(data.deckById("all")));
    view.appendChild(grid);

    /* Grammatik-Hinweis */
    view.appendChild(el("div", { class: "section-title", text: "Grammatik" }));
    view.appendChild(el("button", { class: "deck", style: "width:100%",
      onclick: function () { AR.app.go("grammar"); } }, [
      el("div", { class: "row" }, [
        el("span", { class: "emoji", text: "📖" }),
        el("div", {}, [
          el("div", { class: "name", text: "Verben konjugieren" }),
          el("div", { class: "sub", text: "Vergangenheit · Präsens · Zukunft" })
        ])
      ])
    ]));

    AR.ui.clear(main).appendChild(view);
  }

  function featureDeck(d, cards, c) {
    var pct = c.total ? Math.round(c.gekonnt / c.total * 100) : 0;
    return el("button", { class: "deck feature", onclick: function () { AR.app.openDeck(d.id); } }, [
      el("div", { class: "row", style: "justify-content:space-between" }, [
        el("span", { class: "emoji", text: "⭐" }),
        el("span", { class: "badge", style: "background:rgba(255,255,255,.25);color:#fff",
          text: c.total + " Wörter" })
      ]),
      el("div", { class: "name", text: d.name }),
      ui.progressBar(pct, ""),
      el("div", { class: "sub", text: c.gekonnt + " gekonnt · " + c.neu + " neu" })
    ]);
  }

  function deckCard(d) {
    var cards = d.cards();
    var c = store.counts(cards);
    var pct = c.total ? Math.round(c.gekonnt / c.total * 100) : 0;
    return el("button", { class: "deck", onclick: function () { AR.app.openDeck(d.id); } }, [
      el("div", { class: "row", style: "justify-content:space-between" }, [
        el("span", { class: "emoji", text: d.emoji }),
        el("span", { class: "sub", text: c.total })
      ]),
      el("div", { class: "name", text: d.name }),
      ui.progressBar(pct),
      el("div", { class: "sub", text: c.gekonnt + " gekonnt" })
    ]);
  }

  /* Deck-Detail (Modus wählen) */
  function renderDeck(main, deckId) {
    var d = data.deckById(deckId);
    var cards = d.cards();
    var c = store.counts(cards);
    var due = store.dueCount(cards);
    var pct = c.total ? Math.round(c.gekonnt / c.total * 100) : 0;

    var view = el("div", { class: "view" });
    view.appendChild(el("button", { class: "link", style: "margin-bottom:10px",
      onclick: function () { AR.app.go("home"); }, text: "‹ Zurück" }));

    view.appendChild(el("div", { class: "card stack" }, [
      el("div", { class: "row" }, [
        el("span", { class: "big-emoji", text: d.emoji }),
        el("div", {}, [
          el("h2", { style: "margin:0", text: d.name }),
          el("div", { class: "muted", text: c.total + " Vokabeln" })
        ])
      ]),
      ui.progressBar(pct),
      el("div", { class: "stat-grid", style: "margin-top:4px" }, [
        stat(c.neu, "neu", "new"), stat(c.lernen, "am Lernen", "learning"), stat(c.gekonnt, "gekonnt", "known")
      ])
    ]));

    view.appendChild(el("div", { class: "stack", style: "margin-top:14px" }, [
      el("button", { class: "btn btn-primary btn-lg block",
        onclick: function () { AR.app.setDeck(deckId); AR.app.go("flashcards"); } },
        [ "🃏 Karteikarten" + (due ? "  ·  " + due + " fällig" : "") ]),
      el("button", { class: "btn btn-lg block",
        onclick: function () { AR.app.setDeck(deckId); AR.app.go("quiz"); } }, "🎯 Quiz (Multiple Choice)"),
      el("button", { class: "btn btn-lg block",
        onclick: function () { AR.app.browseDeck(deckId); } }, "📋 Vokabeln durchsehen")
    ]));

    AR.ui.clear(main).appendChild(view);
  }

  function stat(n, label, cls) {
    return el("div", { class: "stat " + cls }, [
      el("div", { class: "n", text: n }), el("div", { class: "l", text: label })
    ]);
  }

  AR.views.home = { render: render, renderDeck: renderDeck };
})(window.AR);
