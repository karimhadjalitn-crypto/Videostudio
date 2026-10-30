/* ============================================================
   views/mehr.js – Weitere Bereiche: der bisherige Alltagsteil,
   Statistik und Einstellungen
   ============================================================ */
window.AR = window.AR || {};
AR.views = AR.views || {};
(function (AR) {
  "use strict";
  var el = AR.ui.el, ui = AR.ui;

  function render(main) {
    var view = el("div", { class: "view" });
    view.appendChild(ui.largeTitle("Mehr"));

    var alltag = AR.data.allCards().length;
    view.appendChild(ui.list([
      ui.listRow({ icon: "🗂", iconBg: "#34C759", title: "Übersicht & Decks", detail: alltag,
        onclick: function () { AR.app.go("home"); } }),
      ui.listRow({ icon: "🃏", iconBg: "#007AFF", title: "Karteikarten",
        onclick: function () { AR.app.setDeck("mine"); AR.app.go("flashcards"); } }),
      ui.listRow({ icon: "🎯", iconBg: "#FF9500", title: "Quiz",
        onclick: function () { AR.app.setDeck("mine"); AR.app.go("quiz"); } }),
      ui.listRow({ icon: "💬", iconBg: "#5856D6", title: "Sätze",
        onclick: function () { AR.app.go("sentences"); } }),
      ui.listRow({ icon: "📖", iconBg: "#AF52DE", title: "Verben konjugieren",
        onclick: function () { AR.app.go("oldgrammar"); } }),
      ui.listRow({ icon: "＋", iconBg: "#FF2D55", title: "Eigene Wörter hinzufügen",
        onclick: function () { AR.app.go("add"); } }),
      ui.listRow({ icon: "📊", iconBg: "#8E8E93", title: "Statistik",
        onclick: function () { AR.app.go("stats"); } })
    ], "Alltagsarabisch", "Der bisherige Wortschatz für Fuṣḥā und Sprechform – unverändert verfügbar."));

    view.appendChild(ui.list([
      ui.listRow({ icon: "⚙︎", iconBg: "#8E8E93", title: "Einstellungen",
        onclick: function () { AR.app.go("settings"); } })
    ]));

    AR.ui.clear(main).appendChild(view);
  }

  AR.views.mehr = { render: render };
})(window.AR);
