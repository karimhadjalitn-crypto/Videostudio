/* ============================================================
   views/woerter.js – Quran-Wortschatz nach Häufigkeit
   ============================================================ */
window.AR = window.AR || {};
AR.views = AR.views || {};
(function (AR) {
  "use strict";
  var el = AR.ui.el, ui = AR.ui, qp = AR.qplan, data = AR.data;

  var cat = 0;        // 0 = alle, sonst 1–4
  var query = "";

  function render(main) {
    var view = el("div", { class: "view" });
    view.appendChild(ui.largeTitle("Wörter", qp.words().length + " Wörter, nach Häufigkeit sortiert"));

    var search = el("input", { type: "search", class: "searchfield", enterkeyhint: "search",
      placeholder: "Suchen – Deutsch oder Arabisch", value: query });
    view.appendChild(search);

    var chips = el("div", { class: "chip-scroll" });
    [{ id: 0, name: "Alle" }].concat(qp.CATS).forEach(function (c) {
      var n = c.id ? qp.inCat(c.id).length : qp.words().length;
      chips.appendChild(el("button", { class: "fchip" + (cat === c.id ? " on" : ""),
        onclick: function () { cat = c.id; render(main); } }, [
        c.name, el("span", { class: "fchip-n", text: n })
      ]));
    });
    view.appendChild(chips);

    var info = el("div", { class: "group-f", style: "margin-top:-4px" });
    view.appendChild(info);
    var body = el("div", {});
    view.appendChild(body);

    function draw() {
      AR.ui.clear(body);
      var c = cat ? qp.CATS[cat - 1] : null;
      var words = cat ? qp.inCat(cat) : qp.words();
      var learned = words.filter(function (w) { return qp.isLearned(w.id); }).length;
      info.textContent = (c ? c.range + " im Quran · " : "") + learned + " von " + words.length + " gelernt";

      var q = query.trim().toLowerCase(), qb = arKeys(query.trim().replace(/^[ٱا]ل(?=..)/, ""))[0];
      if (q) {
        // Gesucht wird immer im ganzen Wortschatz, nicht nur in der gewählten Stufe
        info.textContent = "Suche in allen " + qp.words().length + " Wörtern";
        words = qp.words().filter(function (w) {
          if (w.de.toLowerCase().indexOf(q) >= 0) return true;
          if (!qb) return false;
          var k = arKeys(w.ar);
          return k[0].indexOf(qb) >= 0 || k[1].indexOf(qb) >= 0;
        });
      }
      if (!words.length) {
        body.appendChild(el("div", { class: "empty" }, [ el("p", { text: "Nichts gefunden." }) ]));
        return;
      }
      // In Blöcken zeichnen: 1000 Zeilen auf einmal ruckeln auf älteren iPhones
      var listEl = el("div", { class: "list words-list" });
      body.appendChild(el("section", { class: "group" }, listEl));
      var i = 0;
      function chunk() {
        var end = Math.min(words.length, i + 120);
        for (; i < end; i++) listEl.appendChild(row(words[i]));
        if (i < words.length) requestAnimationFrame(chunk);
      }
      chunk();
    }
    search.addEventListener("input", function () { query = search.value; draw(); });
    draw();
    AR.ui.clear(main).appendChild(view);
  }

  function row(w) {
    var learned = qp.isLearned(w.id);
    return el("button", { class: "lr word-row", onclick: function () { ui.wordSheet(w); } }, [
      el("span", { class: "wr-dot" + (learned ? " ok" : "") }),
      el("div", { class: "lr-main" }, [
        el("div", { class: "lr-t", text: w.de }),
        el("div", { class: "lr-s", text: w.count + "×" })
      ]),
      ui.ar(w.ar, "wr-ar")
    ]);
  }

  /* Für die Suche: uthmanische Schreibung auf Standardbuchstaben zurückführen.
     Zwei Schlüssel, weil das kleine Alif (ٰ) in normaler Schrift mal als
     Alif steht (كِتَٰب → كتاب), mal fehlt (رَحۡمَٰن → رحمن). */
  function arKeys(s) {
    var b = (s || "").replace(/ىٰ/g, "ى").replace(/[ٱأإآ]/g, "ا").replace(/[ىئ]/g, "ي")
      .replace(/ؤ/g, "و").replace(/ة/g, "ه").replace(/ـ/g, "");
    function clean(x) { return data.stripHarakat(x).replace(/[ۖ-ۭ]/g, "").replace(/\s+/g, ""); }
    // وٰ steht uthmanisch für ein Alif: صَلَوٰة → صلاة, زَكَوٰة → زكاة, حَيَوٰة → حياة
    var std = b.replace(/و([ً-ْۡ]*)ٰ/g, "ا$1");
    return [clean(b.replace(/ٰ/g, "")), clean(std.replace(/ٰ/g, "ا"))];
  }

  AR.views.woerter = { render: render };
})(window.AR);
