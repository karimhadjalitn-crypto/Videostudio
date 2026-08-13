# Sūq (السوق)

Werkstatt für TikTok-Shop-Videos. Skript, Einstellungen, Prompt, Kennzeichnung —
und ein Montagewerkzeug, das daraus eine fertige MP4 baut.

## Zwei Fassungen

| Datei | Wofür |
|---|---|
| **`artifact.html`** | Die gepflegte Fassung. Eine einzelne Seite, läuft als Artifact in Claude. Zehn Sekunden sind hier der Normalfall, das Prompt-Feld sitzt hier. Hier wird weiterentwickelt. |
| `index.html` + `js/` | Die modulare Fassung für den Betrieb als installierte Web-App auf dem Startbildschirm. Längere Formate, ElevenLabs direkt angebunden. |

Beide speichern nur auf dem Gerät, beide brauchen keinen Server und kein Konto.

**Was die Artifact-Fassung nicht kann:** Eine Artifact-Seite darf keine
Verbindung nach außen aufbauen. ElevenLabs lässt sich dort also nicht selbst
rufen. Stattdessen stellt der Prompt-Baukasten einen vollständigen Auftrag
zusammen — Produktdaten, Sekundenbudget, Grenzen, Kennzeichnungspflicht —, den
du an Claude gibst; Stimme und Schnitt entstehen dort.

## Formate

| Format | Länge | Aufbau |
|---|---|---|
| **Kurz** | 10 s, ~24 Wörter | Hook → Nutzen → Aufforderung |
| Mittel | 20 s, ~48 Wörter | Hook → Problem → Nutzen → Beweis → Aufforderung |
| Lang | 35 s, ~84 Wörter | die sechs Teile vollständig |

Kurz ist die Vorgabe. Das ist keine gekürzte Fassung des langen Formats,
sondern ein anderes: bei zehn Sekunden hat man rund 24 Wörter, und darin ist
kein Platz für Problem, Beweis und Einwand nacheinander — der Nutzen trägt den
Beweis gleich mit.

Die **Zeitleiste** zeigt beim Tippen mit, wie viel Budget übrig ist, und sagt
bei Überlänge, wie viele Wörter zu streichen sind.

---

## Wofür das da ist

Affiliate-Videos für islamische Produkte — Gebetsteppiche, Abayas, Attar,
Tasbīḥ, Bücher. Die Videos sollen **echt aussehen** und **verkaufen**, und
das steht von Anfang an fest: Sūq baut keine Stimmungsvideos, sondern
Werbung, die sich als Werbung zu erkennen gibt.

### Die Grenzen

Sie sind keine Einstellung unter vielen, sondern der Rahmen:

| | |
|---|---|
| **Keine Menschen im Bild** | Keine Gesichter, keine Personen. Die eigene Hand am Produkt ist erlaubt, solange niemand ins Bild kommt. |
| **Keine weiblichen Darstellungen** | Kleidung auf dem Bügel, flach ausgelegt oder auf der kopflosen Schneiderpuppe. Nie am Körper. |
| **Keine Musik** | Nasheed ohne Instrumente, die Stimme allein oder Ambient. |
| **Keine Übertreibung** | Keine Heilversprechen, keine Superlative ohne Beleg. |
| **Kein Riba** | Ratenzahlung und „jetzt kaufen, später zahlen“ werden nicht mitbeworben. |

Der **Wächter** prüft jedes Skript und jede Einstellung dagegen — beim Tippen,
nicht erst am Ende. Ein Befund nennt immer den sauberen Ersatz, nicht nur das
Verbot.

### Warum keine KI-Videos

Sūq erzeugt keine Bilder. Gearbeitet wird mit den freigegebenen Fotos des
Sellers und deinem eigenen Material, bewegt durch eine ruhige Kamerafahrt.

Das ist kein Verzicht, sondern die bessere Wahl:

- **Es sieht echter aus, weil es echt ist.** Bild-KI verformt genau das, was
  du verkaufst — Stoff fließt, Muster verlaufen, Stickerei wird zu Matsch,
  arabische Schrift zu Fantasiezeichen.
- **Die härteste Grenze hält bauartbedingt.** Was nicht erzeugt wird, kann
  nicht falsch entstehen. Kein Modell kann versehentlich einen Menschen
  erfinden, wenn gar kein Modell im Spiel ist.

---

## Aufbau

Vier Reiter:

- **Pipeline** — jedes Video von `Idee → Skript → Stimme → Gedreht → Geschnitten → Gepostet`.
  Was liegen bleibt, sieht man an der Zahl neben der Stufe.
- **Produkte** — Preis, Provision, Merkmale, Einwände, Fotos und die
  **Freigabe des Sellers**. Ohne Freigabe sperrt der Wächter jedes Video.
- **Zahlen** — Aufrufe, Klicks, Bestellungen, Provision. Rangliste der Produkte
  nach **Provision je tausend Aufrufe**.
- **Mehr** — Grenzen, Klang, Rechtliches, Stimme, Ziele, Sicherung.

