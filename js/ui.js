/* ============================================================
   ui.js – DOM-Helfer, Toast, Sprech-Knopf, arabische Tastatur
   ============================================================ */
window.AR = window.AR || {};
(function (AR) {
  "use strict";

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null) return;
      if (k === "class" || k === "className") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else if (k === "onclick") n.addEventListener("click", v);
      else if (k === "oninput") n.addEventListener("input", v);
      else if (k === "onchange") n.addEventListener("change", v);
      else if (k === "dataset") Object.keys(v).forEach(function (dk){ n.dataset[dk]=v[dk]; });
      else n.setAttribute(k, v);
    });
    if (children != null) append(n, children);
    return n;
  }
  function append(parent, children) {
    if (Array.isArray(children)) children.forEach(function (c) { append(parent, c); });
    else if (children instanceof Node) parent.appendChild(children);
    else if (children != null) parent.appendChild(document.createTextNode(String(children)));
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

  /* Arabischer Textbaustein */
  function ar(text, cls) {
    return el("span", { class: "ar" + (cls ? " " + cls : ""), text: text });
  }

  /* Toast */
  var toastTimer = null;
  function toast(msg) {
    var wrap = document.getElementById("toastWrap");
    clear(wrap);
    wrap.appendChild(el("div", { class: "toast", text: msg }));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { clear(wrap); }, 2200);
  }

  /* Sprech-Knopf */
  function speakButton(text, cls) {
    if (!AR.audio.available()) return document.createComment("no-audio");
    var b = el("button", {
      class: "speakbtn" + (cls ? " " + cls : ""), "aria-label": "Aussprechen",
      html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg>'
    });
    b.addEventListener("click", function (e) { e.stopPropagation(); AR.audio.speak(text); });
    return b;
  }

  /* Favoriten-Stern */
  function starButton(id, onToggle) {
    var b = el("button", { class: "starbtn" + (AR.store.isFav(id) ? " on" : ""),
      "aria-label": "Als Favorit markieren", type: "button",
      html: AR.store.isFav(id) ? "★" : "☆" });
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      var now = AR.store.toggleFav(id);
      b.classList.toggle("on", now);
      b.innerHTML = now ? "★" : "☆";
      toast(now ? "Zu Favoriten hinzugefügt ⭐" : "Aus Favoriten entfernt");
      if (onToggle) onToggle(now);
    });
    return b;
  }

  /* Status-Chip einer Karte */
  function statusChip(id) {
    var st = AR.store.status(id);
    if (st === "known") return el("span", { class: "chip", html: "✓ gekonnt" });
    if (st === "learning") return el("span", { class: "chip gold", html: "● am Lernen" });
    return el("span", { class: "chip", html: "○ neu" });
  }

  function progressBar(pct, cls) {
    return el("div", { class: "bar" + (cls ? " " + cls : "") },
      el("span", { style: "width:" + Math.max(0, Math.min(100, pct)) + "%" }));
  }

  /* ---------- Lernziel einstellen ---------- */
  /* Öffnet ein Blatt, in dem das Ziel frei gewählt werden kann.
     onSave wird nach dem Speichern aufgerufen (zum Neuzeichnen). */
  function goalSheet(onSave) {
    var store = AR.store;
    var max = AR.data.allCards().length;
    var cur = store.goal();

    var input = el("input", { type: "number", inputmode: "numeric", min: "1", max: String(max),
      step: "1", value: String(cur), style: "font-size:20px;font-weight:700;text-align:center" });

    var chips = el("div", { class: "row", style: "gap:8px;flex-wrap:wrap;justify-content:center" });
    var presets = [50, 100, 200, 300, max];
    presets.filter(function (n, i) { return n <= max && presets.indexOf(n) === i; })
      .forEach(function (n) {
        chips.appendChild(el("button", { class: "chip", type: "button",
          text: n === max ? "alle " + max : String(n),
          onclick: function () { input.value = String(n); input.focus(); } }));
      });

    var hint = el("div", { class: "muted", style: "font-size:13px;text-align:center" });
    function refreshHint() {
      var n = parseInt(input.value, 10);
      if (!isFinite(n) || n < 1) { hint.textContent = "Bitte eine Zahl ab 1 eingeben."; return; }
      var known = store.goalProgress(AR.data.allCards()).known;
      hint.textContent = known >= n
        ? "Du kannst schon " + known + " Wörter – Ziel wäre sofort erreicht."
        : "Noch " + (n - known) + " Wörter bis zum Ziel (" + known + " schon gekonnt).";
    }
    input.addEventListener("input", refreshHint);
    refreshHint();

    var body = el("div", { class: "stack" }, [
      el("div", { class: "muted", style: "font-size:14px;text-align:center",
        text: "Wie viele Wörter möchtest du sicher können?" }),
      input, chips, hint,
      el("button", { class: "btn btn-primary block", onclick: function () {
        var n = parseInt(input.value, 10);
        if (!isFinite(n) || n < 1) { toast("Bitte eine Zahl ab 1 eingeben"); return; }
        store.setGoal(Math.min(n, max));
        AR.app.closeSheet();
        toast("Ziel: " + store.goal() + " Wörter ✓");
        if (onSave) onSave(store.goal());
      } }, "Ziel speichern")
    ]);

    AR.app.sheet("Lernziel", body);
  }

  /* ---------- Arabische Bildschirmtastatur ---------- */
  var ROWS = [
    "ا ب ت ث ج ح خ د ذ ر ز س".split(" "),
    "ش ص ض ط ظ ع غ ف ق ك ل م".split(" "),
    "ن ه و ي ء ة ى أ إ آ ؤ ئ".split(" ")
  ];
  var HARAKAT = [
    { c: "َ", l: "َ" }, { c: "ُ", l: "ُ" }, { c: "ِ", l: "ِ" },
    { c: "ّ", l: "ّ" }, { c: "ْ", l: "ْ" }, { c: "ً", l: "ً" },
    { c: "ٌ", l: "ٌ" }, { c: "ٍ", l: "ٍ" }, { c: "ـ", l: "ـ" }
  ];

  function insertAtCursor(input, str) {
    var start = input.selectionStart, end = input.selectionEnd;
    if (start == null) { input.value += str; }
    else {
      input.value = input.value.slice(0, start) + str + input.value.slice(end);
      var pos = start + str.length;
      input.setSelectionRange(pos, pos);
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function backspace(input) {
    var start = input.selectionStart, end = input.selectionEnd;
    if (start == null) { input.value = input.value.slice(0, -1); }
    else if (start !== end) {
      input.value = input.value.slice(0, start) + input.value.slice(end);
      input.setSelectionRange(start, start);
    } else if (start > 0) {
      input.value = input.value.slice(0, start - 1) + input.value.slice(start);
      input.setSelectionRange(start - 1, start - 1);
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function arabicKeyboard(input) {
    // input darf ein Element ODER eine Funktion sein, die das aktive Feld liefert
    function T() { return typeof input === "function" ? input() : input; }
    var kbd = el("div", { class: "kbd" });
    ROWS.forEach(function (row) {
      var r = el("div", { class: "krow" });
      row.forEach(function (ch) {
        r.appendChild(mkKey(ch, "key", function () { var t = T(); if (t) insertAtCursor(t, ch); }));
      });
      kbd.appendChild(r);
    });
    // Harakat-Reihe
    var hr = el("div", { class: "krow" });
    HARAKAT.forEach(function (h) {
      hr.appendChild(mkKey(h.l, "key harakat", function () { var t = T(); if (t) insertAtCursor(t, h.c); }));
    });
    kbd.appendChild(hr);
    // Utility
    var ur = el("div", { class: "krow" });
    ur.appendChild(mkKey("Leer", "key util", function () { var t = T(); if (t) insertAtCursor(t, " "); }));
    ur.appendChild(mkKey("⌫", "key util", function () { var t = T(); if (t) backspace(t); }));
    ur.appendChild(mkKey("✓ fertig", "key util", function () { var t = T(); if (t) t.blur(); }));
    kbd.appendChild(ur);
    return kbd;
  }
  function mkKey(label, cls, fn) {
    var b = el("button", { class: cls, type: "button", text: label });
    b.addEventListener("mousedown", function (e) { e.preventDefault(); });
    b.addEventListener("click", function (e) { e.preventDefault(); fn(); });
    return b;
  }

  /* iOS-Installationsanleitung (Schritte) */
  function installSteps() {
    function step(n, node) {
      return el("div", { class: "row", style: "gap:10px;align-items:flex-start" }, [
        el("span", { class: "step-n", text: n }),
        el("div", { style: "flex:1", html: node })
      ]);
    }
    return el("div", { class: "stack", style: "gap:10px" }, [
      step(1, 'Öffne diese Seite in <b>Safari</b> und tippe unten auf das <b>Teilen-Symbol</b> ' +
              '<span class="ios-share">□↑</span> (Quadrat mit Pfeil nach oben).'),
      step(2, 'Wähle <b>„Zum Home-Bildschirm“</b> <span style="opacity:.7">(ggf. etwas nach unten scrollen)</span>.'),
      step(3, 'Oben rechts auf <b>„Hinzufügen“</b> tippen.'),
      el("div", { class: "muted", style: "font-size:13px", text: "Danach liegt „Arabisch“ als App auf dem Home-Bildschirm und öffnet im Vollbild – auch offline." })
    ]);
  }

  /* Session-Abschluss-Bildschirm */
  function doneScreen(opts) {
    return el("div", { class: "card center stack" }, [
      el("div", { class: "result-check", text: opts.emoji || "🎉" }),
      el("h2", { text: opts.title || "Geschafft!" }),
      el("p", { class: "muted", style: "white-space:pre-line", text: opts.subtitle || "" }),
      el("div", { class: "stack", style: "margin-top:8px" }, opts.buttons || [])
    ]);
  }

  AR.ui = {
    el: el, clear: clear, append: append, ar: ar, toast: toast,
    speakButton: speakButton, statusChip: statusChip, progressBar: progressBar,
    arabicKeyboard: arabicKeyboard, insertAtCursor: insertAtCursor,
    starButton: starButton, installSteps: installSteps, doneScreen: doneScreen,
    goalSheet: goalSheet
  };
})(window.AR);
