#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_data.py
Extrahiert den kompletten Wortschatz aus dem Arabisch-Lernbuch (.docx)
und schreibt saubere JSON-Dateien nach ../data/ fuer die Lern-App.

Reproduzierbar: python3 tools/build_data.py
"""
import json
import os
import re
import unicodedata

import docx
from docx.text.paragraph import Paragraph
from docx.table import Table

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
SRC = os.path.join(HERE, "quelle_lernbuch.docx")

os.makedirs(DATA, exist_ok=True)


def iter_block_items(parent):
    for child in parent.iterchildren():
        if child.tag.endswith("}p"):
            yield ("p", Paragraph(child, parent))
        elif child.tag.endswith("}tbl"):
            yield ("tbl", Table(child, parent))


def clean(s):
    if s is None:
        return ""
    s = s.replace("‏", "").replace("‎", "")  # RTL/LTR marks
    return s.strip()


AR_RE = re.compile(r"[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]")


def has_arabic(s):
    return bool(AR_RE.search(s or ""))


def strip_harakat(s):
    """Entfernt Harakat/Tatweel fuer Vergleich."""
    if not s:
        return ""
    out = []
    for ch in unicodedata.normalize("NFC", s):
        cat = unicodedata.category(ch)
        if cat.startswith("M"):  # Mark (Harakat)
            continue
        if ch in ("ـ",):  # Tatweel
            continue
        out.append(ch)
    return "".join(out).strip()


def main():
    d = docx.Document(SRC)
    blocks = list(iter_block_items(d.element.body))

    result = {
        "conjugation_model": None,
        "verbs": [],
        "nouns": [],
        "adjectives": [],
        "prepositions": [],
        "conjunctions": [],
        "questionwords": [],
        "idioms": [],
        "sentences": [],
    }

    current_category = None
    NOUN_CATS = {
        "Familie und Menschen", "Haus und Alltag", "Essen und Trinken",
        "Orte und Reisen", "Religion und Moschee", "Studium und Arbeit",
        "Körper und Gesundheit", "Natur, Wetter und Dinge",
    }

    for kind, obj in blocks:
        if kind == "p":
            t = clean(obj.text)
            if t in NOUN_CATS:
                current_category = t
            continue

        # --- Table ---
        rows = obj.rows
        if not rows:
            continue
        header = [clean(c.text) for c in rows[0].cells]
        hset = " | ".join(header)

        # Conjugation model table
        if header[:1] == ["Pronomen"] and "Vergangenheit" in header:
            model = []
            for r in rows[1:]:
                c = [clean(x.text) for x in r.cells]
                if len(c) >= 5 and c[0]:
                    model.append({
                        "pronoun": c[0], "de": c[1],
                        "past": c[2], "present": c[3], "future": c[4],
                    })
            result["conjugation_model"] = model
            continue

        # Verbs table
        if header[:1] == ["Nr."] and "Vergangenheit" in header and "Präsens" in header:
            for r in rows[1:]:
                c = [clean(x.text) for x in r.cells]
                if len(c) >= 5 and has_arabic(c[1]):
                    result["verbs"].append({
                        "nr": c[0], "past": c[1], "present": c[2],
                        "future": c[3], "de": c[4],
                    })
            continue

        # Nouns table
        if header[0].startswith("Arabisch - Sprechform") or (
            "Sprechform" in hset and "Fuṣḥā-Grundform" in hset
        ):
            for r in rows[1:]:
                c = [clean(x.text) for x in r.cells]
                if len(c) >= 3 and (has_arabic(c[0]) or has_arabic(c[1])):
                    result["nouns"].append({
                        "spoken": c[0], "fusha": c[1], "de": c[2],
                        "category": current_category or "Sonstige",
                    })
            continue

        # Adjectives table
        if header[:1] == ["Nr."] and "Sprechform" in hset and "Deutsch" in header:
            for r in rows[1:]:
                c = [clean(x.text) for x in r.cells]
                if len(c) >= 4 and (has_arabic(c[1]) or has_arabic(c[2])):
                    result["adjectives"].append({
                        "nr": c[0], "spoken": c[1], "fusha": c[2], "de": c[3],
                    })
            continue

        # Prepositions (Arabisch | Deutsch | Beispiel)
        if header[0] == "Arabisch" and "Beispiel" in hset:
            for r in rows[1:]:
                c = [clean(x.text) for x in r.cells]
                if len(c) >= 3 and has_arabic(c[0]):
                    result["prepositions"].append({
                        "fusha": c[0], "de": c[1], "example": c[2],
                    })
            continue

        # Idioms (Fuṣḥā | Nah an Fuṣḥā | Deutsch)
        if header[0] == "Fuṣḥā" and "Nah an Fuṣḥā" in hset:
            for r in rows[1:]:
                c = [clean(x.text) for x in r.cells]
                if len(c) >= 3 and has_arabic(c[0]):
                    result["idioms"].append({
                        "fusha": c[0], "spoken": c[1], "de": c[2],
                    })
            continue

        # Two-col Arabisch | Deutsch -> conjunctions or question words
        if header == ["Arabisch", "Deutsch"]:
            rowsout = []
            for r in rows[1:]:
                c = [clean(x.text) for x in r.cells]
                if len(c) >= 2 and has_arabic(c[0]):
                    rowsout.append({"fusha": c[0], "de": c[1]})
            # first such table = conjunctions, second = questionwords
            if not result["conjunctions"]:
                result["conjunctions"] = rowsout
            else:
                result["questionwords"] = rowsout
            continue

    # --- Sentence patterns (paragraphs) ---
    texts = [clean(o.text) for k, o in blocks if k == "p"]
    # find the Satzmuster section
    # The real section header is "8. Die 100 wichtigsten Satzmuster"
    # (the table-of-contents entry reads "8. 100 zentrale Satzmuster").
    start = None
    for i, t in enumerate(texts):
        if t.startswith("8.") and "wichtigsten Satzmuster" in t:
            start = i
            break
    end = None
    if start is not None:
        for j in range(start + 1, len(texts)):
            if texts[j].startswith("9.") and "Redewendungen" in texts[j]:
                end = j
                break
    seg = texts[start:end] if start is not None else []

    num_re = re.compile(r"^(\d+)\.\s+(.*)$")
    cur = None
    for t in seg:
        m = num_re.match(t)
        if m and not t.startswith(("Fuṣḥā", "Nah", "Wort", "Gesamt")):
            # New pattern header like "1. Ich bin Student."
            if cur:
                result["sentences"].append(cur)
            cur = {"nr": int(m.group(1)), "de": m.group(2).strip(),
                   "fusha": "", "spoken": "", "words": [], "gesamt": ""}
        elif cur is not None:
            if t.startswith("Fuṣḥā:"):
                cur["fusha"] = t.split(":", 1)[1].strip()
            elif t.startswith("Nah an Fuṣḥā:"):
                cur["spoken"] = t.split(":", 1)[1].strip()
            elif t.startswith("Wort für Wort:"):
                body = t.split(":", 1)[1].strip()
                pairs = []
                for part in body.split("|"):
                    part = part.strip()
                    if "=" in part:
                        a, g = part.split("=", 1)
                        pairs.append({"ar": a.strip(), "de": g.strip()})
                cur["words"] = pairs
            elif t.startswith("Gesamt:"):
                cur["gesamt"] = t.split(":", 1)[1].strip()
    if cur:
        result["sentences"].append(cur)
    # Drop the section-header pseudo-entry / anything without an actual sentence
    result["sentences"] = [s for s in result["sentences"] if s["fusha"]]
    # Renumber cleanly 1..N
    for i, s in enumerate(result["sentences"], 1):
        s["nr"] = i

    # Save raw structured extraction
    with open(os.path.join(HERE, "_raw_book.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)

    print("EXTRAHIERT:")
    for k in ["verbs", "nouns", "adjectives", "prepositions",
              "conjunctions", "questionwords", "idioms", "sentences"]:
        print(f"  {k:14s}: {len(result[k])}")
    print(f"  conjugation_model rows: {len(result['conjugation_model'] or [])}")
    # sanity
    print("\nBeispiel Verb:", result["verbs"][0] if result["verbs"] else None)
    print("Beispiel Nomen:", result["nouns"][0] if result["nouns"] else None)
    print("Beispiel Satz:", json.dumps(result["sentences"][0], ensure_ascii=False) if result["sentences"] else None)
    print("Nomen-Kategorien:", sorted(set(n["category"] for n in result["nouns"])))


if __name__ == "__main__":
    main()
