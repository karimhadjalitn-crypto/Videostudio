#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sūq – Montagewerkzeug.

Baut aus einem Bauplan (JSON aus der Sūq-App), einem Ordner mit Produktfotos
und dem Voiceover eine fertige 1080x1920-MP4 für TikTok.

    python3 tools/suq_video.py bauplan.json --bilder ./fotos --stimme vo.mp3

Was es macht:
  · Jede Szene bekommt eine ruhige Kamerabewegung (Ken Burns) auf einem
    echten Foto. Es wird nichts erzeugt — dadurch sieht es echt aus, und
    dadurch kann auch nichts entstehen, was nicht entstehen soll.
  · Die Zeitachse aus dem Bauplan wird auf die tatsächliche Länge des
    Voiceovers gestreckt. Die Sekunden in der App sind geschätzt; hier
    zählt, was die Stimme wirklich braucht.
  · Die Werbekennzeichnung steht in den ersten Sekunden oben im Bild,
    hinterlegt und lesbar — nicht klein in einer Ecke.
  · Untertitel aus dem Skript, unten, über dem Bedienfeld von TikTok.
  · Keine Musik. Es kommt nichts unter die Stimme, was nicht im Bauplan
    als eigene Tonspur steht.

Voraussetzung: ffmpeg und ffprobe im Pfad.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

BREITE, HOEHE, FPS = 1080, 1920, 30

# Vor der Kamerabewegung wird das Foto hochskaliert, damit zoompan beim
# Runden von x und y nicht sichtbar ruckelt. Der Faktor muss nur über dem
# stärksten Zoom liegen (1,14) — mit 1,5 bleibt Luft, und es rechnet gut
# doppelt so schnell wie mit dem naheliegenden Faktor 2.
VORSKALIERUNG = 1.5

# Die Kennzeichnung darf nicht unter TikToks Bedienelementen verschwinden.
# Oben sind etwa 12 % des Bildes frei, unten gut 20 %.
RAND_OBEN = 220
RAND_UNTEN = 430

SCHRIFT_KANDIDATEN = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "C:/Windows/Fonts/arialbd.ttf",
]

BILD_ENDUNGEN = (".jpg", ".jpeg", ".png", ".webp", ".heic", ".bmp")


def fehler(text):
    print("\n  " + text + "\n", file=sys.stderr)
    sys.exit(1)


def werkzeug_pruefen():
    for w in ("ffmpeg", "ffprobe"):
        if not shutil.which(w):
            fehler(
                w + " wurde nicht gefunden.\n"
                "  Installieren: apt install ffmpeg  ·  brew install ffmpeg\n"
                "  Oder ffmpeg-static über npm holen und den Ordner in den PATH legen."
            )


def schrift_finden(vorgabe=None):
    if vorgabe:
        if os.path.exists(vorgabe):
            return vorgabe
        fehler("Die angegebene Schrift gibt es nicht: " + vorgabe)
    for p in SCHRIFT_KANDIDATEN:
        if os.path.exists(p):
            return p
    fehler(
        "Keine Schriftdatei gefunden. Gib eine mit --schrift an,\n"
        "  z. B. --schrift /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    )


def dauer_von(pfad):
    """Länge einer Audio- oder Videodatei in Sekunden."""
    aus = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", pfad],
        capture_output=True, text=True,
    )
    if aus.returncode != 0:
        fehler("ffprobe kommt mit " + pfad + " nicht zurecht:\n  " + aus.stderr.strip())
    try:
        return float(aus.stdout.strip())
    except ValueError:
        fehler("Konnte die Länge von " + pfad + " nicht lesen.")


def bilder_sammeln(ordner):
    if not os.path.isdir(ordner):
        fehler("Den Bilderordner gibt es nicht: " + ordner)
    dateien = sorted(
        d for d in os.listdir(ordner)
        if d.lower().endswith(BILD_ENDUNGEN) and not d.startswith(".")
    )
    if not dateien:
        fehler(
            "In " + ordner + " liegt kein Bild.\n"
            "  Leg die freigegebenen Produktfotos und dein eigenes Material dort ab."
        )
    return [os.path.join(ordner, d) for d in dateien]


