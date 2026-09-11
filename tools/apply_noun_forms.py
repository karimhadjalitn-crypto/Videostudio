#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
apply_noun_forms.py
Traegt Plural + Genus in data/vocab.json ein und korrigiert die bekannten
Schreib- und Bedeutungsfehler.

Arbeitet bewusst direkt auf data/vocab.json statt ueber einen Neubau der
Pipeline: die Karten-IDs (n1, v1, ...) muessen stabil bleiben, weil der
Lernfortschritt im localStorage daran haengt.

    python3 tools/apply_noun_forms.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
sys.path.insert(0, HERE)

import noun_forms as nf


def main():
    path = os.path.join(DATA, "vocab.json")
    vocab = json.load(open(path, encoding="utf-8"))

    n_spell = n_mean = n_plural = n_genus = 0

    for v in vocab:
        fusha = nf.nfc(v["fusha"])

        # 1. Schreibfehler korrigieren (fusha + Sprechform)
        if fusha in nf.SPELLING:
            v["fusha"] = nf.SPELLING[fusha]
            v["spoken"] = nf.pausal(v["fusha"])
            fusha = v["fusha"]
            n_spell += 1

        # 2. Bedeutung praezisieren
        if fusha in nf.MEANING:
            v["de"] = nf.MEANING[fusha]
            n_mean += 1

        # 3. Plural + Genus fuer Nomen
        if v.get("type") == "noun":
            entry = nf.lookup(fusha)
            if entry is None:
                print("  ! kein Tabelleneintrag:", v["de"], v["fusha"])
                continue
            plural, genus = entry
            v["genus"] = genus
            n_genus += 1
            if plural:
                v["plural"] = plural
                v["pluralSpoken"] = nf.pausal(plural)
                n_plural += 1

    with open(path, "w", encoding="utf-8") as f:
        json.dump(vocab, f, ensure_ascii=False, separators=(",", ":"))

    # meta.json: Zaehlungen ergaenzen
    mpath = os.path.join(DATA, "meta.json")
    meta = json.load(open(mpath, encoding="utf-8"))
    meta["counts"]["plurals"] = n_plural
    meta["counts"]["genus"] = n_genus
    with open(mpath, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))

    # appdata.js neu buendeln
    bundle = {
        "vocab": vocab,
        "sentences": json.load(open(os.path.join(DATA, "sentences.json"), encoding="utf-8")),
        "idioms": json.load(open(os.path.join(DATA, "idioms.json"), encoding="utf-8")),
        "grammar": json.load(open(os.path.join(DATA, "grammar.json"), encoding="utf-8")),
        "meta": meta,
    }
    with open(os.path.join(DATA, "appdata.js"), "w", encoding="utf-8") as f:
        f.write("window.APPDATA=")
        json.dump(bundle, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    print("Schreibfehler korrigiert : %d" % n_spell)
    print("Bedeutungen praezisiert  : %d" % n_mean)
    print("Genus gesetzt            : %d" % n_genus)
    print("Plural gesetzt           : %d" % n_plural)


if __name__ == "__main__":
    main()
