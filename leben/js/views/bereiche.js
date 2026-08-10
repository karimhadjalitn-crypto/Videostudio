/* Mīzān – Übersicht über alle Bereiche. */
var AnsichtBereiche = (function () {
  "use strict";

  var wurzel = null, tag = null, tage = [];

  function kachel(ziel, titel, arabisch, stand, anteil, gewicht) {
    return UI.el("button.bereich", {
      type: "button", onclick: function () { location.hash = "#/" + ziel; }
    }, [
      UI.el("div.bkopf", [
        UI.el("span.bt", { text: titel }),
        arabisch ? UI.el("span.ar", { text: arabisch }) : null,
        gewicht ? UI.el("span.bgew", { text: gewicht + " %" }) : null
      ].filter(Boolean)),
      UI.el("div.bstand", { text: stand }),
      anteil == null ? null : UI.balken(anteil),
      UI.el("span.bpfeil", { text: "›" })
    ].filter(Boolean));
  }

  function zeichne() {
    if (!wurzel) return;
    var e = Store.einstellungen;
    var h = Hijri.fuer(new Date());
    var w = e.gewichte;

    /* --- Stände zusammensuchen --- */
    var gemacht = Gebetszeiten.PFLICHT.filter(function (k) {
      return tag.gebete[k] && tag.gebete[k] !== "verpasst";
    }).length;

    var woche = tage.slice(-7).concat([tag]);
    var wocheTrainings = woche.filter(function (t) {
      return t.training && (t.training.arten || []).length;
    }).length;

    var letzterKontakt = {};
    tage.forEach(function (t) {
      Object.keys(t.kontakte || {}).forEach(function (n) {
        if (t.kontakte[n]) letzterKontakt[n] = t.datum;
      });
    });
    var faellig = (e.kontakte || []).filter(function (k) {
      if (tag.kontakte && tag.kontakte[k.name]) return false;
      var l = letzterKontakt[k.name];
      if (!l) return true;
      return Math.round((Store.ausKey(tag.datum) - Store.ausKey(l)) / 86400000) >= (k.intervall || 7);
    });

    var s = Score.fuer(tag, { wocheTrainings: wocheTrainings, letzterKontakt: letzterKontakt });

    var arten = (tag.training && tag.training.arten) || [];
    var supps = (e.essen.supplemente || []).filter(function (n) {
      return tag.essen && tag.essen.supplemente && tag.essen.supplemente[n];
    }).length;
    var wichtigste = (tag.arbeit && tag.arbeit.wichtigste) || [];
    var wErledigt = wichtigste.filter(function (x) { return x && x.erledigt; }).length;
    var videosWoche = woche.reduce(function (a, t) { return a + ((t.business && t.business.videos) || 0); }, 0);
    var ausgabenHeute = (tag.ausgaben || []).reduce(function (a, x) { return a + (x.betrag || 0); }, 0);
    var kaempfeAktiv = (e.kaempfe || []).filter(function (k) { return k.aktiv; }).length;

    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Bereiche", "Dein Tag in Teilen", h.textAr));
    wurzel.appendChild(UI.el("div.inhalt", [

      UI.el("div.karte.scorekarte", [
        UI.ring(s.wert / 100, s.wert),
        UI.el("div.smeta", [
          UI.el("div.st", { text: "Tagesscore" }),
          UI.el("div.ss", { text: s.tagZu ? "Tag abgeschlossen" : "läuft noch" })
        ])
      ]),

      kachel("religion", "Religion", "الدين",
        gemacht + " von 5 Gebeten · " + UI.plural(Hifz.fertige().length, "Sure", "Suren") + " auswendig",
        (s.bereiche.religion || 0) / 100, w.religion),

      kachel("arbeit", "Arbeit & Uni", null,
        wichtigste.length
          ? wErledigt + " von " + wichtigste.length + " Wichtigsten erledigt"
          : "Noch keine Tagesziele gesetzt",
        s.bereiche.produktivitaet == null ? null : s.bereiche.produktivitaet / 100, w.produktivitaet),

      kachel("koerper", "Körper & Sport", null,
        arten.length ? arten.join(", ") + " · " + wocheTrainings + "/" + e.sport.wochenziel + " diese Woche"
                     : wocheTrainings + " von " + e.sport.wochenziel + " Trainings diese Woche",
        wocheTrainings / (e.sport.wochenziel || 4), w.sport),

      kachel("schlaf", "Schlaf", null,
        tag.schlaf.bett ? "Bett " + tag.schlaf.bett + (tag.schlaf.auf ? " · auf " + tag.schlaf.auf : "")
                        : "Ziel: vor " + e.schlafZiel + " im Bett",
        s.bereiche.schlaf == null ? null : s.bereiche.schlaf / 100, w.schlaf),

      kachel("ernaehrung", "Ernährung", null,
        UI.zahl(tag.wasser || 0, 1).replace(".", ",") + " / " + UI.zahl(e.wasserZiel, 1) + " l Wasser · " +
        supps + " von " + e.essen.supplemente.length + " Supplementen",
        s.bereiche.ernaehrung == null ? null : s.bereiche.ernaehrung / 100, w.ernaehrung),

      kachel("soziales", "Soziales & Familie", "صلة الرحم",
        faellig.length ? faellig.map(function (k) { return k.name; }).join(", ") + " wären dran"
                       : "Alle im Takt",
        s.bereiche.soziales == null ? null : s.bereiche.soziales / 100, w.soziales),

      kachel("business", "Business", null,
        videosWoche + " von " + e.business.videoZielWoche + " Videos diese Woche",
        videosWoche / (e.business.videoZielWoche || 4), null),

      kachel("finanzen", "Finanzen", null,
        (ausgabenHeute > 0 ? UI.zahl(ausgabenHeute, 2).replace(".", ",") + " € heute" : "Heute nichts erfasst") +
        (tag.sadaqa > 0 ? " · Sadaqa " + UI.zahl(tag.sadaqa, 2).replace(".", ",") + " €" : ""),
        null, null),

      kachel("innen", "Innenleben", null,
        tag.stimmung ? "Stimmung erfasst" + ((tag.dankbar || []).length ? " · dankbar für " + tag.dankbar.length : "")
                     : "Heute noch nichts",
        s.bereiche.innen == null ? null : s.bereiche.innen / 100, w.innen),

      kachel("privat", "Geschützt", "🔒",
        kaempfeAktiv + (kaempfeAktiv === 1 ? " Kampf" : " Kämpfe") + " · Ehe & Familienplanung",
        null, null),

      UI.el("p.klein", {
        text: "Die Prozente zeigen, wie stark ein Bereich in deinen Tagesscore eingeht. Verschieben kannst du sie unter Mehr → Gewichtung."
      })
    ]));
  }

  function oeffnen(root) {
    wurzel = root;
    return Promise.all([Store.tag(), Store.letzteTage(30), Hifz.laden()]).then(function (r) {
      tag = r[0];
      tage = r[1].filter(function (t) { return t.datum !== tag.datum; });
      zeichne();
    });
  }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