def bild_zuordnen(szenen, ordner):
    """Jede Szene bekommt eine Bilddatei.

    Erst über den Namen aus dem Bauplan. Was übrig bleibt, wird der Reihe
    nach aufgefüllt — dann sieht man wenigstens etwas und kann danach von
    Hand nachbessern, statt vor einem Abbruch zu stehen.
    """
    vorhanden = bilder_sammeln(ordner)
    nach_name = {}
    for p in vorhanden:
        basis = os.path.basename(p).lower()
        nach_name[basis] = p
        nach_name[os.path.splitext(basis)[0]] = p

    zugeordnet = []
    for s in szenen:
        name = (s.get("bild") or "").lower()
        treffer = nach_name.get(name) or nach_name.get(os.path.splitext(name)[0])
        zugeordnet.append(treffer)

    reihe = 0
    fehlend = 0
    for i, t in enumerate(zugeordnet):
        if t is None:
            zugeordnet[i] = vorhanden[reihe % len(vorhanden)]
            reihe += 1
            fehlend += 1
    if fehlend:
        print("  " + str(fehlend) + " Szenen ohne zugeordnetes Foto — "
              "der Reihe nach aufgefüllt.")
    return zugeordnet


def zeit_strecken(szenen, ziel_dauer):
    """Die geschätzte Zeitachse auf die echte Länge der Stimme bringen.

    Die App rechnet mit 2,4 Wörtern je Sekunde. Die wirkliche Aufnahme ist
    fast nie genau so lang. Ohne diese Streckung läuft das Bild dem Ton
    davon oder hinterher — und zwar zunehmend, je länger das Video wird.
    """
    ist = sum(float(s.get("dauer", 0)) for s in szenen)
    if ist <= 0:
        fehler("Der Bauplan enthält keine Szene mit einer Dauer.")
    faktor = ziel_dauer / ist
    t = 0.0
    for s in szenen:
        s["dauer"] = round(float(s.get("dauer", 0)) * faktor, 3)
        s["von"] = round(t, 3)
        t += s["dauer"]
    return faktor


def bewegung_filter(art, frames):
    """Kamerabewegung als zoompan-Ausdruck.

    Das Bild wird vorher auf die doppelte Ausgabegröße gebracht. zoompan
    rundet x und y auf ganze Pixel; auf einem kleinen Bild sieht man das
    als Ruckeln, auf einem großen nicht mehr.
    """
    n = max(frames - 1, 1)
    mitte_x = "iw/2-(iw/zoom/2)"
    mitte_y = "ih/2-(ih/zoom/2)"

    if art == "hinein":
        return "1+0.14*on/%d" % n, mitte_x, mitte_y
    if art == "heraus":
        return "1.14-0.14*on/%d" % n, mitte_x, mitte_y
    if art == "links":
        return "1.12", "(iw-iw/zoom)*(1-on/%d)" % n, mitte_y
    if art == "rechts":
        return "1.12", "(iw-iw/zoom)*on/%d" % n, mitte_y
    if art == "hoch":
        return "1.12", mitte_x, "(ih-ih/zoom)*(1-on/%d)" % n
    if art == "runter":
        return "1.12", mitte_x, "(ih-ih/zoom)*on/%d" % n
    # "still" — minimale Drift, damit ein Standbild nicht wie ein Fehler wirkt
    return "1+0.02*on/%d" % n, mitte_x, mitte_y


