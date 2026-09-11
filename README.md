# Arabisch lernen 🕌

Eine schlichte, übersichtliche Lern-App für Arabisch (**Fuṣḥā** und Sprechform „nah an Fuṣḥā"),
aufgebaut aus deinem Lehrbuch und deiner eigenen Vokabelliste.

Karteikarten · Multiple-Choice-Quiz · Satzstrukturen · Fortschritts-Tracking mit
Wiederholungssystem · eigene Wörter hinzufügen · installierbar als App (offline).

---

## Was drin ist

- **614 Vokabeln** – das komplette Lehrbuch **plus** deine 100 Wörter, zusammengeführt
  (160 Verben, 245 Nomen, 102 Adjektive, Präpositionen,
  Konjunktionen, Fragewörter).
- **100 Satzmuster** mit Wort-für-Wort-Übersetzung.
- **20 Redewendungen** und eine vollständige Verb-Konjugationstabelle.
- Jede **Verb-Karte** zeigt **Vergangenheit + Präsens + Zukunft + Befehlsform** zusammen
  (Befehlsform = Imperativ/صيغة الأمر, z. B. ذَهَبَ → **اِذْهَبْ** „geh!“).
- Jede Karte zeigt **Fuṣḥā (mit Harakat)** und die **Sprechform**.
- Wo möglich ein **Beispielsatz** auf der Karte, mit hervorgehobenem Wort (aus den 100 Satzmustern).

### Decks
- Verben (160)
- Familie und Menschen (31)
- Haus und Alltag (30)
- Essen und Trinken (33)
- Orte und Reisen (33)
- Religion und Moschee (29)
- Studium und Arbeit (32)
- Körper und Gesundheit (27)
- Natur, Wetter und Dinge (30)
- Adjektive (102)
- Präpositionen & Orte (24)
- Konjunktionen (20)
- Fragewörter & Pronomen (25)
- Meine Wörter (38)

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
> sind berücksichtigt; Hoch- und Querformat auf dem iPad funktionieren.

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
| 🃏 **Karteikarten** | Nomen zeigen **Einzahl und Mehrzahl** – jeweils volles Fuṣḥā und die Sprechform darunter – plus **männlich/weiblich**. Verben zeigen alle vier Formen (Vergangenheit · Präsens · Zukunft · Befehlsform). Umdrehen, selbst einschätzen in vier Stufen (*Nochmal / Schwer / Gut / Leicht*) – unter jedem Knopf steht, wann die Karte wiederkommt. Richtung DE→AR, AR→DE oder gemischt. **Wischen** (rechts = Gut, links = Nochmal, hoch = Leicht, runter = Schwer), **Tastatur** (Leer = umdrehen, 1/2/3/4 = bewerten) und **⭐-Stern** zum Merken. |
| 🎯 **Quiz** | **Sehen** (Multiple Choice) und **Hören** (Wort anhören, Bedeutung wählen). Tastatur 1–4. Speist denselben Fortschritt. |
| 💬 **Sätze** | **Baukasten** (Wörter ordnen), **Muster** (Satz-Karten), **Ersetzen** (Lückentext + Variante). |
| ➕ **Neu** | Eigene Wörter **tippen** (mit arabischer Bildschirmtastatur), aus **Datei** (.txt/.csv/.docx) oder per **Bild** (Texterkennung) importieren. |
| 🔍 **Suche** | Globale Suche auf der Startseite über alle Vokabeln (Deutsch oder Arabisch). |
| ⭐ **Favoriten** | Wörter mit dem Stern markieren und gezielt als eigenes Deck üben. |
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
  finalize_data.py      mit Karims Liste zusammenführen -> data/
  generate_icons.py     Icons erzeugen
```

### Daten neu bauen
```bash
python3 tools/build_data.py      # .docx  -> tools/_raw_book.json
python3 tools/finalize_data.py   # + Karims Liste -> data/*.json + appdata.js
python3 tools/generate_icons.py  # Icons
python3 tools/imperative.py      # nur pruefen: alle Befehlsformen auflisten
```

---

## Hinweise
- **Audio** nutzt die Sprachausgabe des Geräts; eine arabische Stimme ist nicht überall vorhanden.
- **Bild-Import (Texterkennung)** lädt die Erkennung beim ersten Mal aus dem Internet; danach bitte
  das Ergebnis prüfen und korrigieren (arabische OCR ist nicht perfekt).
- **Datenschutz:** Es gibt keinen Server – Fortschritt und eigene Wörter bleiben auf deinem Gerät.
  Über *Einstellungen → Fortschritt sichern* kannst du ein Backup als Datei exportieren.
