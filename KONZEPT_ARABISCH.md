# Konzept: Arabisch-Lern-App

Stand: 11. September 2026 · Lernender: Karim · Diese Datei ist die verbindliche
Grundlage für alle weiteren Arbeiten an der App im Root-Verzeichnis.
(Nicht zu verwechseln mit `KONZEPT.md` — das gehört zur Mīzān-App in `leben/`.)

---

## 1. Ausgangslage und Zweck

Karim hat den Arabisch-Unterricht beendet: zu eintönig, kein Eingehen auf ihn,
Vorwissen wurde als selbstverständlich vorausgesetzt. **Die App ersetzt den
Unterricht vollständig.** Sie ist das einzige Lernmittel und wird täglich benutzt.

Daraus folgen drei Grundsätze, die jede Design-Entscheidung schlagen:

1. **Nichts voraussetzen.** Jede neue Sache wird erklärt, bevor sie abgefragt wird.
   Kein „das weißt du ja".
2. **Immer vollständig vokalisiert.** Jede arabische Zeichenkette in der App trägt
   volle Harakat — Vokabeln, Plurale, Beispielsätze, Quranwörter. Ohne Ausnahme.
   Karim kann ohne Harakat nicht sicher lesen.
3. **Die App passt sich an, nicht umgekehrt.** Die verfügbare Lernzeit schwankt
   stark von Tag zu Tag. Das Tagesprogramm muss das abfangen, ohne zu bestrafen.

## 2. Ziele mit Terminen

| Termin | Ziel |
|---|---|
| **Ramadan 1448** (ca. 18.02.2027, ~160 Tage) | Große Teile des Quran im Original verstehen |
| **Sommer 2027** (~280 Tage) | Frei sprechen können — Familie, Freunde, Reise, Moschee |

**Quran-Rechnung:** 300 Wörter decken ~70 % aller Wortvorkommen ab, 600 Wörter
~80 %, 1000 Wörter ~85–90 %. Zielmarke bis Ramadan: **600 Wörter = 4 neue pro Tag.**

Ehrliche Einordnung, die dem Lernenden auch so kommuniziert wird: 70 % Abdeckung
bedeutet nicht 70 % Verständnis — bei 70 % ist noch jedes dritte Wort unbekannt.
Echtes Verstehen stellt sich ab ~85 % ein. Keine Versprechen über das hinaus,
was die Zahlen hergeben.

**Sprech-Ziel:** ~1.500 aktive Alltagswörter. Große Überschneidung mit dem
Quran-Wortschatz (قَالَ، بَيْت، يَوْم، نَاس …), der Gesamtaufwand ist also kleiner
als die Summe beider Listen.

## 3. Sprachform

- **Alltagsvokabeln:** immer **beide** Formen auf der Karte — volles Fusha mit
  Tanwin (بَيْتٌ) *und* die Pausalform „nah an Fusha" ohne Flexionsendung (بَيْت).
  Gesprochen wird die Pausalform.
- **Quranvokabeln:** **keine** Pausalform. Der Quran wird so wiedergegeben, wie
  er dasteht, voll vokalisiert.
- **Dialekt:** kein Thema. Ziel ist Fusha-nahes Sprechen.
- **Synonyme:** sparsam. Wo es mehrere Wörter gibt, gewinnt das im Sprachgebrauch
  gängigere. Zwei Karten mit identischer deutscher Bedeutung sind ein Fehler —
  entweder fliegt eine raus oder die Bedeutungen werden präzisiert
  (أَمَامَ = räumlich vor, قَبْلَ = zeitlich vor).

## 4. Datenmodell

Bestehende Felder: `id, type, category, de, fusha, spoken, present, future,
imperative, ex, example, source`.

**Neu für Nomen:**

| Feld | Bedeutung | Beispiel |
|---|---|---|
| `genus` | `m` oder `f` | `m` |
| `plural` | Plural, voll vokalisiert | `بُيُوتٌ` |
| `pluralSpoken` | Plural in Pausalform | `بُيُوت` |

**Neu für Verben:**

| Feld | Bedeutung | Beispiel |
|---|---|---|
| `prep` | verlangte Präposition | `إِلَى` bei `اِحْتَاجَ` |

**Neu für Quranvokabeln** (eigener Bereich, eigene Datei):

| Feld | Bedeutung |
|---|---|
| `root` | Wurzel (drei Radikale) |
| `freq` | Häufigkeit im Quran |
| `lemma` | Grundform für die Vokabelkarte |
| `occurs` | Belegstellen (Sure:Vers) |

Quranwörter erscheinen auf der **Vokabelkarte als Grundform** (رَحْمَة), in der
**Wort-für-Wort-Ansicht der Sure** dagegen in der Form, die dort tatsächlich
steht (الرَّحْمَٰنِ). Sonst erkennt man die gelernte Vokabel im Mushaf nicht wieder.

## 5. Aufbau der App

**Trakt A — Alltag/Sprechen**
Wortschatz nach Themen, Sätze, Sprechübungen, Grammatik nur soweit zum Reden nötig.

**Trakt B — Quran**
Frequenz-Wortschatz · Gebetstexte (al-Fātiḥa, Taschahhud, Adhkār, kurze Suren) ·
Suren Wort für Wort antippbar · nur die Grammatik, die im Quran vorkommt.

