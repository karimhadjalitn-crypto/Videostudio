# -*- coding: utf-8 -*-
"""
noun_forms.py
Plural und Genus fuer alle Nomen des Grundwortschatzes.

Arabische Plurale sind groesstenteils gebrochen (jamʿ taksīr) und damit NICHT
aus dem Singular ableitbar - sie muessen pro Wort hinterlegt werden. Diese
Tabelle ist die Quelle dafuer.

Aufbau:  "<fusha exakt wie in vocab.json>": ("<Plural voll vokalisiert>", "<m|f>")
Plural None  = Wort hat keinen gebraeuchlichen Plural (Stoffname, Kollektivum,
               Eigenname, Verbalsubstantiv).

Diptota (Plurale ohne Tanwin wie أَصْدِقَاءُ، مَسَاجِدُ) stehen bewusst mit
Damma statt Tanwin - das ist die korrekte Form, kein fehlendes Zeichen.
"""

import unicodedata

_NOUNS = {
    # ---------------- Familie und Menschen ----------------
    "أَبٌ": ("آبَاءٌ", "m"),
    "أُمٌّ": ("أُمَّهَاتٌ", "f"),
    "وَالِدٌ": ("وَالِدُونَ", "m"),
    "وَالِدَةٌ": ("وَالِدَاتٌ", "f"),
    "اِبْنٌ": ("أَبْنَاءٌ", "m"),
    "بِنْتٌ": ("بَنَاتٌ", "f"),
    "أَخٌ": ("إِخْوَةٌ", "m"),
    "أُخْتٌ": ("أَخَوَاتٌ", "f"),
    "جَدٌّ": ("أَجْدَادٌ", "m"),
    "جَدَّةٌ": ("جَدَّاتٌ", "f"),
    "عَمٌّ": ("أَعْمَامٌ", "m"),
    "عَمَّةٌ": ("عَمَّاتٌ", "f"),
    "خَالٌ": ("أَخْوَالٌ", "m"),
    "خَالَةٌ": ("خَالَاتٌ", "f"),
    "زَوْجٌ": ("أَزْوَاجٌ", "m"),
    "زَوْجَةٌ": ("زَوْجَاتٌ", "f"),
    "طِفْلٌ": ("أَطْفَالٌ", "m"),
    "رَجُلٌ": ("رِجَالٌ", "m"),
    "اِمْرَأَةٌ": ("نِسَاءٌ", "f"),
    "شَابٌّ": ("شَبَابٌ", "m"),
    "فَتَاةٌ": ("فَتَيَاتٌ", "f"),
    "صَدِيقٌ": ("أَصْدِقَاءُ", "m"),
    "زَمِيلٌ": ("زُمَلَاءُ", "m"),
    "جَارٌ": ("جِيرَانٌ", "m"),
    "ضَيْفٌ": ("ضُيُوفٌ", "m"),
    "نَاسٌ": (None, "m"),          # ist selbst schon Kollektiv-Plural
    "شَخْصٌ": ("أَشْخَاصٌ", "m"),
    "طَبِيبٌ": ("أَطِبَّاءُ", "m"),
    "مُمَرِّضٌ": ("مُمَرِّضُونَ", "m"),
    "مُعَلِّمٌ": ("مُعَلِّمُونَ", "m"),
    "طَالِبٌ": ("طُلَّابٌ", "m"),

    # ---------------- Haus und Alltag ----------------
    "بَيْتٌ": ("بُيُوتٌ", "m"),
    "شَقَّةٌ": ("شُقَقٌ", "f"),
    "غُرْفَةٌ": ("غُرَفٌ", "f"),
    "مَطْبَخٌ": ("مَطَابِخُ", "m"),
    "حَمَّامٌ": ("حَمَّامَاتٌ", "m"),
    "بَابٌ": ("أَبْوَابٌ", "m"),
    "نَافِذَةٌ": ("نَوَافِذُ", "f"),
    "سَقْفٌ": ("سُقُوفٌ", "m"),
    "جِدَارٌ": ("جُدْرَانٌ", "m"),
    "أَرْضٌ": ("أَرَاضٍ", "f"),      # أرض ist feminin, trotz fehlendem ة
    "سَرِيرٌ": ("أَسِرَّةٌ", "m"),
    "كُرْسِيٌّ": ("كَرَاسِيُّ", "m"),
    "طَاوِلَةٌ": ("طَاوِلَاتٌ", "f"),
    "خِزَانَةٌ": ("خَزَائِنُ", "f"),
    "مِفْتَاحٌ": ("مَفَاتِيحُ", "m"),
    "مِصْبَاحٌ": ("مَصَابِيحُ", "m"),
    "هَاتِفٌ": ("هَوَاتِفُ", "m"),
    "حَاسُوبٌ": ("حَوَاسِيبُ", "m"),
    "شَاحِنٌ": ("شَوَاحِنُ", "m"),
    "تِلْفَازٌ": ("تِلْفَازَاتٌ", "m"),
    "ثَلَّاجَةٌ": ("ثَلَّاجَاتٌ", "f"),
    "غَسَّالَةٌ": ("غَسَّالَاتٌ", "f"),
    "مِرْآةٌ": ("مَرَايَا", "f"),
    "مِنْشَفَةٌ": ("مَنَاشِفُ", "f"),
    "صَابُونٌ": (None, "m"),        # Stoffname
    "فُرْشَاةٌ": ("فُرَشٌ", "f"),
    "كِيسٌ": ("أَكْيَاسٌ", "m"),
    "صُنْدُوقٌ": ("صَنَادِيقُ", "m"),
    "سُلَّمٌ": ("سَلَالِمُ", "m"),
    "حَدِيقَةٌ": ("حَدَائِقُ", "f"),

    # ---------------- Essen und Trinken ----------------
    "طَعَامٌ": ("أَطْعِمَةٌ", "m"),
    "مَاءٌ": ("مِيَاهٌ", "m"),
    "خُبْزٌ": (None, "m"),
    "لَحْمٌ": ("لُحُومٌ", "m"),
    "دَجَاجٌ": (None, "m"),         # Kollektivum, Einzelstueck: دَجَاجَةٌ
    "سَمَكٌ": ("أَسْمَاكٌ", "m"),
    "أَرُزٌّ": (None, "m"),
    "مَعْكَرُونَةٌ": (None, "f"),
    "بَيْضٌ": (None, "m"),          # Kollektivum, Einzelstueck: بَيْضَةٌ
    "حَلِيبٌ": (None, "m"),
    "جُبْنٌ": (None, "m"),
    "زَيْتٌ": ("زُيُوتٌ", "m"),
    "مِلْحٌ": ("أَمْلَاحٌ", "m"),
    "سُكَّرٌ": (None, "m"),
    "فِلْفِلٌ": (None, "m"),
    "تُفَّاحٌ": (None, "m"),        # Kollektivum, Einzelstueck: تُفَّاحَةٌ
    "مَوْزٌ": (None, "m"),
    "بُرْتُقَالٌ": (None, "m"),
    "عِنَبٌ": (None, "m"),
    "بِطِّيخٌ": (None, "m"),
    "تَمْرٌ": (None, "m"),
    "خُضْرَةٌ": ("خُضْرَوَاتٌ", "f"),
    "فَاكِهَةٌ": ("فَوَاكِهُ", "f"),
    "بَطَاطَا": (None, "f"),
    "طَمَاطِمٌ": (None, "f"),
    "بَصَلٌ": (None, "m"),
    "قَهْوَةٌ": (None, "f"),
    "شَايٌ": (None, "m"),
    "عَصِيرٌ": ("عَصَائِرُ", "m"),
    "وَجْبَةٌ": ("وَجَبَاتٌ", "f"),
    "فُطُورٌ": (None, "m"),
    "غَدَاءٌ": (None, "m"),
    "عَشَاءٌ": (None, "m"),

    # ---------------- Orte und Reisen ----------------
    "مَدِينَةٌ": ("مُدُنٌ", "f"),
    "قَرْيَةٌ": ("قُرًى", "f"),
    "بَلَدٌ": ("بِلَادٌ", "m"),
    "شَارِعٌ": ("شَوَارِعُ", "m"),
    "طَرِيقٌ": ("طُرُقٌ", "m"),
    "مَكَانٌ": ("أَمَاكِنُ", "m"),
    "سُوقٌ": ("أَسْوَاقٌ", "m"),
    "مَتْجَرٌ": ("مَتَاجِرُ", "m"),
    "مَطْعَمٌ": ("مَطَاعِمُ", "m"),
    "فُنْدُقٌ": ("فَنَادِقُ", "m"),
    "مَطَارٌ": ("مَطَارَاتٌ", "m"),
    "مَحَطَّةٌ": ("مَحَطَّاتٌ", "f"),
    "حَافِلَةٌ": ("حَافِلَاتٌ", "f"),
    "قِطَارٌ": ("قِطَارَاتٌ", "m"),
    "سَيَّارَةٌ": ("سَيَّارَاتٌ", "f"),
    "طَائِرَةٌ": ("طَائِرَاتٌ", "f"),
    "دَرَّاجَةٌ": ("دَرَّاجَاتٌ", "f"),
    "تَذْكِرَةٌ": ("تَذَاكِرُ", "f"),
    "جَوَازُ سَفَرٍ": ("جَوَازَاتُ سَفَرٍ", "m"),
    "حَقِيبَةٌ": ("حَقَائِبُ", "f"),
    "رِحْلَةٌ": ("رِحْلَاتٌ", "f"),
    "سَفَرٌ": ("أَسْفَارٌ", "m"),
    "خَرِيطَةٌ": ("خَرَائِطُ", "f"),
    "عُنْوَانٌ": ("عَنَاوِينُ", "m"),
    "مَدْخَلٌ": ("مَدَاخِلُ", "m"),
    "مَخْرَجٌ": ("مَخَارِجُ", "m"),
    "يَمِينٌ": (None, "m"),
    "يَسَارٌ": (None, "m"),
    "وَسَطٌ": ("أَوْسَاطٌ", "m"),
    "جِسْرٌ": ("جُسُورٌ", "m"),
    "بَحْرٌ": ("بِحَارٌ", "m"),
    "شَاطِئٌ": ("شَوَاطِئُ", "m"),
    "جَبَلٌ": ("جِبَالٌ", "m"),

    # ---------------- Religion und Moschee ----------------
    "مَسْجِدٌ": ("مَسَاجِدُ", "m"),
    "صَلَاةٌ": ("صَلَوَاتٌ", "f"),
    "وُضُوءٌ": (None, "m"),
    "قُرْآنٌ": (None, "m"),
    "سُورَةٌ": ("سُوَرٌ", "f"),
    "آيَةٌ": ("آيَاتٌ", "f"),
    "إِيمَانٌ": (None, "m"),
    "إِسْلَامٌ": (None, "m"),
    "مُسْلِمٌ": ("مُسْلِمُونَ", "m"),
    "دُعَاءٌ": ("أَدْعِيَةٌ", "m"),
    "ذِكْرٌ": ("أَذْكَارٌ", "m"),
    "سُجُودٌ": (None, "m"),
    "رُكُوعٌ": (None, "m"),
    "إِمَامٌ": ("أَئِمَّةٌ", "m"),
    "مُؤَذِّنٌ": ("مُؤَذِّنُونَ", "m"),
    "جَمَاعَةٌ": ("جَمَاعَاتٌ", "f"),
    "فَجْرٌ": (None, "m"),
    "ظُهْرٌ": (None, "m"),
    "عَصْرٌ": (None, "m"),
    "مَغْرِبٌ": (None, "m"),
    "عِشَاءٌ": (None, "m"),
    "جُمُعَةٌ": ("جُمَعٌ", "f"),
    "رَمَضَانُ": (None, "m"),
    "صِيَامٌ": (None, "m"),
    "زَكَاةٌ": ("زَكَوَاتٌ", "f"),
    "حَجٌّ": (None, "m"),
    "عُمْرَةٌ": ("عُمَرٌ", "f"),
    "حَلَالٌ": (None, "m"),
    "حَرَامٌ": (None, "m"),

    # ---------------- Studium und Arbeit ----------------
    "جَامِعَةٌ": ("جَامِعَاتٌ", "f"),
    "مَدْرَسَةٌ": ("مَدَارِسُ", "f"),
    "فَصْلٌ": ("فُصُولٌ", "m"),
    "دَرْسٌ": ("دُرُوسٌ", "m"),
    "كِتَابٌ": ("كُتُبٌ", "m"),
    "دَفْتَرٌ": ("دَفَاتِرُ", "m"),
    "قَلَمٌ": ("أَقْلَامٌ", "m"),
    "وَرَقَةٌ": ("أَوْرَاقٌ", "f"),
    "سُؤَالٌ": ("أَسْئِلَةٌ", "m"),
    "جَوَابٌ": ("أَجْوِبَةٌ", "m"),
    "اِمْتِحَانٌ": ("اِمْتِحَانَاتٌ", "m"),
    "وَاجِبٌ": ("وَاجِبَاتٌ", "m"),
    "لُغَةٌ": ("لُغَاتٌ", "f"),
    "كَلِمَةٌ": ("كَلِمَاتٌ", "f"),
    "جُمْلَةٌ": ("جُمَلٌ", "f"),
    "قَاعِدَةٌ": ("قَوَاعِدُ", "f"),
    "مَعْنًى": ("مَعَانٍ", "m"),
    "عَمَلٌ": ("أَعْمَالٌ", "m"),
    "وَظِيفَةٌ": ("وَظَائِفُ", "f"),
    "مَكْتَبٌ": ("مَكَاتِبُ", "m"),
    "مُدِيرٌ": ("مُدِيرُونَ", "m"),
    "مُوَظَّفٌ": ("مُوَظَّفُونَ", "m"),
    "اِجْتِمَاعٌ": ("اِجْتِمَاعَاتٌ", "m"),
    "مَشْرُوعٌ": ("مَشَارِيعُ", "m"),
    "رَاتِبٌ": ("رَوَاتِبُ", "m"),
    "وَقْتٌ": ("أَوْقَاتٌ", "m"),
    "سَاعَةٌ": ("سَاعَاتٌ", "f"),
    "دَقِيقَةٌ": ("دَقَائِقُ", "f"),
    "يَوْمٌ": ("أَيَّامٌ", "m"),
    "أُسْبُوعٌ": ("أَسَابِيعُ", "m"),
    "شَهْرٌ": ("أَشْهُرٌ", "m"),
    "سَنَةٌ": ("سَنَوَاتٌ", "f"),

    # ---------------- Koerper und Gesundheit ----------------
    "رَأْسٌ": ("رُؤُوسٌ", "m"),
    "وَجْهٌ": ("وُجُوهٌ", "m"),
    "عَيْنٌ": ("عُيُونٌ", "f"),
    "أُذُنٌ": ("آذَانٌ", "f"),
    "أَنْفٌ": ("أُنُوفٌ", "m"),
    "فَمٌ": ("أَفْوَاهٌ", "m"),
    "سِنٌّ": ("أَسْنَانٌ", "f"),
    "لِسَانٌ": ("أَلْسِنَةٌ", "m"),
    "يَدٌ": ("أَيْدٍ", "f"),
    "ذِرَاعٌ": ("أَذْرُعٌ", "f"),
    "إِصْبَعٌ": ("أَصَابِعُ", "f"),
    "رِجْلٌ": ("أَرْجُلٌ", "f"),
    "قَلْبٌ": ("قُلُوبٌ", "m"),
    "بَطْنٌ": ("بُطُونٌ", "m"),
    "ظَهْرٌ": ("ظُهُورٌ", "m"),
    "دَمٌ": ("دِمَاءٌ", "m"),
    "جِسْمٌ": ("أَجْسَامٌ", "m"),
    "صِحَّةٌ": (None, "f"),
    "مَرَضٌ": ("أَمْرَاضٌ", "m"),
    "أَلَمٌ": ("آلَامٌ", "m"),
    "دَوَاءٌ": ("أَدْوِيَةٌ", "m"),
    "مُسْتَشْفًى": ("مُسْتَشْفَيَاتٌ", "m"),
    "عِيَادَةٌ": ("عِيَادَاتٌ", "f"),
    "حُمًّى": (None, "f"),
    "جُرْحٌ": ("جُرُوحٌ", "m"),
    "نَوْمٌ": (None, "m"),
    "رَاحَةٌ": (None, "f"),

    # ---------------- Natur, Wetter und Dinge ----------------
    "شَمْسٌ": ("شُمُوسٌ", "f"),
    "قَمَرٌ": ("أَقْمَارٌ", "m"),
    "سَمَاءٌ": ("سَمَاوَاتٌ", "f"),
    "هَوَاءٌ": (None, "m"),
    "مَطَرٌ": ("أَمْطَارٌ", "m"),
    "رِيحٌ": ("رِيَاحٌ", "f"),
    "سَحَابٌ": (None, "m"),         # Kollektivum, Einzelstueck: سَحَابَةٌ
    "حَرَارَةٌ": (None, "f"),
    "بَرْدٌ": (None, "m"),
    "نَارٌ": ("نِيرَانٌ", "f"),
    "شَجَرَةٌ": ("أَشْجَارٌ", "f"),
    "زَهْرَةٌ": ("زُهُورٌ", "f"),
    "حَيَوَانٌ": ("حَيَوَانَاتٌ", "m"),
    "قِطٌّ": ("قِطَطٌ", "m"),
    "كَلْبٌ": ("كِلَابٌ", "m"),
    "طَائِرٌ": ("طُيُورٌ", "m"),
    "لَوْنٌ": ("أَلْوَانٌ", "m"),
    "صَوْتٌ": ("أَصْوَاتٌ", "m"),
    "صُورَةٌ": ("صُوَرٌ", "f"),
    "شَيْءٌ": ("أَشْيَاءُ", "m"),
    "مَالٌ": ("أَمْوَالٌ", "m"),
    "سِعْرٌ": ("أَسْعَارٌ", "m"),
    "رَقْمٌ": ("أَرْقَامٌ", "m"),
    "اِسْمٌ": ("أَسْمَاءٌ", "m"),
    "خَبَرٌ": ("أَخْبَارٌ", "m"),
    "مُشْكِلَةٌ": ("مَشَاكِلُ", "f"),
    "حَلٌّ": ("حُلُولٌ", "m"),
    "فِكْرَةٌ": ("أَفْكَارٌ", "f"),
    "حَقٌّ": ("حُقُوقٌ", "m"),
}

