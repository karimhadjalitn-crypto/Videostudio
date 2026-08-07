#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Erzeugt die PWA-Icons (Teal mit Halbmond & Stern). python3 tools/generate_icons.py"""
import math
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "assets", "icons")
os.makedirs(OUT, exist_ok=True)

TOP = (22, 152, 141)      # #16988d
BOT = (12, 106, 99)       # #0c6a63
WHITE = (255, 255, 255, 255)


def vgrad(size, top, bot):
    img = Image.new("RGB", (size, size), top)
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        r = int(top[0] + (bot[0] - top[0]) * t)
        g = int(top[1] + (bot[1] - top[1]) * t)
        b = int(top[2] + (bot[2] - top[2]) * t)
        for x in range(size):
            px[x, y] = (r, g, b)
    return img


def star(draw, cx, cy, r, rot=-math.pi / 2, fill=WHITE):
    pts = []
    for i in range(10):
        rad = r if i % 2 == 0 else r * 0.42
        a = rot + i * math.pi / 5
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    draw.polygon(pts, fill=fill)


def make(size, maskable=False, rounded=True):
    S = size * 4  # Supersampling
    base = vgrad(S, TOP, BOT).convert("RGBA")

    # Motiv-Ebene
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    scale = 0.60 if maskable else 0.78
    cx, cy = S * 0.52, S * 0.52
    R = S * 0.30 * (scale / 0.78)

    # Halbmond: weißer Kreis, dann mit Hintergrund ausgestanzt
    moon = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    md = ImageDraw.Draw(moon)
    md.ellipse([cx - R, cy - R, cx + R, cy + R], fill=WHITE)
    cut = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cut)
    off = R * 0.42
    rc = R * 0.92
    cd.ellipse([cx + off - rc, cy - off - rc, cx + off + rc, cy - off + rc], fill=(0, 0, 0, 255))
    # ausstanzen
    moon_arr = moon.copy()
    r, g, b, a = moon_arr.split()
    _, _, _, ca = cut.split()
    import PIL.ImageChops as C
    a = C.subtract(a, ca)
    moon_arr = Image.merge("RGBA", (r, g, b, a))
    layer = Image.alpha_composite(layer, moon_arr)

    # Stern in der Mondöffnung
    d2 = ImageDraw.Draw(layer)
    star(d2, cx + off * 1.15, cy - off * 1.15, R * 0.30)

    img = Image.alpha_composite(base, layer)

    if rounded and not maskable:
        # abgerundete Maske
        mask = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S, S], radius=int(S * 0.22), fill=255)
        img.putalpha(mask)

    img = img.resize((size, size), Image.LANCZOS)
    return img


for name, size, mask in [
    ("icon-192.png", 192, False),
    ("icon-512.png", 512, False),
    ("icon-512-maskable.png", 512, True),
    ("icon-180.png", 180, False),
]:
    im = make(size, maskable=mask)
    if mask:
        im.convert("RGB").save(os.path.join(OUT, name))
    else:
        im.save(os.path.join(OUT, name))
    print("geschrieben:", name)

print("Icons fertig in", OUT)
