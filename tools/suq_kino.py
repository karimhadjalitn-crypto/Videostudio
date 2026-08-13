#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sūq – Kinofassung.

Warum das hier anders ist als zoompan:

Ein Zoom auf ein Standbild bleibt ein Standbild. Das Bild wird größer,
aber nichts an ihm ändert sich — das Gehirn liest „jemand zoomt in ein
Foto", nicht „eine Kamera bewegt sich". Genau das war der Vorwurf, und er
stimmt.

Hier wird stattdessen pro Einzelbild eine **projektive Transformation**
gerechnet. Statt eines Rechtecks wird ein Viereck aus dem Foto gegriffen,
dessen vier Ecken sich unabhängig voneinander bewegen. Damit ändert sich
die Perspektive: die nahe Kante des Teppichs wächst schneller als die
ferne, Fluchtlinien laufen anders zusammen. Das ist der Unterschied
zwischen einer Diashow und einer Kamerafahrt.

Dazu kommt, was schwarzen Samt überhaupt erst sichtbar macht: ein
wanderndes Streiflicht. Ein schwarzer Teppich mit geprägtem Muster zeigt
sein Muster nur, wenn Licht schräg darüber läuft. Steht das Licht still,
sieht man eine schwarze Fläche. Das Streiflicht wird an der eigenen
Helligkeit des Bildes moduliert, damit die erhabene Stickerei aufblitzt
und die glatten Stellen dunkel bleiben.

