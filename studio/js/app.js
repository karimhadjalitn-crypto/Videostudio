/* Sūq – Router und Rahmen.
   Vier Reiter. Die Werkstatt und der Produktbogen hängen darunter —
   man kommt dorthin über etwas, das man angetippt hat, nicht über die
   Leiste. */
(function () {
  "use strict";

  var ANSICHTEN = {
    pipeline:      { titel: "Pipeline",  symbol: "▤", modul: function () { return AnsichtPipeline; } },
    produkte:      { titel: "Produkte",  symbol: "◫", modul: function () { return AnsichtProdukte; } },
    zahlen:        { titel: "Zahlen",    symbol: "◔", modul: function () { return AnsichtZahlen; } },
    einstellungen: { titel: "Mehr",      symbol: "⚙", modul: function () { return AnsichtEinstellungen; } },

    werkstatt: { titel: "Werkstatt", versteckt: true, reiter: "pipeline",
                 modul: function () { return AnsichtWerkstatt; } },
    produkt:   { titel: "Produkt", versteckt: true, reiter: "produkte",
                 modul: function () { return AnsichtProdukte; } }
  };

  var aktuell = null, wurzel, leiste;

  /* "#/werkstatt?id=v-1" -> "werkstatt" */
  function ziel() {
    var h = (location.hash || "").replace(/^#\/?/, "").split("?")[0].split("/")[0];
    return ANSICHTEN[h] ? h : "pipeline";
  }

  function zeichneLeiste(aktiv) {
    UI.leeren(leiste);
    Object.keys(ANSICHTEN).forEach(function (k) {
      var a = ANSICHTEN[k];
      if (a.versteckt) return;
      leiste.appendChild(UI.el("a.reiter" + (k === aktiv ? ".an" : ""), { href: "#/" + k }, [
        UI.el("span.ic", { text: a.symbol }),
        UI.el("span", { text: a.titel })
      ]));
    });
  }

  function wechseln() {
    var k = ziel();
    if (aktuell && aktuell.modul.schliessen) aktuell.modul.schliessen();
    var modul = ANSICHTEN[k].modul();
    aktuell = { key: k, modul: modul };
    zeichneLeiste(ANSICHTEN[k].reiter || (ANSICHTEN[k].versteckt ? null : k));
    UI.leeren(wurzel);
    window.scrollTo(0, 0);
    Promise.resolve(modul.oeffnen(wurzel)).catch(function (fehler) {
      wurzel.appendChild(UI.el("div.karte.hinweis", [
        UI.el("div.hz", { text: "Da ist etwas schiefgegangen: " + fehler.message })
      ]));
      if (window.console) console.error(fehler);
    });
  }

  function start() {
    wurzel = document.getElementById("app");
    leiste = document.getElementById("leiste");
    UI.themaAnwenden();

    window.addEventListener("hashchange", wechseln);
    wechseln();

    /* Erinnerung an die Sicherung. Hier hängen Produktfotos und Skripte
       daran — geht der Browser-Speicher verloren, ist alles weg. */
    var b = Store.einstellungen.letztesBackup;
    if (!b || (Date.now() - new Date(b).getTime()) > 7 * 86400000) {
      setTimeout(function () {
        UI.meldung("Denk an die Sicherung — unter „Mehr“.");
      }, 5000);
    }
  }

  Store.bereit().then(start).catch(function (fehler) {
    document.getElementById("app").appendChild(
      UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Der Speicher lässt sich nicht öffnen. Im privaten Modus von Safari " +
                "geht das nicht — bitte ein normales Fenster benutzen. (" + fehler.message + ")"
        })
      ])
    );
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").then(function (reg) {
        reg.addEventListener("updatefound", function () {
          var neu = reg.installing;
          if (!neu) return;
          neu.addEventListener("statechange", function () {
            if (neu.state === "installed" && navigator.serviceWorker.controller) {
              var m = UI.el("button.aktualisieren", {
                type: "button", onclick: function () { location.reload(); }
              }, "Neue Fassung bereit — tippen zum Laden");
              document.body.appendChild(m);
              requestAnimationFrame(function () { m.classList.add("an"); });
            }
          });
        });
      }).catch(function () { /* offline egal */ });
    });
  }
})();
