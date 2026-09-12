# Arabisch lernen 🕌

Eine schlichte, übersichtliche Lern-App für Arabisch (**Fuṣḥā** und Sprechform „nah an Fuṣḥā"),
aufgebaut aus deinem Lehrbuch und deiner eigenen Vokabelliste.

Karteikarten · Multiple-Choice-Quiz · Satzstrukturen · Fortschritts-Tracking mit
Wiederholungssystem · eigene Wörter hinzufügen · installierbar als App (offline).

---

## Was drin ist

- **1309 Vokabeln im Alltagstrakt** – das Lehrbuch, deine 100 Wörter und der
  große Ausbau vom September, alles zusammengeführt
  (288 Verben, 625 Nomen, 182 Adjektive, 28 Zahlen, 79 Wendungen,
  Präpositionen, Konjunktionen, Fragewörter).
- **343 Quran-Vokabeln** in fünf Stufen, dazu 16 Texte Wort für Wort – eigener Tab.
- **100 Satzmuster** mit Wort-für-Wort-Übersetzung.
- **20 Redewendungen** und eine vollständige Verb-Konjugationstabelle.
- Jede **Verb-Karte** zeigt **Vergangenheit + Präsens + Zukunft + Befehlsform** zusammen
  (Befehlsform = Imperativ/صيغة الأمر, z. B. ذَهَبَ → **اِذْهَبْ** „geh!“).
- Jede Karte zeigt **Fuṣḥā (mit Harakat)** und die **Sprechform**.
- Jede **Nomen-Karte** zeigt **Einzahl + Mehrzahl** und das **Genus**,
  jede **Adjektiv-Karte** die **männliche und weibliche Form**.
- Wo es einen Sonderfall gibt (Zahl-Kongruenz, Anrede an eine Frau, zweite
  Bedeutung), steht ein **kurzer Hinweis** unter der Antwort.
- Wo möglich ein **Beispielsatz** auf der Karte, mit hervorgehobenem Wort (aus den 100 Satzmustern).
- **Audio** über die Stimme des Geräts, mit Auswahl, falls mehrere arabische
  Stimmen installiert sind. Ist keine da, steht in den Einstellungen, wo man
  sie herbekommt (iPhone-Einstellungen › Bedienungshilfen › Gesprochene Inhalte
  › Stimmen › Arabisch).

### Decks
- Verben (288)
- Familie und Menschen (42)
- Haus und Alltag (62)
- Essen und Trinken (60)
- Orte und Reisen (68)
- Religion und Moschee (62)
- Studium und Arbeit (58)
- Körper und Gesundheit (62)
- Natur, Wetter und Dinge (59)
- Adjektive (165)
- Präpositionen & Orte (24)
- Konjunktionen (20)
- Fragewörter & Pronomen (25)
- Meine Wörter (38)
- Zahlen (30)
- Farben (15)
- Zeit und Kalender (28)
- Kleidung (14)
- Berufe (14)
- Höflichkeit und Gespräch (32)
- Tiere (24)
- Stadt und Einkaufen (28)
- Technik und Medien (23)
- Gefühle und Charakter (31)
- Kleine Wörter (37)

Dazu ein Stern-Deck **„Mein Wortschatz"** (deine 100 Vokabeln) und **„Schwierige Wörter"**
(automatisch aus deinen Fehlern).

---

## Nutzung

Die App ist eine reine Webseite (kein Server, keine Anmeldung). Dein Fortschritt wird nur
**lokal auf deinem Gerät** gespeichert.

**Als App aufs iPhone/iPad (empfohlen):**
1. Repository auf **GitHub Pages** veröffentlichen (Settings → Pages → Branch wählen).
2. Die Pages-URL in **Safari** öffnen → **Teilen-Symbol** → **„Zum Home-Bildschirm“**.
3. Läuft danach als App im Vollbild, mit eigenem Icon, Startbildschirm und offline.

> Die App erkennt iPhone/iPad und zeigt die Schritte direkt an (Startseite oben
> und unter *Einstellungen → App installieren*). Safe-Areas (Notch, Home-Indicator)
> sind berücksichtigt.

**Auf dem iPad** nutzt die App die Breite: ab 740 px steht links das
Tagesprogramm und rechts Suche und Decks, die Decks stehen drei- bis vierspaltig,
die vier Quizantworten als 2 × 2, und die Wortliste läuft zweispaltig.
Karteikarten, das Formular für neue Wörter und die Suren behalten bewusst ihre
ruhige Lesespalte. Hoch- und Querformat funktionieren beide.

**Lokal ausprobieren:**
```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```
(Über einen Server öffnen, nicht per Doppelklick – wegen des Service-Workers.)

---

## Funktionen im Überblick

| Bereich | Beschreibung |
|---|---|
| 🃏 **Karteikarten** | **Nomen**: Einzahl und Mehrzahl nebeneinander, je volles Fuṣḥā und Sprechform darunter, dazu männlich/weiblich. **Adjektive**: männliche und weibliche Form. **Verben**: alle vier Formen (Vergangenheit · Präsens · Zukunft · Befehlsform) plus die verlangte Präposition (يَحْتَاجُ **إِلَى**) – oder die Warnung, wenn das Deutsche eine hat und das Arabische nicht (*warten auf*). Umdrehen, selbst einschätzen in vier Stufen (*Nochmal / Schwer / Gut / Leicht*) – unter jedem Knopf steht, wann die Karte wiederkommt. Richtung DE→AR, AR→DE oder gemischt. **Wischen** (rechts = Gut, links = Nochmal, hoch = Leicht, runter = Schwer), **Tastatur** (Leer = umdrehen, 1/2/3/4 = bewerten) und **⭐-Stern** zum Merken. |
| 🎯 **Quiz** | **Sehen** (Multiple Choice) und **Hören** (Wort anhören, Bedeutung wählen). Tastatur 1–4. Speist denselben Fortschritt. |
| 💬 **Sätze** | **Baukasten** (Wörter ordnen), **Muster** (Satz-Karten), **Ersetzen** (Lückentext + Variante). |
| ➕ **Neu** | Eigene Wörter **tippen** (mit arabischer Bildschirmtastatur), aus **Datei** (.txt/.csv/.docx) oder per **Bild** (Texterkennung) importieren. |
| 🔍 **Suche** | Globale Suche auf der Startseite über alle Vokabeln (Deutsch oder Arabisch). |
| ⚑ **Fehler melden** | An jeder Karte sitzt eine Fahne: Stimmt etwas nicht, antippen und kurz beschreiben. Die Meldungen sammeln sich in den Einstellungen und lassen sich als Liste kopieren. |
| ⭐ **Favoriten** | Wörter mit dem Stern markieren und gezielt als eigenes Deck üben. |
| 📖 **Quran** | Eigener Bereich: **343 Wörter** in fünf Lernstufen (die häufigsten Wörter, Nomen, Verben, Eigenschaften/Gottesnamen, Wörter aus den Gebetstexten) und **16 Texte Wort für Wort** – die Suren 104 bis 114 lückenlos, dazu al-Fātiḥa, al-Qadr, al-ʿAṣr sowie Taschahhud und die Adhkār aus Rukūʿ und Sujūd. Jedes Wort im Vers ist antippbar und zeigt Bedeutung, Grundform und Wurzel. Quranwörter behalten ihre Vokalzeichen immer. Dazu **7 Grammatik-Themen** – nur was man zum Verstehen braucht, jede Regel an einem Vers aus der App erklärt. |
| ☀️ **Heute** | Das Tagesprogramm auf der Startseite, in drei Größen: **Kurz** (~5 Min), **Normal** (~15) und **Lang** (~30). Fällige Wiederholungen zuerst, neue Wörter je nach Größe – bis Ramadan mit Schwerpunkt Quran. Darunter der ehrliche Abgleich mit den beiden Zielterminen („im Plan" / „hinten dran"), ohne Streak-Druck. |
| 🎯 **Lernziel** | Frei einstellbar (Standard 100 Wörter). Der Balken auf der Startseite zeigt, wie viele Wörter du schon sicher kannst – antippen zum Ändern. |
| 📊 **Statistik** | Was du kannst, Lernziel, Lernserie, schwierige Wörter, Favoriten, Fortschritt je Deck. |
| ⚙️ **Einstellungen** | Design (hell/dunkel), Richtung, Sprechform/Harakat/Audio (+ Auswahl der arabischen Stimme, falls mehrere installiert sind), Sitzungsgröße, Lernziel, Installations­anleitung, Sichern/Laden. |

**Wiederholungssystem:** Karten wandern durch Boxen mit wachsenden Abständen
(6 Std. · 1 · 3 · 7 · 14 · 30 Tage). Die Bewertung steuert das Tempo:

| Knopf | Bedeutung | Effekt |
|---|---|---|
| **Nochmal** | gar nicht gewusst | zurück auf Anfang, kommt gleich in dieser Sitzung wieder |
| **Schwer** | gewusst, aber lange überlegt | bleibt auf dem Niveau, kürzerer Abstand, kommt in dieser Sitzung noch einmal |
| **Gut** | sicher gewusst | zwei Boxen weiter – zählt ab jetzt als **gekonnt** |
| **Leicht** | sofort gewusst | drei Boxen weiter, längster Abstand |

Wörter, die du **noch nicht gut kannst, kommen öfter dran**; Gekonntes seltener.
Für das Lernziel zählen **Gut** und **Leicht** – „Schwer" noch nicht.

---

## Korrekturen an deiner Vokabelliste

Beim Zusammenführen mit dem Lehrbuch habe ich kleine Tippfehler gegen die (autoritative)
Buchform korrigiert. Alles hier steht auch in der App unter **Einstellungen → Korrekturen**.

**Buchstaben-Tippfehler (10):**

| Deutsch | vorher | nachher | Grund |
|---|---|---|---|
| China | اَلصِّنُ | اَلصِّينُ | fehlendes ي |
| Das Auto | اَاسَّيَّارَةُ | اَلسَّيَّارَةُ | اا → ال |
| Der Klassenkamerad | الْزَمِيلُ | الزَّمِيلُ | Sonnenbuchstabe: Schadda |
| Der Löffel | اَلْمِاْعَقَةُ | اَلْمِلْعَقَةُ | verdreht → مِلْعَقة |
| Der Name | اَلْاءِسْمُ | اَلِاسْمُ | überflüssiges ء |
| Ehepartner | زَوْخٌ | زَوْجٌ | خ → ج |
| Flasche | قَارُرَةٌ | قَارُورَةٌ | fehlendes و |
| Stift | قَاَمٌ | قَلَمٌ | fehlendes ل |
| Uhr | سَاعَتٌ | سَاعَةٌ | ت → ة |
| auch | أَيْضاََ | أَيْضًا | Tanwīn korrigiert |

**Nur Vokalzeichen ergänzt (3):**

| Deutsch | vorher | nachher | Grund |
|---|---|---|---|
| Ei | بيْضَةٌ | بَيْضَةٌ | fehlendes َ |
| Finger | إصْبَعٌ | إِصْبَعٌ | fehlendes ِ |
| Vater | أبُ | أَبٌ | Vokalzeichen ergänzt |

> Bewusst **nicht** verändert wurden richtige Formen, die nur nach „Fehler" aussahen –
> z. B. *Arm (nicht das Körperteil)* = فَقِيرٌ (arm/poor), *hungrig* = جَوْعَانُ, *durstig* = عَطْشَانُ.

---

## Projektstruktur

```
index.html              App-Gerüst
manifest.webmanifest    PWA-Manifest
sw.js                   Service Worker (Offline)
css/styles.css          Design (Sand & Teal, hell/dunkel)
js/                     App-Code (store, data, srs, views …)
data/
  appdata.js            Datenbündel, das die App lädt
  *.json                dieselben Daten als JSON (zum Nachschlagen)
assets/icons/           App-Icons
tools/
  quelle_lernbuch.docx  Quelle
  build_data.py         Wortschatz aus .docx extrahieren
  imperative.py         Befehlsform (Imperativ) aus dem Präsens ableiten
  quran_words.py        Quran-Grundwortschatz nach Lernstufen
  quran_texts.py        Suren und Gebetstexte, Wort für Wort
  quran_grammar.py      Grammatik für den Quran (7 Themen)
  build_quran.py        -> data/quran.json, verknüpft Verse mit Wortschatz
  bundle.py             baut data/appdata.js aus den data/*.json
  noun_forms.py         Plural + Genus je Nomen, Pausalform-Regeln
  adjective_forms.py    weibliche Form der Adjektive
  verb_prepositions.py  Präposition, die ein Verb verlangt
  apply_word_forms.py   obige Tabellen in data/vocab.json eintragen
  finalize_data.py      mit Karims Liste zusammenführen -> data/
  generate_icons.py     Icons erzeugen
```

### Daten neu bauen
```bash
python3 tools/build_data.py      # .docx  -> tools/_raw_book.json
python3 tools/finalize_data.py   # + Karims Liste -> data/*.json + appdata.js
python3 tools/generate_icons.py  # Icons
```
`finalize_data.py` zieht Plural, Genus, weibliche Formen und Präpositionen
automatisch mit ein. Sollen nur diese Tabellen nachgezogen werden, ohne den
ganzen Wortschatz neu zu bauen (das hält die Karten-IDs und damit deinen
Lernfortschritt stabil):
```bash
python3 tools/apply_word_forms.py
```
Beide Wege erzeugen nachweislich dieselben Daten.

**Einzelne Tabellen prüfen:**
```bash
python3 tools/imperative.py        # alle Befehlsformen auflisten
python3 tools/noun_forms.py        # Nomen-Tabelle + Pausalform-Beispiele
python3 tools/adjective_forms.py   # Selbsttest der weiblichen Formen
python3 tools/verb_prepositions.py # Anzahl und Überschneidungen
python3 tools/build_quran.py       # Quran-Daten + Lückenbericht
```

Der Quran-Teil wird getrennt gebaut:
```bash
python3 tools/build_quran.py     # data/quran.json + appdata.js
```
Es meldet dabei jedes Wort aus den Texten, das noch keine Vokabelkarte hat –
diese Liste ist die Arbeitsvorlage, wenn weitere Suren dazukommen.

---

## Hinweise
- **Audio** nutzt die Sprachausgabe des Geräts; eine arabische Stimme ist nicht überall vorhanden.
- **Bild-Import (Texterkennung)** lädt die Erkennung beim ersten Mal aus dem Internet; danach bitte
  das Ergebnis prüfen und korrigieren (arabische OCR ist nicht perfekt).
- **Datenschutz:** Es gibt keinen Server – Fortschritt und eigene Wörter bleiben auf deinem Gerät.
  Über *Einstellungen → Fortschritt sichern* kannst du ein Backup als Datei exportieren.