class Textebenen:
    """Texte werden mit Pillow zu durchsichtigen PNGs und per `overlay`
    ins Bild gelegt — nicht mit drawtext.

    Zwei Gründe, und beide sind aus Schaden entstanden:

    1. Im Filtergraphen sind Doppelpunkt, Hochkomma, Backslash, Prozent,
       Komma und der Zeilenumbruch allesamt Syntax. Ein deutscher
       Werbetext wie „8 mm: genoppt“ über zwei Zeilen bringt den Parser
       zu Fall, und die Meldung lautet dann „Filter not found“ — was in
       die völlig falsche Richtung weist.
    2. drawtext braucht einen ffmpeg-Build mit libfreetype. Viele
       statische Builds haben den Filter schlicht nicht. `overlay` ist
       Kernbestand und immer da.

    Nebenbei wird es dadurch besser: abgerundete Kästen, echter
    Zeilenabstand und ein Schatten sind hier eine Zeile Code und in
    drawtext gar nicht zu haben.
    """

    def __init__(self, schrift, breite=BREITE, hoehe=HOEHE):
        try:
            from PIL import Image, ImageDraw, ImageFont
        except ImportError:
            fehler(
                "Pillow fehlt — das Werkzeug zeichnet die Texte damit.\n"
                "  Installieren: python3 -m pip install pillow"
            )
        self.Image, self.ImageDraw, self.ImageFont = Image, ImageDraw, ImageFont
        self.schrift = schrift
        self.breite, self.hoehe = breite, hoehe
        # Alle Maße im Code sind für 1080 gedacht. Bei kleinerer Ausgabe
        # wird alles mitskaliert, sonst füllt der Untertitel das halbe Bild.
        self.mass = breite / float(BREITE)
        self.ordner = tempfile.mkdtemp(prefix="suq-text-")
        self.ebenen = []          # (pfad, von, bis)
        self._font_cache = {}

    def _font(self, groesse):
        if groesse not in self._font_cache:
            try:
                self._font_cache[groesse] = self.ImageFont.truetype(self.schrift, groesse)
            except OSError:
                fehler("Die Schrift lässt sich nicht laden: " + self.schrift)
        return self._font_cache[groesse]

    def _breite(self, text, font):
        k = self.ImageDraw.Draw(self.Image.new("RGBA", (1, 1)))
        return k.textbbox((0, 0), text, font=font)[2]

    def umbrechen(self, text, font, hoechstbreite):
        """Nach gemessener Pixelbreite umbrechen, nicht nach Zeichenzahl.
        „Millimeter“ und „ist“ sind nicht gleich breit — mit Zeichenzahl
        reißen manche Zeilen aus dem Kasten heraus und andere sind halb leer."""
        zeilen, jetzt = [], ""
        for w in text.split():
            versuch = (jetzt + " " + w).strip()
            if self._breite(versuch, font) <= hoechstbreite or not jetzt:
                jetzt = versuch
            else:
                zeilen.append(jetzt)
                jetzt = w
        if jetzt:
            zeilen.append(jetzt)
        return zeilen or [""]

    def textbreite(self, groesse=52):
        """Wie breit ein Untertitel werden darf — dieselbe Rechnung wie
        beim Zeichnen, damit die Umbruchvorschau nicht danebenliegt."""
        return int((BREITE - 2 * 70 - 2 * 30) * self.mass)

    def hinzufuegen(self, text, groesse, lage, von, bis,
                    deckung=0.55, unten=False):
        """Eine Textebene anlegen. `lage` ist der Abstand von oben bzw.,
        wenn `unten` gesetzt ist, von unten — jeweils in 1080er Maßen."""
        text = (text or "").strip()
        if not text or bis <= von:
            return

        m = self.mass
        groesse = max(int(groesse * m), 8)
        lage = int(lage * m)
        font = self._font(groesse)
        polster_x, polster_y = int(30 * m), int(20 * m)
        zeilenluft, ecke = int(14 * m), int(16 * m)
        hoechstbreite = self.textbreite()

        zeilen = self.umbrechen(text, font, hoechstbreite)
        breiten = [self._breite(z, font) for z in zeilen]
        zeilenhoehe = groesse + zeilenluft
        kasten_b = max(breiten) + 2 * polster_x
        kasten_h = len(zeilen) * zeilenhoehe - zeilenluft + 2 * polster_y

        bild = self.Image.new("RGBA", (self.breite, self.hoehe), (0, 0, 0, 0))
        d = self.ImageDraw.Draw(bild)

        x0 = (self.breite - kasten_b) // 2
        y0 = (self.hoehe - lage - kasten_h) if unten else lage

        d.rounded_rectangle(
            [x0, y0, x0 + kasten_b, y0 + kasten_h],
            radius=ecke, fill=(0, 0, 0, int(255 * deckung))
        )
        for i, z in enumerate(zeilen):
            zx = (self.breite - breiten[i]) // 2
            zy = y0 + polster_y + i * zeilenhoehe
            # Ein weicher Schatten hält die Schrift auch auf hellem
            # Produktfoto lesbar, falls der Kasten einmal fehlt.
            versatz = max(int(2 * m), 1)
            d.text((zx + versatz, zy + versatz), z, font=font, fill=(0, 0, 0, 150))
            d.text((zx, zy), z, font=font, fill=(255, 255, 255, 255))

        pfad = os.path.join(self.ordner, "e%03d.png" % (len(self.ebenen) + 1))
        bild.save(pfad)
        self.ebenen.append((pfad, von, bis))

    def aufraeumen(self):
        shutil.rmtree(self.ordner, ignore_errors=True)


