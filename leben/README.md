# Mīzān ⚖️

**Dein Tag, gewogen.** Eine persönliche Lebens-App — dunkel, offline, ohne Konto,
ohne Server, ohne Kosten. Alle Daten liegen ausschließlich auf deinem Gerät.

Das vollständige Konzept steht in [`../KONZEPT.md`](../KONZEPT.md).

---

## Was Phase 1 kann

**Heute** — ein Bildschirm. Nächstes Gebet ganz oben mit Restzeit und drei
Schnellknöpfen, Tagesscore als Ring, was heute noch offen ist, ein Vers,
und ab Maghrib die Abendabrechnung.

**Gebete** — die fünf Pflichtgebete mit **fünf Qualitätsstufen** statt eines Hakens:

| Stufe | Wertung |
|---|---|
| In der Moschee (Jamāʿa) | 100 % |
| Pünktlich zu Hause | 85 % |
| Noch im Zeitfenster | 65 % |
| Verspätet nachgeholt | 30 % |
| Verpasst | 0 % |

Dazu Sunan Rawātib, Witr, Ḍuḥā, Ishrāq, Tahajjud, das Wochenziel für die Moschee
und ein Streifen über die letzten sieben Tage.

**Religion** — Übersicht mit dem Religions-Anteil des Tagesscores und fünf Bereichen:

- **Qur'an** — Hifz-Bestand mit Status je Sure, die Sure, die du gerade lernst,
  und der **Murājaʿa-Plan**: dein Bestand in sechs Tagesblöcken, aufgeteilt nach
  **Versanzahl** statt nach Suren-Anzahl. Sonntag ist Prüfungstag. Was du als
  *wackelig* markierst, kommt bis auf Weiteres täglich dran. Der Fortschrittsbalken
  läuft auf **Juz' 29 komplett** zu, nicht auf eine abstrakte Prozentzahl.
- **Adhkār** — Morgen und Abend, dazu Istighfār- und Salawāt-Zähler mit großer
  Tippfläche. Freitags verdreifacht sich das Salawāt-Ziel.
- **Fasten** — heutiger Anlass mit Suḥūr- und Ifṭār-Zeit, Vorschau auf die nächsten
  empfohlenen Tage, **Qaḍāʾ-Konto** für offene Nachholtage, Bilanz über 30 Tage.
- **Duʿāʾ** — 18 Bittgebete der Propheten aus dem Qur'an und 9 aus der Sunnah,
  Arabisch mit Ḥarakāt, deutsche Übersetzung und Anlass.
- **Gebete** — siehe oben.

**Muḥāsaba** — geführte Abendabrechnung in acht Schritten, unter einer Minute:
Gebete nachtragen, drei täglich wechselnde Akhlāq-Fragen, Bildschirmzeit
(gearbeitet und gescrollt getrennt), Stimmung, ein Satz, Abschluss mit Urteil
und einer Sache für morgen.