Rest: Blüte um die goldenen Stellen, S-Kurve, Korn, Vignette. Kein Filter
über allem, sondern jeweils dort, wo es etwas tut.
"""

import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter

SP = "/tmp/claude-0/-home-user-Videostudio/02578a63-b253-5444-9dcf-0fe77ed6cfea/scratchpad"
FOTOS = SP + "/molora/fotos"

BREITE, HOEHE, FPS = 1080, 1920, 30
ASPEKT = BREITE / HOEHE          # 0.5625


# ────────────────────────────── Bewegungskurven ──────────────────────────────
# Lineare Bewegung sieht mechanisch aus. Eine Kamera beschleunigt und
# kommt zur Ruhe.

def ease_out(u):        # schnell los, sanft ankommen — der Standard
    return 1 - (1 - u) ** 3


def ease_in_out(u):     # ruhig los, ruhig an — für lange, getragene Fahrten
    return 3 * u * u - 2 * u * u * u


def linear(u):
    return u


# ────────────────────────────── Viereck im Quellbild ─────────────────────────

def viereck(cx, cy, h, keystone=0.0, rot=0.0, shear=0.0):
    """Vier Ecken (oben-links, oben-rechts, unten-rechts, unten-links).

    `keystone` staucht die obere Kante und weitet die untere — das ist der
    Blick schräg auf eine Fläche. Ändert sich der Wert während der Fahrt,
    kippt die Perspektive, und genau daran erkennt das Auge eine Kamera.
    """
    w = h * ASPEKT
    ecken = [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]
    aus = []
    for x, y in ecken:
        s = (1 - keystone) if y < 0 else (1 + keystone)
        x *= s
        x += shear * (y / (h / 2))
        xr = x * math.cos(rot) - y * math.sin(rot)
        yr = x * math.sin(rot) + y * math.cos(rot)
        aus.append((cx + xr, cy + yr))
    return aus


def koeffizienten(ziel_ecken, quell_ecken):
    """Die acht Zahlen, die PIL für eine projektive Abbildung braucht.

    Gesucht ist die Abbildung Ausgabe → Quelle; PIL rechnet rückwärts.
    Acht Unbekannte, vier Punktpaare, also ein 8×8-System.
    """
    A, B = [], []
    for (xz, yz), (xq, yq) in zip(ziel_ecken, quell_ecken):
        A.append([xz, yz, 1, 0, 0, 0, -xq * xz, -xq * yz])
        A.append([0, 0, 0, xz, yz, 1, -yq * xz, -yq * yz])
        B.append(xq)
        B.append(yq)
    return np.linalg.solve(np.array(A, dtype=np.float64), np.array(B, dtype=np.float64))


ZIEL = [(0, 0), (BREITE, 0), (BREITE, HOEHE), (0, HOEHE)]


# ────────────────────────────── Der Look ─────────────────────────────────────

_gitter = None


def gitter():
    """Koordinatengitter einmal bauen, nicht 270-mal."""
    global _gitter
    if _gitter is None:
        y, x = np.mgrid[0:HOEHE, 0:BREITE]
        _gitter = (x.astype(np.float32) / BREITE, y.astype(np.float32) / HOEHE)
    return _gitter


def streiflicht(bild, luma, u, winkel_grad, breite=0.30, staerke=0.5):
    """Ein weiches Lichtband wandert schräg über das Bild.

    Moduliert an der eigenen Helligkeit: wo die Prägung leicht heller ist,
    fängt sie mehr Licht. Dadurch blitzt das Muster auf, statt dass ein
    grauer Schleier über allem liegt.
    """
    gx, gy = gitter()
    a = math.radians(winkel_grad)
    d = gx * math.cos(a) + gy * math.sin(a)
    d = (d - d.min()) / (d.max() - d.min())

    # Das Band läuft mit Vorlauf und Nachlauf durch, damit es am
    # Schnittanfang nicht schon mitten im Bild steht.
    pos = -0.35 + u * 1.7
    band = np.exp(-((d - pos) ** 2) / (2 * breite * breite))

    gewicht = 0.22 + 0.78 * luma            # Prägung fängt mehr als der Grund
    zuwachs = (band * gewicht * staerke)[..., None]
    return bild + zuwachs * np.array([1.0, 0.94, 0.80], dtype=np.float32) * 0.42


def bluete(bild, schwelle=0.62, staerke=0.34, radius=26):
    """Blüte nur um das, was wirklich hell ist — Gold, Messing, Lampe.

    Nicht als Weichzeichner über allem: das nimmt dem Samt die Tiefe.
    """
    luma = bild @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    maske = np.clip((luma - schwelle) / (1 - schwelle), 0, 1)
    hell = bild * maske[..., None]
    weich = np.asarray(
        Image.fromarray((np.clip(hell, 0, 1) * 255).astype(np.uint8))
        .filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32) / 255.0
    return 1 - (1 - bild) * (1 - weich * staerke)     # Screen


def grade(bild):
    """S-Kurve, warme Lichter, kühle Schatten, etwas mehr Farbe.

    Der Teppich ist schwarz — ohne echtes Schwarz sieht er billig aus.
    Deswegen werden die Tiefen heruntergezogen, aber nicht zugeklebt.
    """
    b = np.clip(bild, 0, 1)
    b = b ** 1.06                                    # Tiefen etwas satter
    b = np.clip((b - 0.5) * 1.16 + 0.5, 0, 1)        # Kontrast

    luma = b @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    warm = np.stack([luma * 0.045, luma * 0.020, -luma * 0.028], axis=-1)
    kalt = np.stack([-(1 - luma) * 0.020, np.zeros_like(luma), (1 - luma) * 0.030], axis=-1)
    b = b + warm + kalt

    grau = (b @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32))[..., None]
    b = grau + (b - grau) * 1.14                     # Sättigung
    return np.clip(b, 0, 1)


def vignette(bild, staerke=0.30):
    gx, gy = gitter()
    r = np.sqrt((gx - 0.5) ** 2 + ((gy - 0.5) * 1.05) ** 2) / 0.72
    v = np.clip(1 - staerke * np.clip(r, 0, 1) ** 2.1, 0, 1)
    return bild * v[..., None]


def korn(bild, staerke=0.016, rng=None):
    """Ein Hauch Korn. Ohne das bleibt jede Standbildfahrt erkennbar
    digital — Korn ist die Bewegung, die auch dann da ist, wenn im Bild
    nichts passiert."""
    n = rng.normal(0.0, staerke, size=(HOEHE, BREITE, 1)).astype(np.float32)
    return np.clip(bild + n, 0, 1)


# ────────────────────────────── Einstellungen ────────────────────────────────
# Jede Einstellung: Foto, Dauer, Start- und Endviereck, Kurve, Streiflicht.
# Die Vierecke bleiben bewusst großzügig — zu enge Ausschnitte werden
# unscharf, das war der zweite berechtigte Vorwurf.

FOTO1 = "01-teppich-boden.png"      # Teppich auf dem Boden im Raum
FOTO2 = "02-teppich-gefaltet.png"   # gefaltet, mit Band und Gebetskette

# Sperrzonen in den Quellfotos, die kein Ausschnitt berühren darf:
#   Foto 1: MOLORA-Logo x 25–285 / y 55–230 · Plakette x 45–235 / y 745–905
#           Symbolleiste ab y 950
#   Foto 2: MOLORA-Logo x 55–330 / y 65–275 · Plakette x 45–235 / y 790–935
#           Symbolleiste ab y 1010
# Alle Vierecke unten beginnen deshalb bei x ≥ 300 und enden über der
# Symbolleiste. Beim ersten Durchlauf rutschte in Einstellung 4 das Logo
# mit ins Bild — Werbung für den Seller statt für das Produkt.

SZENEN = [
    # Der Rhythmus ist Absicht: hell, dunkel, gold, hell, gold, weit.
    # Der Teppich ist schwarz — vier dunkle Einstellungen hintereinander
    # ergeben vier schwarze Flächen, egal wie gut die Kamera fährt. Das
    # Schöne an diesen Fotos ist der helle Raum mit dem Lichteinfall;
    # dagegen wirkt das Schwarz erst.

    # 1 — Weit und hell: Wand, Licht, Lampe, und der Teppich läuft unten
    #     ins Bild. Die Kamera senkt sich langsam auf ihn zu.
    dict(foto=FOTO1, dauer=1.4, kurve=ease_in_out, licht=(70, 0.34, 0.30),
         a=viereck(706, 374, 726, keystone=0.014, rot=-0.008),
         b=viereck(686, 424, 700, keystone=0.052, rot=0.004)),

    # 2 — Dunkel und nah: der Bogen in der Prägung. Streiflicht quer, sonst
    #     bliebe hier nur eine schwarze Fläche.
    dict(foto=FOTO1, dauer=1.4, kurve=ease_out, licht=(102, 0.20, 0.92),
         a=viereck(652, 540, 796, keystone=0.056, rot=0.014),
         b=viereck(646, 452, 770, keystone=0.016, rot=-0.006)),

    # 3 — Das Gold: der gestickte Name. Licht läuft flach darüber hinweg.
    dict(foto=FOTO1, dauer=1.5, kurve=ease_out, licht=(16, 0.22, 0.86),
         a=viereck(806, 566, 740, keystone=0.038, rot=0.012),
         b=viereck(842, 594, 692, keystone=0.060, rot=-0.008)),

    # 4 — Wieder hell: die Lichtstreifen der Gardine auf dem Boden, der
    #     Teppich als dunkle Masse daneben. Seitliche Fahrt.
    dict(foto=FOTO1, dauer=1.3, kurve=ease_in_out, licht=(6, 0.30, 0.34),
         a=viereck(558, 462, 876, keystone=0.040, rot=-0.014),
         b=viereck(600, 486, 840, keystone=0.018, rot=0.008)),

    # 5 — Das Geschenk: hinein auf Schleife, Band und Name.
    dict(foto=FOTO2, dauer=1.6, kurve=ease_out, licht=(48, 0.26, 0.56),
         a=viereck(624, 566, 820, keystone=0.014, rot=0.008),
         b=viereck(664, 600, 726, keystone=0.056, rot=-0.010)),

    # 6 — Ausklang: heraus, bis Lampe, Vase und Gebetskette dazukommen.
    #     Die Kamera kommt zur Ruhe, nicht mitten in der Bewegung.
    dict(foto=FOTO2, dauer=1.9, kurve=ease_in_out, licht=(84, 0.38, 0.26),
         a=viereck(690, 556, 840, keystone=0.050, rot=-0.008),
         b=viereck(676, 504, 980, keystone=0.018, rot=0.004)),
]


def main():
    ziel = sys.argv[1] if len(sys.argv) > 1 else SP + "/molora/kino.mp4"
    stimme = sys.argv[2] if len(sys.argv) > 2 else None

    quellen = {}
    for name in {s["foto"] for s in SZENEN}:
        quellen[name] = Image.open(os.path.join(FOTOS, name)).convert("RGB")

    gesamt = sum(s["dauer"] for s in SZENEN)
    frames_gesamt = int(round(gesamt * FPS))
    print(f"  {len(SZENEN)} Einstellungen · {gesamt:.1f} s · {frames_gesamt} Einzelbilder")

    befehl = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{BREITE}x{HOEHE}", "-r", str(FPS), "-i", "-",
    ]
    if stimme:
        befehl += ["-i", stimme]
    befehl += ["-map", "0:v"]
    if stimme:
        befehl += ["-map", "1:a", "-c:a", "aac", "-b:a", "192k"]
    befehl += [
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", ziel,
    ]

    rng = np.random.default_rng(7)
    p = subprocess.Popen(befehl, stdin=subprocess.PIPE)

    gezeichnet = 0
    for i, s in enumerate(SZENEN):
        quelle = quellen[s["foto"]]
        n = int(round(s["dauer"] * FPS))
        winkel, breite_band, staerke_band = s["licht"]

        for f in range(n):
            u = s["kurve"]((f + 0.5) / n)
            ecken = [(ax + (bx - ax) * u, ay + (by - ay) * u)
                     for (ax, ay), (bx, by) in zip(s["a"], s["b"])]

            k = koeffizienten(ZIEL, ecken)
            bild = quelle.transform((BREITE, HOEHE), Image.PERSPECTIVE, k, Image.BICUBIC)

            arr = np.asarray(bild, dtype=np.float32) / 255.0
            luma = arr @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)

            arr = streiflicht(arr, luma, (f + 0.5) / n, winkel, breite_band, staerke_band)
            arr = grade(arr)
            arr = bluete(arr)
            arr = vignette(arr)
            arr = korn(arr, rng=rng)

            p.stdin.write((arr * 255).astype(np.uint8).tobytes())
            gezeichnet += 1

        print(f"  {i+1}/{len(SZENEN)}  {s['foto'][:2]}  {s['dauer']:.1f}s  {n} Bilder")

    p.stdin.close()
    p.wait()
    if p.returncode != 0:
        sys.exit("ffmpeg ist ausgestiegen.")

    mb = os.path.getsize(ziel) / (1024 * 1024)
    print(f"\n  Fertig: {ziel}  ({mb:.1f} MB, {gezeichnet} Bilder)")


if __name__ == "__main__":
    main()