# ---------------------------------------------------------------- #
# Unicode-Normalisierung
# ---------------------------------------------------------------- #
# Schadda und Vokalzeichen koennen in zwei Reihenfolgen kodiert sein
# (أُمٌّ als Schadda+Tanwin oder Tanwin+Schadda). Beide sehen identisch aus,
# sind als String aber verschieden. NFC vereinheitlicht das - ohne diese
# Normalisierung schlaegt jeder Vergleich bei Woertern mit Schadda fehl.
def nfc(s):
    return unicodedata.normalize("NFC", s) if s else s


NOUNS = {nfc(k): (nfc(p), g) for k, (p, g) in _NOUNS.items()}


def lookup(fusha):
    """Plural und Genus zu einem Nomen, oder None."""
    return NOUNS.get(nfc(fusha))


# ---------------------------------------------------------------- #
# Korrekturen am Grundwortschatz
# ---------------------------------------------------------------- #
# Schreibfehler: fusha alt -> fusha neu
SPELLING = {
    "بَطَاطَاٌ": "بَطَاطَا",      # Tanwin auf Alif ist nicht moeglich
    "مَوْظَّفٌ": "مُوَظَّفٌ",      # Partizip von وَظَّفَ: mu- statt ma-
    "اَلدَّجَاجَةُ": "دَجَاجَةٌ",   # einzige Karte mit Artikel -> vereinheitlicht
}

