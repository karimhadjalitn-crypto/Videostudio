# -*- coding: utf-8 -*-
"""
bundle.py
Baut data/appdata.js aus den einzelnen data/*.json zusammen.

Die App laedt genau eine Datei (appdata.js als window.APPDATA), damit sie
ohne fetch() und damit auch von file:// laeuft. Diese Funktion ist die
einzige Stelle, an der das Buendel entsteht - sonst laufen die Build-Wege
auseinander.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(HERE), "data")

# name im Buendel -> Datei; optional = darf fehlen
PARTS = [
    ("vocab", "vocab.json", False),
    ("sentences", "sentences.json", False),
    ("idioms", "idioms.json", False),
    ("grammar", "grammar.json", False),
    ("meta", "meta.json", False),
    ("quran", "quran.json", True),
]


def bundle():
    out = {}
    for name, fname, optional in PARTS:
        path = os.path.join(DATA, fname)
        if not os.path.exists(path):
            if optional:
                continue
            raise FileNotFoundError(path)
        out[name] = json.load(open(path, encoding="utf-8"))

    target = os.path.join(DATA, "appdata.js")
    with open(target, "w", encoding="utf-8") as f:
        f.write("window.APPDATA=")
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    return {k: (len(v) if isinstance(v, list) else 1) for k, v in out.items()}, \
        os.path.getsize(target)


if __name__ == "__main__":
    counts, size = bundle()
    print("appdata.js neu gebaut (%.0f KB)" % (size / 1024))
    for k, v in counts.items():
        print("  %-10s %s" % (k, v))