Die **Werkstatt** hängt unter der Pipeline und hat vier Abteilungen: Skript,
Einstellungen, Stimme, Rechtliches.

### Das Skript

Sechs Abschnitte, in dieser Reihenfolge, weil jeder den nächsten trägt:

```
Hook      Warum jemand nicht weiterwischt        0–3 s
Problem   Warum ihn das angeht                   3–8 s
Produkt   Was es ist und was es löst             8–18 s
Beweis    Warum das stimmt und nicht nur klingt 18–26 s
Einwand   Was ihn noch abhält, vorweggenommen   26–32 s
CTA       Was er jetzt tun soll                 32–38 s
```

Die Hook-Bibliothek ist nach Kategorie sortiert. Einige Hooks tragen die
Werbekennzeichnung im Satz selbst — „Werbung — aber für etwas, das seit
Monaten bei mir liegt.“ Das erfüllt die Pflicht ganz vorn, kostet keine
Sekunde Aufmerksamkeit, und Offenheit wirkt auf TikTok ohnehin besser als
ein halb verstecktes „Ad“.

---

## Rechtliches

Sūq ist ein Werkzeug, keine Rechtsberatung. Es folgt zwei Quellen:

**Werbekennzeichnung** — Leitfaden der Medienanstalten zur Kennzeichnung bei
Online-Medien:

- Anerkannt sind allein **„Werbung“** und **„Anzeige“**. „Ad“, „Sponsored“,
  „Kooperation“ und „Paid Partnership“ genügen nicht.
- Sie muss **am Anfang** stehen und darf nicht zwischen Hashtags verschwinden.
- Der plattformeigene Branded-Content-Schalter allein reicht nach dieser
  Auffassung **nicht** — er kommt zusätzlich.
- Beim Affiliate-Link gehört der Provisionshinweis **direkt an den Link**.

**KI-Kennzeichnung** — Verordnung (EU) 2024/1689, Artikel 50, **gilt seit dem
2. August 2026**: synthetisches Audio muss als künstlich erzeugt gekennzeichnet
werden. Dein ElevenLabs-Voiceover fällt darunter. Sūq setzt den Hinweis in den
Beschreibungstext; den Schalter für KI-Inhalte in TikTok musst du selbst setzen.

Im Zweifel fragst du jemanden, der dafür haftet.

---

## Die Stimme

Unter *Mehr → Stimme* trägst du deinen ElevenLabs-Schlüssel ein. Er bleibt auf
dem Gerät, geht nur an ElevenLabs und wandert **nicht** in die Sicherungsdatei.
Stimmen lassen sich vor der Auswahl probehören, ohne ein ganzes Skript durch
das Kontingent zu jagen.

---

## Vom Skript zum Video

1. In der Werkstatt unter *Rechtliches* **Bauplan sichern** — eine JSON-Datei.
2. Unter *Stimme* das Voiceover erzeugen — landet als MP3 im Download-Ordner.
3. Die Produktfotos und dein eigenes Material in einen Ordner legen.
4. Montieren:

```bash
python3 tools/suq_video.py bauplan.json --bilder ./fotos --stimme suq-video.mp3
```

Ergebnis: eine MP4 in 1080×1920, 30 fps, mit Kamerabewegung, eingebrannten
Untertiteln und der Werbekennzeichnung in den ersten Sekunden.

Zum Ausprobieren `--schnell` anhängen — halbe Auflösung, etwa dreimal so
schnell, nicht zum Hochladen.

**Voraussetzungen:** `ffmpeg` und `ffprobe` im Pfad, dazu Pillow
(`python3 -m pip install pillow`).

Das Werkzeug streckt die geschätzte Zeitachse aus der App auf die tatsächliche
Länge des Voiceovers. Ohne das läuft das Bild dem Ton davon, und zwar zunehmend,
je länger das Video wird.

---

## Nutzung

```bash
python3 -m http.server 8000
# dann http://localhost:8000/studio/ öffnen
```

Über einen Server öffnen, nicht per Doppelklick — wegen des Service Workers.

Auf dem iPhone: Pages-URL in Safari öffnen → Teilen → *Zum Home-Bildschirm*.

**Sichern nicht vergessen.** Hier hängen Produktfotos und Skripte am
Browser-Speicher. Geht der verloren, ist alles weg. *Mehr → Sicherung → Mit Fotos.*

---

## Was Sūq nicht macht

Nicht auf TikTok hochladen, keine Zugangsdaten speichern, keine Konten
anlegen. Die App bereitet vor — posten tust du selbst.

## Erwartung

Die ersten Monate bringen wenig. Spürbar wird es erfahrungsgemäß frühestens
ab Monat neun, und auch dann nur, wenn ein oder zwei Produkte wirklich tragen.
Die Zahlen-Ansicht ist dafür da, genau diese Produkte zu finden — und sie sagt
dir auch, wenn die Datenlage für eine Aussage noch zu dünn ist.