# Unpraezise oder falsche deutsche Bedeutungen: fusha -> neue Bedeutung
MEANING = {
    "سَفَرٌ": "Reise (das Reisen)",      # war "Reisen" -> klang wie das Verb
    "طَعَامٌ": "Essen (die Speise)",     # war "Essen" -> klang wie das Verb
    "صِيَامٌ": "Fasten (das Fasten)",    # war "Fasten" -> klang wie das Verb
    "أَمَامَ": "vor (örtlich)",
    "قَبْلَ": "vor (zeitlich)",
    "وَالِدٌ": "Vater (formell)",
    "وَالِدَةٌ": "Mutter (formell)",
    "عَادَ": "zurückkehren (wiederkommen)",
    "مَاذَا؟": "was? (vor Verben)",
    "مَا؟": "was? (vor Nomen)",
    "جَوْعَانُ": "hungrig (umgangssprachlich)",
}

SPELLING = {nfc(k): nfc(v) for k, v in SPELLING.items()}
MEANING = {nfc(k): v for k, v in MEANING.items()}


# ---------------------------------------------------------------- #
TANWEEN = "ًٌٍ"          # ً ٌ ٍ
SHORT = "َُِ"            # َ ُ ِ
# alle Vokal-/Hilfszeichen: Tanwin, Kurzvokale, Schadda, Sukun, Dolch-Alif
MARKS = TANWEEN + SHORT + "ّْٰ"

