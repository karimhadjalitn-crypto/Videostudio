#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_quran.py
Baut data/quran.json aus den Quellen quran_words.py und quran_texts.py.

Zusaetzlich:
  * vergibt stabile IDs (qw1, qw2 ... fuer Woerter)
  * verknuepft jedes Wort im Vers mit dem passenden Wortschatz-Eintrag
    (ueber Grundform bzw. Wortform, Harakat- und Artikel-unabhaengig)
  * markiert Ueberschneidungen mit dem Alltagswortschatz (data/vocab.json),
    damit dasselbe Wort nicht zweimal von vorn gelernt wird
  * meldet Woerter aus den Texten, die noch nicht im Wortschatz stehen

    python3 tools/build_quran.py
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

from quran_words import WORDS
from quran_texts import TEXTS

MARKS = re.compile("[ً-ْٰـ]")


def nfc(s):
    return unicodedata.normalize("NFC", s) if s else s


def key(s):
    """Vergleichsform: ohne Vokalzeichen, ohne Artikel, ohne Bindestriche."""
    s = MARKS.sub("", nfc(s or "")).strip()
    s = s.strip("ًٌٍَُِّْ.،؟!:")
    for art in ("ال", "وال", "بال", "فال", "لل"):
        if s.startswith(art) and len(s) > len(art) + 1:
            s = s[len(art):]
            break
    return s


def main():
    # ---------- Woerter mit IDs ----------
    words = []
    by_key = {}
    for i, w in enumerate(WORDS, 1):
        item = {"id": "qw%d" % i, "ar": nfc(w["ar"]), "de": w["de"],
                "root": w["root"], "level": w["level"]}
        if w.get("freq"):
            item["freq"] = w["freq"]
        words.append(item)
        by_key.setdefault(key(w["ar"]), item["id"])

    # ---------- Ueberschneidung mit dem Alltagswortschatz ----------
    overlap = 0
    try:
        vocab = json.load(open(os.path.join(DATA, "vocab.json"), encoding="utf-8"))
    except FileNotFoundError:
        vocab = []
    vocab_key = {}
    for v in vocab:
        vocab_key.setdefault(key(v["fusha"]), v["id"])
    for item in words:
        vid = vocab_key.get(key(item["ar"]))
        if vid:
            item["also"] = vid          # dasselbe Wort im Alltagswortschatz
            overlap += 1

    # ---------- Texte: Verse zusammensetzen, Woerter verknuepfen ----------
    texts = []
    unbekannt = []
    verse_count = word_count = linked = 0
    for t in TEXTS:
        ayat = []
        for a in t["ayat"]:
            ws = []
            for w in a["words"]:
                entry = {"ar": nfc(w["ar"]), "de": w["de"], "root": w.get("root", "—")}
                if w.get("name"):
                    entry["name"] = True
                if w.get("lemma"):
                    entry["lemma"] = nfc(w["lemma"])
                # Verknuepfung: erst ueber die Grundform, dann ueber die Wortform
                wid = by_key.get(key(w.get("lemma") or "")) or by_key.get(key(w["ar"]))
                if wid:
                    entry["word"] = wid
                    linked += 1
                else:
                    # Steht das Wort schon im Alltagswortschatz? Dann ist es
                    # nicht "fehlend", sondern von dort aus lernbar.
                    vid = (vocab_key.get(key(w.get("lemma") or ""))
                           or vocab_key.get(key(w["ar"])))
                    if vid:
                        entry["vocab"] = vid
                        linked += 1
                    elif w.get("root", "—") != "—" and not w.get("name"):
                        # Eigennamen brauchen keine Vokabelkarte
                        unbekannt.append((t["id"], w.get("lemma") or w["ar"], w["de"]))
                ws.append(entry)
                word_count += 1
            ayat.append({"nr": a["nr"], "de": a["de"],
                         "ar": " ".join(x["ar"] for x in ws), "words": ws})
            verse_count += 1
        item = {"id": t["id"], "kind": t["kind"], "name": nfc(t["name"]),
                "nameDe": t["nameDe"], "ayat": ayat}
        if t.get("nr"):
            item["nr"] = t["nr"]
        if t.get("note"):
            item["note"] = t["note"]
        texts.append(item)

    levels = {}
    for w in words:
        levels[str(w["level"])] = levels.get(str(w["level"]), 0) + 1

    out = {
        "words": words,
        "texts": texts,
        "meta": {
            "words": len(words), "levels": levels,
            "texts": len(texts), "ayat": verse_count,
            "suras": sum(1 for t in texts if t["kind"] == "sura"),
            "adhkar": sum(1 for t in texts if t["kind"] == "dhikr"),
            "overlap_alltag": overlap,
        },
    }
    with open(os.path.join(DATA, "quran.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    print("Woerter            : %d  %s" % (len(words), levels))
    print("davon im Alltag    : %d (werden nicht doppelt gelernt)" % overlap)
    print("mit Haeufigkeit    : %d" % sum(1 for w in words if w.get("freq")))
    print("Texte              : %d (%d Suren, %d Gebetstexte)"
          % (len(texts), out["meta"]["suras"], out["meta"]["adhkar"]))
    print("Verse / Wortformen : %d / %d" % (verse_count, word_count))
    print("davon verknuepft   : %d" % linked)
    if unbekannt:
        print()
        print("Noch nicht im Wortschatz (%d) - Kandidaten fuer die naechste Stufe:" % len(unbekannt))
        seen = set()
        for tid, w, de in unbekannt:
            if w in seen:
                continue
            seen.add(w)
            print("   %-16s %-22s (%s)" % (w, de, tid))


if __name__ == "__main__":
    main()
