#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
apply_word_forms.py
Reichert data/vocab.json an:
  Nomen     Plural + Genus            (noun_forms.py)
  Adjektive weibliche Form            (adjective_forms.py)
  Verben    verlangte Praeposition    (verb_prepositions.py)
und korrigiert die bekannten Schreib- und Bedeutungsfehler.

Arbeitet bewusst direkt auf data/vocab.json statt ueber einen Neubau der
Pipeline: die Karten-IDs (n1, v1, ...) muessen stabil bleiben, weil der
Lernfortschritt im localStorage daran haengt.

    python3 tools/apply_word_forms.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
sys.path.insert(0, HERE)

import noun_forms as nf
import adjective_forms as af
import verb_prepositions as vp


def main():
    path = os.path.join(DATA, "vocab.json")
    vocab = json.load(open(path, encoding="utf-8"))

    n_spell = n_mean = n_plural = n_genus = n_fem = n_prep = 0

    AR_FIELDS = ("fusha", "spoken", "present", "future", "imperative",
                 "plural", "pluralSpoken", "feminine", "feminineSpoken", "prep")
    n_norm = n_spoken = 0

    for v in vocab:
        # 0. Alles auf eine Unicode-Form bringen. Schadda und Vokalzeichen
        #    lassen sich in zwei Reihenfolgen kodieren; ohne Normalisierung
        #    schlagen Vergleiche bei genau diesen Woertern fehl.
        for f in AR_FIELDS:
            if v.get(f):
                norm = nf.nfc(v[f])
                if norm != v[f]:
                    v[f] = norm
                    n_norm += 1

        fusha = v["fusha"]

        # 1. Schreibfehler korrigieren (fusha + Sprechform)
        if fusha in nf.SPELLING:
            v["fusha"] = nf.SPELLING[fusha]
            fusha = v["fusha"]
            n_spell += 1

        # 1b. Sprechform neu bilden - aber NUR fuer flektierende Wortarten.
        #     Praepositionen, Konjunktionen und Pronomen sind mabni: ihre
        #     Endung ist fester Wortbestandteil, keine Kasusendung. مَعَ bleibt
        #     مَعَ ("maʿa l-bayt"), هُوَ bleibt هُوَ. Eine Pausalform gibt es dort
        #     gar nicht, weil diese Woerter nie am Satzende stehen.
        #     Karims eigene Karten tragen den Sammel-Typ "karim" und koennen
        #     alles sein. Dort gilt dieselbe Faustregel wie im Build: sehr
        #     kurze Woerter (drei Buchstaben ohne Zeichen: مِنْ، فِي، هُوَ،
        #     عِنْدَ) sind Partikeln und bleiben unangetastet, laengere werden
        #     als flektierbar behandelt.
        bare = "".join(ch for ch in fusha if ch not in nf.MARKS and ch != "ـ")
        flektiert = (v.get("type") in ("noun", "adjective", "verb")
                     or any(ch in nf.TANWEEN for ch in fusha)
                     or (v.get("type") == "karim" and len(bare.replace(" ", "")) > 3))
        if flektiert:
            sp = nf.pausal(fusha)
            if sp and sp != v.get("spoken"):
                v["spoken"] = sp
                n_spoken += 1

        # 2. Bedeutung praezisieren
        if fusha in nf.MEANING:
            v["de"] = nf.MEANING[fusha]
            n_mean += 1
        elif fusha in af.MEANING:
            v["de"] = af.MEANING[fusha]
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

        # 4. Weibliche Form fuer Adjektive
        elif v.get("type") == "adjective":
            fem = af.feminine(fusha)
            if fem:
                v["feminine"] = fem
                v["feminineSpoken"] = nf.pausal(fem)
                n_fem += 1

        # 5. Verlangte Praeposition bzw. Warnung bei abweichender Rektion
        elif v.get("type") == "verb":
            prep = vp.preposition(fusha)
            if prep:
                v["prep"] = prep
                n_prep += 1
            note = vp.direct_note(fusha)
            if note:
                v["prepNote"] = note
                n_prep += 1

    with open(path, "w", encoding="utf-8") as f:
        json.dump(vocab, f, ensure_ascii=False, separators=(",", ":"))

    # meta.json: Zaehlungen ergaenzen
    mpath = os.path.join(DATA, "meta.json")
    meta = json.load(open(mpath, encoding="utf-8"))
    meta["counts"]["plurals"] = n_plural
    meta["counts"]["genus"] = n_genus
    meta["counts"]["feminines"] = n_fem
    meta["counts"]["prepositions"] = n_prep
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

    print("Unicode normalisiert     : %d Felder" % n_norm)
    print("Sprechform neu gebildet  : %d" % n_spoken)
    print("Schreibfehler korrigiert : %d" % n_spell)
    print("Bedeutungen praezisiert  : %d" % n_mean)
    print("Genus gesetzt            : %d" % n_genus)
    print("Plural gesetzt           : %d" % n_plural)
    print("Weibliche Form gesetzt   : %d" % n_fem)
    print("Praepositionen gesetzt   : %d" % n_prep)


if __name__ == "__main__":
    main()