# Defektive Nomen (manqus): ihr auslautendes ي faellt im unbestimmten
# Nominativ/Genitiv weg und kehrt in Pause zurueck. An der Schrift NICHT
# erkennbar - غَالٍ (manqus) und سَفَرٍ (nur Genitiv) sehen gleich aus.
MANQUS = set()
for _w in ("غَالٍ", "مَاضٍ", "أَيْدٍ", "مَعَانٍ", "أَرَاضٍ", "لَيَالٍ",
           "قَاضٍ", "نَادٍ", "وَادٍ"):
    MANQUS.add(unicodedata.normalize("NFC", _w))


def pausal(word):
    """Pausalform ('nah an Fusha'): Endung wegfallen lassen.

    بُيُوتٌ -> بُيُوت      Tanwin faellt weg
    أَصْدِقَاءُ -> أَصْدِقَاء   Diptot-Damma faellt weg
    قُرًى -> قُرَى          maqsur: Tanwin weg, Alif maqsura bleibt
    أَيْدٍ -> أَيْدِي        manqus: getilgtes ya kehrt in Pause zurueck
    """
    if not word:
        return None
    w = nfc(word.strip())
    if not w:
        return None

    # Mehrteilige Ausdruecke (Genitivverbindungen wie جَوَازُ سَفَرٍ) Wort fuer
    # Wort behandeln - in Pause verliert jedes Glied seine Endung.
    if " " in w:
        return " ".join(pausal(part) for part in w.split(" "))

    # manqus: das getilgte Ya kehrt in Pause zurueck (أَيْدٍ -> أَيْدِي).
    # Ob ein Wort manqus ist, steht NICHT in der Schrift - سَفَرٍ sieht genauso
    # aus, ist aber nur ein Genitiv. Deshalb feste Liste statt Regel.
    if w in MANQUS:
        base = w
        while base and base[-1] in MARKS:
            base = base[:-1]
        return base + "ِي"

    # maqsur: Wort endet auf Alif/Alif maqsura und traegt davor ein Fathatan
    # (مَعْنًى، حُمًّى). Nach NFC kann zwischen beiden noch eine Schadda stehen,
    # darum wird der ganze Zeichenblock geprueft statt nur das Nachbarzeichen.
    if w[-1] in ("ى", "ا"):
        i = len(w) - 1
        j = i
        while j > 0 and w[j - 1] in MARKS:
            j -= 1
        marks = w[j:i]
        if "ً" in marks:
            keep = "".join(c for c in marks if c not in TANWEEN)
            return w[:j] + keep + "َ" + w[i]
        return w

    # Zeichen am Wortende abtrennen. Nach NFC kann dort das Tanwin VOR der
    # Schadda stehen (أُمٌّ), deshalb der ganze Block statt nur das letzte Zeichen.
    i = len(w)
    while i > 0 and w[i - 1] in MARKS:
        i -= 1
    base, marks = w[:i], w[i:]

    # Tanwin und Endvokal weg, Schadda/Sukun bleiben
    return base + "".join(c for c in marks if c not in TANWEEN + SHORT)


if __name__ == "__main__":
    print("Nomen in der Tabelle:", len(NOUNS))
    ohne = [k for k, (p, g) in NOUNS.items() if p is None]
    print("davon ohne Plural   :", len(ohne))
    print("maskulin / feminin  :",
          sum(1 for _, (p, g) in NOUNS.items() if g == "m"), "/",
          sum(1 for _, (p, g) in NOUNS.items() if g == "f"))
    print()
    for k, (p, g) in list(NOUNS.items())[:8]:
        print("  %-14s %-16s %s  (Pausal: %s)" % (k, p or "—", g, pausal(p) or "—"))
