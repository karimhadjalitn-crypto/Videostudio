/* ============================================================
   app.js – Router, Navigation, Start
   ============================================================ */
window.AR = window.AR || {};
(function (AR) {
  "use strict";

  /* Welcher Tab gehört zu welcher Ansicht? Alles, was nicht zum
     Quranteil gehört, läuft unter „Mehr". */
  var TAB_OF = {
    heute: "heute", lernen: "heute",
    woerter: "woerter",
    grammatik: "grammatik"
  };
  var current = "heute";
  var history = [];          // für „Zurück" aus Einstellungen & Co.
  var installEvent = null;   // Angebot des Browsers, die App zu installieren

  var app = {
    currentDeck: "mine",
    browseDeckId: "mine",

    go: function (view, opts) {
      if (view !== current && !(opts && opts.noHistory)) history.push(current);
      if (history.length > 30) history.shift();
      current = view;
      var main = document.getElementById("main");
      if (view === "deck") { AR.views.home.renderDeck(main, app.currentDeck); }
      else if (AR.views[view]) { AR.views[view].render(main); }
      else { current = "heute"; AR.views.heute.render(main); }
      // Damit das Stylesheet je Ansicht anders layouten kann
      if (main) main.setAttribute("data-view", current);
      // Ein Update, das während einer Lernrunde kam, greift jetzt
      if (updateWartet && darfNeuLaden()) { neuLaden(); return; }
      updateTabs(current);
      window.scrollTo(0, 0);
    },
    back: function () {
      var v = history.pop() || "heute";
      app.go(v, { noHistory: true });
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
    /* Chrome auf Android bietet einen eigenen Installationsdialog an und
       meldet das vorher über beforeinstallprompt. Dann braucht es keine
       Klickanleitung, sondern nur einen Knopf. */
    canInstall: function () { return !!installEvent; },
    promptInstall: function () {
      if (!installEvent) return;
      var e = installEvent;
      installEvent = null;
      e.prompt();
    },

    sheet: function (title, node) {
      closeSheet();
      var overlay = AR.ui.el("div", { class: "overlay", id: "overlay",
        onclick: function (e) { if (e.target.id === "overlay") closeSheet(); } });
      var sheet = AR.ui.el("div", { class: "sheet" }, [
        AR.ui.el("div", { class: "sheet-grip" }),
        title ? AR.ui.el("h3", { text: title, style: "margin:4px 0 12px" }) : null,
        node,
        AR.ui.el("button", { class: "btn btn-tinted block", style: "margin-top:14px", onclick: closeSheet }, "Schließen")
      ]);
      overlay.appendChild(sheet);
      document.body.appendChild(overlay);
    }
  };
  function closeSheet() { var o = document.getElementById("overlay"); if (o) o.parentNode.removeChild(o); }
  app.closeSheet = closeSheet;

  function updateTabs(view) {
    // Einstellungen erreicht man von „Heute" und von „Mehr" – der Tab bleibt
    if (view === "settings") return;
    var tab = TAB_OF[view] || "mehr";
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-view") === tab);
    });
  }

  function boot() {
    AR.store.load();
    AR.store.applyTheme();

    // Tab-Leiste: ein Tipp auf den aktiven Tab führt zu seiner Startseite
    document.querySelectorAll(".tab").forEach(function (t) {
      t.addEventListener("click", function () {
        var v = t.getAttribute("data-view");
        if (v === "grammatik" && AR.views.grammatik.reset) AR.views.grammatik.reset();
        history = [];
        app.go(v, { noHistory: true });
      });
    });

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

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      installEvent = e;
    });
    window.addEventListener("appinstalled", function () { installEvent = null; });

    // Service Worker (nur über http/https, nicht file://)
    // Auf localhost (Entwicklung) ohne Service Worker – sonst liefert er alte Dateien
    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0 &&
        location.hostname !== "localhost") {
      navigator.serviceWorker.register("sw.js").catch(function () { /* offline optional */ });
      watchForUpdate();
    }

    // Neuer Tag, während die App offen im Hintergrund lag: Übersicht auffrischen
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible" && current === "heute") app.go("heute", { noHistory: true });
    });

    app.go("heute", { noHistory: true });
  }

  /* ---------- Neue Version übernehmen ----------
     Der Service Worker lädt eine neue Fassung im Hintergrund und übernimmt
     sofort (skipWaiting + clients.claim). Neu geladen wird erst, wenn es
     nicht stört: mitten in einer Lernrunde wartet die App. Der
     Lernfortschritt hängt nicht daran, er steht nach jeder Antwort im
     Speicher. */
  var updateWartet = false;

  function watchForUpdate() {
    var hatteController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (!hatteController) { hatteController = true; return; }
      if (updateWartet) return;
      updateWartet = true;
      if (darfNeuLaden()) neuLaden();
      else AR.ui.toast("Update bereit – wird nach dieser Runde geladen");
    });
  }
  function darfNeuLaden() {
    if (current === "lernen" && AR.views.lernen.inSession()) return false;
    if (current === "grammatik" && AR.views.grammatik.inSession()) return false;
    return current !== "flashcards" && current !== "quiz";
  }
  function neuLaden() {
    try { AR.store.saveNow(); } catch (e) {}
    location.reload();
  }

  AR.app = app;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window.AR);
