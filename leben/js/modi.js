/* Mīzān – Sondermodi: Reise und Ramaḍān.
   Beide senken die Erwartung, statt dich an einem Maßstab zu messen,
   der gerade nicht gilt. */
var Modi = (function () {
  "use strict";

  /* ---------- Reise ---------- */
  function reiseAktiv(datum) {
    var r = Store.einstellungen.reise;
    if (!r || !r.aktiv) return false;
    if (!r.von || !r.bis) return true;
    var k = Store.key(datum || new Date());
    return k >= r.von && k <= r.bis;
  }

  function reiseInfo() {
    var r = Store.einstellungen.reise;
    if (!r.aktiv) return null;
    var heute = Store.key();
    var text = r.ort || "unterwegs";
    if (r.von && r.bis) {
      if (heute < r.von) {
        var tage = Math.round((Store.ausKey(r.von) - Store.ausKey(heute)) / 86400000);
        return { kommend: true, tage: tage, ort: text,
                 satz: "Reise nach " + text + " in " + tage + (tage === 1 ? " Tag" : " Tagen") + "." };
      }
      if (heute > r.bis) return null;
      var rest = Math.round((Store.ausKey(r.bis) - Store.ausKey(heute)) / 86400000);
      return { laeuft: true, tage: rest, ort: text,
               satz: "Reisemodus aktiv · " + text + (rest > 0 ? " · noch " + rest + " Tage" : " · letzter Tag") };
    }
    return { laeuft: true, ort: text, satz: "Reisemodus aktiv · " + text };
  }

  /* ---------- Ramaḍān ---------- */
  function ramadanInfo(datum) {
    var h = Hijri.fuer(datum || new Date());
    if (!h.ramadan) {
      // Wie weit ist es noch hin?
      var d = datum || new Date();
      for (var i = 1; i <= 60; i++) {
        var x = Hijri.fuer(new Date(d.getTime() + i * 86400000));
        if (x.ramadan && x.tag === 1) return { kommend: true, tage: i };
      }
      return null;
    }
    var z = Gebetszeiten.fuer(datum || new Date());
    return {
      aktiv: true, tag: h.tag,
      letzteZehn: h.tag >= 21,
      ungeradeNacht: h.tag >= 21 && h.tag % 2 === 1,
      suhurBis: z.fajr, iftar: z.maghrib,
      // Ein Juz' pro Tag bringt den Qur'an einmal durch den Monat
      juzHeute: Math.min(30, h.tag)
    };
  }

  /* ---------- Wirkung auf die Bewertung ---------- */
  /* Auf Reisen und im Ramaḍān gelten andere Maßstäbe: Trainings- und
     Ernährungsziele werden nicht eingefordert, die Serie pausiert. */
  function nachsicht(tag) {
    var reise = tag.reise || reiseAktiv(Store.ausKey(tag.datum));
    var h = Hijri.fuer(Store.ausKey(tag.datum));
    return {
      reise: reise,
      ramadan: h.ramadan,
      sportLocker: reise || h.ramadan,
      essenLocker: reise || h.ramadan,
      seriePausiert: reise
    };
  }

  return {
    reiseAktiv: reiseAktiv, reiseInfo: reiseInfo,
    ramadanInfo: ramadanInfo, nachsicht: nachsicht
  };
})();
