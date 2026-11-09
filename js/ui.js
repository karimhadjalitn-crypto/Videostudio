/* ============================================================
   ui.js – DOM-Helfer, Toast, iOS-Bausteine, Quran-Karte, arabische Tastatur
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

  /* ---------- iOS-Bausteine ---------- */
  var ICONS = {
    gear: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    chevron: '<svg viewBox="0 0 8 14" width="8" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };
  function icon(name) { return ICONS[name] || ""; }

  /* Großer Titel wie in iOS-Apps, optional mit Untertitel und Knopf rechts */
  function largeTitle(title, sub, right) {
    return el("header", { class: "large-title" }, [
      el("div", { class: "lt-text" }, [
        sub ? el("div", { class: "lt-sub", text: sub }) : null,
        el("h1", { text: title })
      ]),
      right || null
    ]);
  }
  /* Zurück-Zeile über Unterseiten */
  function backBar(label, onBack) {
    return el("div", { class: "back-bar" }, [
      el("button", { class: "navlink back", onclick: onBack }, [
        el("span", { class: "back-chev", html: ICONS.chevron }), label
      ])
    ]);
  }

  /* Gruppierte Liste (inset grouped) */
  function list(rows, header, footer) {
    var wrap = el("section", { class: "group" });
    if (header) wrap.appendChild(el("div", { class: "group-h", text: header }));
    wrap.appendChild(el("div", { class: "list" }, rows));
    if (footer) wrap.appendChild(el("div", { class: "group-f", text: footer }));
    return wrap;
  }
  /* Deutsch-arabischer Mischtext: die arabischen Stellen bekommen die
     Mushaf-Schrift und ihre eigene Leserichtung */
  var ARABIC_RUN = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]+(?:[\s،\/]+[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]+)*/g;
  function mixed(text, tag, cls) {
    var node = el(tag || "span", cls ? { class: cls } : null);
    var s = String(text || ""), last = 0, m;
    ARABIC_RUN.lastIndex = 0;
    while ((m = ARABIC_RUN.exec(s)) !== null) {
      if (m.index > last) node.appendChild(document.createTextNode(s.slice(last, m.index)));
      node.appendChild(ar(m[0], "inline-ar"));
      last = m.index + m[0].length;
    }
    if (last < s.length) node.appendChild(document.createTextNode(s.slice(last)));
    return node;
  }

  function listRow(opts) {
    var children = [];
    if (opts.icon) children.push(el("span", { class: "lr-icon", style: opts.iconBg ? "background:" + opts.iconBg : "", text: opts.icon }));
    children.push(el("div", { class: "lr-main" }, [
      mixed(opts.title, "div", "lr-t"),
      opts.sub ? mixed(opts.sub, "div", "lr-s") : null
    ]));
    if (opts.detail != null) children.push(el("span", { class: "lr-d", text: opts.detail }));
    if (opts.right) children.push(opts.right);
    if (opts.onclick) children.push(el("span", { class: "lr-chev", html: ICONS.chevron }));
    return el(opts.onclick ? "button" : "div", { class: "lr" + (opts.cls ? " " + opts.cls : ""),
      onclick: opts.onclick || null }, children);
  }

  /* Fortschrittsring */
  function ring(frac, label) {
    var r = 26, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, frac)));
    return el("div", { class: "ring", html:
      '<svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="' + r + '" class="ring-bg"/>' +
      '<circle cx="32" cy="32" r="' + r + '" class="ring-fg" stroke-dasharray="' + c.toFixed(1) +
      '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 32 32)"/></svg>' +
      '<span>' + label + '</span>' });
  }

  /* ---------- Quran-Vokabelkarte ----------
     Vorderseite: das Wort. Rückseite: Wort, Bedeutung und bei Verben
     Vergangenheit, Präsens und Masdar. Mehr steht bewusst nicht drauf. */
  function qcard(w, flipped, onFlip) {
    var card = el("div", { class: "qcard" + (flipped ? " flipped" : ""), role: "button",
      tabindex: "0", "aria-label": flipped ? "Karte" : "Karte umdrehen" });
    if (onFlip) card.addEventListener("click", function () { if (!flipped) onFlip(); });
    card.appendChild(ar(w.ar, "qc-ar"));
    if (!flipped) {
      card.appendChild(el("div", { class: "qc-hint", text: "Tippen zum Umdrehen" }));
      return card;
    }
    card.appendChild(el("div", { class: "qc-de", text: w.de }));
    if (w.type === "verb") card.appendChild(verbForms(w));
    return card;
  }
  function verbForms(w) {
    function cell(label, txt) {
      return el("div", { class: "vfc" }, [ el("small", { text: label }), ar(txt || "—", "vfc-ar") ]);
    }
    return el("div", { class: "qc-forms" }, [
      cell("Vergangenheit", w.past), cell("Präsens", w.present), cell("Masdar", w.masdar)
    ]);
  }

  /* Detailblatt zu einem Quranwort (aus der Wortliste) */
  function wordSheet(w) {
    var learned = AR.qplan.isLearned(w.id);
    AR.app.sheet(null, el("div", { class: "stack" }, [
      qcard(w, true),
      el("div", { class: "muted small center", text: (learned ? "✓ gelernt · " : "") +
        (w.list ? "Meine Liste · Gruppe " + w.group : w.count + "× im Quran · Rang " + w.rank) })
    ]));
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

  /* ---------- Fehler an einer Karte melden ----------
     Die Vokabeln sind aus Sprachwissen erzeugt, nicht gegen ein Wörterbuch
     geprüft. Was komisch aussieht, soll sofort markierbar sein. */
  function reportButton(card) {
    var b = el("button", { class: "reportbtn", type: "button",
      "aria-label": "Fehler an dieser Karte melden", text: "⚑" });
    b.addEventListener("click", function (e) { e.stopPropagation(); reportSheet(card); });
    return b;
  }

  function reportSheet(card) {
    var store = AR.store;
    var ta = el("textarea", { placeholder: "Was stimmt nicht? Kurz beschreiben – oder oben antippen.",
      style: "min-height:90px" });
    var choices = el("div", { class: "row", style: "gap:8px;flex-wrap:wrap" });
    ["Übersetzung falsch", "Vokalzeichen falsch", "Plural falsch", "Wort unüblich"].forEach(function (t) {
      choices.appendChild(el("button", { class: "chip", type: "button", text: t,
        onclick: function () { ta.value = ta.value ? ta.value + ", " + t : t; ta.focus(); } }));
    });

    AR.app.sheet("Fehler melden", el("div", { class: "stack" }, [
      el("div", { class: "row", style: "gap:8px;justify-content:center" }, [
        el("b", { text: card.de }), ar(card.fusha)
      ]),
      choices,
      ta,
      el("button", { class: "btn btn-primary block", onclick: function () {
        store.reportIssue(card, ta.value);
        AR.app.closeSheet();
        toast("Gemeldet ✓ – danke, ich schau's mir an");
      } }, "Melden")
    ]));
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
  /* Anleitung zum Installieren. Die Schritte unterscheiden sich je Gerät;
     bietet der Browser selbst einen Installationsdialog an (Chrome auf
     Android), gibt es stattdessen einen echten Knopf. */
  function installSteps() {
    function step(n, node) {
      return el("div", { class: "row", style: "gap:10px;align-items:flex-start" }, [
        el("span", { class: "step-n", text: n }),
        el("div", { style: "flex:1", html: node })
      ]);
    }
    var box = el("div", { class: "stack", style: "gap:10px" });

    if (AR.app.canInstall()) {
      box.appendChild(el("button", { class: "btn btn-primary btn-lg block",
        onclick: function () { AR.app.promptInstall(); } }, "📲  Jetzt installieren"));
      box.appendChild(el("div", { class: "muted", style: "font-size:13px",
        text: "Danach liegt „Quran“ als App auf dem Startbildschirm und öffnet im Vollbild – auch ohne Netz." }));
      return box;
    }

    if (AR.app.isIOS()) {
      box.appendChild(step(1, 'Öffne diese Seite in <b>Safari</b> und tippe unten auf das <b>Teilen-Symbol</b> ' +
        '<span class="ios-share">□↑</span> (Quadrat mit Pfeil nach oben).'));
      box.appendChild(step(2, 'Wähle <b>„Zum Home-Bildschirm“</b> <span style="opacity:.7">(ggf. etwas nach unten scrollen)</span>.'));
      box.appendChild(step(3, 'Oben rechts auf <b>„Hinzufügen“</b> tippen.'));
    } else {
      box.appendChild(step(1, 'Öffne diese Seite in <b>Chrome</b> und tippe oben rechts auf das <b>Menü</b> ' +
        '<span class="ios-share">⋮</span> (drei Punkte).'));
      box.appendChild(step(2, 'Wähle <b>„App installieren“</b> oder <b>„Zum Startbildschirm hinzufügen“</b>.'));
      box.appendChild(step(3, 'Mit <b>„Installieren“</b> bestätigen.'));
    }
    box.appendChild(el("div", { class: "muted", style: "font-size:13px",
      text: "Danach liegt „Quran“ als App auf dem Startbildschirm und öffnet im Vollbild – auch ohne Netz." }));
    return box;
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
    statusChip: statusChip, progressBar: progressBar,
    icon: icon, mixed: mixed, largeTitle: largeTitle, backBar: backBar, list: list, listRow: listRow,
    ring: ring, qcard: qcard, verbForms: verbForms, wordSheet: wordSheet,
    arabicKeyboard: arabicKeyboard, insertAtCursor: insertAtCursor,
    starButton: starButton, installSteps: installSteps, doneScreen: doneScreen,
    goalSheet: goalSheet, reportButton: reportButton, reportSheet: reportSheet
  };
})(window.AR);
