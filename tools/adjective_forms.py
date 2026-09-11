# -*- coding: utf-8 -*-
"""
adjective_forms.py
Weibliche Form (Muannath) fuer Adjektive.

Warum wichtig: Das Adjektiv richtet sich im Arabischen nach dem Nomen.
  بَيْتٌ كَبِيرٌ   (Haus ist maskulin)
  سَيَّارَةٌ كَبِيرَةٌ (Auto ist feminin)
Ohne die weibliche Form laesst sich kein richtiger Satz bilden.

Die Regel ist meist "+ ـَةٌ", aber es gibt Muster, die anders gehen:
  - فَعْلَانُ -> فَعْلَى        عَطْشَانُ -> عَطْشَى (Diptot, kein ة)
  - manqus   -> ـِيَةٌ         غَالٍ -> غَالِيَةٌ
  - Hamza nach langem i        بَطِيءٌ -> بَطِيئَةٌ (Traeger wechselt zu ئ)
Deshalb Regel + Ausnahmetabelle statt blindem Anhaengen.

Merksatz fuer den Plural, der bewusst NICHT auf den Karten steht:
Ein Plural von Sachen wird im Arabischen wie ein weiblicher Singular
behandelt - اَلْبُيُوتُ كَبِيرَةٌ ("die Haeuser sind gross").
"""
import unicodedata


def nfc(s):
    return unicodedata.normalize("NFC", s) if s else s


TANWEEN = "ًٌٍ"
SHORT = "َُِ"
MARKS = TANWEEN + SHORT + "ّْٰ"

FATHA, DAMMATAN, KASRATAN, SHADDA = "َ", "ٌ", "ٍ", "ّ"
TA_MARBUTA = "ة"
YA, KASRA = "ي", "ِ"

# Adjektive, die der Regel nicht folgen
EXCEPTIONS = {
    # Muster فَعْلَانُ -> فَعْلَى (Zustandsadjektive, Diptot)
    "عَطْشَانُ": "عَطْشَى",
    "شَبْعَانُ": "شَبْعَى",
    "تَعْبَانُ": "تَعْبَى",
    "كَسْلَانُ": "كَسْلَى",
    "جَوْعَانُ": "جَوْعَى",
    # Hamza-Traeger wechselt
    "بَطِيءٌ": "بَطِيئَةٌ",
    # Ordnungszahl mit eigener weiblicher Form
    "أَوَّلٌ": "أُولَى",
}

# Bedeutungen, die praezisiert werden muessen
MEANING = {
    # آخِرٌ (Kasra) = der letzte;  آخَرُ (Fatha) = ein anderer - zwei Woerter
    "آخِرٌ": "letzter",
    "طَوِيلٌ": "lang (auch: groß gewachsen)",
    "قَصِيرٌ": "kurz (auch: klein gewachsen)",
    "حُلْوٌ": "süß",
    "خَاصٌّ": "besonders (privat)",
    "عَامٌّ": "allgemein (öffentlich)",
    "غَرِيبٌ": "fremd (auch: seltsam)",
    "مُبْتَدِئٌ": "Anfänger (anfangend)",
    "نَاقِصٌ": "unvollständig",
    "مَفْقُودٌ": "fehlend (vermisst)",
    "صَحِيحٌ": "richtig (auch: gesund)",
    "سَلِيمٌ": "unversehrt (gesund)",
}

EXCEPTIONS = {nfc(k): nfc(v) for k, v in EXCEPTIONS.items()}
MEANING = {nfc(k): v for k, v in MEANING.items()}


def feminine(word):
    """Weibliche Form eines Adjektivs, voll vokalisiert."""
    if not word:
        return None
    w = nfc(word.strip())
    if not w:
        return None
    if w in EXCEPTIONS:
        return EXCEPTIONS[w]

    # Zeichen am Wortende abtrennen (Tanwin kann nach NFC vor der Schadda stehen)
    i = len(w)
    while i > 0 and w[i - 1] in MARKS:
        i -= 1
    base, marks = w[:i], w[i:]

    # manqus: غَالٍ -> غَالِيَةٌ
    if KASRATAN in marks:
        return base + KASRA + YA + FATHA + TA_MARBUTA + DAMMATAN

    # verdoppelter Endkonsonant und Nisba behalten ihre Schadda
    shadda = SHADDA if SHADDA in marks else ""
    return base + shadda + FATHA + TA_MARBUTA + DAMMATAN


if __name__ == "__main__":
    tests = [
        ("كَبِيرٌ", "كَبِيرَةٌ"), ("سَهْلٌ", "سَهْلَةٌ"), ("حُلْوٌ", "حُلْوَةٌ"),
        ("مُهِمٌّ", "مُهِمَّةٌ"), ("عَرَبِيٌّ", "عَرَبِيَّةٌ"), ("قَوِيٌّ", "قَوِيَّةٌ"),
        ("غَالٍ", "غَالِيَةٌ"), ("مَاضٍ", "مَاضِيَةٌ"), ("خَاطِئٌ", "خَاطِئَةٌ"),
        ("سَيِّئٌ", "سَيِّئَةٌ"), ("بَطِيءٌ", "بَطِيئَةٌ"), ("عَطْشَانُ", "عَطْشَى"),
        ("حَارٌّ", "حَارَّةٌ"), ("حُرٌّ", "حُرَّةٌ"), ("أَوَّلٌ", "أُولَى"),
    ]
    bad = 0
    for inp, want in tests:
        got = feminine(inp)
        ok = nfc(got) == nfc(want)
        if not ok:
            bad += 1
        print("  %-6s %-14s -> %-14s %s" % ("OK" if ok else "FEHLER", inp, got,
                                            "" if ok else "(erwartet " + want + ")"))
    print()
    print("alle %d korrekt" % len(tests) if not bad else "%d Fehler" % bad)
