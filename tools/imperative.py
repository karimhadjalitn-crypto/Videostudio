# -*- coding: utf-8 -*-
"""
Befehlsform (Imperativ, صيغة الأمر) aus dem Präsens ableiten.

Klassische Ableitung:
  1. Präfix يَ / يُ abtrennen
  2. Jussiv bilden (Endvokal -> Sukūn, schwacher Endbuchstabe faellt weg,
     hohler Stamm verkuerzt den Langvokal)
  3. Beginnt der Rest mit Sukūn/Schadda -> Hilfs-Hamza (همزة وصل) davor:
     اُ wenn der Stammvokal Damma ist, sonst اِ
     Bei Form IV (Praefix يُ) stattdessen أَ (همزة قطع)
Unregelmaessige Verben stehen in EXCEPTIONS.
"""

FATHA, DAMMA, KASRA = "َ", "ُ", "ِ"
SUKUN, SHADDA = "ْ", "ّ"
TANWEEN = "ًٌٍ"
MARKS = FATHA + DAMMA + KASRA + SUKUN + SHADDA + TANWEEN + "ٰ"
LONG = "اوي"          # ا و ي
WEAK_END = "ىويا"  # ى و ي ا

# Verben, die der Regel nicht folgen (oder gar keinen Imperativ haben)
EXCEPTIONS = {
    "يَأْخُذُ": "خُذْ",   # يَأْخُذُ -> خُذْ
    "يَأْكُلُ": "كُلْ",   # يَأْكُلُ -> كُلْ
    "يَجِيءُ": "جِئْ",         # يَجِيءُ -> جِئْ
    # Passiv – kein Imperativ
    "يُشْفَى": None,                 # يُشْفَى (gesund werden)
    "يُولَدُ": None,                 # يُولَدُ (geboren werden)
}


def units(word):
    """Zerlegt in [Buchstabe + zugehoerige Zeichen]."""
    out = []
    for ch in word:
        if ch in MARKS and out:
            out[-1][1] += ch
        else:
            out.append([ch, ""])
    return out


def imperative(present):
    """Gibt die Befehlsform (2. Pers. Sg. m.) zurueck oder None."""
    if not present:
        return None
    present = present.strip()
    if present in EXCEPTIONS:
        return EXCEPTIONS[present]

    u = units(present)
    if len(u) < 2 or u[0][0] != "ي":
        return None

    prefix_damma = DAMMA in u[0][1]
    stem = [list(x) for x in u[1:]]
    if not stem:
        return None

    # --- Jussiv ---
    last = stem[-1]
    if last[0] in WEAK_END and last[1] == "":
        # schwacher Endbuchstabe faellt weg (يمشي -> امشِ)
        stem.pop()
        if not stem:
            return None
    elif SHADDA in last[1]:
        # verdoppelter Stamm: يظنُّ -> ظُنَّ
        last[1] = SHADDA + FATHA
    else:
        last[1] = SUKUN
        # hohler Stamm: Langvokal vor dem letzten Buchstaben faellt weg
        if len(stem) >= 2 and stem[-2][0] in LONG and stem[-2][1] == "":
            stem.pop(-2)

    if not stem:
        return None

    # --- Form II / III behalten kein Praefix ---
    first = stem[0]
    form_ii_iii = (
        prefix_damma and FATHA in first[1] and len(stem) >= 2
        and (SHADDA in stem[1][1] or (stem[1][0] == "ا" and stem[1][1] == ""))
    )

    body = "".join(ch + mk for ch, mk in stem)
    needs_hamza = (SUKUN in first[1]) or (SHADDA in first[1])

    if prefix_damma and not form_ii_iii:
        # Form IV: Hamzat qatʿ mit Fatha, Stamm-Sukūn bleibt
        return "أ" + FATHA + body
    if not needs_hamza:
        return body

    # Hilfs-Hamza: Damma nur, wenn der Stammvokal Damma ist.
    # Stammvokal = letzter echte Vokal im Wort (bei يَدْعُو -> اُدْعُ steht er
    # auf dem letzten Buchstaben, bei يَخْرُجُ -> اُخْرُجْ auf dem vorletzten).
    stem_vowel = ""
    for ch, mk in reversed(stem):
        v = [m for m in mk if m in (FATHA, DAMMA, KASRA)]
        if v:
            stem_vowel = v[-1]
            break
    helper = DAMMA if stem_vowel == DAMMA else KASRA
    return "ا" + helper + body


if __name__ == "__main__":
    import json, sys, os
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    vocab = json.load(open(os.path.join(root, "data", "vocab.json"), encoding="utf-8"))
    for v in vocab:
        if v.get("type") == "verb":
            print("%-30s %-14s %-14s %s" % (v["de"], v["fusha"], v["present"],
                                            imperative(v.get("present")) or "—"))
