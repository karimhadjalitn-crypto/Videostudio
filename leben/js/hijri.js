/* Mīzān – Hijri-Kalender.
   Nutzt den Umm-al-Qurā-Kalender des Geräts. Weil der Monatsbeginn
   von der Sichtung abhängt, gibt es in den Einstellungen einen
   Versatz von −2 bis +2 Tagen. */
var Hijri = (function () {
  "use strict";

  var MONATE = [
    "Muḥarram", "Ṣafar", "Rabīʿ al-Awwal", "Rabīʿ ath-Thānī",
    "Jumādā al-Ūlā", "Jumādā al-Ākhira", "Rajab", "Shaʿbān",
    "Ramaḍān", "Shawwāl", "Dhū l-Qaʿda", "Dhū l-Ḥijja"
  ];
  var MONATE_AR = [
    "محرم", "صفر", "ربيع الأول", "ربيع الآخر",
    "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
    "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
  ];

  var intlOk = null, formatierer = null;
  function pruefeIntl() {
    if (intlOk !== null) return intlOk;
    try {
      formatierer = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
        day: "numeric", month: "numeric", year: "numeric"
      });
      intlOk = formatierer.resolvedOptions().calendar.indexOf("islamic") === 0;
    } catch (e) { intlOk = false; formatierer = null; }
    return intlOk;
  }

  /* Der Kalender fragt 60 Tage am Stück ab. Ein Formatierer und ein
     Zwischenspeicher sparen dabei den Löwenanteil der Rechenzeit. */
  var speicher = {};

  /* Ersatzrechnung, falls das Gerät den Kalender nicht kennt (tabellarisch) */
  function ersatz(date) {
    var jd = Math.floor(date.getTime() / 86400000) + 2440588;
    var l = jd - 1948440 + 10632;
    var n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    var j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
            Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
        Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    var m = Math.floor((24 * l) / 709);
    var d = l - Math.floor((709 * m) / 24);
    var y = 30 * n + j - 30;
    return { tag: d, monat: m, jahr: y };
  }

  function fuer(date, versatz) {
    date = date || new Date();
    versatz = versatz === undefined
      ? ((Store.einstellungen && Store.einstellungen.hijriOffset) || 0)
      : versatz;
    var schluessel = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate() + "|" + versatz;
    if (speicher[schluessel]) return speicher[schluessel];

    // Mittag nehmen, damit Zeitzonen-Ränder nicht kippen
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    d = new Date(d.getTime() + versatz * 86400000);

    var tag, monat, jahr;
    if (pruefeIntl()) {
      var teile = formatierer.formatToParts(d);
      teile.forEach(function (t) {
        if (t.type === "day") tag = parseInt(t.value, 10);
        if (t.type === "month") monat = parseInt(t.value, 10);
        if (t.type === "year") jahr = parseInt(t.value, 10);
      });
    } else {
      var e = ersatz(d);
      tag = e.tag; monat = e.monat; jahr = e.jahr;
    }

    var ergebnis = {
      tag: tag, monat: monat, jahr: jahr,
      monatName: MONATE[monat - 1] || "",
      monatAr: MONATE_AR[monat - 1] || "",
      weisserTag: tag >= 13 && tag <= 15,
      ramadan: monat === 9,
      letzteZehn: monat === 9 && tag >= 21,
      text: tag + ". " + (MONATE[monat - 1] || "") + " " + jahr,
      textAr: arabischeZiffern(tag) + " " + (MONATE_AR[monat - 1] || "") + " " + arabischeZiffern(jahr)
    };
    speicher[schluessel] = ergebnis;
    return ergebnis;
  }

  /* Nach einer Änderung des Versatzes muss der Zwischenspeicher weg. */
  function leeren() { speicher = {}; }

  function arabischeZiffern(n) {
    var z = "٠١٢٣٤٥٦٧٨٩";
    return String(n).replace(/[0-9]/g, function (d) { return z[+d]; });
  }

  /* Islamische Termine für ein gregorianisches Datum */
  function anlass(date) {
    var h = fuer(date);
    if (h.monat === 1 && h.tag === 10) return { name: "ʿĀshūrā'", art: "fasten" };
    if (h.monat === 9 && h.tag === 1) return { name: "Ramaḍān beginnt", art: "gross" };
    if (h.monat === 9 && h.tag === 27) return { name: "27. Nacht", art: "gross" };
    if (h.monat === 10 && h.tag === 1) return { name: "ʿĪd al-Fiṭr", art: "gross" };
    if (h.monat === 12 && h.tag === 9) return { name: "ʿArafa", art: "fasten" };
    if (h.monat === 12 && h.tag === 10) return { name: "ʿĪd al-Aḍḥā", art: "gross" };
    if (h.weisserTag) return { name: "Weißer Tag", art: "fasten" };
    return null;
  }

  return {
    fuer: fuer, anlass: anlass, leeren: leeren,
    MONATE: MONATE, MONATE_AR: MONATE_AR, ziffern: arabischeZiffern
  };
})();
