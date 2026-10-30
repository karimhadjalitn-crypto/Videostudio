/* ============================================================
   views/settings.js – Einstellungen, Korrekturen, Daten
   ============================================================ */
window.AR = window.AR || {};
AR.views = AR.views || {};
(function (AR) {
  "use strict";
  var el = AR.ui.el, ui = AR.ui, store = AR.store, data = AR.data;

  function render(main) {
    var view = el("div", { class: "view" });
    view.appendChild(el("div", { class: "back-bar" }, [
      el("span", {}),
      el("button", { class: "navlink strong", onclick: function () { AR.app.back(); }, text: "Fertig" })
    ]));
    view.appendChild(ui.largeTitle("Einstellungen"));

    /* Quran-Lernplan */
    view.appendChild(el("div", { class: "section-title", text: "Quran-Lernplan" }));
    var cq = el("div", { class: "card" });
    cq.appendChild(el("div", { class: "setting" }, [
      el("div", {}, [
        el("div", { class: "s-l", text: "Neue Wörter pro Tag" }),
        el("div", { class: "s-d", text: "Gilt ab sofort, auch für heute" })
      ]),
      stepper(AR.qplan.dailyNew(), 1, 30, function (n) { store.set("dailyNew", n); })
    ]));
    var dateIn = el("input", { type: "date", class: "date-in", value: store.get("qStart") || "" });
    dateIn.addEventListener("change", function () {
      if (dateIn.value) { store.set("qStart", dateIn.value); ui.toast("Startdatum gespeichert"); }
    });
    cq.appendChild(el("div", { class: "setting" }, [
      el("div", {}, [
        el("div", { class: "s-l", text: "Erster Lerntag" }),
        el("div", { class: "s-d", text: "Ab diesem Tag gibt es täglich neue Wörter" })
      ]),
      dateIn
    ]));
    view.appendChild(cq);

    /* Darstellung */
    view.appendChild(el("div", { class: "section-title", text: "Darstellung" }));
    var card1 = el("div", { class: "card" });
    card1.appendChild(labelRow("Design", segControl("theme",
      [["system", "Automatisch"], ["light", "Hell"], ["dark", "Dunkel"]])));
    view.appendChild(card1);

    /* Karten im Alltagsteil */
    view.appendChild(el("div", { class: "section-title", text: "Alltagsarabisch (unter „Mehr“)" }));
    var card2 = el("div", { class: "card" });
    card2.appendChild(labelRow("Abfrage-Richtung", segControl("direction",
      [["mix", "Gemischt"], ["de2ar", "DE→AR"], ["ar2de", "AR→DE"]])));
    card2.appendChild(toggleRow("Sprechform anzeigen", "„Nah an Fuṣḥā“ unter den Karten", "showSpoken"));
    card2.appendChild(toggleRow("Vokalzeichen (Harakat)", "Abschalten für Lese-Herausforderung", "showHarakat"));
    // Sitzungsgröße
    var sizeSel = el("select", {}, [10, 15, 20, 30, 50].map(function (n) {
      var o = el("option", { value: n, text: n + " Karten" }); if (store.get("sessionSize") === n) o.selected = true; return o;
    }));
    sizeSel.addEventListener("change", function () { store.set("sessionSize", parseInt(sizeSel.value, 10)); });
    card2.appendChild(el("div", { class: "setting" }, [
      el("div", {}, [el("div", { class: "s-l", text: "Karten pro Sitzung" })]),
      el("div", { style: "width:130px" }, sizeSel)
    ]));
    // Lernziel
    card2.appendChild(el("div", { class: "setting" }, [
      el("div", {}, [
        el("div", { class: "s-l", text: "Lernziel" }),
        el("div", { class: "s-d", text: "So viele Wörter willst du sicher können" })
      ]),
      el("button", { class: "chip accent", text: store.goal() + " Wörter  ✎",
        onclick: function () { ui.goalSheet(function () { render(main); }); } })
    ]));
    view.appendChild(card2);

    /* Gemeldete Fehler */
    var issues = store.issues();
    if (issues.length) {
      view.appendChild(el("div", { class: "section-title", text: "Von dir gemeldet (" + issues.length + ")" }));
      var ic = el("div", { class: "card stack" });
      ic.appendChild(el("p", { class: "muted", style: "font-size:13px",
        text: "Diese Karten hast du als fehlerhaft markiert. Schick mir die Liste, dann korrigiere ich sie." }));
      issues.forEach(function (x, i) {
        ic.appendChild(el("div", { class: "issue-row" }, [
          el("div", { class: "txt" }, [
            el("div", { style: "font-weight:600" }, [x.de + "  ", ui.ar(x.fusha)]),
            el("div", { class: "what", text: x.text || "ohne Beschreibung" })
          ]),
          el("button", { class: "iconbtn", style: "width:34px;height:34px;flex:none", text: "✕",
            onclick: function () { store.deleteIssue(i); render(main); } })
        ]));
      });
      ic.appendChild(el("button", { class: "btn block", style: "margin-top:6px", onclick: function () {
        var t = store.issuesAsText();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(t).then(function () { ui.toast("Liste kopiert ✓"); },
                                                function () { AR.app.sheet("Gemeldete Fehler", el("textarea", { text: t, style: "min-height:200px" })); });
        } else {
          AR.app.sheet("Gemeldete Fehler", el("textarea", { text: t, style: "min-height:200px" }));
        }
      } }, "📋 Liste kopieren"));
      view.appendChild(ic);
    }

    /* Korrekturen an Karims Liste */
    var changes = (data.meta.changes || []);
    if (changes.length) {
      view.appendChild(el("div", { class: "section-title", text: "Korrekturen an deiner Liste (" + changes.length + ")" }));
      var cc = el("div", { class: "card stack" });
      cc.appendChild(el("p", { class: "muted", style: "font-size:13px", text: "Kleine Tippfehler, die ich gegen das Lehrbuch korrigiert habe:" }));
      changes.forEach(function (ch) {
        cc.appendChild(el("div", { class: "row", style: "justify-content:space-between;gap:8px;border-bottom:1px solid var(--border);padding-bottom:6px" }, [
          el("div", { style: "min-width:0" }, [
            el("div", { style: "font-weight:600", text: ch.de }),
            el("div", { class: "row", style: "gap:8px" }, [
              ui.ar(ch.old), el("span", { class: "muted", text: "→" }), ui.ar(ch.new)
            ])
          ]),
          el("span", { class: "chip", style: "font-size:11px", text: ch.why })
        ]));
      });
      view.appendChild(cc);
    }

    /* Daten */
    view.appendChild(el("div", { class: "section-title", text: "Daten & Fortschritt" }));
    var card3 = el("div", { class: "card stack" });
    card3.appendChild(el("button", { class: "btn block", onclick: exportProgress }, "⬇︎ Fortschritt sichern (Datei)"));
    var imp = el("input", { type: "file", accept: "application/json,.json", style: "display:none" });
    imp.addEventListener("change", function () {
      var f = imp.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try { store.importData(String(r.result)); ui.toast("Fortschritt wiederhergestellt ✓"); render(main); }
        catch (e) { ui.toast("Datei konnte nicht gelesen werden"); }
      };
      r.readAsText(f);
    });
    card3.appendChild(el("button", { class: "btn block", onclick: function () { imp.click(); } }, "⬆︎ Fortschritt laden"));
    card3.appendChild(imp);
    card3.appendChild(el("button", { class: "btn block", style: "color:var(--danger)",
      onclick: function () {
        if (confirm("Wirklich den Quran-Fortschritt zurücksetzen? Gelernte Wörter und Grammatik-Ergebnisse gehen verloren.")) {
          store.resetQuran(); ui.toast("Quran-Fortschritt zurückgesetzt"); render(main);
        }
      } }, "Quran-Fortschritt zurücksetzen"));
    card3.appendChild(el("button", { class: "btn block", style: "color:var(--danger)",
      onclick: function () {
        if (confirm("Wirklich den Fortschritt im Alltagsteil zurücksetzen? (Deine hinzugefügten Wörter bleiben erhalten.)")) {
          store.resetProgress(); ui.toast("Fortschritt zurückgesetzt"); render(main);
        }
      } }, "Alltags-Fortschritt zurücksetzen"));
    view.appendChild(card3);

    /* Installation */
    view.appendChild(el("div", { class: "section-title", text: "App installieren" }));
    var inst = el("div", { class: "card stack" });
    if (AR.app.isStandalone()) {
      inst.appendChild(el("div", { class: "row", style: "gap:8px" }, [
        el("span", { style: "font-size:20px", text: "✅" }), el("b", { text: "Läuft bereits als installierte App" })
      ]));
    } else {
      inst.appendChild(ui.installSteps());
    }
    view.appendChild(inst);

    /* Über */
    var m = data.meta.counts || {};
    view.appendChild(el("div", { class: "section-title", text: "Über" }));
    var qm = (window.QVOCAB && window.QVOCAB.meta) || {};
    view.appendChild(el("div", { class: "card muted", style: "font-size:13px" }, [
      el("p", { text: "Quran-Wortschatz: " + AR.qplan.words().length + " Wörter, sortiert nach Häufigkeit im Quran." }),
      qm.sources ? el("p", { text: "Quellen: " + qm.sources }) : null,
      el("p", { text: "Arabische Schrift: KFGQPC Uthmanic Script Hafs (King Fahd Glorious Quran Printing Complex)." }),
      el("p", { text: "Alltagsteil: " + (m.vocab_total || 0) + " Vokabeln · " + (m.sentences || 0) + " Satzmuster · " +
        (m.idioms || 0) + " Redewendungen." }),
      el("p", { text: "Dein Fortschritt wird nur lokal auf diesem Gerät gespeichert." })
    ]));

    AR.ui.clear(main).appendChild(view);
  }

  function labelRow(label, control) {
    return el("div", { class: "setting" }, [ el("div", { class: "s-l", text: label }), control ]);
  }
  function segControl(key, opts) {
    var seg = el("div", { class: "seg" });
    opts.forEach(function (o) {
      var b = el("button", { class: store.get(key) === o[0] ? "active" : "", text: o[1],
        onclick: function () {
          store.set(key, o[0]);
          Array.prototype.forEach.call(seg.children, function (x) { x.classList.remove("active"); });
          b.classList.add("active");
        } });
      seg.appendChild(b);
    });
    return seg;
  }
  /* Plus/Minus-Regler wie der iOS-Stepper */
  function stepper(value, min, max, onChange) {
    var n = value;
    var out = el("span", { class: "stepper-v", text: n });
    function setN(v) { n = Math.max(min, Math.min(max, v)); out.textContent = n; onChange(n); }
    return el("div", { class: "stepper" }, [
      el("button", { type: "button", "aria-label": "Weniger", text: "−", onclick: function () { setN(n - 1); } }),
      out,
      el("button", { type: "button", "aria-label": "Mehr", text: "+", onclick: function () { setN(n + 1); } })
    ]);
  }

  function toggleRow(title, desc, key) {
    var input = el("input", { type: "checkbox" });
    input.checked = !!store.get(key);
    input.addEventListener("change", function () { store.set(key, input.checked); });
    return el("div", { class: "setting" }, [
      el("div", {}, [ el("div", { class: "s-l", text: title }), el("div", { class: "s-d", text: desc }) ]),
      el("label", { class: "toggle" }, [ input, el("span", { class: "track" }) ])
    ]);
  }

  function exportProgress() {
    var blob = new Blob([store.exportData()], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = el("a", { href: url, download: "quran-wortschatz-fortschritt.json" });
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    ui.toast("Datei gespeichert");
  }

  AR.views.settings = { render: render };
})(window.AR);
