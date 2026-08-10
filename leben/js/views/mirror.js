/* Mīzān – Spiegel. Vorläufer der großen Auswertung aus Phase 7. */
var AnsichtSpiegel = (function () {
  "use strict";

  var wurzel = null, tage = [];

  function schnitt(liste) {
    var m = liste.filter(function (t) { return typeof t.score === "number"; });
    if (!m.length) return null;
    return Math.round(m.reduce(function (a, t) { return a + t.score; }, 0) / m.length);
  }

  function stufe(s) {
    if (s == null) return "leer";
    if (s >= 80) return "s4";
    if (s >= 60) return "s3";
    if (s >= 40) return "s2";
    return "s1";
  }

  function heatmap() {
    var karte = {};
    tage.forEach(function (t) { karte[t.datum] = t.score; });
    var felder = [];
    var heute = new Date();
    for (var i = 41; i >= 0; i--) {
      var d = new Date(heute.getTime() - i * 86400000);
      var k = Store.key(d);
      felder.push(UI.el("i.feld." + stufe(karte[k]), { title: k + (karte[k] != null ? " · " + karte[k] : "") }));
    }
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Die letzten sechs Wochen" }),
      UI.el("div.heat", felder),
      UI.el("div.legende", [
        UI.el("span", { text: "schwach" }),
        UI.el("i.feld.s1"), UI.el("i.feld.s2"), UI.el("i.feld.s3"), UI.el("i.feld.s4"),
        UI.el("span", { text: "stark" })
      ])
    ]);
  }

  function schnittKarte() {
    var s7 = schnitt(tage.slice(-7));
    var s30 = schnitt(tage.slice(-30));
    var diff = (s7 != null && s30 != null) ? s7 - s30 : null;
    return UI.el("div.karte.scorekarte", [
      UI.ring(s7 == null ? 0 : s7 / 100, s7 == null ? "–" : s7),
      UI.el("div.smeta", [
        UI.el("div.st", { text: "Schnitt der Woche" }),
        UI.el("div.ss", diff == null
          ? [UI.el("span", { text: "noch zu wenig Daten" })]
          : [
              UI.el("span" + (diff >= 0 ? ".hoch" : ".tief"), { text: (diff >= 0 ? "▲ " : "▼ ") + Math.abs(diff) }),
              UI.el("span", { text: " gegenüber dem Monat (" + s30 + ")" })
            ])
      ])
    ]);
  }

  function gebeteKarte() {
    var zaehler = { moschee: 0, puenktlich: 0, fenster: 0, spaet: 0, verpasst: 0, offen: 0 };
    var letzte = tage.slice(-30);
    letzte.forEach(function (t) {
      Gebetszeiten.PFLICHT.forEach(function (k) {
        var w = (t.gebete || {})[k];
        if (w) zaehler[w]++; else zaehler.offen++;
      });
    });
    var gesamt = letzte.length * 5 || 1;
    var reihen = [
      { k: "moschee", t: "In der Moschee", f: "jade" },
      { k: "puenktlich", t: "Pünktlich", f: "jade" },
      { k: "fenster", t: "Im Fenster", f: "jade-dim" },
      { k: "spaet", t: "Verspätet", f: "amber" },
      { k: "verpasst", t: "Verpasst", f: "rose" }
    ];
    return UI.el("div.karte", [
      UI.el("span.etikett", { text: "Gebete der letzten 30 Tage" }),
      UI.el("div.verteilung", reihen.map(function (r) {
        return UI.el("div.vz", [
          UI.el("span.vt", { text: r.t }),
          UI.el("div.vbalken", [UI.el("i.f-" + r.f, { style: "width:" + (zaehler[r.k] / gesamt * 100) + "%" })]),
          UI.el("span.vw", { text: String(zaehler[r.k]) })
        ]);
      }))
    ]);
  }

  /* Ein erster Zusammenhang – greift erst ab genug Tagen */
  function zusammenhang() {
    var mit = [], ohne = [];
    tage.forEach(function (t) {
      if (typeof t.score !== "number") return;
      var m = Gebetszeiten.PFLICHT.some(function (k) { return (t.gebete || {})[k] === "moschee"; });
      (m ? mit : ohne).push(t.score);
    });
    if (mit.length < 4 || ohne.length < 4) {
      return UI.el("div.karte.hinweis", [
        UI.el("div.hz", { text: "Zusammenhänge zeigt dir Mīzān, sobald genug Tage vorliegen. Mit dünner Datenlage würde sie raten — das tut sie nicht." })
      ]);
    }
    var a = Math.round(mit.reduce(function (x, y) { return x + y; }, 0) / mit.length);
    var b = Math.round(ohne.reduce(function (x, y) { return x + y; }, 0) / ohne.length);
    return UI.el("div.karte.held", [
      UI.el("span.etikett", { text: "Was die Daten sagen" }),
      UI.el("p.aurteil", {
        text: "An den " + mit.length + " Tagen, an denen du in der Moschee warst, lag dein Score bei " + a +
              ". An den " + ohne.length + " anderen bei " + b + "."
      })
    ]);
  }

  function zeichne() {
    if (!wurzel) return;
    UI.leeren(wurzel);
    var mit = tage.filter(function (t) { return typeof t.score === "number"; }).length;
    wurzel.appendChild(UI.kopf("Spiegel", mit + " erfasste Tage", "المرآة"));
    wurzel.appendChild(UI.el("div.inhalt", [
      schnittKarte(),
      heatmap(),
      gebeteKarte(),
      zusammenhang(),
      UI.el("p.fuss", { text: "Heatmaps über Jahre, Streaks und die vollständige Zusammenhangs-Analyse kommen in Phase 7." })
    ]));
  }

  function oeffnen(root) {
    wurzel = root;
    return Store.letzteTage(120).then(function (l) { tage = l; zeichne(); });
  }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
