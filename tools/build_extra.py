#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_extra.py
Traegt die Eintraege aus vocab_extra.py in data/vocab.json ein.

Arbeitet – wie apply_word_forms.py – direkt auf data/vocab.json, statt die
Pipeline neu zu bauen: die vorhandenen Karten-IDs (n1, v1, ...) muessen
stabil bleiben, weil der Lernfortschritt im localStorage daran haengt.
Neue Karten bekommen fortlaufende IDs hinter den hoechsten bestehenden.

Abgeleitet werden:
    Sprechform      noun_forms.pausal()       (Nomen, Adjektive, Verben, Zahlen)
    weibliche Form  adjective_forms.feminine() (falls nicht ausdruecklich gesetzt)
    Zukunft         سَ + Praesens
    Befehlsform     imperative.imperative()

Doppelte Woerter (gleiche Schrift wie eine bestehende Karte) werden NICHT
eingetragen, sondern gemeldet – zwei Karten mit demselben arabischen Wort
haetten im Quiz zwei richtige Antworten.

    python3 tools/build_extra.py [--dry]
"""
import json
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
sys.path.insert(0, HERE)

import noun_forms as nf
import adjective_forms as af
import bundle
from imperative import imperative
from vocab_extra import EXTRA

# Wortarten, deren Endung sich beugt – nur bei ihnen wird die Sprechform
# gebildet. Wendungen stehen schon so da, wie man sie spricht.
INFLECTED = ("noun", "adjective", "verb", "number")

ID_PREFIX = {"noun": "n", "verb": "v", "adjective": "a",
             "number": "z", "phrase": "w"}


def nfc(s):
    return unicodedata.normalize("NFC", s) if s else s


HARAKAT = re.compile("[ً-ْٰ]")
ARTICLE = re.compile("^ا[ً-ْٰ]*ل[ً-ْٰ]*")


def key(word):
    """Vergleichsform: mit Vokalzeichen, aber ohne Artikel.

    Die Vokalzeichen MUESSEN mitverglichen werden. Ohne sie faellt z.B.
    شَعْرٌ (Haar) mit شَعَرَ (fuehlen) zusammen – zwei verschiedene Woerter
    aus derselben Wurzel.
    """
    w = nfc(word or "").strip().replace("ٱ", "ا")   # Alif wasla -> Alif
    if len(HARAKAT.sub("", w)) > 3:
        w = ARTICLE.sub("", w, count=1)
    return w


def skeleton(word):
    """Nur die Buchstaben – fuer den Hinweis auf aehnliche Woerter."""
    return HARAKAT.sub("", key(word))


# ---------------------------------------------------------------- #
# Korrekturen an bestehenden Karten
#
# Beim Eintragen der neuen Woerter sind ein paar Stellen aufgefallen, an
# denen eine alte Karte dasselbe Wort schon fuehrt – mal mit einem Tippfehler,
# mal mit einer Bedeutung, die zu eng gefasst war. Die IDs bleiben, damit der
# Lernfortschritt haengen bleibt.
# ---------------------------------------------------------------- #
FIX = {
    # الآنَ steht immer im Akkusativ – das Damma war falsch
    "k38": {"fusha": "اَلْآنَ",
            "spoken": "اَلْآنَ"},
    # war اَلْكُوبْ (mit Artikel, ohne Endung) – jetzt wie der ganze Rest
    "k2": {"fusha": "كُوبٌ", "spoken": "كُوب",
           "de": "Becher, Trinkglas"},
    # Zahlwoerter gehoeren zu den Zahlen, nicht unter die Adjektive
    "a90": {"category": "Zahlen", "de": "eins, einzeln"},
    "a91": {"category": "Zahlen"},
    # Bedeutungen, die dasselbe Wort noch mit abdeckt
    "n149": {"de": "Freitagsgebet"},
    "a21": {"de": "nah (auch: Verwandter)"},
    "n226": {"de": "Feuer (auch: Höllenfeuer)"},
    # حَتَّى ist Vorwort UND Konjunktion – zwei Karten, jetzt klar getrennt
    "p24": {"de": "bis (zeitlich), sogar"},
    "c12": {"de": "bis, damit (vor einem Verb)"},
    # أَرْضٌ stand zweimal drin. Fuer den Fussboden im Zimmer gibt es ein
    # eigenes Wort – damit ist die Dublette weg und die Karte genauer.
    "n41": {"de": "Fußboden", "fusha": "أَرْضِيَّةٌ",
            "spoken": "أَرْضِيَّة",
            "plural": "أَرْضِيَّاتٌ",
            "pluralSpoken": "أَرْضِيَّات",
            "genus": "f"},
    "n219": {"de": "Erde, Boden"},
    # دَجَاجٌ (Sammelwort) und دَجَاجَةٌ (ein einzelnes Tier) hiessen beide "Huhn"
    "n66": {"de": "Huhn (Sammelwort)"},
    "k23": {"de": "Henne (ein einzelnes Huhn)"},
}


def next_ids(vocab):
    """Hoechste vergebene Nummer je Praefix."""
    top = {}
    for c in vocab:
        m = re.match(r"([a-z]+)(\d+)$", c["id"])
        if m:
            top[m.group(1)] = max(top.get(m.group(1), 0), int(m.group(2)))
    return top


def future(present):
    # سَ mit Fatha – wie in den bestehenden Karten (سَيَذْهَبُ)
    return ("سَ" + present) if present else None


def build_card(e, cid):
    """Eine EXTRA-Zeile in eine Karte verwandeln."""
    t = e["type"]
    ar = nfc(e["ar"])
    card = {"id": cid, "type": t, "category": e["cat"], "de": e["de"],
            "fusha": ar}

    # Sprechform
    card["spoken"] = nfc(nf.pausal(ar)) if t in INFLECTED else ar
    # Zahlen aus mehreren Woertern (أَحَدَ عَشَرَ) sind unbeugbar gebaut –
    # da bleibt die Endung stehen.
    if t == "number" and " " in ar:
        card["spoken"] = ar

    card["karim"] = False

    if t == "noun":
        if e.get("g"):
            card["genus"] = e["g"]
        if e.get("pl"):
            card["plural"] = nfc(e["pl"])
            card["pluralSpoken"] = nfc(nf.pausal(e["pl"]))
    elif t == "adjective":
        fem = e["fem"] if "fem" in e else af.feminine(ar)
        if fem:
            card["feminine"] = nfc(fem)
            card["feminineSpoken"] = nfc(nf.pausal(fem))
    elif t == "verb":
        card["present"] = nfc(e["pres"])
        card["future"] = nfc(future(e["pres"]))
        imp = imperative(card["present"])
        if imp:
            card["imperative"] = nfc(imp)
        if e.get("prep"):
            card["prep"] = nfc(e["prep"])

    if e.get("note"):
        card["note"] = e["note"]
    return card


def main():
    dry = "--dry" in sys.argv
    path = os.path.join(DATA, "vocab.json")
    vocab = json.load(open(path, encoding="utf-8"))

    by_id = {c["id"]: c for c in vocab}
    n_fix = 0
    for cid, patch in FIX.items():
        if cid not in by_id:
            print("FEHLT: Karte %s (Korrektur nicht angewendet)" % cid)
            continue
        by_id[cid].update({k: nfc(v) for k, v in patch.items()})
        n_fix += 1

    seen, skel = {}, {}
    for c in vocab:
        seen.setdefault(key(c["fusha"]), c)
        skel.setdefault(skeleton(c["fusha"]), c)

    top = next_ids(vocab)
    added, skipped, noimp, near = [], [], [], []

    for e in EXTRA:
        k = key(e["ar"])
        if k in seen:
            other = seen[k]
            skipped.append((e["de"], e["ar"], other["de"], other["id"]))
            continue
        t = e["type"]
        pre = ID_PREFIX[t]
        top[pre] = top.get(pre, 0) + 1
        card = build_card(e, pre + str(top[pre]))
        if t == "verb" and "imperative" not in card:
            noimp.append((e["de"], card["present"]))
        s = skeleton(e["ar"])
        if s in skel:
            near.append((e["de"], e["ar"], skel[s]["de"], skel[s]["fusha"]))
        else:
            skel[s] = card
        seen[k] = card
        added.append(card)

    print("Korrekturen an alten Karten: %d" % n_fix)
    print("neu: %d" % len(added))
    if skipped:
        print("uebersprungen (Wort schon vorhanden): %d" % len(skipped))
        for de, ar, other_de, other_id in skipped:
            print("   %-34s %-16s == %s (%s)" % (de, ar, other_de, other_id))
    if noimp:
        print("ohne Befehlsform: %d" % len(noimp))
        for de, pres in noimp:
            print("   %-34s %s" % (de, pres))
    if near:
        print("gleiches Schriftbild ohne Vokalzeichen (nur Hinweis): %d" % len(near))
        for de, ar, o_de, o_ar in near:
            print("   %-30s %-14s ~ %-24s %s" % (de, ar, o_de, o_ar))

    if dry:
        return

    vocab.extend(added)

    # Alle arabischen Felder auf eine Schreibweise bringen. Schadda und
    # Tanwin lassen sich in zwei Reihenfolgen kodieren; sie sehen gleich aus,
    # sind als Zeichenkette aber verschieden – jeder Vergleich ginge sonst schief.
    AR_FIELDS = ("fusha", "spoken", "present", "future", "imperative",
                 "plural", "pluralSpoken", "feminine", "feminineSpoken", "prep")
    n_norm = 0
    for c in vocab:
        for f in AR_FIELDS:
            if c.get(f) and nfc(c[f]) != c[f]:
                c[f] = nfc(c[f])
                n_norm += 1
    if n_norm:
        print("Schreibweise vereinheitlicht: %d Felder" % n_norm)

    json.dump(vocab, open(path, "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))

    # ---- meta.json: Kategorien und Zaehlungen nachziehen ----
    mpath = os.path.join(DATA, "meta.json")
    meta = json.load(open(mpath, encoding="utf-8"))
    counts = {}
    order = []
    for c in vocab:
        if c["category"] not in counts:
            order.append(c["category"])
            counts[c["category"]] = 0
        counts[c["category"]] += 1
    # bestehende Reihenfolge beibehalten, neue Kategorien hinten anfuegen
    old = [c["name"] for c in meta["categories"]]
    names = old + [n for n in order if n not in old]
    meta["categories"] = [{"name": n, "count": counts[n]} for n in names
                          if n in counts]

    def n_of(*types):
        return sum(1 for c in vocab if c["type"] in types)
    meta["counts"].update({
        "vocab_total": len(vocab),
        "verbs": n_of("verb"),
        "nouns": n_of("noun"),
        "adjectives": n_of("adjective"),
        "numbers": n_of("number"),
        "phrases": n_of("phrase"),
        "imperatives": sum(1 for c in vocab if c.get("imperative")),
        "plurals": sum(1 for c in vocab if c.get("plural")),
        "genus": sum(1 for c in vocab if c.get("genus")),
        "feminines": sum(1 for c in vocab if c.get("feminine")),
        "prepositions": sum(1 for c in vocab if c.get("prep"))
                        + sum(1 for c in vocab if c["type"] == "preposition"),
    })
    json.dump(meta, open(mpath, "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))

    bundle.bundle()
    print("\ndata/vocab.json: %d Karten" % len(vocab))
    print("Kategorien: %d" % len(meta["categories"]))


if __name__ == "__main__":
    main()
