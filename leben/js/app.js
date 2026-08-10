/* Mīzān – Router und Rahmen. */
(function () {
  "use strict";

  var ANSICHTEN = {
    heute:    { titel: "Heute",    symbol: "◆",   modul: function () { return AnsichtHeute; } },
    kalender: { titel: "Kalender", symbol: "▦",   modul: function () { return AnsichtKalender; } },
    religion: { titel: "Religion", symbol: "☰",   modul: function () { return AnsichtReligion; } },
    spiegel:  { titel: "Spiegel",  symbol: "◐",   modul: function () { return AnsichtSpiegel; } },
    mehr:     { titel: "Mehr",     symbol: "•••", modul: function () { return AnsichtMehr; } },

    gebete: { titel: "Gebete", versteckt: true, reiter: "religion",
              modul: function () { return AnsichtGebete; } },
    quran:  { titel: "Qur'an", versteckt: true, reiter: "religion",
              modul: function () { return AnsichtQuran; } },
    adhkar: { titel: "Adhkār", versteckt: true, reiter: "religion",
              modul: function () { return AnsichtAdhkar; } },
    fasten: { titel: "Fasten", versteckt: true, reiter: "religion",
              modul: function () { return AnsichtFasten; } },
    duas:   { titel: "Duʿāʾ",  versteckt: true, reiter: "religion",
              modul: function () { return AnsichtDuas; } },
    muhasaba:     { titel: "Muḥāsaba", versteckt: true, vollbild: true,
                    modul: function () { return AnsichtMuhasaba; } },
    erinnerungen: { titel: "Erinnerungen", versteckt: true, reiter: "kalender",
                    modul: function () { return AnsichtErinnerungen; } },
    "import":     { titel: "Übernahme", versteckt: true, reiter: "heute",
                    modul: function () { return AnsichtImport; } }
  };

  var aktuell = null, wurzel, leiste;

  /* "#/import?gebet=fajr" -> "import" */
  function ziel() {
    var h = (location.hash || "").replace(/^#\/?/, "").split("?")[0].split("/")[0];
    return ANSICHTEN[h] ? h : "heute";
  }

  function zeichneLeiste(aktiv) {
    UI.leeren(leiste);
    Object.keys(ANSICHTEN).forEach(function (k) {
      var a = ANSICHTEN[k];
      if (a.versteckt) return;
      leiste.appendChild(UI.el("a.reiter" + (k === aktiv ? ".an" : ""), {
        href: "#/" + k
      }, [
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
    // Die Muḥāsaba läuft im Vollbild; die anderen behalten die Leiste,
    // damit man nicht in einer Ansicht festsitzt.
    document.body.classList.toggle("ohne-leiste", !!ANSICHTEN[k].vollbild);
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
    UI.themaBeobachten();

    // Erstbefüllung des Hifz-Bestands beim allerersten Start
    var hifz = Store.einstellungen.hifz;
    if (!hifz.status || !Object.keys(hifz.status).length) {
      hifz.status = Hifz.grundbestand();
      Store.einstellungenSpeichern();
    }
    window.addEventListener("hashchange", wechseln);
    wechseln();

    // Tageswechsel um Mitternacht abfangen
    var tagKey = Store.key();
    setInterval(function () {
      if (Store.key() !== tagKey) { tagKey = Store.key(); wechseln(); }
    }, 60000);

    // Backup-Erinnerung: einmal pro Woche
    var b = Store.einstellungen.letztesBackup;
    if (!b || (Date.now() - new Date(b).getTime()) > 7 * 86400000) {
      setTimeout(function () {
        UI.meldung("Denk an die Sicherung — unter „Mehr“.");
      }, 4000);
    }
  }

  Store.bereit().then(start).catch(function (fehler) {
    document.getElementById("app").appendChild(
      UI.el("div.karte.hinweis", [
        UI.el("div.hz", { text: "Der Speicher lässt sich nicht öffnen. Im privaten Modus von Safari geht das nicht — bitte ein normales Fenster benutzen. (" + fehler.message + ")" })
      ])
    );
  });

  /* Eine PWA auf dem iPhone bleibt oft wochenlang offen. Ohne Hinweis
     merkt man nie, dass eine neue Fassung bereitliegt. */
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