def haeppchen(text, ebenen, font, hoechstbreite, zeilen_max=2):
    """Text in lesbare Häppchen von höchstens zwei Zeilen teilen.

    Stumpf alle zwei Zeilen zu schneiden ergibt Untertitel wie „…tut der
    Sujud nach dem“ — der Satz bricht mitten im Gedanken ab und der Rest
    erscheint erst nach dem nächsten Schnitt. Deswegen wird zuerst an
    Satzenden getrennt, dann notfalls an Komma und Semikolon, und erst
    ganz zuletzt hart nach Zeilen.
    """
    def passt(t):
        return len(ebenen.umbrechen(t, font, hoechstbreite)) <= zeilen_max

    saetze = [s.strip() for s in re.split(r"(?<=[.!?…])\s+", text) if s.strip()]
    fertig = []

    for satz in saetze:
        if passt(satz):
            fertig.append(satz)
            continue

        # Zu lang: an Nebensatzgrenzen zerlegen und wieder auffüllen,
        # solange es in zwei Zeilen bleibt.
        stuecke = [t.strip() for t in re.split(r"(?<=[,;:])\s+", satz) if t.strip()]
        jetzt = ""
        for st in stuecke:
            versuch = (jetzt + " " + st).strip()
            if not jetzt or passt(versuch):
                jetzt = versuch
            else:
                fertig.append(jetzt)
                jetzt = st
        if jetzt:
            fertig.append(jetzt)

    # Was danach immer noch zu lang ist: lieber eine dritte Zeile zulassen,
    # als einen Nebensatz mittendrin zu zerreißen. Deutsche Nebensätze sind
    # lang, und drei Zeilen stehen im Hochformat immer noch bequem über dem
    # Bedienfeld. Erst darüber hinaus wird hart geteilt.
    notfall = zeilen_max + 1
    aus = []
    for t in fertig:
        zeilen = ebenen.umbrechen(t, font, hoechstbreite)
        if len(zeilen) <= notfall:
            aus.append(t)
            continue
        for i in range(0, len(zeilen), notfall):
            aus.append(" ".join(zeilen[i:i + notfall]))
    return aus


def untertitel_bauen(abschnitte, video_dauer, ebenen):
    """Untertitel aus den Skriptabschnitten.

    Die Abschnitte tragen ihre eigene geschätzte Zeitachse — dieselbe
    Schätzung wie die Szenen, aber eine eigene Summe. Sie muss getrennt
    auf die Videolänge gestreckt werden. Rechnet man mit dem Faktor der
    Szenen, laufen die Untertitel über das Videoende hinaus und die
    letzten Sätze erscheinen nie im Bild.
    """
    brauchbar = [a for a in abschnitte if (a.get("text") or "").strip()]
    if not brauchbar:
        return

    ende = max(float(a.get("bis", 0)) for a in brauchbar)
    if ende <= 0:
        return
    faktor = video_dauer / ende

    font = ebenen._font(max(int(52 * ebenen.mass), 8))
    hoechstbreite = ebenen.textbreite()

    for a in brauchbar:
        von = float(a.get("von", 0)) * faktor
        bis = min(float(a.get("bis", 0)) * faktor, video_dauer)
        spanne = max(bis - von, 0.4)

        teile = haeppchen((a.get("text") or "").strip(), ebenen, font, hoechstbreite)
        if not teile:
            continue

        # Die Zeit nach Textlänge verteilen, nicht zu gleichen Teilen:
        # ein Häppchen aus drei Wörtern braucht keine drei Sekunden,
        # während ein langes sonst zu früh verschwindet.
        laengen = [max(len(t), 1) for t in teile]
        summe = float(sum(laengen))
        t = von
        for text, laenge in zip(teile, laengen):
            dauer = spanne * laenge / summe
            ebenen.hinzufuegen(text, 52, RAND_UNTEN, t,
                               min(t + dauer, video_dauer), unten=True)
            t += dauer


