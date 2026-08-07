/* ============================================================
   app.js – Router, Navigation, Start
   ============================================================ */
window.AR = window.AR || {};
(function (AR) {
  "use strict";

  var TAB_VIEWS = { home: 1, flashcards: 1, quiz: 1, sentences: 1, add: 1 };
  var current = "home";

  var app = {
    currentDeck: "mine",
    browseDeckId: "mine",

    go: function (view) {
      current = view;
      var main = document.getElementById("main");
      var v = AR.views[view] || (view === "deck" ? null : null);
      if (view === "deck") { AR.views.home.renderDeck(main, app.currentDeck); }
      else if (AR.views[view]) { AR.views[view].render(main); }
      else { AR.views.home.render(main); }
      updateTabs(view);
      updateBadge();
      window.scrollTo(0, 0);
      if (main) main.scrollTop = 0;
    },

    setDeck: function (id) {
      app.currentDeck = id;
      if (AR.views.flashcards.reset) AR.views.flashcards.reset();
      if (AR.views.quiz.reset) AR.views.quiz.reset();
    },
    openDeck: function (id) { app.currentDeck = id; app.go("deck"); },
    browseDeck: function (id) { app.browseDeckId = id; app.go("browse"); },

    isIOS: function () {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    },
    isStandalone: function () {
      return window.navigator.standalone === true ||
        (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
    },

    sheet: function (title, node) {
      closeSheet();
      var overlay = AR.ui.el("div", { class: "overlay", id: "overlay",
        onclick: function (e) { if (e.target.id === "overlay") closeSheet(); } });
      var sheet = AR.ui.el("div", { class: "sheet" }, [
        AR.ui.el("div", { class: "sheet-grip" }),
        title ? AR.ui.el("h3", { text: title, style: "margin:4px 0 12px" }) : null,
        node,
        AR.ui.el("button", { class: "btn btn-ghost block", style: "margin-top:10px", onclick: closeSheet }, "Schließen")
      ]);
      overlay.appendChild(sheet);
      document.body.appendChild(overlay);
    }
  };
  function closeSheet() { var o = document.getElementById("overlay"); if (o) o.parentNode.removeChild(o); }
  app.closeSheet = closeSheet;

  function updateBadge() {
    var badge = document.getElementById("dueBadge");
    if (!badge) return;
    try {
      var due = AR.store.dueCount(AR.data.deckById(app.currentDeck).cards());
      if (due > 0) { badge.textContent = due > 99 ? "99+" : due; badge.classList.remove("hidden"); }
      else badge.classList.add("hidden");
    } catch (e) { badge.classList.add("hidden"); }
  }

  function updateTabs(view) {
    var tabs = document.querySelectorAll(".tab");
    Array.prototype.forEach.call(tabs, function (t) {
      var v = t.getAttribute("data-view");
      // Deck-Detail & Browser zählen zum Home-Tab
      var match = v === view || (v === "home" && (view === "deck" || view === "browse" || view === "grammar"));
      t.classList.toggle("active", !!match);
    });
  }

  function boot() {
    AR.store.load();
    AR.store.applyTheme();
    AR.audio.init();

    // Tab-Leiste
    document.querySelectorAll(".tab").forEach(function (t) {
      t.addEventListener("click", function () {
        var v = t.getAttribute("data-view");
        if ((v === "flashcards" || v === "quiz")) { /* Deck beibehalten */ }
        app.go(v);
      });
    });
    var bs = document.getElementById("btnStats");
    var bg = document.getElementById("btnSettings");
    if (bs) bs.addEventListener("click", function () { app.go("stats"); });
    if (bg) bg.addEventListener("click", function () { app.go("settings"); });

    // Globale Tastaturbedienung -> an aktuelle Ansicht weiterreichen
    document.addEventListener("keydown", function (e) {
      var v = AR.views[current];
      if (v && v.onKey) v.onKey(e);
    });

    // Theme-Meta bei Systemwechsel aktualisieren
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", function () { AR.store.applyTheme(); });
    }

    // Service Worker (nur über http/https, nicht file://)
    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
      navigator.serviceWorker.register("sw.js").catch(function () { /* offline optional */ });
    }

    app.go("home");
  }

  AR.app = app;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window.AR);
