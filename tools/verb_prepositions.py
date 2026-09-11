# -*- coding: utf-8 -*-
"""
verb_prepositions.py
Praepositionen, die ein Verb verlangt (Rektion).

Wer ein Verb ohne seine Praeposition lernt, baut zwangslaeufig falsche Saetze:
    falsch:   أَحْتَاجُ مُسَاعَدَةً
    richtig:  أَحْتَاجُ إِلَى مُسَاعَدَةٍ

Zwei Tabellen, weil es in beide Richtungen schiefgehen kann:
  PREPS   - das Verb verlangt eine Praeposition
  DIRECT  - im Deutschen steht eine Praeposition (oder ein Dativ), im
            Arabischen NICHT. Diese Faelle sind die haeufigste Fehlerquelle,
            weil man die deutsche Konstruktion unbewusst uebertraegt.
"""
import unicodedata


def nfc(s):
    return unicodedata.normalize("NFC", s) if s else s


PREPS = {
    # --- Bewegung / Ort ---
    "ذَهَبَ": "إِلَى",        # gehen nach
    "وَصَلَ": "إِلَى",        # ankommen in
    "سَافَرَ": "إِلَى",       # reisen nach
    "عَادَ": "إِلَى",         # zurückkehren nach
    "رَجَعَ": "إِلَى",        # zurückkehren nach
    "خَرَجَ": "مِنْ",         # hinausgehen aus
    "نَزَلَ": "مِنْ",         # aussteigen aus
    "سَقَطَ": "مِنْ",         # fallen von
    "بَقِيَ": "فِي",          # bleiben in
    "سَكَنَ": "فِي",          # wohnen in
    "عَاشَ": "فِي",           # leben in
    "عَمِلَ": "فِي",          # arbeiten bei/in
    "جَلَسَ": "عَلَى",        # sitzen auf
    "وَضَعَ": "عَلَى",        # legen auf

    # --- Wahrnehmung / Kommunikation ---
    "نَظَرَ": "إِلَى",        # schauen auf
    "اِسْتَمَعَ": "إِلَى",    # zuhören
    "بَحَثَ": "عَنْ",         # suchen nach
    "سَأَلَ": "عَنْ",         # fragen nach
    "أَجَابَ": "عَنْ",        # antworten auf
    "حَكَى": "عَنْ",          # erzählen von
    "تَكَلَّمَ": "مَعَ",      # sprechen mit
    "قَالَ": "لِ",            # sagen zu
    "شَرَحَ": "لِ",           # erklären für
    "اِتَّصَلَ": "بِ",        # anrufen (jemanden)

    # --- Gefühl / Denken ---
    "شَعَرَ": "بِ",           # fühlen
    "فَرِحَ": "بِ",           # sich freuen über
    "خَافَ": "مِنْ",          # Angst haben vor
    "حَزِنَ": "عَلَى",        # traurig sein über
    "ضَحِكَ": "عَلَى",        # lachen über
    "بَكَى": "عَلَى",         # weinen über
    "فَكَّرَ": "فِي",         # nachdenken über
    "فَضَّلَ": "عَلَى",       # bevorzugen vor
    "اِحْتَاجَ": "إِلَى",     # brauchen

    # --- Handlung / Ziel ---
    "بَدَأَ": "بِ",           # anfangen mit
    "اِنْتَهَى": "مِنْ",      # fertig werden mit
    "تَوَقَّفَ": "عَنْ",      # aufhören mit
    "اِسْتَمَرَّ": "فِي",     # weitermachen mit
    "نَجَحَ": "فِي",          # Erfolg haben in
    "فَشِلَ": "فِي",          # scheitern an
    "فَازَ": "بِ",            # gewinnen
    "لَعِبَ": "بِ",           # spielen mit
    "مَسَكَ": "بِ",           # festhalten an
    "مَلَأَ": "بِ",           # füllen mit
    "وَعَدَ": "بِ",           # versprechen
    "تَدَرَّبَ": "عَلَى",     # trainieren
    "وَافَقَ": "عَلَى",       # zustimmen zu
    "اِتَّفَقَ": "عَلَى",     # sich einigen auf
    "اِخْتَلَفَ": "عَنْ",     # sich unterscheiden von
    "خَطَّطَ": "لِ",          # planen für
    "اِشْتَرَى": "مِنْ",      # kaufen bei
    "طَلَبَ": "مِنْ",         # verlangen von
    "اِسْتَلَمَ": "مِنْ",     # bekommen von
    "مَنَعَ": "مِنْ",         # abhalten von
    "نَزَعَ": "مِنْ",         # entfernen von
    "شُفِيَ": "مِنْ",         # genesen von
    "سَمَحَ": "لِ",           # erlauben (jemandem)
    "دَفَعَ": "لِ",           # bezahlen an
    "بَاعَ": "لِ",            # verkaufen an
    "أَرْسَلَ": "إِلَى",      # schicken an
    "غَابَ": "عَنْ",          # fehlen bei
    "سَجَدَ": "لِ",           # sich niederwerfen vor
    "دَعَا": "لِ",            # bitten für
}

# Im Deutschen mit Praeposition oder Dativ - im Arabischen ohne
DIRECT = {
    "اِنْتَظَرَ": "warten auf → ohne Vorwort",
    "سَاعَدَ": "helfen + Dativ → ohne Vorwort",
    "خَدَمَ": "dienen + Dativ → ohne Vorwort",
    "تَذَكَّرَ": "sich erinnern an → ohne Vorwort",
    "دَخَلَ": "hineingehen in → ohne Vorwort",
    "رَكِبَ": "einsteigen in → ohne Vorwort",
    "تَبِعَ": "folgen + Dativ → ohne Vorwort",
    "زَارَ": "zu Besuch gehen zu → ohne Vorwort",
    "قَابَلَ": "sich treffen mit → ohne Vorwort",
}

PREPS = {nfc(k): nfc(v) for k, v in PREPS.items()}
DIRECT = {nfc(k): v for k, v in DIRECT.items()}


def preposition(fusha):
    """Verlangte Praeposition, oder None."""
    return PREPS.get(nfc(fusha))


def direct_note(fusha):
    """Hinweis, wenn das Deutsche eine Praeposition hat und das Arabische nicht."""
    return DIRECT.get(nfc(fusha))


if __name__ == "__main__":
    print("Verben mit Praeposition :", len(PREPS))
    print("Verben ohne (Warnung)   :", len(DIRECT))
    overlap = set(PREPS) & set(DIRECT)
    print("Ueberschneidung (muss leer sein):", overlap or "keine")