def kennzeichnung_bauen(kz, ebenen):
    """Die Werbekennzeichnung. Groß, hinterlegt, oben, ab Sekunde 0.

    Klein und grau in der Ecke gilt nach dem Leitfaden der Medienanstalten
    nicht als Kennzeichnung. Deswegen sind Größe und Lage hier nicht
    einstellbar.
    """
    if not kz:
        return
    ebenen.hinzufuegen(
        kz.get("text", "Werbung"), 58, RAND_OBEN,
        float(kz.get("von", 0)), float(kz.get("bis", 3)), deckung=0.72
    )


def einblendungen_bauen(szenen, ebenen):
    """Freie Einblendungen je Szene — außer der Kennzeichnung, die steht
    schon oben und würde sich sonst selbst überlagern."""
    for s in szenen:
        text = (s.get("einblendung") or "").strip()
        if not text or text.lower() in ("werbung", "anzeige"):
            continue
        von = float(s["von"])
        ebenen.hinzufuegen(text, 46, RAND_OBEN + 150,
                           von, von + float(s["dauer"]), deckung=0.5)


def bauen(plan, bilder, stimme, ziel, schrift, ohne_untertitel=False, schnell=False):
    szenen = plan.get("szenen") or []
    if not szenen:
        fehler("Der Bauplan enthält keine Szenen.")

    zuordnung = bild_zuordnen(szenen, bilder)

    # Die Stimme gibt die Länge vor.
    faktor = 1.0
    if stimme:
        ton_dauer = dauer_von(stimme)
        # Eine knappe Sekunde Nachlauf, damit das letzte Wort nicht auf
        # dem Schnitt sitzt.
        faktor = zeit_strecken(szenen, ton_dauer + 0.6)

    gesamt = sum(s["dauer"] for s in szenen)

    # Die Kamerabewegung ist der teure Teil, nicht die Kodierung. Wer eine
    # Vorschau will, spart Zeit nur über die Auflösung — ein schnelleres
    # x264-Preset ändert an der Wartezeit fast nichts.
    breite = BREITE // 2 // 2 * 2 if schnell else BREITE
    hoehe = HOEHE // 2 // 2 * 2 if schnell else HOEHE

    ebenen = Textebenen(schrift, breite, hoehe)

    try:
        kennzeichnung_bauen(plan.get("kennzeichnung"), ebenen)
        einblendungen_bauen(szenen, ebenen)
        if not ohne_untertitel:
            untertitel_bauen(plan.get("abschnitte") or [], gesamt, ebenen)

        eingaben = []
        filter_teile = []
        marken = []

        # Gerade Zahlen: libx264 mag ungerade Kantenlängen nicht, und
        # crop rundet sonst still vor sich hin.
        gross_b = int(breite * VORSKALIERUNG) // 2 * 2
        gross_h = int(hoehe * VORSKALIERUNG) // 2 * 2

        for i, (s, bild) in enumerate(zip(szenen, zuordnung)):
            eingaben += ["-loop", "1", "-t", "%.3f" % s["dauer"], "-i", bild]
            frames = max(int(round(s["dauer"] * FPS)), 2)
            z, x, y = bewegung_filter(s.get("bewegung", "hinein"), frames)
            filter_teile.append(
                "[{i}:v]"
                "scale={bb}:{hh}:force_original_aspect_ratio=increase,"
                "crop={bb}:{hh},"
                "zoompan=z='{z}':x='{x}':y='{y}':d={d}:s={b}x{h}:fps={fps},"
                "trim=duration={dauer:.3f},setpts=PTS-STARTPTS,setsar=1[v{i}]".format(
                    i=i, bb=gross_b, hh=gross_h, z=z, x=x, y=y,
                    d=frames, b=breite, h=hoehe, fps=FPS, dauer=s["dauer"]
                )
            )
            marken.append("[v%d]" % i)

        filter_teile.append(
            "".join(marken) + "concat=n=%d:v=1:a=0[stufe0]" % len(szenen)
        )

        # Die Textebenen kommen als eigene Eingaben dazu und werden der
        # Reihe nach daraufgelegt. `enable` schaltet jede nur in ihrem
        # Zeitfenster ein; `shortest=0` verhindert, dass ein Standbild
        # das Video vorzeitig beendet.
        naechster = len(szenen)
        for nr, (pfad, von, bis) in enumerate(ebenen.ebenen):
            eingaben += ["-loop", "1", "-t", "%.3f" % gesamt, "-i", pfad]
            filter_teile.append(
                "[stufe{vor}][{ein}:v]overlay=0:0:shortest=0:"
                "enable='between(t,{von:.3f},{bis:.3f})'[stufe{nach}]".format(
                    vor=nr, ein=naechster + nr, von=von, bis=bis, nach=nr + 1
                )
            )
        letzte = "stufe%d" % len(ebenen.ebenen)
        filter_teile.append("[%s]format=yuv420p[vid]" % letzte)

        befehl = ["ffmpeg", "-y"] + eingaben
        ton_index = len(szenen) + len(ebenen.ebenen)
        if stimme:
            befehl += ["-i", stimme]

        befehl += ["-filter_complex", ";".join(filter_teile), "-map", "[vid]"]

        if stimme:
            befehl += ["-map", "%d:a" % ton_index, "-c:a", "aac", "-b:a", "192k"]

        befehl += [
            "-c:v", "libx264",
            "-preset", "veryfast" if schnell else "fast",
            "-crf", "26" if schnell else "20",
            "-pix_fmt", "yuv420p", "-r", str(FPS),
            "-movflags", "+faststart",
            "-t", "%.3f" % gesamt,
            ziel,
        ]

        print("  %d Szenen · %d Textebenen · %.1f s · %dx%d"
              % (len(szenen), len(ebenen.ebenen), gesamt, breite, hoehe))
        if stimme:
            print("  Zeitachse auf die Stimme gestreckt (Faktor %.2f)" % faktor)
        if schnell:
            print("  Vorschau — geringere Qualität, nicht zum Hochladen.")
        print("  ffmpeg läuft …\n")

        lauf = subprocess.run(befehl, capture_output=True, text=True)
        if lauf.returncode != 0:
            zeilen = lauf.stderr.strip().splitlines()
            fehler("ffmpeg ist ausgestiegen:\n  " + "\n  ".join(zeilen[-14:]))
    finally:
        ebenen.aufraeumen()

    return ziel