Wichtig: Die reine Häufigkeitsliste deckt Juz ʿAmma schlecht ab — die kurzen
Suren enthalten viel seltenes Vokabular. Deshalb zweigleisig: Häufigkeitsliste
als Hauptstrang **plus** ein eigener Block mit genau den Wörtern aus den Texten,
die täglich gebetet werden.

**Der Pfad** (klammert beide Trakte)
- Tagesprogramm in zwei Größen: **Mindestdosis** (~5 Min, damit nichts verfällt)
  und **Vollprogramm** (~20 Min).
- Kein Streak, der bei einem ausgelassenen Tag bestraft. Stattdessen ehrlicher
  Soll-Ist-Abgleich gegen die Zieltermine: „im Plan" / „hinten dran".
- Meilensteine an **Fähigkeiten** gekoppelt, nicht an Punkte:
  „Du verstehst al-Fātiḥa Wort für Wort", nicht „Level 7".

## 6. Sprechübungen (ohne Mikrofon)

Bewusst ohne Spracherkennung:
- Deutscher Satz → laut auf Arabisch sagen → auflösen → selbst bewerten.
- Rollen-Dialoge: die App gibt eine Situation vor („Du bist im Laden, frag nach
  dem Preis"), Karim antwortet laut.
- Satzbaukasten (existiert bereits).

## 7. Audio — offen

Aktuell: Systemstimme des Geräts, klingt je nach Gerät anders und liest Harakat
unzuverlässig. Entscheidung vertagt.

Architektur trotzdem so bauen, dass Audio eine **austauschbare Schicht** ist:
Läuft vorerst über die Systemstimme weiter; sobald entschieden, lassen sich
vorproduzierte MP3s (Cloud-TTS, einmalig erzeugt, offline abgelegt) nachschalten,
ohne dass etwas umgebaut werden muss.

## 8. Datenqualität — was geht und was nicht

**Einschränkung dieser Arbeitsumgebung:** Externe Seiten sind gesperrt
(Wiktionary, Tanzil, quran.com, alle per 403 blockiert). `WebFetch` und `curl`
kommen nicht raus, nur `WebSearch` liefert Treffer. Wörterbuch-Dumps, Quran-Korpora
und Frequenzlisten lassen sich also **nicht als Datei beziehen**.

Daraus folgt das Verfahren:

1. Daten werden aus dem Sprachwissen des Modells erzeugt — bei gängigem
   Vokabular und beim Quran-Kernwortschatz (dem am besten dokumentierten
   Wortbestand des Arabischen) ist das tragfähig.
2. **Maschinelle Prüfungen** in der Pipeline: Harakat-Vollständigkeit, bekannte
   Pluralmuster, Wurzel-Konsistenz, Dubletten, doppelte deutsche Bedeutungen,
   Zeichenplausibilität.
3. **Gezielte Stichproben** per `WebSearch` bei Zweifelsfällen.
4. **„Fehler melden"-Knopf** an jeder Karte in der App. Bei diesem Umfang ist das
   Pflicht, nicht Kür: Auffälliges wird sofort markiert und gesammelt korrigiert.

Ein Anspruch auf 100 % Fehlerfreiheit bei mehreren tausend Einträgen wäre
unehrlich. Ziel ist: alles Prüfbare maschinell geprüft, Unsicheres markiert,
Korrekturweg eingebaut.

## 9. Etappen

| # | Inhalt | Status |
|---|---|---|
| 1 | **Datenfundament** — Plural + Genus für 245 Nomen, Verb-Präpositionen, Dubletten und Übersetzungsfehler bereinigen, Prüfskripte | in Arbeit |
| 2 | **Quran-Trakt** — Frequenzwortschatz, Gebetstexte, Suren Wort für Wort, Quran-Grammatik | offen |
| 3 | **Der Pfad** — Tagesprogramm, Soll-Ist gegen die Termine, Meilensteine | offen |
| 4 | **Reden** — Alltagswortschatz ausbauen, Sprechübungen, Sprech-Grammatik | offen |
| 5 | **Feinschliff** — UX-Korrekturen, vollständiger Testdurchlauf | offen |

Nach jeder Etappe ist die App benutzbar. Kein Zustand, in dem sie tagelang
kaputt ist.

## 10. Bekannte Datenfehler (Stand der ersten Prüfung)

Gefunden am 11.09.2026, zu beheben in Etappe 1:

- **Wortart falsch:** „reisen" → سَفَرٌ ist das Nomen *die Reise*; „essen" →
  طَعَامٌ ist *die Speise*; „fasten" → صِيَامٌ ist *das Fasten*.
- **Bedeutung unpräzise:** „vor" steht für أَمَامَ (räumlich) *und* قَبْلَ (zeitlich).
- **Echte Synonympaare:** Vater أَب/وَالِد, Mutter أُمّ/وَالِدَة,
  zurückkehren رَجَعَ/عَادَ, was? مَا/مَاذَا, hungrig جَائِع/جَوْعَان.
- **Formatfehler:** اَلدَّجَاجَةُ trägt als einzige Karte den Artikel mit.
- 14 Wortpaare teilen sich das Schriftbild ohne Harakat (ذهب *gehen* / *Gold*) —
  bei abgeschalteten Harakat im Quiz nicht unterscheidbar.
