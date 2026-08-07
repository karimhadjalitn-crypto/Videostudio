#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Erzeugt iOS-Startbildschirme (apple-touch-startup-image) + Link-Tags.
   python3 tools/generate_splash.py  ->  assets/splash/*.png und tools/_splash_links.html"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets", "splash")
os.makedirs(OUT, exist_ok=True)

SAND = (250, 246, 239)
TEAL = (18, 133, 124)
DARK = (44, 39, 32)

# (css-width, css-height, ratio) in Hochformat
IPHONES = [
    (320, 568, 2), (375, 667, 2), (414, 896, 2),
    (375, 812, 3), (390, 844, 3), (393, 852, 3),
    (414, 896, 3), (428, 926, 3), (430, 932, 3),
]
IPADS = [
    (768, 1024, 2), (744, 1133, 2), (810, 1080, 2),
    (820, 1180, 2), (834, 1194, 2), (1024, 1366, 2),
]

try:
    FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 10)
    HASFONT = True
except Exception:
    HASFONT = False


def star(d, cx, cy, r, fill):
    pts = []
    for i in range(10):
        rad = r if i % 2 == 0 else r * 0.42
        a = -math.pi / 2 + i * math.pi / 5
        pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    d.polygon(pts, fill=fill)


def draw_logo(base, cx, cy, R):
    """Halbmond + Stern in Teal."""
    S = base.size[0]
    moon = Image.new("RGBA", base.size, (0, 0, 0, 0))
    md = ImageDraw.Draw(moon)
    md.ellipse([cx - R, cy - R, cx + R, cy + R], fill=TEAL + (255,))
    cut = Image.new("RGBA", base.size, (0, 0, 0, 0))
    cd = ImageDraw.Draw(cut)
    off = R * 0.42
    rc = R * 0.92
    cd.ellipse([cx + off - rc, cy - off - rc, cx + off + rc, cy - off + rc], fill=(0, 0, 0, 255))
    r, g, b, a = moon.split()
    import PIL.ImageChops as C
    a = C.subtract(a, cut.split()[3])
    moon = Image.merge("RGBA", (r, g, b, a))
    base.alpha_composite(moon)
    star(ImageDraw.Draw(base), cx + off * 1.15, cy - off * 1.15, R * 0.30, TEAL + (255,))


def make(pxW, pxH):
    img = Image.new("RGBA", (pxW, pxH), SAND + (255,))
    R = min(pxW, pxH) * 0.12
    draw_logo(img, pxW / 2, pxH / 2 - R * 0.3, R)
    d = ImageDraw.Draw(img)
    try:
        f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(R * 0.42))
        txt = "Arabisch"
        tb = d.textbbox((0, 0), txt, font=f)
        d.text(((pxW - (tb[2] - tb[0])) / 2, pxH / 2 + R * 1.1), txt, font=f, fill=DARK)
    except Exception:
        pass
    return img.convert("RGB")


links = []


def emit(W, H, r, orient):
    if orient == "portrait":
        pxW, pxH = W * r, H * r
    else:
        pxW, pxH = H * r, W * r
    name = f"splash-{pxW}x{pxH}.png"
    path = os.path.join(OUT, name)
    if not os.path.exists(path):
        make(pxW, pxH).save(path)
    media = (f"screen and (device-width: {W}px) and (device-height: {H}px) "
             f"and (-webkit-device-pixel-ratio: {r}) and (orientation: {orient})")
    links.append(f'  <link rel="apple-touch-startup-image" media="{media}" href="assets/splash/{name}" />')


seen = set()
for (W, H, r) in IPHONES:
    key = (W, H, r, "portrait")
    if key in seen:
        continue
    seen.add(key)
    emit(W, H, r, "portrait")     # iPhone-PWA ist auf Hochformat fixiert
for (W, H, r) in IPADS:
    for orient in ("portrait", "landscape"):
        emit(W, H, r, orient)

with open(os.path.join(HERE, "_splash_links.html"), "w", encoding="utf-8") as f:
    f.write("\n".join(links) + "\n")

pngs = [x for x in os.listdir(OUT) if x.endswith(".png")]
total = sum(os.path.getsize(os.path.join(OUT, x)) for x in pngs)
print(f"{len(pngs)} Splash-PNGs, gesamt {total//1024} KB")
print(f"{len(links)} Link-Tags -> tools/_splash_links.html")
