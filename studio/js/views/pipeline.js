/* Sūq – Pipeline.
   Jedes Video steht in genau einer Spalte. Was hier liegen bleibt, sieht
   man sofort — und das ist der ganze Zweck: nicht die fertigen Videos
   sind das Problem, sondern die neun, die auf halbem Weg stehen. */
var AnsichtPipeline = (function () {
  "use strict";

  var wurzel = null;
  var filter = "alle";

  function wocheZaehlen() {
    var grenze = new Date(Date.now() - 7 * 86400000).toISOString();
    return Store.videos().filter(function (v) {
      return v.gepostetAm && v.gepostetAm > grenze;
    }).length;
  }

  function karte(v) {
    var p = v.produktId ? Store.produkt(v.produktId) : null;
    var u = Halal.urteil(v, p);
    var dauer = Skript.gesamt(v);

    return UI.el("div.karte.videokarte", {
      onclick: function () { location.hash = "#/werkstatt?id=" + v.id; }
    }, [
      UI.el("div.vkopf", [
        UI.el("div.vt", [
          UI.el("span.vname", { text: v.titel || "Ohne Titel" }),
          UI.el("span.vprodukt", { text: p ? p.name : "kein Produkt" })
        ]),
        UI.el("span.marke." + u.klasse, { text: u.text })
      ]),
      UI.el("div.vmeta", [
        UI.el("span", { text: Store.STUFEN_NAME[v.stand] }),
        dauer ? UI.el("span", { text: UI.sek(dauer) }) : null,
        v.zahlen.views != null ? UI.el("span", { text: UI.zahl(v.zahlen.views) + " Views" }) : null,
        v.zahlen.provision ? UI.el("span.verdient", { text: UI.euro(v.zahlen.provision) }) : null
      ].filter(Boolean)),
      UI.el("div.vstand", Store.STUFEN.map(function (s, i) {
        var jetzt = Store.STUFEN.indexOf(v.stand);
        return UI.el("i" + (i <= jetzt ? ".an" : ""));
      }))
    ]);
  }

  function zeichne() {
    UI.leeren(wurzel);
    var alle = Store.videos();
    var woche = wocheZaehlen();
    var ziel = Store.einstellungen.ziel.videosProWoche;

    wurzel.appendChild(UI.kopf("Pipeline",
      alle.length ? UI.plural(alle.length, "Video", "Videos") : "",
      woche + " von " + ziel + " diese Woche"));

    var gefiltert = filter === "alle"
      ? alle
      : alle.filter(function (v) { return v.stand === filter; });

    /* Die Stufen als Filter, mit Anzahl daneben. Wo null steht, klemmt
       nichts; wo sich etwas staut, sieht man es an der Zahl. */
    var stufen = [{ wert: "alle", name: "Alle · " + alle.length }].concat(
      Store.STUFEN.map(function (s) {
        var n = alle.filter(function (v) { return v.stand === s; }).length;
        return { wert: s, name: Store.STUFEN_NAME[s] + " · " + n };
      })
    );

    wurzel.appendChild(UI.el("div.inhalt", [
      UI.el("div.knopfreihe", [
        UI.cta("Neues Video", {
          onclick: function () {
            var v = Store.leeresVideo(Store.neuId("v"), null);
            Store.videoSpeichern(v).then(function () {
              location.hash = "#/werkstatt?id=" + v.id;
            });
          }
        })
      ]),

      /* Der Wochenbalken ist bewusst nüchtern. Er lobt nicht und
         schimpft nicht, er zeigt nur, wo du stehst. */
      UI.karte("woche", [
        UI.el("div.wkopf", [
          UI.el("span.wt", { text: "Diese Woche gepostet" }),
          UI.el("span.wz", { text: woche + " / " + ziel })
        ]),
        UI.balken(ziel ? woche / ziel : 0)
      ]),

      UI.chips(stufen, filter, function (w) { filter = w; zeichne(); }, "umbruch"),

      gefiltert.length
        ? UI.el("div.videoliste", gefiltert.map(karte))
        : UI.karte("hinweis", [
            UI.el("div.hz", {
              text: filter === "alle"
                ? "Noch kein Video. Fang mit einem Produkt an, dann kommt das Skript fast von allein."
                : "In dieser Stufe liegt gerade nichts."
            })
          ])
    ]));
  }

  function oeffnen(root) { wurzel = root; zeichne(); }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
