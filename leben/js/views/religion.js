/* Mīzān – Religion. Die Übersicht über alles, was hier zusammenkommt. */
var AnsichtReligion = (function () {
  "use strict";

  var wurzel = null, tag = null;

  function bereich(ziel, titel, arabisch, stand, anteil) {
    return UI.el("button.bereich", {
      type: "button", onclick: function () { location.hash = "#/" + ziel; }
    }, [
      UI.el("div.bkopf", [
        UI.el("span.bt", { text: titel }),
        UI.el("span.ar", { text: arabisch })
      ]),
      UI.el("div.bstand", { text: stand }),
      anteil == null ? null : UI.balken(anteil),
      UI.el("span.bpfeil", { text: "›" })
    ].filter(Boolean));
  }

  function zeichne() {
    if (!wurzel) return;
    var h = Hijri.fuer(new Date());
    var jetzt = new Date();

    var gemacht = Gebetszeiten.PFLICHT.filter(function (k) {
      return tag.gebete[k] && tag.gebete[k] !== "verpasst";
    }).length;
    var faellig = Gebetszeiten.faellig(jetzt).length;

    var d = Hifz.heuteDran();
    var f = Hifz.juzFortschritt();
    var fertig = Hifz.fertige();

    var adhkarStand = [];
    if (tag.dhikr.morgens) adhkarStand.push("Morgen ✓");
    if (tag.dhikr.abends) adhkarStand.push("Abend ✓");
    if (tag.dhikr.istighfar) adhkarStand.push(tag.dhikr.istighfar + "× Istighfār");
    if (tag.dhikr.salawat) adhkarStand.push(tag.dhikr.salawat + "× Salawāt");

    var qada = (Store.einstellungen.fasten && Store.einstellungen.fasten.qada) || 0;
    var fastenStand = tag.fasten ? "Heute gefastet"
      : (qada > 0 ? qada + " Nachholtage offen" : "Kein Fastentag");

    var score = Score.fuer(tag);

    UI.leeren(wurzel);
    wurzel.appendChild(UI.kopf("Religion", "45 % deines Tages", h.textAr));
    wurzel.appendChild(UI.el("div.inhalt", [

      UI.el("div.karte.scorekarte", [
        UI.ring((score.bereiche.religion || 0) / 100, score.bereiche.religion == null ? "–" : score.bereiche.religion),
        UI.el("div.smeta", [
          UI.el("div.st", { text: "Religion heute" }),
          UI.el("div.ss", { text: "Gebete, Qur'an, Adhkār, Akhlāq" })
        ])
      ]),

      bereich("gebete", "Gebete", "الصلاة",
        gemacht + " von " + (faellig || 5) + " gehalten" +
        (faellig < 5 ? " · " + (5 - faellig) + " stehen noch aus" : ""),
        faellig ? gemacht / faellig : 0),

      bereich("quran", "Qur'an", "القرآن",
        fertig.length + " Suren auswendig" +
        (f ? " · Juz' " + f.juz + " zu " + Math.round(f.anteil * 100) + " %" : "") +
        (d.neu ? " · lernt " + d.neu.de : ""),
        f ? f.anteil : null),

      bereich("adhkar", "Adhkār", "الأذكار",
        adhkarStand.length ? adhkarStand.join(" · ") : "Heute noch nichts",
        null),

      bereich("fasten", "Fasten", "الصيام", fastenStand, null),

      bereich("duas", "Duʿāʾ", "الدعاء",
        "Bittgebete der Propheten und aus der Sunnah", null),

      UI.el("div.karte.hinweis", [
        UI.el("div.hz", {
          text: "Akhlāq wird nicht hier erfasst, sondern abends bei der Muḥāsaba — drei wechselnde Fragen, damit du nicht blind durchhakst."
        })
      ])
    ]));
  }

  function oeffnen(root) {
    wurzel = root;
    return Promise.all([Store.tag(), Hifz.laden()]).then(function (r) {
      tag = r[0];
      zeichne();
    });
  }
  function schliessen() { wurzel = null; }

  return { oeffnen: oeffnen, schliessen: schliessen };
})();
