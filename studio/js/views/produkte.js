/* Sūq – Produkte.
   Die Liste dessen, was du bewirbst, und der Bogen, aus dem später jedes
   Skript gespeist wird. Was hier fehlt, fehlt in jedem Video: ohne
   Merkmale kein Beweis, ohne Einwände keine Entkräftung.

   Die Freigabe des Sellers steht bewusst weit oben und nicht unter
   „Sonstiges“. Ohne sie sperrt der Wächter jedes Video zu diesem Produkt. */
var AnsichtProdukte = (function () {
  "use strict";

  var wurzel = null;
  var offenId = null;      // welches Produkt gerade aufgeklappt ist
  var adressen = [];       // Blob-Adressen, die beim Verlassen freigegeben werden

  function frei() {
    adressen.forEach(function (u) { URL.revokeObjectURL(u); });
    adressen = [];
  }

  /* ---------- Liste ---------- */
  function listeZeichnen() {
    var alle = Store.produkte();
    if (!alle.length) {
      return UI.karte("hinweis", [
        UI.el("div.hz", { text: "Noch kein Produkt angelegt." }),
        UI.el("div.hz", { text: "Leg das an, was du als Erstes bewerben willst. Alles andere hängt daran." })
      ]);
    }

    return UI.el("div.produktliste", alle.map(function (p) {
      var videos = Store.videosZu(p.id);
      var gepostet = videos.filter(function (v) { return v.stand === "gepostet"; }).length;
      var provision = videos.reduce(function (s, v) { return s + (v.zahlen.provision || 0); }, 0);

      return UI.el("div.karte.produkt" + (p.status !== "aktiv" ? ".ruht" : ""), {
        onclick: function () { location.hash = "#/produkt?id=" + p.id; }
      }, [
        UI.el("div.pkopf", [
          UI.el("div.pt", [
            UI.el("span.pname", { text: p.name || "Ohne Namen" }),
            UI.el("span.pkat", { text: p.kategorie })
          ]),
          !p.freigabe.erteilt
            ? UI.el("span.marke.sperre", { text: "keine Freigabe" })
            : (p.status !== "aktiv" ? UI.el("span.marke", { text: "ruht" }) : null)
        ].filter(Boolean)),
        UI.el("div.pzahlen", [
          zahlchen(UI.euro(p.preis), "Preis"),
          zahlchen(p.provisionProzent != null ? p.provisionProzent + " %" : "—", "Provision"),
          zahlchen(String(videos.length), videos.length === 1 ? "Video" : "Videos"),
          zahlchen(gepostet ? UI.euro(provision) : "—", "verdient")
        ])
      ]);
    }));
  }

  function zahlchen(wert, name) {
    return UI.el("div.zc", [
      UI.el("span.zcw", { text: wert }),
      UI.el("span.zcn", { text: name })
    ]);
  }

  /* ---------- Bogen ---------- */
  function bogen(p, neuzeichnen) {
    function setz(feld, wert) {
      var teile = feld.split(".");
      var ziel = p;
      for (var i = 0; i < teile.length - 1; i++) ziel = ziel[teile[i]];
      ziel[teile[teile.length - 1]] = wert;
      Store.produktSpeichern(p);
    }

    /* ---------- Listenfelder (Merkmale, Einwände) ----------
       Eine Zeile je Eintrag, letzte Zeile leer zum Weiterschreiben. */
    function liste(feld, titel, hinweis, platzhalter) {
      var werte = p[feld].slice();
      werte.push("");
      return UI.block(titel, werte.map(function (w, i) {
        var f = UI.el("input.feld.blank", {
          type: "text", value: w, placeholder: i === p[feld].length ? platzhalter : "",
          onchange: function () {
            var neu = p[feld].slice();
            if (i < neu.length) {
              if (f.value.trim()) neu[i] = f.value.trim();
              else neu.splice(i, 1);
            } else if (f.value.trim()) {
              neu.push(f.value.trim());
            }
            p[feld] = neu;
            Store.produktSpeichern(p).then(neuzeichnen);
          }
        });
        return UI.el("div.zeile.feldzeile", [
          UI.el("span.nr", { text: i < p[feld].length ? String(i + 1) : "+" }),
          f
        ]);
      }), UI.el("span.bhinweis", { text: hinweis }));
    }

    /* ---------- Fotos ---------- */
    var fotoRaster = UI.el("div.fotos");
    function fotosZeichnen() {
      UI.leeren(fotoRaster);
      p.fotos.forEach(function (f) {
        var kachel = UI.el("div.foto");
        Store.bildAdresse(f.id).then(function (url) {
          if (!url) return;
          adressen.push(url);
          kachel.appendChild(UI.el("img", { src: url, alt: f.name || "" }));
          kachel.appendChild(UI.el("button.fotoweg", {
            type: "button", "aria-label": "Foto entfernen",
            onclick: function (ev) {
              ev.stopPropagation();
              p.fotos = p.fotos.filter(function (x) { return x.id !== f.id; });
              Store.bildLoeschen(f.id);
              Store.produktSpeichern(p).then(fotosZeichnen);
            }
          }, "×"));
        });
        fotoRaster.appendChild(kachel);
      });

      var eingabe = UI.el("input", {
        type: "file", accept: "image/*", multiple: true,
        style: "display:none",
        onchange: function () {
          var dateien = Array.prototype.slice.call(eingabe.files || []);
          if (!dateien.length) return;
          Promise.all(dateien.map(function (d) {
            return Store.bildSpeichern(d, d.name);
          })).then(function (neue) {
            p.fotos = p.fotos.concat(neue);
            return Store.produktSpeichern(p);
          }).then(function () {
            eingabe.value = "";
            fotosZeichnen();
            UI.meldung(UI.plural(dateien.length, "Foto", "Fotos") + " hinzugefügt.");
          });
        }
      });
      fotoRaster.appendChild(UI.el("button.foto.neu", {
        type: "button", onclick: function () { eingabe.click(); }
      }, [UI.el("span", { text: "+" }), eingabe]));
    }
    fotosZeichnen();

    return UI.el("div.inhalt", [
      UI.block("Das Produkt", [
        UI.beschriftet("Name", UI.feld({
          wert: p.name, platzhalter: "z. B. Gebetsteppich mit Memory-Schaum",
          onchange: function (e) { setz("name", e.target.value); }
        })),
        UI.beschriftet("Kategorie", UI.auswahl({
          werte: Store.einstellungen.kategorien, wert: p.kategorie,
          onchange: function (e) { setz("kategorie", e.target.value); neuzeichnen(); }
        }), "Steuert Hooks, Szenen und die Wächterregeln."),
        UI.beschriftet("Seller", UI.feld({
          wert: p.seller, platzhalter: "Name des Shops",
          onchange: function (e) { setz("seller", e.target.value); }
        })),
        UI.beschriftet("Preis", UI.feld({
          wert: p.preis, typ: "number", inputmode: "decimal", platzhalter: "24,99",
          onchange: function (e) { setz("preis", e.target.value ? parseFloat(e.target.value) : null); }
        })),
        UI.beschriftet("Provision in Prozent", UI.feld({
          wert: p.provisionProzent, typ: "number", inputmode: "decimal", platzhalter: "15",
          onchange: function (e) {
            setz("provisionProzent", e.target.value ? parseFloat(e.target.value) : null);
            neuzeichnen();
          }
        }), p.preis && p.provisionProzent
          ? "Etwa " + UI.euro(p.preis * p.provisionProzent / 100) + " je Verkauf."
          : null),
        UI.beschriftet("Affiliate-Link", UI.feld({
          wert: p.link, platzhalter: "https://…",
          onchange: function (e) { setz("link", e.target.value); }
        }))
      ]),

      /* Die Freigabe ist kein Formularfeld unter vielen. Ohne sie
         sperrt der Wächter jedes Video zu diesem Produkt. */
      UI.el("div.block", [
        UI.el("div.blockkopf", { text: "Freigabe des Sellers" }),
        UI.el("div.gruppe", [
          UI.schalter(
            "Bildnutzung ist freigegeben",
            p.freigabe.erteilt,
            function (an) {
              p.freigabe.erteilt = an;
              p.freigabe.am = an ? new Date().toISOString() : null;
              Store.produktSpeichern(p).then(neuzeichnen);
            },
            p.freigabe.erteilt
              ? "Erteilt am " + UI.datum(p.freigabe.am)
              : "Ohne Freigabe sperrt der Wächter jedes Video zu diesem Produkt."
          ),
          p.freigabe.erteilt ? UI.el("div.zeile.feldzeile", [
            UI.el("input.feld.blank", {
              type: "text", value: p.freigabe.wie,
              placeholder: "Auf welchem Weg? z. B. Nachricht im TikTok-Backend, 12.08.",
              onchange: function (e) { setz("freigabe.wie", e.target.value); }
            })
          ]) : null
        ].filter(Boolean))
      ]),

      liste("merkmale", "Merkmale",
        "Je ein kurzer, überprüfbarer Satz. Daraus wird der Beweis im Skript.",
        "z. B. 8 mm Polsterung, rutschfeste Unterseite"),

      liste("einwaende", "Einwände",
        "Was hält jemanden vom Kauf ab? Genau das nimmt das Skript vorweg.",
        "z. B. „bestimmt rutschig“, „passt nicht in die Tasche“"),

      UI.el("div.block", [
        UI.el("div.blockkopf", [
          UI.el("span", { text: "Fotos" }),
          UI.el("span.bhinweis", { text: p.fotos.length + " vorhanden" })
        ]),
        fotoRaster
      ]),

      UI.block("Notiz", [
        UI.el("div.zeile.feldzeile", [
          UI.textfeld({
            wert: p.notiz, zeilen: 3,
            platzhalter: "Was dir sonst noch auffällt.",
            onblur: function (e) { setz("notiz", e.target.value); }
          })
        ])
      ]),

      UI.el("div.knopfreihe", [
        UI.cta("Video zu diesem Produkt", {
          onclick: function () {
            var v = Store.leeresVideo(Store.neuId("v"), p.id);
            v.titel = p.name;
            Store.videoSpeichern(v).then(function () {
              location.hash = "#/werkstatt?id=" + v.id;
            });
          }
        }),
        UI.knopf(p.status === "aktiv" ? "Pausieren" : "Wieder aufnehmen", {
          onclick: function () {
            setz("status", p.status === "aktiv" ? "pausiert" : "aktiv");
            neuzeichnen();
          }
        }),
        UI.knopf("Produkt löschen", {
          klasse: "gefahr",
          onclick: function () {
            UI.rueckfrage(
              "Produkt löschen?",
              "Die " + UI.plural(Store.videosZu(p.id).length, "Video", "Videos") +
              " und alle Fotos dazu werden mitgelöscht. Das lässt sich nicht rückgängig machen.",
              "Löschen"
            ).then(function (ja) {
              if (!ja) return;
              Store.produktLoeschen(p.id).then(function () {
                location.hash = "#/produkte";
              });
            });
          }
        })
      ]),

      Store.videosZu(p.id).length
        ? UI.block("Videos", Store.videosZu(p.id).map(function (v) {
            var u = Halal.urteil(v, p);
            return UI.zeile({
              text: v.titel || "Ohne Titel",
              dehnbar: true,
              wert: Store.STUFEN_NAME[v.stand],
              rechts: UI.el("span.marke." + u.klasse, { text: u.text }),
              onclick: function () { location.hash = "#/werkstatt?id=" + v.id; }
            });
          }))
        : null
    ].filter(Boolean));
  }

  /* ---------- Einstieg ---------- */
  function zeichneListe() {
    UI.leeren(wurzel);
    var alle = Store.produkte();
    var aktiv = alle.filter(function (p) { return p.status === "aktiv"; }).length;
    wurzel.appendChild(UI.kopf("Produkte",
      alle.length ? UI.plural(aktiv, "aktives Produkt", "aktive Produkte") : "",
      ""));
    wurzel.appendChild(UI.el("div.inhalt", [
      UI.cta("Produkt anlegen", {
        onclick: function () {
          var p = Store.leeresProdukt(Store.neuId("p"));
          Store.produktSpeichern(p).then(function () {
            location.hash = "#/produkt?id=" + p.id;
          });
        }
      }),
      listeZeichnen()
    ]));
  }

  function zeichneEines(id) {
    var p = Store.produkt(id);
    if (!p) { location.hash = "#/produkte"; return; }
    UI.leeren(wurzel);
    frei();
    wurzel.appendChild(UI.kopf(p.name || "Neues Produkt", p.kategorie, ""));
    wurzel.appendChild(bogen(p, function () { zeichneEines(id); }));
  }

  function param(name) {
    var teil = (location.hash.split("?")[1] || "");
    var treffer = teil.split("&").filter(function (x) { return x.indexOf(name + "=") === 0; })[0];
    return treffer ? decodeURIComponent(treffer.slice(name.length + 1)) : null;
  }

  function oeffnen(root) {
    wurzel = root;
    var id = param("id");
    if (id) zeichneEines(id); else zeichneListe();
  }

  function schliessen() { frei(); wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
