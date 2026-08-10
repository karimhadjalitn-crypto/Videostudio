#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Erzeugt die Mīzān-Icons (schwarz mit Jade-Waage).

    python3 leben/tools/generate_icons.py
"""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "assets", "icons")
os.makedirs(OUT, exist_ok=True)

BG_TOP = (20, 24, 26)
BG_BOT = (0, 0, 0)
JADE = (79, 199, 154, 255)
BRASS = (201, 169, 106, 255)


def hintergrund(size):
    img = Image.new("RGB", (size, size), BG_TOP)
    px = img.load()
    for y in range(size):
        t = y / max(1, size - 1)
        c = tuple(int(BG_TOP[i] + (BG_BOT[i] - BG_TOP[i]) * t) for i in range(3))
        for x in range(size):
            px[x, y] = c
    return img


def waage(draw, S):
    """Balkenwaage: Querbalken, Mittelsäule, Fuß, zwei Schalen."""
    mitte = S / 2
    strich = S * 0.042
    balken_y = S * 0.40
    links, rechts = S * 0.215, S * 0.785

    # Aufhängung oben
    r = S * 0.038
    draw.ellipse([mitte - r, balken_y - S * 0.115 - r, mitte + r, balken_y - S * 0.115 + r],
                 outline=JADE, width=int(strich * 0.75))
    draw.line([mitte, balken_y - S * 0.077, mitte, balken_y], fill=JADE, width=int(strich))

    # Querbalken
    draw.line([links, balken_y, rechts, balken_y], fill=JADE, width=int(strich))
    for x in (links, rechts):
        draw.ellipse([x - strich / 2, balken_y - strich / 2, x + strich / 2, balken_y + strich / 2], fill=JADE)

    # Mittelsäule und Fuß
    draw.line([mitte, balken_y, mitte, S * 0.735], fill=JADE, width=int(strich))
    draw.line([mitte - S * 0.135, S * 0.755, mitte + S * 0.135, S * 0.755], fill=JADE, width=int(strich))

    # Schalen
    schale_r = S * 0.125
    schale_y = S * 0.545
    for x in (links, rechts):
        draw.line([x, balken_y, x, schale_y - schale_r * 0.15], fill=JADE, width=int(strich * 0.62))
        kasten = [x - schale_r, schale_y - schale_r, x + schale_r, schale_y + schale_r]
        draw.arc(kasten, start=0, end=180, fill=BRASS, width=int(strich * 0.9))


def runden(img, radius):
    maske = Image.new("L", img.size, 0)
    ImageDraw.Draw(maske).rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1],
                                            radius=radius, fill=255)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), maske)
    return out


def bauen(size, maskable=False):
    S = size * 4                     # Supersampling
    img = hintergrund(S).convert("RGBA")
    ebene = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(ebene)

    if maskable:
        # Sicherheitszone: Motiv auf 62 % verkleinern
        klein = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        dk = ImageDraw.Draw(klein)
        waage(dk, S)
        klein = klein.resize((int(S * 0.62), int(S * 0.62)), Image.LANCZOS)
        ebene.paste(klein, (int(S * 0.19), int(S * 0.19)), klein)
    else:
        waage(d, S)

    img = Image.alpha_composite(img, ebene)
    if not maskable:
        img = runden(img, int(S * 0.225))
    return img.resize((size, size), Image.LANCZOS)


SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#14181A"/><stop offset="1" stop-color="#000000"/>
  </linearGradient></defs>
  <rect width="512" height="512" rx="115" fill="url(#g)"/>
  <g fill="none" stroke="#4FC79A" stroke-width="21" stroke-linecap="round">
    <circle cx="256" cy="146" r="19" stroke-width="16"/>
    <path d="M256 165V205"/>
    <path d="M110 205H402"/>
    <path d="M256 205V376"/>
    <path d="M187 387H325"/>
    <path d="M110 205V264" stroke-width="13"/>
    <path d="M402 205V264" stroke-width="13"/>
  </g>
  <g fill="none" stroke="#C9A96A" stroke-width="19" stroke-linecap="round">
    <path d="M46 279a64 64 0 0 0 128 0"/>
    <path d="M338 279a64 64 0 0 0 128 0"/>
  </g>
</svg>
"""

if __name__ == "__main__":
    for groesse in (180, 192, 512):
        bauen(groesse).save(os.path.join(OUT, "icon-%d.png" % groesse))
    bauen(512, maskable=True).save(os.path.join(OUT, "icon-512-maskable.png"))
    with open(os.path.join(OUT, "icon.svg"), "w", encoding="utf-8") as f:
        f.write(SVG)
    print("Icons geschrieben nach", OUT)
