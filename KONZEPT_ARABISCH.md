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

## 7. Audio — entschieden: die iPhone-Stimme

*Entschieden am 12.09.2026: „Ja, dann lass einfach die iPhone Stimme."*

Es bleibt bei der Systemstimme des Geräts. Der Grund ist nüchtern: Die
arabischen Stimmen bei ElevenLabs liegen samt und sonders hinter einer
Tarifstufe, die Karims Konto nicht hat — alle 25 sind Bibliotheksstimmen und
verlangen „creator tier or above". Eine bessere Stimme wäre also nicht
gratis zu haben, und eine schlechte gekaufte wäre keine Verbesserung.

Was die Systemstimme brauchbar macht:

- **Stimmenauswahl** in den Einstellungen, falls mehrere arabische Stimmen
  installiert sind — iOS liefert je nach Gerät unterschiedliche.
- **Anleitung, wenn keine installiert ist.** Ohne arabische Stimme liest iOS
  den Text mit deutscher Aussprache vor, was schlimmer ist als Stille. Steht
  keine bereit, nennt die Einstellungsseite jetzt den Weg: iPhone-Einstellungen
  › Bedienungshilfen › Gesprochene Inhalte › Stimmen › Arabisch.

Die Schicht bleibt austauschbar (`js/audio.js`): Sollten später vorproduzierte
MP3s dazukommen, muss an den Ansichten nichts geändert werden.

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
| 3 | **Der Pfad** — Tagesprogramm in drei Größen, Soll-Ist gegen die Termine | **fertig** |
| 4 | **Reden** — Alltagswortschatz von 614 auf 1309 Wörter ausgebaut, elf neue Themen | **fertig** |
| 5 | **Feinschliff** — iPad-Layout, Rundumprüfung, gefundene Fehler behoben | **fertig** |