def main():
    p = argparse.ArgumentParser(
        description="Baut aus einem Sūq-Bauplan eine fertige TikTok-MP4.")
    p.add_argument("bauplan", help="Die JSON-Datei aus der Sūq-App")
    p.add_argument("--bilder", required=True, help="Ordner mit den Produktfotos")
    p.add_argument("--stimme", help="Voiceover als MP3 oder WAV")
    p.add_argument("--ziel", help="Zieldatei (Standard: neben dem Bauplan)")
    p.add_argument("--schrift", help="Pfad zu einer TTF-Datei für die Texte")
    p.add_argument("--ohne-untertitel", action="store_true",
                   help="Keine Untertitel einbrennen")
    p.add_argument("--schnell", action="store_true",
                   help="Vorschau: rechnet deutlich schneller, sichtbar schlechter")
    a = p.parse_args()

    werkzeug_pruefen()

    if not os.path.exists(a.bauplan):
        fehler("Den Bauplan gibt es nicht: " + a.bauplan)
    with open(a.bauplan, encoding="utf-8") as f:
        plan = json.load(f)

    if plan.get("app") != "suq":
        fehler("Das ist kein Sūq-Bauplan.")

    stimme = a.stimme or plan.get("stimme")
    if stimme and not os.path.exists(stimme):
        print("  Hinweis: " + stimme + " gibt es nicht — es wird ohne Ton gebaut.")
        stimme = None

    ziel = a.ziel
    if not ziel:
        stamm = re.sub(r"[^a-z0-9]+", "-",
                       (plan.get("titel") or "video").lower()).strip("-") or "video"
        ziel = os.path.join(os.path.dirname(os.path.abspath(a.bauplan)), stamm + ".mp4")

    schrift = schrift_finden(a.schrift)

    print("\n  Sūq — " + (plan.get("titel") or "Video"))
    bauen(plan, a.bilder, stimme, ziel, schrift, a.ohne_untertitel, a.schnell)

    groesse = os.path.getsize(ziel) / (1024 * 1024)
    print("  Fertig: %s  (%.1f MB)\n" % (ziel, groesse))
    print("  Vor dem Hochladen nicht vergessen:")
    print("   · Branded Content bzw. Werbeoffenlegung in TikTok aktivieren")
    print("   · Produkt aus dem Shop verknüpfen")
    if stimme:
        print("   · Schalter für KI-Inhalte setzen (synthetische Stimme)")
    print()


if __name__ == "__main__":
    main()