Unter jeder Frage sitzt ein **freies Feld** („Etwas dazu schreiben"). Es ist
eingeklappt, solange du es nicht brauchst. Ist es offen, springt die App nach
deiner Antwort nicht weiter — sonst könntest du nicht zu Ende schreiben.
Am Ende stehen alle Ergänzungen des Tages noch einmal zusammen.

**Spiegel** — Wochenschnitt gegen Monatsschnitt, Heatmap der letzten sechs Wochen,
Verteilung der Gebetsqualität über 30 Tage, und ein erster Zusammenhang
(Moschee-Tage gegen andere Tage) — der erscheint erst, wenn genug Daten da sind.

**Kalender** — Monatsraster mit gregorianischem **und** Hijri-Datum in jeder Zelle.
Der Tagesscore färbt die Zelle ein. Markiert werden weiße Tage, Jumuʿa, islamische
Termine, Fastenvorschläge und deine Arbeitstage. Ein Tipp auf einen Tag zeigt
Gebetszeiten, Anlässe und was an dem Tag erfasst wurde.

**Bereiche** — Übersicht über alle Lebensbereiche mit Tagesscore und dem
Gewicht, mit dem jeder eingeht: Religion · Arbeit & Uni · Körper & Sport ·
Schlaf · Ernährung · Soziales & Familie · Business · Finanzen · Innenleben ·
Geschützt.

**Spiegel** — Wochen- gegen Monatsschnitt, Serie mit Schonfrist, Heatmap über
bis zu ein Jahr (umschaltbar auf Score, Gebete, Qur'an, Sport oder Schlaf),
Bereichsvergleich mit der schwächsten Stelle zuerst, Verteilung der
Gebetsqualität, Wochenbericht und die **Zusammenhänge**.

**Mehr** — Erscheinungsbild, Gebetszeiten mit Feinjustierung, Hijri-Versatz,
Gewichtung des Tagesscores, Ziele & Listen, Erinnerungen, Sperre, Reisemodus,
Export und Import.

## Erscheinungsbild

**Dunkel ist der Standard** — echtes OLED-Schwarz, damit es um 3 Uhr vor Fajr
nicht blendet. Zusätzlich gibt es **Hell** (für draußen im Sommer) und
**Automatisch**, das dem iPhone folgt. Umschaltbar unter *Mehr → Erscheinungsbild*.

Jede Farbe läuft über eine CSS-Variable — es gibt keine fest verdrahtete Farbe,
die nur in einer der beiden Varianten funktioniert.

---

## Gebetszeiten

Offline berechnet, Standard **MWL** (Fajr 18°, ʿIshā' 17°), **ʿAṣr nach Standard
(Shāfiʿī)**, Ort München-Fürstenried.

> **Die Zeiten sind bewusst nur ungefähr.** Die Autorität bleibt deine Gebetsapp.
> Mīzān braucht sie nur, um zu wissen, wann welches Zeitfenster offen ist.
> Weicht etwas ab: **Mehr → Feinjustierung**, pro Gebet in Minuten.

Für München greift im Hochsommer eine Hochbreiten-Regel — auf 48,1° Nord sinkt
die Sonne im Juni nicht mehr tief genug für eine reguläre Fajr-Berechnung.
Zum Vergleich, wie die App rechnet:

| Datum | Fajr | Maghrib | ʿIshā' |
|---|---|---|---|
| 21. Juni | 02:51 | 21:17 | 23:32 |
| 21. Dezember | 06:07 | 16:22 | 18:10 |

Der Hijri-Kalender kommt aus dem Umm-al-Qurā-Kalender des Geräts. Weil der
Monatsbeginn von der Sichtung abhängt, gibt es einen Versatz von −2 bis +2 Tagen.

---

## Der Score

Was noch nicht fällig war, zählt **nicht** gegen dich — der Score fällt also nicht,
nur weil es erst Vormittag ist. Was du früh erledigst, hebt ihn sofort. Erst wenn
der Tag abgeschlossen ist, zählt alles Offene als nicht erledigt.

Gewichtung laut Konzept: Religion 45, Produktivität 18, Sport 12, Schlaf 8,
Ernährung 8, Soziales 5, Innenleben und Finanzen 4. In Phase 1 gibt es nur
Religion, Ernährung (Wasser), Schlaf und Innenleben — die übrigen Gewichte
verteilen sich so lange anteilig auf die aktiven Bereiche.

---

## Religiöse Inhalte

**Qur'an-Stellen** sind mit Sure und Vers eindeutig belegt und als Übersetzung der
Bedeutung gekennzeichnet — das gilt für den Vers des Tages und für die 18
Bittgebete der Propheten.

**Bei den 9 Bittgebeten aus der Sunnah** stehen Sammlung und Nummer dabei, aber die
Zählung weicht zwischen Druckausgaben ab. Die App sagt das an der Stelle selbst:
für ein Zitat gegen die eigene Ausgabe prüfen. Ein **Hadith des Tages** ist bewusst
noch nicht eingebaut — dafür fehlt die Prüfung des Authentizitätsgrads.

Die Versanzahlen der Suren folgen der kufischen Zählung (Ḥafṣ ʿan ʿĀṣim).

---

## Erinnerungen

Eine Web-App auf dem iPhone darf **keine zeitgesteuerten Mitteilungen** schicken —
Safari lässt das nicht zu, bei jeder Web-App. Zwei Wege übernehmen das, beide ohne
Server; nichts verlässt dein Gerät.

**1. Kalenderdatei.** Unter *Mehr → Erinnerungen* erzeugt Mīzān eine `.ics` mit
Gebetszeiten, weißen Tagen, islamischen Terminen und der Jumuʿa — inklusive
Alarmen. Einmal in den iPhone-Kalender importieren, danach kommen die
Benachrichtigungen von iOS, auch bei geschlossener App. Wählbar sind Zeitraum
(1–12 Monate), Umfang der Gebetszeiten und Vorlaufzeit des Alarms.

**2. iOS-Kurzbefehle.** Fertige `.shortcut`-Dateien kann ich nicht liefern — Apple
verlangt dafür eine Signatur, die nur auf einem Mac entsteht. Stattdessen enthält
die App die Adressen und die Schritte; jeder Kurzbefehl ist in zwei Minuten angelegt.

Die Kurzbefehle rufen `#/import` mit Parametern auf. Alles landet direkt im
Speicher dieses Geräts:

| Parameter | Beispiel | Wirkung |
|---|---|---|
| `gebet` + `stufe` | `?gebet=fajr&stufe=moschee` | Gebet mit Qualitätsstufe eintragen |
| `gewicht` | `?gewicht=79,8` | Gewicht (Komma oder Punkt) |
| `schritte` | `?schritte=8231` | Schritte des Tages |
| `wasser` | `?wasser=0.5` | Liter dazuzählen |
| `bett` / `auf` | `?bett=jetzt` | Schlafzeiten, `jetzt` oder `23:15` |
| `fajrAuf` | `?fajrAuf=1` | für Fajr aufgestanden |
| `istighfar` / `salawat` | `?istighfar=100` | Zähler erhöhen |

So kommen auch **Gewicht und Schritte aus Apple Health** herein: der Kurzbefehl
darf Health lesen, die Web-App nicht — er reicht die Werte über die Adresszeile weiter.

**Bildschirmzeit** lässt sich auf dem iPhone von keiner App auslesen, auch von
keiner nativen. Die trägst du abends bei der Muḥāsaba selbst ein.

## Aufs iPhone

1. Seite in **Safari** öffnen
2. Teilen-Symbol → **„Zum Home-Bildschirm"**
3. Läuft danach im Vollbild und offline, mit eigenem Icon

**Wichtig:** Alles liegt nur auf diesem Gerät. Es gibt keinen Server und kein
Konto — geht das iPhone verloren, sind die Daten weg. Unter **Mehr → Sicherung
herunterladen** bekommst du eine JSON-Datei; die App erinnert wöchentlich daran.

---

## Lokal ausprobieren

```bash
cd leben
python3 -m http.server 8000
# http://localhost:8000
```

Icons neu bauen (braucht Pillow):

```bash
python3 leben/tools/generate_icons.py
```

---

## Aufbau

```
leben/
  index.html
  manifest.webmanifest
  sw.js                  Service Worker, offline
  css/styles.css
  js/
    store.js             IndexedDB, Einstellungen, Export/Import
    prayer.js            Gebetszeiten offline
    hijri.js             Hijri, weiße Tage, islamische Termine
    score.js             Tagesscore und Gebetsstufen
    ayat.js              Vers des Tages
    ui.js                Bausteine der Oberfläche
    assistant.js         Regeln und Texte des Assistenten
    views/               today · prayers · muhasaba · mirror · settings
    app.js               Router
  data/ayat.json
  tools/generate_icons.py
```

Kein Build-Werkzeug, keine Abhängigkeiten. Reine Dateien, wie die Arabisch-App.

---

## Stand

**Alle acht Phasen sind gebaut.** Die App ist vollständig.

| Phase | Inhalt |
|---|---|
| 1 | Gerüst, Speicher, Heute, Gebete mit Qualitätsstufen, Score, Muḥāsaba |
| 2 | Religion: Qur'an mit Hifz und Murājaʿa, Adhkār, Fasten, Duʿāʾ |
| 3 | Kalender, `.ics`-Export, Kurzbefehl-Übernahme |
| 4 | Körper & Sport, Ernährung, Schlaf |
| 5 | Arbeit & Uni mit Aufgaben, Business |
| 6 | Finanzen, Soziales, Innenleben, Ehe, geschützter Bereich |
| 7 | Spiegel: Heatmaps, Serie, Wochenbericht, Zusammenhänge |
| 8 | Reise- und Ramaḍān-Modus |


---

## Die Zusammenhänge

Der Kern des Spiegels. Mīzān vergleicht deine Bereiche gegeneinander und sagt
im Klartext, was sie findet — zum Beispiel:

> An den 40 Tagen, an denen du vor 0 Uhr im Bett warst, hast du Fajr 40-mal
> gehalten. An den 20 späteren Nächten 10-mal. Das ist kein Zufall mehr.

Geprüft werden acht Regeln: Schlafenszeit ↔ Fajr · Scrollzeit ↔ Murājaʿa ·
Moschee ↔ Tagesscore · Sport ↔ Stimmung am Folgetag · Schlafenszeit ↔ Rückfälle ·
Arbeitstage ↔ alles andere · Fajr in der Moschee ↔ erledigte Hauptaufgaben ·
stärkster und schwächster Wochentag.

**Eine Aussage erscheint erst**, wenn beide Verglichsgruppen mindestens vier Tage
umfassen und der Unterschied deutlich ist. Bei dünner Datenlage sagt die App das
offen, statt zu raten. Die Regel zu Rückfällen läuft ausschließlich im
geschützten Bereich und taucht im Spiegel nie auf.

## Sondermodi

**Reise** — Serie pausiert statt zu brechen, Sport und Ernährung werden nicht
eingefordert, Hinweis auf Qaṣr und Jamʿ. Die Erfassung der Gebete bleibt gleich:
ob gekürzt oder zusammengelegt wurde, ist eine Frage des Fiqh, nicht der App.

**Ramaḍān** — schaltet sich am 1. Ramaḍān von selbst ein: Suḥūr- und Ifṭār-Zeit,
Tarāwīḥ, täglicher Juz', die letzten zehn Nächte hervorgehoben mit Markierung der
ungeraden Nächte.

## Sperre

Zwei getrennte Codes, beide optional: einer beim Öffnen der App, einer für den
geschützten Bereich. Sie werden **nur als SHA-256-Prüfsumme** gespeichert — nie im
Klartext, auch nicht in der Sicherungsdatei. Ein vergessener Code lässt sich nicht
wiederherstellen.
