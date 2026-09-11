/* ============================================================
   views/quran.js – Quran-Bereich: Wortschatz nach Stufen,
   Suren und Gebetstexte Wort für Wort
   ============================================================ */
window.AR = window.AR || {};
AR.views = AR.views || {};
(function (AR) {
  "use strict";
  var el = AR.ui.el, ui = AR.ui, store = AR.store, data = AR.data;

  /* -------------------- Übersicht -------------------- */
  function render(main) {
    var cards = data.quranCards();
    var c = store.counts(cards);
    var pct = c.total ? Math.round(c.gekonnt / c.total * 100) : 0;

    var view = el("div", { class: "view" });
    view.appendChild(el("h2", { text: "📖 Quran verstehen" }));

    /* Fortschritt insgesamt */
    view.appendChild(el("div", { class: "card stack" }, [
      el("div", { class: "row", style: "justify-content:space-between" }, [
        el("span", { style: "font-weight:600", text: "Wortschatz" }),
        el("span", { class: "muted", text: c.gekonnt + " / " + c.total })
      ]),
      ui.progressBar(pct),
      el("div", { class: "muted", style: "font-size:13px",
        text: coverageHint(c.gekonnt) })
    ]));

    /* Stufen */
    view.appendChild(el("div", { class: "section-title", text: "Nach Stufen lernen" }));
    var levels = data.quranLevels();
    var wrap = el("div", { class: "card stack" });
    levels.forEach(function (lv) {
      var deckId = "quran:" + lv.level;
      var lc = store.counts(data.deckById(deckId).cards());
      var lpct = lc.total ? Math.round(lc.gekonnt / lc.total * 100) : 0;
      wrap.appendChild(el("button", { class: "qlevel", onclick: function () {
        AR.app.setDeck(deckId); AR.app.go("flashcards");
      } }, [
        el("div", { class: "row", style: "justify-content:space-between;gap:10px" }, [
          el("div", { style: "min-width:0;text-align:left" }, [
            el("div", { style: "font-weight:650" }, "Stufe " + lv.level + " · " + lv.name),
            el("div", { class: "muted", style: "font-size:13px",
              text: lc.gekonnt + " von " + lv.count + " gekonnt" })
          ]),
          el("span", { class: "chip" + (lpct === 100 ? " accent" : ""), text: lpct + "%" })
        ]),
        ui.progressBar(lpct)
      ]));
    });
    view.appendChild(wrap);

    /* Texte */
    var texts = data.quranTexts();
    var suras = texts.filter(function (t) { return t.kind === "sura"; });
    var adhkar = texts.filter(function (t) { return t.kind === "dhikr"; });

    view.appendChild(el("div", { class: "section-title", text: "Suren Wort für Wort" }));
    view.appendChild(textList(suras));

    if (adhkar.length) {
      view.appendChild(el("div", { class: "section-title", text: "Was du im Gebet sprichst" }));
      view.appendChild(textList(adhkar));
    }

    AR.ui.clear(main).appendChild(view);
  }

  function coverageHint(known) {
    if (known >= 600) return "Damit erkennst du rund 80 % aller Wörter im Quran-Text.";
    if (known >= 300) return "Damit erkennst du rund 70 % aller Wörter im Quran-Text.";
    if (known >= 150) return "Weiter so – ab 300 Wörtern erkennst du rund 70 % des Textes.";
    if (known > 0) return "Jedes Wort zählt. Die ersten 300 decken rund 70 % des Textes ab.";
    return "Die 300 häufigsten Wörter decken rund 70 % aller Wortvorkommen ab.";
  }

  function textList(list) {
    var box = el("div", { class: "card stack" });
    list.forEach(function (t) {
      box.appendChild(el("button", { class: "qtext", onclick: function () {
        AR.app.openQuranText(t.id);
      } }, [
        el("div", { class: "row", style: "justify-content:space-between;gap:10px" }, [
          el("div", { style: "min-width:0;text-align:left" }, [
            el("div", { style: "font-weight:650", text: t.nameDe }),
            el("div", { class: "muted", style: "font-size:13px",
              text: t.ayat.length + (t.kind === "sura" ? " Verse" : " Abschnitte") })
          ]),
          ui.ar(t.name, "qtext-ar")
        ])
      ]));
    });
    return box;
  }

  /* -------------------- Ein Text Wort für Wort -------------------- */
  function renderText(main, id) {
    var t = data.quranTextById(id);
    if (!t) { render(main); return; }

    var view = el("div", { class: "view" });
    view.appendChild(el("button", { class: "link", style: "margin-bottom:10px",
      onclick: function () { AR.app.go("quran"); }, text: "‹ Zurück" }));

    view.appendChild(el("div", { class: "card center stack" }, [
      ui.ar(t.name, "qtitle-ar"),
      el("div", { style: "font-weight:650", text: t.nameDe }),
      t.nr ? el("div", { class: "muted", style: "font-size:13px",
        text: "Sure " + t.nr + " · " + t.ayat.length + " Verse" }) : null,
      t.note ? el("div", { class: "muted", style: "font-size:13px", text: t.note }) : null
    ]));

    view.appendChild(el("div", { class: "muted", style: "font-size:13px;text-align:center;margin:12px 0 6px",
      text: "Tippe ein Wort an, um seine Bedeutung zu sehen." }));

    t.ayat.forEach(function (a) {
      view.appendChild(ayaBlock(t, a));
    });

    AR.ui.clear(main).appendChild(view);
  }

  function ayaBlock(t, a) {
    var line = el("div", { class: "aya-ar" });
    a.words.forEach(function (w) {
      var b = el("button", { class: "aya-word", type: "button",
        onclick: function () { wordSheet(w); } }, ui.ar(w.ar));
      line.appendChild(b);
    });
    return el("div", { class: "card aya" }, [
      el("div", { class: "row", style: "justify-content:space-between;align-items:flex-start;gap:8px" }, [
        el("span", { class: "aya-nr", text: a.nr }),
        ui.speakButton(a.ar)
      ]),
      line,
      el("div", { class: "aya-de", text: a.de })
    ]);
  }

  /* Wort angetippt: Bedeutung, Wurzel, Grundform */
  function wordSheet(w) {
    var rows = el("div", { class: "stack" });
    rows.appendChild(el("div", { class: "center stack", style: "gap:6px" }, [
      ui.ar(w.ar, "qword-ar"),
      el("div", { style: "font-size:18px;font-weight:650", text: w.de })
    ]));

    var info = el("div", { class: "card stack", style: "gap:8px" });
    if (w.lemma) {
      info.appendChild(infoRow("Grundform", ui.ar(w.lemma, "qinfo-ar")));
    }
    if (w.root && w.root !== "—") {
      info.appendChild(infoRow("Wurzel", ui.ar(w.root, "qinfo-ar")));
    }
    if (info.childNodes.length) rows.appendChild(info);

    rows.appendChild(ui.speakButton(w.ar));

    // Verweis auf die Vokabel, falls es eine gibt
    var card = w.word ? data.quranWordById(w.word) : (w.vocab ? data.byId(w.vocab) : null);
    if (card) {
      var st = store.status(card.id);
      rows.appendChild(el("div", { class: "row", style: "justify-content:center;gap:8px" }, [
        ui.statusChip(card.id),
        el("span", { class: "muted", style: "font-size:13px",
          text: w.word ? "im Quran-Wortschatz" : "im Alltagswortschatz" })
      ]));
    } else if (w.name) {
      rows.appendChild(el("div", { class: "muted center", style: "font-size:13px", text: "Eigenname" }));
    }

    AR.app.sheet("", rows);
  }

  function infoRow(label, node) {
    return el("div", { class: "row", style: "justify-content:space-between;gap:12px" }, [
      el("span", { class: "muted", style: "font-size:13px", text: label }), node
    ]);
  }

  AR.views.quran = { render: render, renderText: renderText };
})(window.AR);
