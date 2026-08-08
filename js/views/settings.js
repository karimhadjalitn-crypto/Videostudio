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
    view.appendChild(el("div", { class: "row", style: "justify-content:space-between" }, [
      el("h2", { text: "Einstellungen" }),
      el("button", { class: "link", onclick: function () { AR.app.go("home"); }, text: "Fertig" })
    ]));

    /* Darstellung */
    view.appendChild(el("div", { class: "section-title", text: "Darstellung" }));
    var card1 = el("div", { class: "card" });
    card1.appendChild(labelRow("Design", segControl("theme",
      [["system", "System"], ["light", "Hell"], ["dark", "Dunkel"]])));
    card1.appendChild(labelRow("Abfrage-Richtung", segControl("direction",
      [["mix", "Gemischt"], ["de2ar", "DE→AR"], ["ar2de", "AR→DE"]])));
    view.appendChild(card1);

    /* Karten */
    view.appendChild(el("div", { class: "section-title", text: "Karten" }));
    var card2 = el("div", { class: "card" });
    card2.appendChild(toggleRow("Sprechform anzeigen", "„Nah an Fuṣḥā“ unter den Karten", "showSpoken"));
    card2.appendChild(toggleRow("Vokalzeichen (Harakat)", "Abschalten für Lese-Herausforderung", "showHarakat"));
    var audioNote = AR.audio.available()
      ? (AR.audio.hasArabicVoice() ? "" : " (keine arabische Stimme auf diesem Gerät gefunden)")
      : " (nicht verfügbar)";
    card2.appendChild(toggleRow("Audio-Aussprache" + audioNote, "Tippe auf 🔊 zum Anhören", "audio"));
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
        if (confirm("Wirklich den gesamten Lernfortschritt zurücksetzen? (Deine hinzugefügten Wörter bleiben erhalten.)")) {
          store.resetProgress(); ui.toast("Fortschritt zurückgesetzt"); render(main);
        }
      } }, "Fortschritt zurücksetzen"));
    view.appendChild(card3);

    /* Installation */
    view.appendChild(el("div", { class: "section-title", text: "App installieren" }));
    var inst = el("div", { class: "card stack" });
    if (AR.app.isStandalone()) {
      inst.appendChild(el("div", { class: "row", style: "gap:8px" }, [
        el("span", { style: "font-size:20px", text: "✅" }), el("b", { text: "Läuft bereits als installierte App" })
      ]));
    } else if (AR.app.isIOS()) {
      inst.appendChild(ui.installSteps());
    } else {
      inst.appendChild(el("p", { class: "muted", style: "font-size:14px", text:
        "Im Browser-Menü „Zum Startbildschirm hinzufügen“ bzw. „App installieren“ wählen – dann läuft sie im Vollbild und offline." }));
    }
    view.appendChild(inst);

    /* Über */
    var m = data.meta.counts || {};
    view.appendChild(el("div", { class: "section-title", text: "Über" }));
    view.appendChild(el("div", { class: "card muted", style: "font-size:13px" }, [
      el("p", { text: "Arabisch lernen – Fuṣḥā & Sprechform." }),
      el("p", { text: (m.vocab_total || 0) + " Vokabeln · " + (m.sentences || 0) + " Satzmuster · " +
        (m.idioms || 0) + " Redewendungen." }),
      el("p", { text: "Dein Fortschritt wird nur lokal auf diesem Gerät gespeichert." })
    ]));

    AR.ui.clear(main).appendChild(view);
  }

  function labelRow(label, control) {
    return el("div", { class: "setting" }, [ el("div", { class: "s-l", text: label }), control ]);
  }
  function segControl(key, opts) {
    var seg = el("div", { class: "seg", style: "width:auto" });
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
    var a = el("a", { href: url, download: "arabisch-fortschritt.json" });
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    ui.toast("Datei gespeichert");
  }

  AR.views.settings = { render: render };
})(window.AR);
