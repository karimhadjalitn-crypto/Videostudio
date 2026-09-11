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

**Neu für Adjektive:**

| Feld | Bedeutung | Beispiel |
|---|---|---|
| `feminine` | weibliche Form | `كَبِيرَةٌ` |
| `feminineSpoken` | weibliche Form in Pausalform | `كَبِيرَة` |

**Neu für Verben:**

| Feld | Bedeutung | Beispiel |
|---|---|---|
| `prep` | verlangte Präposition | `إِلَى` bei `اِحْتَاجَ` |
| `prepNote` | Warnung, wenn Deutsch eine Präposition hat und Arabisch nicht | „warten auf → ohne Vorwort" |

**Sprechform — wichtige Einschränkung:** Die Pausalform wird nur für
flektierende Wortarten gebildet. Präpositionen, Konjunktionen und Pronomen
sind *mabnī*: ihre Endung gehört zum Wort und fällt nicht weg. مَعَ bleibt
مَعَ („maʿa l-bayt"), هُوَ bleibt هُوَ. Diese Wörter stehen nie am Satzende,
eine Pausalform existiert dort gar nicht.

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
| 1 | **Datenfundament** — Plural + Genus für 245 Nomen, weibliche Form für 102 Adjektive, Präpositionen für 71 Verben, Datenkorrekturen, „Fehler melden"-Knopf | **fertig** |
| 2 | **Quran-Trakt** — Frequenzwortschatz, Gebetstexte, Suren Wort für Wort, Quran-Grammatik | **fertig** |
| 3 | **Der Pfad** — Tagesprogramm, Soll-Ist gegen die Termine, Meilensteine | offen |
| 4 | **Reden** — Alltagswortschatz ausbauen, Sprechübungen, Sprech-Grammatik | offen |
| 5 | **Feinschliff** — UX-Korrekturen, vollständiger Testdurchlauf | offen |

Nach jeder Etappe ist die App benutzbar. Kein Zustand, in dem sie tagelang
kaputt ist.

## 9a. Stand des Quran-Trakts

**Wortschatz: 343 Wörter** in fünf Stufen (`tools/quran_words.py`)

| Stufe | Inhalt | Wörter |
|---|---|---|
| 1 | Funktionswörter und Spitzenreiter | 60 |
| 2 | häufigste Nomen | 69 |
| 3 | häufigste Verben | 70 |
| 4 | Eigenschaften und Gottesnamen | 55 |
| 5 | Wörter aus den Suren und Gebetstexten | 89 |

121 davon stehen auch im Alltagswortschatz und sind verknüpft (`also`) –
sie werden nicht zweimal von vorn gelernt. Das bestätigt die Annahme aus
Abschnitt 2: der Gesamtaufwand ist deutlich kleiner als die Summe beider Listen.

Häufigkeitszahlen stehen nur bei 25 Wörtern, wo sie belastbar sind. Die
Lernreihenfolge hängt an der Stufe, nicht an der Zahl – eine erfundene
Häufigkeit wäre schlechter als gar keine.

**Texte: 16, davon 14 Suren und 2 Gebetstexte** (`tools/quran_texts.py`),
zusammen 81 Verse und 352 Wortformen, davon 318 mit dem Wortschatz verknüpft:

- **Sure 104 bis 114 lückenlos** – al-Humazah, al-Fīl, Quraysh, al-Māʿūn,
  al-Kawthar, al-Kāfirūn, an-Naṣr, al-Masad, al-Ikhlāṣ, al-Falaq, an-Nās
- dazu al-Fātiḥa, al-Qadr, al-ʿAṣr
- Taschahhud, Adhkār aus Rukūʿ und Sujūd

Stufe 5 existiert, weil eine reine Häufigkeitsliste die kurzen Suren schlecht
abdeckt – genau die werden aber täglich gebetet. Beim Bauen meldet
`tools/build_quran.py` jedes Textwort, das noch keine Vokabel hat; diese Liste
ist die Arbeitsvorlage, wenn weitere Suren dazukommen.

**Grammatik: 7 Themen** (`tools/quran_grammar.py`) – Pronominalsuffixe,
Präsens-Vorsilben, Genitivverbindung, der Artikel und die Sonnenbuchstaben,
Verneinung (لَا / لَمْ / لَنْ / مَا), die häufigen Partikeln, und die Wurzel als
Schlüssel zu ganzen Wortfamilien. Jede Regel steht an einem Vers, der in der
App liegt; der Verweis springt direkt dorthin. Der Build prüft, dass jeder
Versverweis existiert.

**Noch offen:** weitere Suren aus Juz ʿAmma (die Lückenliste aus
`build_quran.py` ist die Arbeitsvorlage).

## 9b. Offene Fragen an Karim

Gesammelt während der Nachtschicht, zu klären bevor es weitergeht:

1. **Navigation.** Der Quran-Bereich hängt zurzeit auf der Startseite unter den
   Decks. Soll er einen **eigenen Tab** in der unteren Leiste bekommen? Es wären
   dann sechs statt fünf Tabs – auf dem iPhone etwas enger, dafür ist der Quran
   immer einen Fingertipp entfernt. Da er das Hauptziel ist, spricht viel dafür.
2. **Schreibweise.** Die Verse stehen in der modernen vokalisierten Standardform
   (الْحَمْدُ). Mushafs nach Uthmani-Satz schreiben teils anders (ٱلْحَمْدُ, zusätzliche
   Lesezeichen). Soll ich näher an das Schriftbild deines Mushafs?
3. **Übersetzungsstil.** Ich übersetze bewusst wörtlich („Dir allein dienen wir"),
   damit Wort und Bedeutung zusammenpassen. Lieber flüssiger formuliert?
4. **Welche Suren als nächstes?** Bisher die kürzesten und meistgebeteten.
   Welche betest du am häufigsten, welche kannst du auswendig und willst sie
   endlich verstehen?
5. **Quran-Grammatik – Umfang.** Vorschlag: Pronominalsuffixe (ـهُ، ـكَ، ـنَا),
   Präsens-Vorsilben, Dual, und die Partikeln, die ständig vorkommen
   (إِنَّ، أَنَّ، لَمْ + Jussiv). Keine Kasus-Feinheiten. Passt das?
6. **Tagespensum für den Pfad (Etappe 3).** Gerechnet war: 4 neue Wörter am Tag
   ergeben 600 bis Ramadan. Im System stecken jetzt 311 – das trägt gut zwei
   Monate. Bleibt es bei 4, oder lieber flexibler („heute wenig Zeit")?

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