Sprechübungen waren für Etappe 4 vorgesehen und sind auf Karims Wunsch
gestrichen („Die Sprachübung kannst du weglassen", 12.09.2026).

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

## 9c. Der Pfad (Etappe 3)

**Drei Tagesgrößen**, weil die verfügbare Zeit stark schwankt:

| Größe | Zeit | Wiederholungen | neue Wörter |
|---|---|---|---|
| Kurz | ~5 Min | max. 10 | 0 (bzw. 3, wenn nichts fällig ist) |
| Normal | ~15 Min | max. 25 | 5 |
| Lang | ~30 Min | max. 50 | 12 |

Die kleinste Größe darf nie ins Leere laufen: Sind keine Wiederholungen
fällig, gibt es auch dort drei neue Wörter – sonst wäre ein kurzer Tag
wertlos.

**Fällige Wiederholungen** kommen zuerst und aus beiden Trakten gemischt,
schwächste Karten zuerst. Was über die Tagesgröße hinausgeht, wartet – es
geht nichts verloren, und die App sagt das auch so.

**Neue Wörter** verteilen sich automatisch: bis Ramadan 70 % Quran / 30 %
Alltag, danach umgekehrt. Ist ein Trakt leer, füllt der andere auf.

**Soll-Ist gegen die Termine** statt Streak-Druck: Das Soll verteilt sich
linear über die Laufzeit ab dem ersten Tag mit Pfad (`pathStart`). Angezeigt
wird „im Plan" oder „hinten dran", dazu wie viele Wörter pro Tag noch nötig
sind. Ein ausgelassener Tag kostet nichts außer ein paar Zehntel im Tagessoll.

Umgesetzt in `js/path.js`; das Tagesprogramm ist über das Deck `today`
erreichbar und nutzt Karteikarten und Fortschritt unverändert mit.

## 9d. Der Wortschatz-Ausbau (Etappe 4)

**614 → 1309 Wörter.** Die neuen Einträge stehen in `tools/vocab_extra.py`,
eingetragen werden sie von `tools/build_extra.py` direkt in `data/vocab.json` –
wie schon bei `apply_word_forms.py`, damit die Karten-IDs und damit der
Lernfortschritt stehen bleiben.

Eine Lückenprüfung zeigte, dass alltäglichste Wortfelder ganz fehlten: Zahlen,
Farben, Wochentage, Kleidung, Berufe. Elf Themen sind neu dazugekommen:

| Thema | Wörter | Thema | Wörter |
|---|---|---|---|
| Zahlen | 30 | Tiere | 24 |
| Farben | 15 | Stadt und Einkaufen | 28 |
| Zeit und Kalender | 28 | Technik und Medien | 23 |
| Kleidung | 14 | Gefühle und Charakter | 31 |
| Berufe | 14 | Kleine Wörter | 37 |
| Höflichkeit und Gespräch | 32 | | |

Dazu 128 neue Verben und Zuwachs in allen bestehenden Themen. Alles voll
vokalisiert, Nomen mit Plural und Genus, Adjektive mit weiblicher Form,
Verben mit Präsens, Zukunft, Befehlsform und – wo nötig – Rektion.

**Abgeleitet statt abgeschrieben.** Sprechform, weibliche Form, Zukunft und
Befehlsform entstehen aus den vorhandenen Regeln (`noun_forms.pausal`,
`adjective_forms.feminine`, `imperative.imperative`). Nur was nicht ableitbar
ist, steht in der Quelle: Plural, Genus, Präsensvokal, Rektion und die
Ausnahmen (Farben nach أَفْعَلُ/فَعْلَاءُ, Diptote, manqūṣ).

**Neu: der Hinweis auf der Karte.** Ein Feld `note` für den einen Satz, der
sonst fehlt – die umgekehrte Zahl-Kongruenz (ثَلَاثَةُ كُتُبٍ), die Anrede an
eine Frau (كَيْفَ حَالُكِ؟), die zweite Bedeutung eines Wortes. 19 Karten haben
einen.

**Drei Fehler in der Ableitung gefunden und behoben:**

- Die Zukunft bekam ein سـ ohne Fatha (`سيَذْهَبُ` statt `سَيَذْهَبُ`).
- Vierbuchstabige Verben bekamen eine Hamza vorgesetzt (`أَتَرْجِمْ` statt
  `تَرْجِمْ`). Die Unterscheidung läuft jetzt über den Vokal auf dem ersten
  Stammbuchstaben: Fatha heißt Form II/III/vierbuchstabig (keine Hilfssilbe),
  Sukūn oder Kasra heißt Form IV (Hamzat qaṭʿ). An den 160 bestehenden Verben
  ändert sich dadurch nichts – geprüft.
- Vier Verben mit Hamza folgen der Regel nicht und stehen jetzt als Ausnahme:
  يَأْمُرُ → مُرْ, يُؤَكِّدُ → أَكِّدْ, يُؤْلِمُ → آلِمْ, يَأْمَلُ → اِئْمَلْ.

**Dubletten.** Der Build vergleicht jedes neue Wort mit dem Bestand – mit
Vokalzeichen, ohne Artikel. Ohne Vokalzeichen zu vergleichen wäre falsch:
شَعْرٌ *Haar* und شَعَرَ *fühlen* sind zwei Wörter. 30 solcher Paare meldet der
Build als Hinweis; elf echte Dubletten wurden vorher aus der Quelle genommen.

Dabei fielen drei Dubletten im **alten** Bestand auf und sind behoben:
أَرْضٌ stand zweimal (*Boden* und *Erde*) – eine Karte heißt jetzt أَرْضِيَّةٌ
*Fußboden*; دَجَاجٌ und دَجَاجَةٌ hießen beide *Huhn*; حَتَّى steht als Vorwort
und als Konjunktion und trägt jetzt zwei klar getrennte Bedeutungen.
Zusätzlich fallen im Quiz jetzt alle Karten mit demselben arabischen Wort als
Ablenker aus – eine „falsche" Antwort, die in Wahrheit richtig ist, kann so
nicht mehr vorkommen.

**Zwei Anzeigefehler**, gefunden beim Durchmessen aller 13 216 Kartenseiten
(1309 + 343 Karten × 2 Richtungen × 2 Seiten × 2 Breiten):

- Karten mit Beispielsatz waren höher als die Karte. Die Rückseite lag hinter
  einem Innen-Scroll, den man leicht übersieht – die deutsche Übersetzung war
  faktisch unsichtbar. Vorder- und Rückseite liegen jetzt in derselben
  Rasterzelle (`grid-area: 1/1`) statt absolut; die Karte wächst mit.
- Lange deutsche Wörter ohne Trennstelle („aussteigen/hinuntergehen",
  „Maghrib/Sonnenuntergang") schoben sich seitlich aus der Karte –
  behoben mit `overflow-wrap: anywhere`.

Nach der Korrektur: 0 Fehler, 0 enge Stellen, keine Konsolenfehler.

## 9e. Feinschliff und Rundumprüfung (Etappe 5)

### Das iPad

Bis hierher war die App auf **jedem** Bildschirm 680 px breit. Auf einem quer
gehaltenen iPad stand sie damit als schmaler Streifen in der Mitte, links und
rechts je 360 px leer, und man sah keine drei Karten ohne zu scrollen.

Ab 740 px Breite wird die Spalte breiter (840 px, ab 1180 px dann 960 px) —
aber nur dort, wo Breite wirklich hilft:

| Ansicht | auf dem Tablet |
|---|---|
| Startseite | zwei Spalten: links Heute, Serie, Schnellzugriff · rechts Suche und Decks |
| Decks | drei Spalten, ab 1180 px vier |
| Quiz | vier Antworten als 2 × 2 — quer war die vierte vorher unter der Falz |
| Wortliste | zweispaltig; 1309 Vokabeln in einer Spalte sind sehr viel Scrollen |
| Karteikarte, Neues Wort, Sure | bleiben eine ruhige Lesespalte von 620 px |

Damit das Stylesheet je Ansicht anders layouten kann, trägt `#main` jetzt ein
`data-view`-Attribut.

Dazu: Im Manifest stand `"orientation": "portrait"` — die installierte App war
aufs Hochformat festgenagelt. Auf dem iPad ist Querformat die natürliche
Haltung, also `"any"`.

### Was die Prüfung sonst gefunden hat

**Der Schalter, der aus dem Bild lief.** Zwischen 401 und 470 px Breite schob
sich der Richtungs-Schalter in den Einstellungen seitlich heraus. Ursache war
eine feste Gerätegrenze von 400 px, unter der er umbrach. Jetzt entscheidet der
Platz, nicht die Gerätebreite.

**Ziele, die man nicht erreichen konnte.** Die Startseite versprach „0 / 600"
Quranwörter und „0 / 1500" Alltagswörter — vorhanden waren 343 und 1309. Der
Balken hätte nie voll werden können, und die App hätte „hinten dran" gemeldet,
obwohl alles Vorhandene sitzt. Gerechnet wird jetzt gegen das, was wirklich in
der App steht; die geplante Zahl steht als Hinweis daneben („Geplant sind 600 —
257 davon kommen noch dazu"). Ist ein Termin verstrichen, sagt die Karte das,
statt weiter „noch 0 Tage" zu rechnen.

**Eine Zahl, die sprang.** Das Abzeichen am Karten-Tab zeigte die Fälligkeit
des zuletzt geöffneten Decks — beim Stöbern sprang es von 24 auf 99+ auf 5. Als
Hinweis auf offene Arbeit war es damit wertlos. Es zeigt jetzt, was heute offen
ist: dieselbe Zahl, die auch „Heute" nennt. Dasselbe galt für die Zahl neben der
Tagesserie, die die Fälligkeit nur des eigenen Wortschatzes zeigte, direkt neben
einem Fortschritt, der über alle Karten rechnet.

**Über tausend leere Einträge.** Die Liste der schwierigen Wörter geht über
*alle* Karten und benutzte dafür eine Funktion, die fehlende Fortschrittsdaten
gleich anlegt. Ein Blick auf die Statistik schrieb damit 1309 leere Einträge in
den Speicher — die dann in jedem Speichervorgang und in jeder Sicherungsdatei
mitgeschleppt wurden. Es gibt jetzt einen reinen Lesezugriff (`store.peek`), und
beim Start werden Altlasten weggeräumt. Gemessen: 1317 Einträge vorher,
11 nachher.

**Die Suche fand den Quran nicht.** Sie ging nur über den Alltagswortschatz.
Wer ein Wort sucht, sucht das Wort und nicht den Bereich — Quranwörter sind
jetzt dabei und mit einem Merkzeichen versehen.

**Selbst angelegte Wörter waren ärmer als der Rest.** Jede mitgelieferte
Nomen-Karte zeigt Einzahl, Mehrzahl und Genus, jede Adjektiv-Karte beide
Geschlechter — im Formular „Neu" gab es dafür keine Felder. Die Felder sind
jetzt da, und die weibliche Form wird vorgeschlagen. Dafür sind die Regeln aus
`noun_forms.py` und `adjective_forms.py` nach JavaScript portiert
(`data.derivePausal`, `data.deriveFeminine`). Gegengeprüft an allen 1309 Karten:
1306 stimmen mit der Python-Seite überein. Die drei Abweichungen sind
zusammengesetzte Zahlwörter (أَحَدَ عَشَرَ), die *mabnī* sind und ihre Endung
behalten — sie stehen fertig in den Daten und tippt niemand selbst nach.

**Der Hinweis, der zur Überschrift wurde.** In den Einstellungen stand
„Audio-Aussprache (keine arabische Stimme auf diesem Gerät gefunden)" als
Titel — drei Zeilen lang, und der Schalter rutschte darunter aus der Flucht der
anderen. Der Hinweis steht jetzt in der kleinen Zeile darunter, wo er hingehört.

### Updates kommen ohne Zutun an

Der Service Worker lädt eine neue Fassung im Hintergrund und übernimmt sofort
(`skipWaiting` + `clients.claim`). Die Seite, die gerade läuft, führte aber
weiter den alten Code aus — man hätte die App **zweimal** öffnen müssen, um
Neuerungen zu sehen. Die App horcht jetzt auf `controllerchange` und lädt sich
selbst neu. Drei Regeln halten das unaufdringlich:

- Beim **allerersten Besuch** wird nicht neu geladen — der erste
  Controller-Wechsel ist die Erstinstallation, kein Update. Der Zuhörer hängt
  trotzdem von Anfang an dran, sonst ginge ein Update in derselben Sitzung
  verloren.
- **Mitten in einer Lernrunde** wird gewartet. Kommt das Update während
  Karteikarten oder Quiz, erscheint nur ein Hinweis; neu geladen wird, sobald
  die Runde verlassen wird.
- Vor dem Neuladen wird der Fortschritt **festgeschrieben**.

Dabei fiel ein älterer Fehler auf: Gespeichert wird mit 120 ms Verzögerung, und
niemand schrieb beim Verlassen noch einmal weg. Wer direkt nach einer Bewertung
die App wegwischte oder umschaltete, verlor sie. `pagehide` und
`visibilitychange` schreiben jetzt sofort — auf iOS die richtigen Ereignisse,
`beforeunload` ist dort unzuverlässig.

Geprüft mit einem Server, der mitten im Durchlauf von der alten auf die neue
Fassung umschaltet: nach **einmal** Öffnen läuft die neue Fassung, der alte
Cache ist weg, und zwei Bewertungen, die unmittelbar vor dem Wegschalten
gemacht wurden, haben das Update überlebt.

### Geprüft

| Prüfung | Umfang | Ergebnis |
|---|---|---|
| Kartenlayout | 13 216 Kartenseiten (1652 Karten × 2 Richtungen × 2 Seiten × 2 Breiten) | 0 Fehler |
| Bedienelemente | 310 Knöpfe, Schalter und Auswahllisten in 9 Ansichten × 3 Geräten | kein Absturz |
| Bildschirmgrößen | 8 Geräte × 12 Ansichten, hell und dunkel | 0 Probleme |
| Quran | 16 Texte, 96 angetippte Wörter, 68 Grammatikknöpfe | fehlerfrei |
| Daten | 1652 Karten auf Zeichen, Vokalzeichen, Dubletten, Verbformen | 0 Probleme |
| Offline | Netz gekappt, App neu geladen | vollständig |
| Update | alte Fassung installiert, neue veröffentlicht, einmal geöffnet | neue Fassung da, Fortschritt erhalten |
| Tempo | Start 0,56 s · längste Ansicht 32 ms | — |

## 9b. Offene Fragen an Karim

*Alle sechs am 12.09.2026 beantwortet: eigener Tab ja · moderne
Standardschreibung bleibt · wörtliche Übersetzung bleibt · Suren reichen
vorerst · Grammatik passt · Pensum soll stärker mitschwanken.*

Ursprüngliche Liste:

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
