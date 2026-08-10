/* Mīzān – Kalenderdatei (.ics).
   Weil eine Web-App auf dem iPhone keine zeitgesteuerten Mitteilungen
   schicken darf, übernimmt das der iPhone-Kalender: Datei einmal
   importieren, danach kommen die Alarme von iOS. */
var ICS = (function () {
  "use strict";

  function pad(n) { return String(n).padStart(2, "0"); }

  function utcStempel(d) {
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" +
           pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
  }
  function datumsStempel(d) {
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
  }
  function esc(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;")
                    .replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  }

  /* iCalendar erlaubt höchstens 75 Oktette je Zeile.
     Ein Encoder für alles — bei zwölf Monaten sind das über 20.000 Zeilen. */
  var encoder = new TextEncoder();
  function oktette(s) { return encoder.encode(s).length; }

  function falten(zeile) {
    if (oktette(zeile) <= 75) return zeile;
    var teile = [], rest = zeile, grenze = 74;
    while (oktette(rest) > grenze) {
      var schnitt = grenze;
      while (oktette(rest.slice(0, schnitt)) > grenze) schnitt--;
      teile.push(rest.slice(0, schnitt));
      rest = rest.slice(schnitt);
      grenze = 73; // Folgezeilen beginnen mit einem Leerzeichen
    }
    teile.push(rest);
    return teile[0] + teile.slice(1).map(function (t) { return "\r\n " + t; }).join("");
  }

  function ereignis(o) {
    var z = ["BEGIN:VEVENT", "UID:" + o.uid, "DTSTAMP:" + utcStempel(new Date())];
    if (o.ganztags) {
      z.push("DTSTART;VALUE=DATE:" + datumsStempel(o.start));
      z.push("DTEND;VALUE=DATE:" + datumsStempel(new Date(o.start.getTime() + 86400000)));
      z.push("X-FUNAMBOL-ALLDAY:1");
    } else {
      z.push("DTSTART:" + utcStempel(o.start));
      z.push("DTEND:" + utcStempel(o.ende || new Date(o.start.getTime() + 15 * 60000)));
    }
    z.push("SUMMARY:" + esc(o.titel));
    if (o.text) z.push("DESCRIPTION:" + esc(o.text));
    if (o.transparent) z.push("TRANSP:TRANSPARENT");
    if (o.alarmMin != null) {
      z.push("BEGIN:VALARM", "ACTION:DISPLAY",
             "TRIGGER:-PT" + o.alarmMin + "M",
             "DESCRIPTION:" + esc(o.alarmText || o.titel),
             "END:VALARM");
    }
    z.push("END:VEVENT");
    return z;
  }

  /* Optionen: monate, gebete ("alle"|"eckpunkte"|"keine"), weisseTage,
     termine, jumua, alarmMin */
  function bauen(opt) {
    opt = opt || {};
    var e = Store.einstellungen;
    var monate = opt.monate || 3;
    var alarm = opt.alarmMin == null ? 10 : opt.alarmMin;
    var welche = opt.gebete === "eckpunkte"
      ? ["fajr", "maghrib"]
      : (opt.gebete === "keine" ? [] : Gebetszeiten.PFLICHT);

    var zeilen = [
      "BEGIN:VCALENDAR", "VERSION:2.0",
      "PRODID:-//Mizan//Lebens-App//DE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "X-WR-CALNAME:Mīzān", "X-WR-TIMEZONE:" + (Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin")
    ];

    var heute = new Date(); heute.setHours(0, 0, 0, 0);
    var tage = Math.round(monate * 30.5);

    for (var i = 0; i < tage; i++) {
      var d = new Date(heute.getTime() + i * 86400000);
      var schluessel = Store.key(d);
      var zeiten = Gebetszeiten.fuer(d, e);
      var h = Hijri.fuer(d);

      welche.forEach(function (k) {
        zeilen = zeilen.concat(ereignis({
          uid: "mizan-" + k + "-" + schluessel + "@mizan",
          start: zeiten[k],
          titel: Gebetszeiten.NAMEN[k].de + " · " + Gebetszeiten.NAMEN[k].ar,
          text: "Gebetsfenster öffnet. Ungefähre Zeit — deine Gebetsapp bleibt maßgeblich.",
          alarmMin: alarm,
          alarmText: Gebetszeiten.NAMEN[k].de + " in " + alarm + " Minuten",
          transparent: true
        }));
      });

      if (opt.weisseTage !== false && h.weisserTag) {
        zeilen = zeilen.concat(ereignis({
          uid: "mizan-bid-" + schluessel + "@mizan",
          start: d, ganztags: true, transparent: true,
          titel: "Weißer Tag · " + h.tag + ". " + h.monatName,
          text: "Ayyām al-Bīḍ — freiwilliges Fasten am 13., 14. und 15. des Mondmonats."
        }));
      }

      if (opt.termine !== false) {
        var a = Hijri.anlass(d);
        if (a && a.art !== "fasten") {
          zeilen = zeilen.concat(ereignis({
            uid: "mizan-anlass-" + schluessel + "@mizan",
            start: d, ganztags: true, transparent: true,
            titel: a.name, text: "Islamischer Termin · " + h.text
          }));
        } else if (a && a.art === "fasten" && !h.weisserTag) {
          zeilen = zeilen.concat(ereignis({
            uid: "mizan-fasten-" + schluessel + "@mizan",
            start: d, ganztags: true, transparent: true,
            titel: a.name + " · Fasten", text: "Freiwilliges Fasten · " + h.text
          }));
        }
      }

      /* Wiederkehrende Termine (Arbeit, Unterricht …) */
      if (opt.termineEigene !== false) {
        Termine.fuerTag(d).forEach(function (x) {
          if (x.art === "religion" && x.name.indexOf("Jumu") === 0) return;  // kommt unten
          var u = (x.von || "09:00").split(":");
          var s = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +u[0], +u[1]);
          var b = (x.bis || "").split(":");
          var ende = b.length === 2
            ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), +b[0], +b[1])
            : new Date(s.getTime() + 3600000);
          zeilen = zeilen.concat(ereignis({
            uid: "mizan-termin-" + x.id + "-" + schluessel + "@mizan",
            start: s, ende: ende, titel: x.name,
            text: "Wiederkehrender Termin aus Mīzān.",
            alarmMin: 15, alarmText: x.name + " in 15 Minuten"
          }));
        });
      }

      if (opt.jumua !== false && d.getDay() === 5) {
        var sommer = d.getMonth() >= 3 && d.getMonth() <= 9;
        var uhr = (sommer ? e.jumua.sommer : e.jumua.winter).split(":");
        var start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +uhr[0], +uhr[1]);
        zeilen = zeilen.concat(ereignis({
          uid: "mizan-jumua-" + schluessel + "@mizan",
          start: start, ende: new Date(start.getTime() + 60 * 60000),
          titel: "Jumuʿa · الجمعة",
          text: "Freitagsgebet. " + (e.ort.label || ""),
          alarmMin: 45,
          alarmText: "In 45 Minuten Jumuʿa — Zeit, loszufahren."
        }));
      }
    }

    zeilen.push("END:VCALENDAR");
    return zeilen.map(falten).join("\r\n") + "\r\n";
  }

  function herunterladen(opt) {
    var text = bauen(opt);
    var blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "mizan-kalender.ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    return text.split("BEGIN:VEVENT").length - 1;
  }

  return { bauen: bauen, herunterladen: herunterladen };
})();
