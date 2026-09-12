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
    // Dieselbe Zahl wie „Heute" und wie das Abzeichen am Karten-Tab.
    // Vorher stand hier die Fälligkeit nur des eigenen Wortschatzes, direkt
    // neben einem Fortschritt, der über alle Karten rechnet – zwei Zahlen
    // mit verschiedenem Bezug in einer Karte.
    var due = AR.path.todayPlan().cards.length;
    var g = store.goalProgress(data.allCards());
    var streak = store.streak();

    var view = el("div", { class: "view home" });
    /* Zwei Spalten auf dem Tablet: links der Einstieg (Heute, Serie,
       Schnellzugriff), rechts Suche und Decks. Auf dem Handy stehen beide
       Blöcke wie bisher untereinander. */
    var oben = el("div", { class: "home-top" });
    var unten = el("div", { class: "home-main" });
    view.appendChild(oben); view.appendChild(unten);

    /* Der Weg: was heute dran ist */
    oben.appendChild(todayCard(main));

    /* Streak und eigenes Lernziel – kompakt, seit „Heute" den Einstieg macht */
    oben.appendChild(el("div", { class: "card stack", style: "margin-top:14px" }, [
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
          el("div", { class: "muted", style: "font-size:12px", text: "heute offen" })
        ])
      ]),
      ui.progressBar(g.pct),
      el("button", { class: "goal-line", "aria-label": "Lernziel ändern",
        onclick: function () { ui.goalSheet(function () { render(main); }); } }, [
        el("span", { class: "muted", style: "font-size:13px",
          text: g.reached ? ("🎉 Ziel erreicht: " + g.known + " Wörter gekonnt")
                          : (g.known + " von " + g.goal + " Wörtern gekonnt") }),
        el("span", { class: "row", style: "gap:6px" }, [
          el("span", { class: "muted", style: "font-size:13px", text: g.pct + "%" }),
          el("span", { class: "goal-edit", text: "Ziel ✎" })
        ])
      ])
    ]));

    /* iOS: Installations-Hinweis (einmal, ausblendbar) */
    if (AR.app.isIOS() && !AR.app.isStandalone() && !localStorage.getItem("installHintDismissed")) {
      oben.appendChild(installHint());
    }

    /* Schnellzugriff – der große Einstieg sitzt jetzt oben in „Heute“ */
    var quick = el("div", { class: "row", style: "gap:10px;margin-top:10px" }, [
      el("button", { class: "btn block", onclick: function () { AR.app.setDeck("mine"); AR.app.go("flashcards"); } }, "🃏 Karten"),
      el("button", { class: "btn block", onclick: function () { AR.app.setDeck("mine"); AR.app.go("quiz"); } }, "🎯 Quiz"),
      el("button", { class: "btn block", onclick: function () { AR.app.go("sentences"); } }, "💬 Sätze")
    ]);
    oben.appendChild(quick);

    /* Globale Suche */
    var search = el("input", { type: "search", enterkeyhint: "search",
      placeholder: "🔍 Vokabel suchen (Deutsch oder Arabisch)…", style: "margin-top:16px" });
    var body = el("div", {});
    search.addEventListener("input", function () {
      var q = search.value.trim();
      if (q.length >= 1) renderResults(body, q);
      else renderDefault(body, mine, mineCards, c);
    });
    unten.appendChild(search);
    unten.appendChild(body);
    renderDefault(body, mine, mineCards, c);

    AR.ui.clear(main).appendChild(view);
  }

  /* ---------- Heute ----------
     Drei Größen, weil die verfügbare Zeit stark schwankt. Die kleinste
     hält den Fortschritt allein schon am Leben – ohne schlechtes Gewissen
     an Tagen, an denen nicht mehr geht. */
  function todayCard(main) {
    var plan = AR.path.todayPlan();
    var card = el("div", { class: "card stack today-card" });

    card.appendChild(el("div", { class: "row", style: "justify-content:space-between" }, [
      el("span", { style: "font-weight:700", text: "☀️ Heute" }),
      plan.done ? el("span", { class: "chip accent", text: plan.done + " gelernt" }) : null
    ]));

    /* Größe wählen */
    var seg = el("div", { class: "seg pace-seg" });
    AR.path.paces().forEach(function (p) {
      var b = el("button", { class: AR.path.pace().id === p.id ? "active" : "", onclick: function () {
        AR.path.setPace(p.id);
        render(main);
      } }, [
        el("span", { text: p.label }),
        el("small", { text: "~" + p.minutes + " Min" })
      ]);
      seg.appendChild(b);
    });
    card.appendChild(seg);

    /* Was ist drin? */
    var parts = [];
    if (plan.reviews.length) parts.push(plan.reviews.length + " Wiederholungen");
    if (plan.fresh.length) parts.push(plan.fresh.length + " neue Wörter");
    var summary = parts.length ? parts.join(" · ") : "Nichts fällig – alles frisch.";
    card.appendChild(el("div", { class: "muted", style: "font-size:14px", text: summary }));

    if (plan.dueTotal > plan.reviews.length) {
      card.appendChild(el("div", { class: "muted", style: "font-size:12px",
        text: "Insgesamt " + plan.dueTotal + " fällig – der Rest wartet, nichts geht verloren." }));
    }

    if (plan.cards.length) {
      card.appendChild(el("button", { class: "btn btn-primary btn-lg block", onclick: function () {
        AR.app.setDeck("today"); AR.app.go("flashcards");
      } }, "▶  Los geht's"));
    } else {
      card.appendChild(el("button", { class: "btn block", onclick: function () {
        AR.app.setDeck("mine"); AR.app.go("flashcards");
      } }, "Trotzdem üben"));
    }

    /* Zieltermine */
    var goals = AR.path.goals();
    var gbox = el("div", { class: "goal-box" });
    goals.forEach(function (g) {
      gbox.appendChild(el("button", { class: "goal-row", onclick: function () {
        AR.app.go(g.id === "quran" ? "quran" : "stats");
      } }, [
        el("div", { class: "row", style: "justify-content:space-between;gap:8px" }, [
          el("span", { style: "font-size:13px;font-weight:600", text: g.label }),
          el("span", { class: "muted", style: "font-size:12px",
            text: g.known + " / " + g.target })
        ]),
        ui.progressBar(g.pct),
        el("div", { class: "row", style: "justify-content:space-between;gap:8px" }, [
          el("span", { class: "muted", style: "font-size:12px",
            text: g.reached ? (g.fehlt ? "🎉 alles Vorhandene gekonnt" : "🎉 erreicht")
                : g.vorbei ? "Termin ist vorbei"
                : "noch " + g.daysLeft + " Tage · " + g.perDay + " Wörter/Tag" }),
          el("span", { class: "chip " + (g.onTrack ? "accent" : "gold"),
            style: "font-size:11px;padding:3px 8px",
            text: g.reached ? "fertig" : (g.onTrack ? "im Plan" : "hinten dran") })
        ]),
        // Solange weniger Wörter im System stehen als geplant, soll das auch
        // dastehen – sonst wirkt der Balken wie ein gebrochenes Versprechen.
        g.fehlt ? el("div", { class: "muted", style: "font-size:11px",
          text: "Geplant sind " + g.geplant + " – " + g.fehlt + " davon kommen noch dazu." }) : null
      ]));
    });
    card.appendChild(gbox);

    return card;
  }

  function renderDefault(body, mine, mineCards, c) {
    AR.ui.clear(body);
    body.appendChild(el("div", { class: "section-title", text: "Decks" }));
    var grid = el("div", { class: "decks" });
    data.decks().forEach(function (d) {
      if (d.id === "mine" || d.id === "all") return;
      grid.appendChild(deckCard(d));
    });
    grid.insertBefore(featureDeck(mine, mineCards, c), grid.firstChild);
    if (store.favCount() > 0) grid.insertBefore(deckCard(data.deckById("fav")), grid.children[1] || null);
    grid.appendChild(deckCard(data.deckById("all")));
    body.appendChild(grid);

    /* Quran-Bereich – eigener Trakt, prominent über der Grammatik */
    var qc = data.quranCards();
    if (qc.length) {
      var q = store.counts(qc);
      var qpct = q.total ? Math.round(q.gekonnt / q.total * 100) : 0;
      body.appendChild(el("div", { class: "section-title", text: "Quran" }));
      body.appendChild(el("button", { class: "deck quran-entry", style: "width:100%",
        onclick: function () { AR.app.go("quran"); } }, [
        el("div", { class: "row", style: "justify-content:space-between" }, [
          el("span", { class: "emoji", text: "📖" }),
          el("span", { class: "badge", style: "background:rgba(255,255,255,.25);color:#fff",
            text: q.total + " Wörter" })
        ]),
        el("div", { class: "name", text: "Quran verstehen" }),
        ui.progressBar(qpct, ""),
        el("div", { class: "sub", text: q.gekonnt + " gekonnt · " +
          data.quranTexts().length + " Texte Wort für Wort" })
      ]));
    }

    body.appendChild(el("div", { class: "section-title", text: "Grammatik" }));
    body.appendChild(el("button", { class: "deck", style: "width:100%",
      onclick: function () { AR.app.go("grammar"); } }, [
      el("div", { class: "row" }, [
        el("span", { class: "emoji", text: "📖" }),
        el("div", {}, [
          el("div", { class: "name", text: "Verben konjugieren" }),
          el("div", { class: "sub", text: "Vergangenheit · Präsens · Zukunft · Befehlsform" })
        ])
      ])
    ]));
  }

  function renderResults(body, q) {
    AR.ui.clear(body);
    var ql = q.toLowerCase(), qbare = data.stripHarakat(q);
    // Auch die Quranwörter durchsuchen. Sie sind ein eigener Bereich, aber
    // wer ein Wort sucht, sucht das Wort – nicht den Bereich.
    var res = data.allCards().concat(data.quranCards()).filter(function (card) {
      return card.de.toLowerCase().indexOf(ql) >= 0 ||
        data.stripHarakat(card.fusha).indexOf(qbare) >= 0 || card.fusha.indexOf(q) >= 0;
    }).slice(0, 60);
    body.appendChild(el("div", { class: "section-title", text: res.length + (res.length === 60 ? "+ Treffer" : " Treffer") }));
    if (!res.length) {
      body.appendChild(el("div", { class: "empty" }, [ el("div", { class: "big", text: "🔍" }), el("p", { text: "Nichts gefunden." }) ]));
      return;
    }
    var list = el("div", { class: "card stack" });
    res.forEach(function (card) {
      list.appendChild(el("div", { class: "row", style: "justify-content:space-between;gap:10px;border-bottom:1px solid var(--border);padding-bottom:8px" }, [
        el("div", { style: "min-width:0" }, [
          el("div", { class: "row", style: "gap:6px" }, [
            el("span", { style: "font-weight:600", text: card.de }),
            data.isQuran(card) ? el("span", { class: "chip gold",
              style: "font-size:10px;padding:2px 7px", text: "Quran" }) : null
          ]),
          el("div", { class: "row", style: "gap:8px" }, [
            ui.ar(data.cardAr(card)),
            data.isVerb(card) ? ui.ar(data.arText(card.present), "") : document.createComment("x")
          ])
        ]),
        el("div", { class: "row", style: "gap:2px" }, [ ui.speakButton(card.fusha), ui.starButton(card.id) ])
      ]));
    });
    body.appendChild(list);
  }

  function installHint() {
    var card = el("div", { class: "card install-card stack", style: "margin-top:14px" });
    card.appendChild(el("div", { class: "row", style: "justify-content:space-between" }, [
      el("div", { class: "row", style: "gap:8px" }, [
        el("span", { style: "font-size:22px", text: "📲" }), el("b", { text: "Als App installieren" })
      ]),
      el("button", { class: "iconbtn", style: "width:32px;height:32px", text: "✕",
        onclick: function () { localStorage.setItem("installHintDismissed", "1"); render(document.getElementById("main")); } })
    ]));
    card.appendChild(ui.installSteps());
    return card;
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
