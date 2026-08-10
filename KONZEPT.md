# Mīzān — Konzept

**Arbeitstitel: Mīzān (الميزان)** — die Waage, auf der die Taten gewogen werden.
Alternativen, falls dir das zu schwer ist: *Muḥāsaba*, *Athar* (Spur), *Sabīl* (Weg),
oder schlicht *Mein Tag*.

> Diese App ist kein Habit-Tracker. Sie ist ein **Spiegel mit Gedächtnis**:
> sie zeigt dir jeden Abend, wie dein Tag wirklich war, sie erinnert sich an
> alles, und sie sagt dir Dinge, die du nicht hören willst.

---

## 1. Grundentscheidungen (bereits festgelegt)

| Frage | Entscheidung |
|---|---|
| Technik | **PWA** — Web-App wie deine Arabisch-App, offline, GitHub Pages, kostenlos |
| Hauptgerät | **iPhone**. Der Windows-PC ist nur Ansicht + Backup |
| Daten | **Nur auf dem Gerät.** Kein Server, kein Konto, kein Abo, keine Übertragung |
| Assistent | **Offline-Logik zuerst.** Schnittstelle so gebaut, dass KI später andockbar ist |
| Sprache | Deutsch. Arabische Begriffe **immer mit deutscher Übersetzung** |
| Ton der App | **Direkt und fordernd**, punktuell sanft — adaptiv (siehe §7.5) |
| Klang | **Keine Musik, keine Melodien.** Systemton oder stumm |
| Design | Dunkelmodus vorhanden. Optik besprechen wir separat |
| Arabisch-App | Bleibt **getrennt**. Wohnt weiter unter `/`, Mīzān unter `/leben/` |
| Export | Vollständiger Export/Import als JSON-Datei |

---

## 2. Aufbau: drei Ebenen, fünf Reiter

**Ebene 1 – Der Tag.** Ein Bildschirm. Was jetzt ansteht, was offen ist, wo du stehst.
**Ebene 2 – Die Bereiche.** Wo du Details erfasst und nachschaust.
**Ebene 3 – Der Spiegel.** Wochen, Monate, Jahre. Muster. Zusammenhänge.

Unten fünf Reiter — mehr nicht:

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  Heute   │  Kalender│  Bereiche│  Spiegel │  Mehr    │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 3. „Heute" — der Startbildschirm

Aufbau von oben nach unten:

```
Montag, 10. August 2026        ·        26. Ṣafar 1448
─────────────────────────────────────────────────────
        ▸ Nächstes: ʿAṣr, Fenster offen bis 18:12
          [ Gebetet ]  [ In der Moschee ]  [ Später ]

  ●●●○○  Tagesscore 62      ▲ 8 über deinem Schnitt
─────────────────────────────────────────────────────
  OFFEN HEUTE
  ○ Adhkār am Morgen          ○ Qur'an-Wiederholung
  ○ Wasser  (1,2 / 3,0 l)     ○ Training
  ○ 2 Uni-Aufgaben            ○ 1 TikTok-Video
─────────────────────────────────────────────────────
  „Und dass dem Menschen nichts zuteil wird
   als das, worum er sich bemüht."   — an-Najm 53:39
─────────────────────────────────────────────────────
        [  Abendabrechnung starten  ]     ab Maghrib
```

**Regeln für diesen Bildschirm:**

- Nie mehr als **8 offene Punkte** gleichzeitig. Der Rest ist eingeklappt.
- Erledigtes verschwindet sofort — der Bildschirm wird über den Tag leerer.
- Das nächste Gebet steht **immer ganz oben**, unabhängig von allem anderen.
- Ein Antippen = erledigt. Detaileingaben sind optional, nie Pflicht.

---

## 4. Die Bereiche

### 4.1 Religion (45 % des Scores)

Das Herzstück. Sechs Karten.

#### Gebete
Für jedes der fünf Pflichtgebete eine **Qualitätsstufe** statt nur Haken:

| Stufe | Bedeutung | Punkte |
|---|---|---|
| ⬤ In der Moschee (Jamāʿa) | in Gemeinschaft gebetet | 100 % |
| ◕ Pünktlich zu Hause | im ersten Drittel des Fensters | 85 % |
| ◑ Im Fenster | irgendwann, bevor die Zeit ablief | 65 % |
| ◔ Verspätet | erst nach Ablauf, aber nachgeholt | 30 % |
| ○ Verpasst | nicht gebetet | 0 % |

