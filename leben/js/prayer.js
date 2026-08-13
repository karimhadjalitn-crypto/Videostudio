/* Mīzān – Gebetszeiten, offline berechnet.
   Bewusst nur ungefähr: die Autorität bleibt deine Gebetsapp.
   Diese Zeiten dienen den Erinnerungsfenstern. Pro Gebet gibt es
   in den Einstellungen einen Korrekturregler in Minuten. */
var Gebetszeiten = (function () {
  "use strict";

  var GRAD = Math.PI / 180;
  function sin(d) { return Math.sin(d * GRAD); }
  function cos(d) { return Math.cos(d * GRAD); }
  function tan(d) { return Math.tan(d * GRAD); }
  function asin(x) { return Math.asin(x) / GRAD; }
  function acos(x) { return Math.acos(x) / GRAD; }
  function atan2(y, x) { return Math.atan2(y, x) / GRAD; }
  function acot(x) { return Math.atan(1 / x) / GRAD; }
  function fix(a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; }
  function fixWinkel(a) { return fix(a, 360); }
  function fixStunde(a) { return fix(a, 24); }

  var METHODEN = {
    MWL:      { name: "Muslim World League",      fajr: 18,   isha: 17 },
    ISNA:     { name: "ISNA (Nordamerika)",       fajr: 15,   isha: 15 },
    Aegypten: { name: "Ägyptische Behörde",       fajr: 19.5, isha: 17.5 },
    Karachi:  { name: "Karachi",                  fajr: 18,   isha: 18 },
    Diyanet:  { name: "Diyanet (Türkei)",         fajr: 18,   isha: 17 },
    UmmAlQura:{ name: "Umm al-Qurā (Mekka)",      fajr: 18.5, isha: 90 } // isha = Minuten nach Maghrib
  };

  var NAMEN = {
    fajr:    { de: "Fajr",    ar: "الفجر" },
    sunrise: { de: "Shurūq",  ar: "الشروق" },
    dhuhr:   { de: "Ẓuhr",    ar: "الظهر" },
    asr:     { de: "ʿAṣr",    ar: "العصر" },
    maghrib: { de: "Maghrib", ar: "المغرب" },
    isha:    { de: "ʿIshā'",  ar: "العشاء" }
  };

  var PFLICHT = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

  /* Fünf Stufen statt eines Hakens. Ein Gebet ist nicht einfach
     gehalten oder nicht — es macht einen Unterschied, ob in der
     Gemeinschaft, pünktlich, gerade noch im Fenster oder nachgeholt. */
  var STUFEN = [
    { key: "moschee",    kurz: "Moschee",   lang: "In der Moschee (Jamāʿa)", farbe: "jade" },
    { key: "puenktlich", kurz: "Pünktlich", lang: "Pünktlich zu Hause",      farbe: "jade" },
    { key: "fenster",    kurz: "Fenster",   lang: "Noch im Zeitfenster",     farbe: "jade-dim" },
    { key: "spaet",      kurz: "Spät",      lang: "Nach Ablauf nachgeholt",  farbe: "amber" },
    { key: "verpasst",   kurz: "Verpasst",  lang: "Nicht gebetet",           farbe: "rose" }
  ];

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }

  function sonne(jd) {
    var D = jd - 2451545.0;
    var g = fixWinkel(357.529 + 0.98560028 * D);
    var q = fixWinkel(280.459 + 0.98564736 * D);
    var L = fixWinkel(q + 1.915 * sin(g) + 0.020 * sin(2 * g));
    var e = 23.439 - 0.00000036 * D;
    var RA = atan2(cos(e) * sin(L), cos(L)) / 15;
    return { dekl: asin(sin(e) * sin(L)), eqt: q / 15 - fixStunde(RA) };
  }

  /* Kernberechnung. Ergebnis in „lokaler mittlerer Sonnenzeit“ am Längengrad. */
  function roh(datum, lat, lng, methode, asrFaktor, hochbreiten) {
    var jd = julian(datum.getFullYear(), datum.getMonth() + 1, datum.getDate()) - lng / (15 * 24);

    function mittag(t) { return fixStunde(12 - sonne(jd + t).eqt); }

    function winkelZeit(winkel, t, rueckwaerts) {
      var dekl = sonne(jd + t).dekl;
      var noon = mittag(t);
      var arg = (-sin(winkel) - sin(dekl) * sin(lat)) / (cos(dekl) * cos(lat));
      var v = 1 / 15 * acos(arg);   // NaN, wenn die Sonne den Winkel nie erreicht
      return rueckwaerts ? noon - v : noon + v;
    }

    function asrZeit(faktor, t) {
      var dekl = sonne(jd + t).dekl;
      var winkel = -acot(faktor + tan(Math.abs(lat - dekl)));
      return winkelZeit(winkel, t, false);
    }

    var m = METHODEN[methode] || METHODEN.MWL;
    var t = {
      fajr:    winkelZeit(m.fajr, 5 / 24, true),
      sunrise: winkelZeit(0.833, 6 / 24, true),
      dhuhr:   mittag(12 / 24),
      asr:     asrZeit(asrFaktor, 13 / 24),
      maghrib: winkelZeit(0.833, 18 / 24, false),
      isha:    0
    };
    t.isha = (methode === "UmmAlQura")
      ? t.maghrib + m.isha / 60
      : winkelZeit(m.isha, 18 / 24, false);

    t.dhuhr += 1 / 60; // kleine Sicherheit nach dem Zenit

    /* ---- Hochbreiten-Regel: München erreicht im Juni die 18° nicht mehr ---- */
    var nacht = fixStunde(t.sunrise - t.maghrib);
    function anteil(winkel) {
      if (hochbreiten === "mitte") return nacht / 2;
      if (hochbreiten === "siebtel") return nacht / 7;
      return nacht * winkel / 60;              // winkelbasiert
    }
    function korrigiere(zeit, basis, winkel, rueckwaerts) {
      var p = anteil(winkel);
      var diff = rueckwaerts ? fixStunde(basis - zeit) : fixStunde(zeit - basis);
      if (isNaN(zeit) || diff > p) return basis + (rueckwaerts ? -p : p);
      return zeit;
    }
    t.fajr = korrigiere(t.fajr, t.sunrise, m.fajr, true);
    if (methode !== "UmmAlQura") t.isha = korrigiere(t.isha, t.maghrib, m.isha, false);

    return t;
  }

  /* Zwischenspeicher: „Heute“ und Kalender fragen dieselben Tage
     mehrfach ab. Der Schlüssel enthält alle Einstellungen, die das
     Ergebnis verändern — ändert sich eine, greift der Speicher nicht mehr. */
  var speicher = {};
  function leeren() { speicher = {}; }

  /* Öffentlich: liefert echte Date-Objekte in der Gerätezeitzone. */
  function fuer(datum, e) {
    e = e || Store.einstellungen;
    var k = e.korrektur || {};
    var schluessel = datum.getFullYear() + "-" + datum.getMonth() + "-" + datum.getDate() +
      "|" + e.ort.lat + "," + e.ort.lng + "|" + e.methode + "|" + e.asr + "|" + e.hochbreiten +
      "|" + [k.fajr, k.sunrise, k.dhuhr, k.asr, k.maghrib, k.isha].join(",");
    if (speicher[schluessel]) return speicher[schluessel];

    var lat = e.ort.lat, lng = e.ort.lng;
    var faktor = e.asr === "hanafi" ? 2 : 1;
    var t = roh(datum, lat, lng, e.methode, faktor, e.hochbreiten);

    var mitternachtUTC = Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate());
    var out = {};
    Object.keys(t).forEach(function (k) {
      var std = t[k] - lng / 15;                       // -> UTC
      var korr = (e.korrektur && e.korrektur[k]) || 0; // Feinjustierung in Minuten
      out[k] = new Date(mitternachtUTC + std * 3600000 + korr * 60000);
    });
    // Bei sehr langen Läufen (12-Monats-Kalender) nicht unbegrenzt wachsen
    if (Object.keys(speicher).length > 800) speicher = {};
    speicher[schluessel] = out;
    return out;
  }

  /* Welches Pflichtgebet ist jetzt dran, und wie lange noch? */
  function aktuell(jetzt, e) {
    jetzt = jetzt || new Date();
    var heute = fuer(jetzt, e);
    var morgen = fuer(new Date(jetzt.getTime() + 86400000), e);

    var folge = PFLICHT.map(function (k) { return { key: k, ab: heute[k] }; });
    folge.push({ key: "fajr", ab: morgen.fajr, morgen: true });

    for (var i = 0; i < folge.length - 1; i++) {
      if (jetzt >= folge[i].ab && jetzt < folge[i + 1].ab) {
        return {
          key: folge[i].key,
          name: NAMEN[folge[i].key],
          beginn: folge[i].ab,
          ende: folge[i + 1].ab,
          naechstes: folge[i + 1],
          restMs: folge[i + 1].ab - jetzt,
          anteil: (jetzt - folge[i].ab) / (folge[i + 1].ab - folge[i].ab)
        };
      }
    }
    // vor Fajr: die Nacht gehört noch zu ʿIshā'
    var gestern = fuer(new Date(jetzt.getTime() - 86400000), e);
    return {
      key: "isha", name: NAMEN.isha,
      beginn: gestern.isha, ende: heute.fajr,
      naechstes: { key: "fajr", ab: heute.fajr },
      restMs: heute.fajr - jetzt,
      anteil: (jetzt - gestern.isha) / (heute.fajr - gestern.isha)
    };
  }

  /* Welche Pflichtgebete haben ihr Fenster schon geöffnet? */
  function faellig(jetzt, e) {
    jetzt = jetzt || new Date();
    var t = fuer(jetzt, e);
    return PFLICHT.filter(function (k) { return jetzt >= t[k]; });
  }

  /* Welche Fenster sind bereits zu?
     Nur diese dürfen im Score gegen dich zählen — solange die Zeit
     noch läuft, ist ein nicht eingetragenes Gebet kein verpasstes. */
  function abgelaufen(jetzt, e) {
    jetzt = jetzt || new Date();
    var t = fuer(jetzt, e);
    var ende = {
      fajr: t.sunrise,   // Fajr endet mit Sonnenaufgang
      dhuhr: t.asr,
      asr: t.maghrib,
      maghrib: t.isha,
      isha: null         // läuft bis in die Nacht — zählt erst beim Tagesabschluss
    };
    return PFLICHT.filter(function (k) { return ende[k] && jetzt >= ende[k]; });
  }

  function uhr(d) {
    if (!d || isNaN(d)) return "--:--";
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function restText(ms) {
    if (ms < 0) return "abgelaufen";
    var min = Math.floor(ms / 60000);
    var std = Math.floor(min / 60);
    min = min % 60;
    if (std > 0) return "noch " + std + " Std " + min + " Min";
    return "noch " + min + " Min";
  }

  return {
    fuer: fuer, aktuell: aktuell, faellig: faellig, abgelaufen: abgelaufen, leeren: leeren,
    uhr: uhr, restText: restText,
    NAMEN: NAMEN, PFLICHT: PFLICHT, STUFEN: STUFEN, METHODEN: METHODEN
  };
})();