Dazu, jeweils als eigene Haken:
**Sunan Rawātib** (12 Rakʿa) · **Witr** · **Tahajjud** · **Ḍuḥā** · **Ishrāq**

Moschee-Ziel ist bei dir **ein Gebet am Tag** (meist Maghrib oder ʿIshā'), nicht fünf.
Die App fordert dich an dem Punkt, wo es realistisch ist.

**Gebetszeiten:** offline berechnet, **ʿAṣr nach Standard (Shāfiʿī)**, Standort München.
Sie sind bewusst **nur ungefähr** — deine Autorität bleibt Muwaqqit. Für jedes Gebet
gibt es in den Einstellungen einen **Korrekturregler ±Minuten**, falls etwas abweicht.
Im Hochsommer greift für Fajr/ʿIshā' eine Hochbreiten-Regel (einstellbar), weil
die Sonne in München im Juni nicht tief genug sinkt.

#### Qur'an — Lesen, Hifz, Murājaʿa

**Dein Stand:** auswendig von **an-Nās (114) bis al-Muzzammil (73)** — 42 Suren.
Das ist das **komplette Juz' 30** plus fünf Suren aus Juz' 29
(al-Muzzammil, al-Muddaththir, al-Qiyāma, al-Insān, al-Mursalāt).
Du lernst **rückwärts durch den Mushaf**.

**Dein nächstes Ziel: Juz' 29 komplett.** Noch sechs Suren, 234 Verse:

| Sure | Verse |
|---|---|
| al-Jinn (72) | 28 |
| Nūḥ (71) | 28 |
| al-Maʿārij (70) | 44 |
| al-Ḥāqqa (69) | 52 |
| al-Qalam (68) | 52 |
| al-Mulk (67) | 30 |

Die App kennt diesen Weg und plant von selbst weiter: Sure, Versanzahl, realistische
Tagesportion, und der Fortschrittsbalken läuft auf **Juz' 29 komplett** zu — nicht auf
eine abstrakte Prozentzahl.

- **Lesen:** Seiten oder Juz' pro Tag, freies Ziel
- **Hifz:** Suren-Liste mit Status *neu lernend / gefestigt / wackelig*
- **Murājaʿa — Wiederholungsplan:**
  - **Täglich:** die Sure, die du gerade lernst
  - **Alle 3 Tage:** die zuletzt gefestigten Suren
  - **Wöchentlich:** dein gesamter Bestand, aufgeteilt in **sechs Tagesblöcke**
    (Tag 7 ist Prüfung). Die App teilt die Blöcke nach **Versanzahl**, nicht nach
    Suren-Anzahl — sonst hast du an einem Tag zehn kurze und am nächsten al-Mursalāt.
  - Was du beim Testen als **„wackelig"** markierst, fällt sofort zurück auf täglich
- **Qur'an-Unterricht** (Präsenz) als wiederkehrender Kalendertermin

#### Adhkār & Dhikr
Morgen-Adhkār · Abend-Adhkār · Adhkār nach dem Gebet ·
**Istighfār-Zähler** · **Salawāt-Zähler** (freitags eigenes Ziel)

Zähler sind große Tippflächen, funktionieren mit gesperrtem Blick, ohne Ton.

#### Fasten
- Freiwillig: **Montag/Donnerstag**, **Ayyām al-Bīḍ** (13./14./15. jedes Hijri-Monats,
  im Kalender automatisch markiert)
- **Ramadan-Modus** (§9)
- **Qaḍā'-Konto**: offene Nachhol-Tage als Schuld, die sichtbar bleibt

#### Akhlāq — die Abendfragen
Aus deiner Antwort („was meinen Dienst beeinflusst"):

1. Zorn beherrscht?
2. Barmherzig / nachsichtig gewesen?
3. Großzügig gewesen (Geld, Zeit, Hilfe)?
4. Niemanden beleidigt oder verletzt?
5. Keine Ghība — nicht gelästert?
6. Wahrheit gesagt?
7. Blick gesenkt?
8. Geduld gehabt, als es unangenehm wurde?

**Nicht alle acht jeden Abend.** Die App fragt rotierend 3–4, sonst hakst du nach zwei
Wochen blind durch. Antwort in drei Stufen: *ja / teils / nein*.

Unter **jeder** Frage sitzt ein **freies Feld** („Etwas dazu schreiben"), falls du
etwas ergänzen willst — auch bei den Gebeten, der Bildschirmzeit und der Stimmung.
Es ist eingeklappt, solange du es nicht brauchst. Sobald es offen ist, springt die App
nach deiner Antwort **nicht** weiter, sonst könntest du gar nicht zu Ende schreiben.
Am Ende der Abrechnung stehen alle deine Ergänzungen noch einmal zusammen.

#### Duʿā' & Wissen
- **Überlieferte Bittgebete** — Arabisch mit Ḥarakāt, deutsche Übersetzung darunter,
  Anlass dazu. Die Bittgebete der Propheten ʿalayhim as-salām aus dem Qur'an
  (Ādam 7:23 · Nūḥ 71:28 · Ibrāhīm 14:40 · Yūsuf 12:101 · Mūsā 20:25–28 ·
  Ayyūb 21:83 · Yūnus 21:87 · Zakariyyā 21:89 · Sulaymān 27:19 u. a.)
  und die des Propheten Muhammad ﷺ aus der Sunnah.
- **Āya / Hadith des Tages** — offline, feste geprüfte Sammlung
- **Minhāj al-Muslim**: Lesefortschritt (Seite X von Y)

> **Quellenregel für alle religiösen Inhalte der App:** Jeder Vers mit Sure:Vers,
> jeder Hadith mit Sammlung und Nummer und Authentizitätsgrad. Keine Paraphrase
> wird als Zitat ausgegeben. Wo ich einen Text nicht sicher belegen kann, kommt er
> nicht in die App. Vor dem Einbau wird jeder Text geprüft.

### 4.2 Sünden & Kämpfe — passwortgeschützt

Eigener Bereich hinter einem **Code**. Von außen unsichtbar, taucht in keiner
Statistik und in keinem Export auf, der nicht ausdrücklich entsperrt wurde.

- Selbst angelegte Kämpfe mit Zähler „X Tage frei"
- **Kein Zwang zu Details.** Ein Rückfall ist ein Antippen, kein Formular
- Beim Rückfall keine Strafe, sondern: *Was war der Auslöser?* (eine Zeile, optional)
- Die App wertet Auslöser über Zeit aus: Uhrzeit, Wochentag, Schlaf, Stimmung
- **Tawba** als eigener Eintrag: was du dir vorgenommen hast, wann

### 4.3 Körper & Sport (12 %)

Bewusst schlank — **kein Trainingslogbuch**, keine Sätze und Gewichte.

- **Training ja/nein** + Art: Kraft · Calisthenics · Fußball
- Calisthenics-Zirkel als **ein** Haken (Klimmzüge, Dips, Australian Pull-ups, Liegestütze)
- Ort: McFit / draußen / zuhause
- **Gewicht:** Verlauf von **80,0 kg → Ziel 75–78 kg**, mit Trendlinie und
  realistischer Prognose („bei diesem Tempo im November")
- Optional: Wochenziel Trainingstage (z. B. 4)

Apple Health lässt sich aus einer Web-App nicht auslesen — Gewicht und Schritte
kommen über einen **iOS-Kurzbefehl** automatisch herein (§8).

### 4.4 Ernährung (8 %)

Nur Regeln, keine Kalorien, kein Tagebuch — genau wie du es wolltest.

- **Wasser**: Ziel 3,0 l, große Tippfläche (+0,25 / +0,5 l)
- **Süßigkeiten vermieden?** (deine Hauptregel — „hier und da okay, mehr nicht":
  die App erlaubt dir **2 Ausnahmen pro Woche** ohne Abzug, danach zählt es)
- **Nicht überessen** (Sunnah-Maß)
- **Protein** genommen
- **Supplemente** als Tagesliste: D3+K2 · Ashwagandha · Magnesium · Vitamin C+Zink ·
  Vitamin-B-Komplex · Omega-3 · **Kreatin** (täglich, auch ohne Training)

Kein Intervallfasten, keine festen Essenszeiten — ist raus.

### 4.5 Produktivität, Uni & Arbeit (18 %)

Du hast gesagt: *„Das muss etwas strukturierter sein, damit ich mich dran halte."*
Deshalb hier als Einziges ein richtiges System:

- **Aufgaben** mit Projekt, Fälligkeit, Wiederholung
- Feste Projekte: `FOM Wirtschaftspsychologie` · `LMU Klinikum` · `Bewerbungen` · `Selbstständigkeit`
- **Wochenplanung**: Sonntag/Montag legst du 3–5 Wochenziele fest, die App bricht sie
  auf Tage herunter und zeigt freitags, was liegen blieb
- **Die drei Wichtigsten** — jeden Morgen genau drei Aufgaben, die zählen
- **Keine Fokuszeit-Messung** (hast du abgelehnt)
- **Bildschirmzeit**: du trägst sie abends selbst ein — keine App auf dem iPhone
  darf sie auslesen, auch keine native. **Getrennt** in:
  - **TikTok gearbeitet** (Videos, Recherche, Skripte) → zählt **positiv**
  - **TikTok/Instagram gescrollt** → zählt **negativ**

  Diese Trennung ist bei dir der entscheidende Punkt: dein Geschäft läuft über
  dieselbe App, die deine größte Baustelle ist. Jeder normale Tracker würde
  dich hier falsch bewerten.

### 4.6 Business — TikTok-Shop-Affiliate

Eigene Karte, weil es dein Weg zur finanziellen Unabhängigkeit ist.

**Gemessen wird, was du steuern kannst** — nicht der Umsatz. Du hast selbst gesagt:
Monat 1 nahe null, ernsthaft ab Monat 6–12. Wenn die App dir ein halbes Jahr
lang „0,00 €" entgegenhält, machst du sie zu.

- **Videos hochgeladen** (Wochenziel)
- Produkte recherchiert / getestet
- Skripte geschrieben
- **Halal-Prüfung** als Pflichthaken vor jedem Produkt
- **Disclosure gesetzt** (KI + Affiliate) als Pflichthaken
- Follower und Umsatz laufen als Nebenzahlen mit, ohne den Score zu bestimmen

### 4.7 Finanzen & Zakat (Teil der 4 %)

- **Ausgaben** erfassen, nach Kategorien
- **Budget** pro Monat
- **Sparziele**
- **Sadaqa**: Betrag und Häufigkeit, eigenes Ziel
- **Vermögen**: Verlauf über Zeit
- **Zakat**: Niṣāb-Vergleich (Gold-/Silberwert), **Zakat-Jahr-Erinnerung** —
  die App merkt sich, ab wann dein Vermögen den Niṣāb überschritten hat,
  und meldet sich nach einem Mondjahr

### 4.8 Schlaf (8 %)

- **Zubettgehzeit** und **Aufstehzeit**
- **Ziel: vor 0:00 Uhr im Bett** — Warnung um 23:15
- **Geteilter Schlaf richtig abgebildet:** schlafen → **für Fajr auf** → wieder schlafen.
  Die App zählt das als zwei Blöcke, nicht als „5 Stunden, schlecht".
  Genau das machen alle Schlaf-Apps falsch.
- Im Sommer rechnet sie dir vor, wie wenig zwischen ʿIshā' (~23:30) und
  Fajr (~2:00) liegt — und schlägt vor, wann du wirklich hinmusst

### 4.9 Soziales & Familie (5 %)

- **Eltern angerufen / besucht** (Birr al-Wālidayn) — mit Erinnerung, wenn zu lange her
- **Silat ar-Raḥim**: Verwandte, die du länger nicht erreicht hast
- Freunde, Geschwister
- **Neva** als eigener Punkt

### 4.10 Ehe & Familienplanung

Eigener Bereich, **hinter demselben Code wie 4.2**, wenn du willst.
Ziele, Sparen darauf hin, Vorbereitung, Wissen dazu, Notizen.

### 4.11 Innenleben

- **Stimmung** in 5 Stufen, ein Tipp
- **Dankbarkeit**: 3 Dinge, freiwillig
- **Freies Journal**, jederzeit
- Diese Werte sind der Schlüssel für die Zusammenhänge in §6.3

### 4.12 Lernen & Wissen

- **Arabisch-Onlineunterricht** als Termin + Haken
- **Minhāj al-Muslim** Lesefortschritt
- **FOM / R / Seminararbeit** laufen über Produktivität
- Verweis auf deine **Arabisch-App** (bleibt eigenständig)

---

## 5. Kalender

Zwei Ansichten, umschaltbar: **Monat** und **Tag mit Zeitblöcken**.

**Immer sichtbar:** gregorianisches **und** Hijri-Datum.

**Automatisch eingetragen:**
- Gebetszeiten als Tagesraster
- **Ayyām al-Bīḍ** (die drei weißen Tage) — jeden Hijri-Monat markiert
- Montag/Donnerstag als Fastenvorschlag
- **Ramadan**, die **letzten zehn Nächte**, **ʿĪd al-Fiṭr**, **ʿĪd al-Aḍḥā**, **ʿĀshūrā'**, **ʿArafa**
- **Jumuʿa**: Sommer **14:45**, Winter **13:30** (Umstellung standardmäßig an die
  Sommer-/Winterzeit gekoppelt, beides frei änderbar).
  Freitag ist bei dir Arbeitstag → die App blockt den Block davor und stupst dich
  rechtzeitig an: *„In 30 Minuten los — Jumuʿa um 14:45."*
- **Arbeitstage Mittwoch bis Freitag, vormittags** — frei änderbar
- **Uni-Termine, Qur'an-Unterricht, Arabischunterricht** als Wiederholungen

**Selbst planen:** Du hast gesagt, die App soll selbst planen — *„wenn sie weiß, wie ich
handel, sonst nicht."* Genau so: die Auto-Planung bleibt **aus**, bis genug Daten da
sind (Richtwert 30 Tage). Dann schlägt sie Zeiten vor, die zu deinem tatsächlichen
Verhalten passen — nicht zu einem Ideal. Und sie fragt, bevor sie etwas einträgt.

**Verbindung zum iPhone-Kalender:** einseitig. Die App erzeugt eine Kalenderdatei
(`.ics`), die du importierst — danach stehen Gebetszeiten, Fastentage, islamische
Termine und dein Wochenplan im normalen iPhone-Kalender, mit iOS-Alarmen.
Umgekehrt kann eine Web-App den iPhone-Kalender **nicht** lesen. Das lässt iOS nicht zu.

---

## 6. Der Spiegel — Auswertung

### 6.1 Tagesscore

Eine Zahl von 0 bis 100, gewichtet wie von dir bestätigt:

| Bereich | Anteil |
|---|---|
| Religion (Gebete, Qur'an, Adhkār, Fasten, Akhlāq) | **45 %** |
| Produktivität (Uni, Arbeit, Selbstständigkeit) | 18 % |
| Sport & Körper | 12 % |
| Schlaf | 8 % |
| Ernährung | 8 % |
| Soziales & Familie | 5 % |
| Innenleben & Finanzen | 4 % |

Innerhalb der Religion wiegen die **fünf Pflichtgebete am schwersten** —
ein Tag ohne sie kann rechnerisch nicht gut werden, egal wie fleißig der Rest war.
Alle Prozente sind in den Einstellungen verschiebbar.

### 6.2 Streaks

Du willst sie. Aber mit einer Regel, die dich nicht zerstört:

- Ein gerissener Tag setzt **nicht auf null**. Die Serie fällt auf den Stand von vor
  drei Tagen zurück. Zwei gerissene Tage hintereinander setzen zurück.
- **Reise- und Krankheitstage pausieren** die Serie, statt sie zu brechen.
- Sichtbar ist immer auch der **Monatsdurchschnitt** — eine 43-Tage-Serie mit
  lauter Minimalerfüllung ist weniger wert als 25 gute Tage von 30.

### 6.3 Zusammenhänge — der wichtigste Teil

Die App vergleicht deine Bereiche gegeneinander und sagt dir, was sie findet.
Beispiele für Regeln, die sie prüft:

- Schlafenszeit ↔ Fajr geschafft
- Scrollzeit ↔ Qur'an-Minuten am selben Tag
- Training ↔ Stimmung am Folgetag
- Fajr in der Moschee ↔ Produktivität des Tages
- Wochentag ↔ Rückfälle im geschützten Bereich
- Arbeitstage (Mi–Fr) ↔ alles andere

Ausgabe im Klartext, keine Diagramme zum Selbstdeuten:

> „An den 12 Tagen, an denen du vor 0 Uhr im Bett warst, hast du Fajr **9-mal**
> geschafft. An den 19 Tagen danach **3-mal**. Das ist kein Zufall mehr."

Eine Regel greift erst, wenn genug Tage vorliegen — sonst behauptet die App Unsinn.
Ist die Datenlage dünn, sagt sie das offen, statt zu raten.

### 6.4 Darstellung

Jahres-Heatmap pro Bereich · Wochenbalken · Gewichtsverlauf ·
Gebets-Qualität als gestapelte Wochenansicht

---

## 7. Der Assistent

Läuft vollständig **offline**, mit fest programmierten Regeln über deine eigenen Daten.
Keine KI, kein Internet, keine Kosten. Die Schnittstelle wird so gebaut, dass später
echte KI andocken kann, ohne dass etwas umgebaut werden muss.

### 7.1 Morgenbriefing
Gebetszeiten heute · Termine · **die drei wichtigsten Aufgaben** · laufende Streaks ·
Āya oder Hadith · ein Satz zum gestrigen Tag

### 7.2 Über den Tag
Gebetsfenster öffnet · Gebetsfenster schließt gleich und nichts eingetragen ·
Wasser hängt zurück · Jumuʿa-Vorlauf freitags · 23:15 Schlafenszeit

### 7.3 Abendabrechnung (Muḥāsaba)
Ab Maghrib, **unter 60 Sekunden**, geführt:

1. Gebete nachtragen (5 Tipps)
2. 3–4 rotierende Akhlāq-Fragen
3. Bildschirmzeit: gearbeitet / gescrollt
4. Stimmung
5. Ein Satz frei, freiwillig
6. **Der Abschluss:** dein Score, ein Satz Einordnung, eine Sache für morgen

### 7.4 Wochenbericht
Freitags. Was besser wurde, was schlechter, **ein** Zusammenhang aus §6.3,
und ein einziges konkretes Ziel für die kommende Woche.

### 7.5 Ton

Grundeinstellung **direkt und fordernd**:

> „Drei Gebete verspätet diese Woche. Du sagst, das ist dir das Wichtigste.
> Deine Woche sagt etwas anderes."

Er wird **sanft**, wenn die Daten es rechtfertigen — mehrere schlechte Tage
hintereinander, Stimmung unten, Krankheit:

> „Harte Woche. Du warst trotzdem viermal in der Moschee. Das zählt."

Er wird **härter**, wenn du gut drauf bist und trotzdem nachlässt.
Konfrontieren darf er — das hast du ausdrücklich so gewollt.

**Er lobt nicht für Selbstverständlichkeiten.** Kein Konfetti, keine Jubelsätze.

---

## 8. Erinnerungen — wie sie technisch funktionieren

Eine Web-App auf dem iPhone kann **von sich aus keine Benachrichtigungen zu
festen Zeiten schicken**. Das ist eine harte Grenze von Safari, kein Fehler meinerseits.
Ohne Server geht es nicht — und du wolltest keinen Server.

**Die Lösung: iOS-Kurzbefehle.**

> **Korrektur zu einer früheren Zusage:** Ich hatte geschrieben, ich baue die
> Kurzbefehle fertig und du tippst sie nur an. Das geht nicht. Apple verlangt für
> verteilbare `.shortcut`-Dateien eine Signatur, die nur auf einem Mac entsteht.
> Was die App liefert: die genauen Adressen und eine Schritt-für-Schritt-Anleitung
> unter *Mehr → Erinnerungen*. Jeder Kurzbefehl ist damit in zwei Minuten angelegt.

| Kurzbefehl | Was er tut |
|---|---|
| **Gebet in einem Tipp** | Symbol auf dem Home-Bildschirm, trägt z. B. Fajr als „in der Moschee" ein |
| **Schlafenszeit 23:15** | „Du wolltest vor 0 Uhr im Bett sein." — trägt die Zubettgehzeit gleich ein |
| **Abendabrechnung** | Nach Maghrib: Erinnerung, öffnet direkt die Muḥāsaba |
| **Health-Übertragung** | Liest nachts Gewicht und Schritte aus Apple Health und übergibt sie über die Adresszeile — nichts verlässt dein Handy |

Die Übergabe läuft über `#/import` mit Parametern: `gebet`, `stufe`, `gewicht`,
`schritte`, `wasser`, `bett`, `auf`, `fajrAuf`, `istighfar`, `salawat`.

Die **Jumuʿa-Erinnerung** und die Gebetszeiten kommen aus der **Kalenderdatei**
(§5) — dort mit Alarm 45 Minuten vorher, damit du von der Arbeit rechtzeitig losfährst.

**Nicht möglich, egal was ich tue:** Bildschirmzeit auslesen (kann keine iPhone-App),
den iPhone-Kalender lesen, Health direkt abfragen. Ich sage es lieber jetzt als später.

---

## 9. Sondermodi

### Ramadan-Modus
Schaltet sich automatisch zum 1. Ramadan ein.
Suḥūr- und Ifṭār-Zeiten prominent · Tarāwīḥ · täglicher Qur'an-Plan zum Durchlesen ·
**die letzten zehn Nächte** hervorgehoben mit Laylat al-Qadr-Zähler ·
Sadaqa-Ziel für den Monat · alle anderen Ziele automatisch heruntergefahren,
damit der Score nicht durch die reine Umstellung einbricht.

### Reisemodus
Wichtig für dich: **Alicante am 24.**
Gebete auf **Qaṣr/Jamʿ** umgestellt (Erfassung, nicht Bewertung) ·
Gebetszeiten am Zielort · Streaks pausiert statt gebrochen ·
Trainings- und Ernährungsziele heruntergesetzt · Notizfeld für Halal-Essen vor Ort ·
Ausgaben in Fremdwährung.

Ohne diesen Modus zeigt dir die App in Spanien lauter rote Felder, und du machst sie zu.

---

## 10. Technik

Gleiche Bauweise wie deine Arabisch-App — du kennst sie, sie funktioniert,
sie braucht kein Build-Werkzeug.

```
/leben/
  index.html
  manifest.webmanifest
  sw.js                    Service Worker, offline
  css/styles.css
  js/
    app.js                 Router
    store.js               Speicher (IndexedDB), Migrationen, Export/Import
    score.js               Score-Berechnung
    prayer.js              Gebetszeiten offline
    hijri.js               Hijri-Umrechnung, weiße Tage, Feiertage
    insights.js            Zusammenhänge (§6.3)
    assistant.js           Texte und Regeln des Assistenten
    ics.js                 Kalenderdatei erzeugen
    views/
      today.js  calendar.js  areas.js  mirror.js  more.js
      religion.js  body.js  food.js  work.js  business.js
      money.js  sleep.js  social.js  inner.js  private.js
  data/
    duas.json              Bittgebete, Arabisch + Übersetzung + Quelle
    ayat.json              Āya/Hadith des Tages, mit Quellenangabe
    surahs.json            Surennamen, Versanzahlen, Juz'-Zuordnung
```

**Speicher:** IndexedDB statt localStorage — du wirst über Jahre Daten sammeln,
localStorage läuft bei ~5 MB voll.
**Versionierung:** jeder Datensatz mit Schema-Version, damit spätere Erweiterungen
alte Daten nicht zerstören.
**Sperre:** Code für die geschützten Bereiche; optional Code für die ganze App.
**Export:** vollständiges JSON. Wöchentliche Erinnerung ans Backup.
**Der PC:** die App läuft auch im Browser am Windows-Rechner (Ansicht, Auswertung,
Wochenplanung). Ohne Sync — Daten kommen per Exportdatei rüber.

---

## 11. Bauphasen

| Phase | Inhalt |
|---|---|
| **1** ✔ | Gerüst, Speicher, „Heute", Gebete mit Qualitätsstufen, Gebetszeiten, Hijri, Score, Abendabrechnung |
| **2** | Religion vollständig: Qur'an/Hifz/Murājaʿa, Adhkār, Fasten, Duʿā'-Sammlung |
| **3** ✔ | Kalender, `.ics`-Export, Kurzbefehl-Übernahme, Erinnerungen |
| **4** | Sport, Ernährung, Schlaf |
| **5** | Produktivität, Wochenplanung, Business, Bildschirmzeit |
| **6** | Finanzen, Zakat, Soziales, Ehe, Innenleben, geschützter Bereich |
| **7** | Spiegel: Zusammenhänge, Heatmaps, Wochenbericht |
| **8** | Reisemodus, Ramadan-Modus, Feinschliff, Design |

Nach jeder Phase kannst du die App benutzen. Kein Warten auf „fertig".

---

## 12. Offene Punkte

1. **Umstellungsdatum Jumuʿa** Sommer/Winter, sobald du es weißt.
   Bis dahin an die Sommer-/Winterzeit gekoppelt.

## 13. Abgenommen

- TikTok wird zweimal gezählt (gearbeitet / gescrollt) ✔
- Business misst Videos statt Umsatz ✔
- Streaks reißen nicht auf null, Reisetage pausieren ✔
- Geteilter Schlaf als zwei Blöcke ✔
- Hifz: an-Nās (114) bis al-Muzzammil (73) fertig, **al-Jinn (72) wird gerade gelernt** ✔
- Akhlāq-Liste: die acht Fragen bleiben wie vorgeschlagen ✔
- Reisemodus wie in §9 beschrieben ✔
- Name: **Mīzān** ✔
- **Helle Variante wird zusätzlich gebaut** — Standard bleibt dunkel ✔
- **Freies Notizfeld an jeder Frage** der Abendabrechnung ✔

---

## 14. Design

**Richtung: dunkel, wertig, Apple-Handschrift** — echtes OLED-Schwarz, viel Luft,
klare Hierarchie, ruhige Materialien. Aber mit eigener Farbe, keine Kopie.

### Farben

| Rolle | Wert |
|---|---|
| Grund | `#000000` — echtes Schwarz, spart auf OLED Akku und blendet nachts nicht |
| Karte | `#17171A` |
| Erhöht | `#212125` |
| Trennlinie | `rgba(255,255,255,.08)` |
| Text | `#F5F5F7` / 60 % / 32 % |
| **Jade** `#4FC79A` | **jeder Fortschritt** — Ringe, Balken, Erledigtes |
| **Messing** `#C9A96A` | **ausschließlich arabische Schrift** — Surennamen, Adhkār, Hijri, Āya |
| Bernstein `#E5B45F` | nur Gebetsqualität „verspätet" |
| Rot `#FF6F61` | nur Gebetsqualität „verpasst" |

Genau zwei Akzente, alles andere ist Weiß in drei Abstufungen. Rot bedeutet in
dieser App **immer** dasselbe und wird nirgends dekorativ eingesetzt.

### Schrift

- **Oberfläche: SF Pro** über `-apple-system` — auf dem iPhone die Systemschrift,
  also exakt die, mit der Apple seine eigenen Apps setzt. Kein Download, keine Ladezeit.
- **Zahlen** mit Tabellenziffern (`tabular-nums`), damit Score, Uhrzeiten und Gewicht
  beim Ändern nicht springen.
- **Qur'an-Text:** eigene Naskh-Schrift mitliefern (sauberer Rasm, korrekte Ḥarakāt).
  Einmal geladen, danach offline. Für die Oberfläche reicht die Systemschrift.

### Muster

- **Große Titel**, die beim Scrollen in eine schmale Leiste zusammenfahren
- **Gruppierte Listen** mit abgerundeten Blöcken und eingerückten Trennlinien
- **Tab-Leiste mit Backdrop-Blur** — echtes Material, kein Bild
- Weiche Übergänge; bei aktiviertem „Bewegung reduzieren" fallen sie weg

### Was nicht geht — und wie ich es ersetze

| Apple-Merkmal | Status |
|---|---|
| **Haptik** beim Antippen | Safari darf das nicht. Ersatz: sichtbare Rückmeldung |
| **SF Symbols** | Lizenz auf Apple-Plattformen beschränkt. Ersatz: eigener Symbolsatz im gleichen Strichgewicht |
| **Squircles** (weich verlaufende Ecken) | Im Web nur angenähert. Im Alltag nicht zu sehen |

### Hell und dunkel

**Dunkel ist der Standard** — ausgelegt darauf, um 3 Uhr vor Fajr nicht zu blenden.
Die **helle Variante** ist gebaut, für draußen im Sommer. Drei Einstellungen unter
*Mehr → Erscheinungsbild*: **Dunkel** (Standard) · **Hell** · **Automatisch**
(folgt dem iPhone). Jede Farbe der App läuft über eine Variable, damit keine
der beiden Varianten bricht.
