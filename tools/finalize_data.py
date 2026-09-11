#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
finalize_data.py
Baut die finalen App-Daten:
  data/vocab.json      alle Vokabeln (Buch + Karims Extras), mit Karim-Flag
  data/sentences.json  100 Satzmuster
  data/idioms.json     Redewendungen
  data/grammar.json    Konjugations-Modell + Hinweise
  data/meta.json       Kategorien, Zaehlungen, Aenderungsliste
Reproduzierbar:  python3 tools/build_data.py && python3 tools/finalize_data.py
"""
import json
import os
import re
import unicodedata

from imperative import imperative
from noun_forms import SPELLING, MEANING, lookup, pausal, nfc

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
book = json.load(open(os.path.join(HERE, "_raw_book.json"), encoding="utf-8"))

# ------------------------------------------------------------------ #
# Karims Liste (Deutsch / Arabisch) exakt wie geschickt
# ------------------------------------------------------------------ #
KARIM_RAW = """Apfel / تُفَّاحٌ
Arm (nicht das Körperteil) / فَقِيرٌ
Auf / عَلَى
Auge / عَيْنٌ
Badezimmer / حَمَّامٌ
Becher / اَلْكُوبْ
Bein / رِجْلٌ
Blume / زَهْرَةٌ
Brot / خُبْزٌ
Brust / صَدْرٌ
Butter / زِبْدَةٌ
Bügeleisen / اَلْمِكْوَاةُ
China / اَلصِّنُ
Das Auto / اَاسَّيَّارَةُ
Das Fahrrad / اَلدَّرَّاجَةُ
Das Klassenzimmer / اَلْفَصْلُ
Das Zimmer / اَلْغُرْفَةُ
Der Bauer / اَلْفَلاَّحُ
Der Direktor / اَلْمُدِيرُ
Der Garten / اَلْحَدِيقَةُ
Der Gebetsruf / اَلْمُؤَذِّنِ
Der Himmel / اَلسَّمَاءُ
Der Ingenieur / اَلْمُهَنْدِسُ
Der Junge / الْفَتَى
Der Klassenkamerad / الْزَمِيلُ
Der Löffel / اَلْمِاْعَقَةُ
Der Markt / اَلسُّوقُ
Der Minister / الْوَزِيرُ
Der Name / اَلْاءِسْمُ
Der Onkel (m. Seite) / اَلْخَالُ
Der Onkel (v. Seite) / اَلْعَمُّ
Der Topf / اَلْقِدْرُ
Der Ventilator / الْمِرْوَحَة
Die Bücherei / الْمَكْتَبَة
Die Klinik / الْمُسْتَوْصَف
Die Philippinen / اَلْفِلِبِّينُ
Die Schule / اَلْمَدْرَسَةُ
Die Straße / اَلشَّارِعُ
Die Tasche / اَلْحَقِيبَةُ
Die Toilette / اَلْمِرْحَاضُ
Die Universität / اَلْجَامِعَةُ
Ehepartner / زَوْخٌ
Ei / بيْضَةٌ
Ente / بَطَّةٌ
Er / هُوَ
Fenster / اَلنَّافِذَةُ
Finger / إصْبَعٌ
Fisch / سَمَكٌ
Flasche / قَارُرَةٌ
Fleisch / لَحْمٌ
Gast / ضَيْفٌ
Gesicht / وَجْهٌ
Gold / ذَهَبٌ
Hand / يَدٌ
Heft / دَفْتَرٌ
Huhn / اَلدَّجَاجَةُ
Händler / تَاجِرٌ
In / فِي
Indien / اَلْهِنْدُ
Japan / اَلْيَابَانُ
Kaffee / اَلْقَهْوَةُ
Kamelstute / نَاقَةٌ
Kleid / ثَوْبٌ
Kopf / رَأْسٌ
Krank / مَرِيضٌ
Krankenschwester / مُمَرِّضَةٌ
Küche / مَطْبَخٌ
Kühlschrank / اَلثَّلاَّجَةُ
Laden / دُكَّانٌ
Lang (Körpergröße) / طَوِيلٌ
Lebensmittel / غَذَاءٌ
Lecker / لَذِيذٌ
Luft / هَوَاءٌ
Milch / حَلِيبْ
Mund / فَمٌ
Nase / أَنْفٌ
Ohr / أُذُنٌ
Professor / أُسْتَاذُ
Reich / غَنِيٌّ
Rücken / ظَهْرٌ
Schrank / خِزَانَةٌ
Seife / صَابُونٌ
Sie / هِيَ
Stift / قَاَمٌ
Süß / حُلْوٌ
Tee / اَلشَّايُ
Uhr / سَاعَتٌ
Vater / أبُ
auch / أَيْضاََ
aus/von / مِنْ
bei / عِنْدَ
dort / هُنَاكَ
durstig / عَطْشَانُ
er ging / ذَهَبَ
er hat verlassen / خَرَجَ
geschlossen / مُغْلَقٌ
hinter / خَلْفَ
hungrig / جَوْعَانُ
jetzt / اَلْآنُ
klein (Körpergröße) / قَصِيرٌ"""

karim = []
for line in KARIM_RAW.strip().split("\n"):
    de, ar = line.rsplit("/", 1)   # Arabisch steht rechts, kein "/" darin
    karim.append({"de": de.strip(), "ar": ar.strip()})

# ------------------------------------------------------------------ #
# Kuratierte Korrekturen (per Hand geprueft gegen das Buch)
# key = Karims exakter deutscher Text
# ------------------------------------------------------------------ #
# Echte Buchstaben-Tippfehler (falsches / fehlendes Zeichen -> Nicht-Wort)
TYPO_FIX = {
    "China":               ("اَلصِّنُ", "اَلصِّينُ", "fehlendes ي"),
    "Das Auto":            ("اَاسَّيَّارَةُ", "اَلسَّيَّارَةُ", "اا → ال"),
    "Der Löffel":          ("اَلْمِاْعَقَةُ", "اَلْمِلْعَقَةُ", "verdreht → مِلْعَقة"),
    "Der Name":            ("اَلْاءِسْمُ", "اَلِاسْمُ", "überflüssiges ء"),
    "Ehepartner":          ("زَوْخٌ", "زَوْجٌ", "خ → ج"),
    "Flasche":             ("قَارُرَةٌ", "قَارُورَةٌ", "fehlendes و"),
    "Stift":               ("قَاَمٌ", "قَلَمٌ", "fehlendes ل"),
    "Uhr":                 ("سَاعَتٌ", "سَاعَةٌ", "ت → ة"),
    "auch":                ("أَيْضاََ", "أَيْضًا", "Tanwīn korrigiert"),
    "Der Klassenkamerad":  ("الْزَمِيلُ", "الزَّمِيلُ", "Sonnenbuchstabe: Schadda"),
}
# Nur Vokalzeichen (Buchstaben waren korrekt) – Feinschliff
HARAKAT_FIX = {
    "Ei":     ("بيْضَةٌ", "بَيْضَةٌ", "fehlendes َ"),
    "Finger": ("إصْبَعٌ", "إِصْبَعٌ", "fehlendes ِ"),
    "Vater":  ("أبُ", "أَبٌ", "Vokalzeichen ergänzt"),
}

changes = []
for k in karim:
    if k["de"] in TYPO_FIX:
        old, new, why = TYPO_FIX[k["de"]]
        k["ar"] = new
        changes.append({"de": k["de"], "old": old, "new": new, "why": why, "kind": "typo"})
    elif k["de"] in HARAKAT_FIX:
        old, new, why = HARAKAT_FIX[k["de"]]
        k["ar"] = new
        changes.append({"de": k["de"], "old": old, "new": new, "why": why, "kind": "harakat"})

# ------------------------------------------------------------------ #
# Normalisierung / Matching gegen das Buch (nur ueber Arabisch)
# ------------------------------------------------------------------ #
def strip_marks(s):
    return "".join(c for c in unicodedata.normalize("NFC", s or "")
                   if not unicodedata.category(c).startswith("M") and c != "ـ")

UNIFY = {"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ء": "",
         "ة": "ه", "ى": "ي", "ؤ": "و", "ئ": "ي"}

def norm_full(s):
    s = strip_marks(s).replace(" ", "")
    return "".join(UNIFY.get(c, c) for c in s)

def norm_bare(s):
    s = norm_full(s)
    if s.startswith("ال"):
        s = s[2:]
    return s

def pausal(fusha):
    """Sprechform (nah an Fuṣḥā) grob: letzten Kurzvokal / Tanwīn weglassen."""
    trailing = set("ًٌٍَُِْ")
    s = fusha
    while s and s[-1] in trailing:
        s = s[:-1]
    return s

# ------------------------------------------------------------------ #
# Einheitliche Vokabel-Liste aufbauen
# ------------------------------------------------------------------ #
vocab = []
full_idx = {}   # norm_full -> [vocab index, ...]
bare_idx = {}   # norm_bare -> [vocab index, ...] (nur wenn len>=3)

def register(v):
    i = len(vocab)
    vocab.append(v)
    full_idx.setdefault(norm_full(v["fusha"]), []).append(i)
    b = norm_bare(v["fusha"])
    if len(b) >= 3:
        bare_idx.setdefault(b, []).append(i)
    return i

def norm_de(s):
    s = s.lower()
    s = re.sub(r"\(.*?\)", "", s)
    for w in ("der ", "die ", "das ", "er ", "sie ", "es ", "hat ", "ist "):
        s = s.replace(w, " ")
    return set(t for t in re.split(r"[\s/]+", s) if len(t) > 2)

def pick_candidate(cands, kde):
    """Bei Homographen den Kandidaten mit passender Bedeutung waehlen."""
    if len(cands) == 1:
        return cands[0]
    ktok = norm_de(kde)
    best, best_score = None, -1
    for i in cands:
        overlap = len(ktok & norm_de(vocab[i]["de"]))
        # Verb-Marker in Karims Deutsch ("er ging") -> Verb bevorzugen
        typ_bonus = 0
        looks_verb = kde.strip().startswith(("er ", "sie ", "es "))
        if looks_verb and vocab[i]["type"] == "verb":
            typ_bonus = 1
        elif (not looks_verb) and vocab[i]["type"] != "verb":
            typ_bonus = 1
        score = overlap * 10 + typ_bonus
        if score > best_score:
            best, best_score = i, score
    return best

CAT_ORDER = []
def cat(name):
    if name not in CAT_ORDER:
        CAT_ORDER.append(name)
    return name

# Verben
for j, v in enumerate(book["verbs"], 1):
    register({"id": f"v{j}", "type": "verb", "category": cat("Verben"),
              "de": v["de"], "fusha": v["past"], "spoken": pausal(v["past"]),
              "present": v["present"], "future": v["future"], "karim": False})
# Nomen (thematisch)
for j, n in enumerate(book["nouns"], 1):
    register({"id": f"n{j}", "type": "noun", "category": cat(n["category"]),
              "de": n["de"], "fusha": n["fusha"],
              "spoken": n["spoken"] or pausal(n["fusha"]), "karim": False})
# Adjektive
for j, a in enumerate(book["adjectives"], 1):
    register({"id": f"a{j}", "type": "adjective", "category": cat("Adjektive"),
              "de": a["de"], "fusha": a["fusha"],
              "spoken": a["spoken"] or pausal(a["fusha"]), "karim": False})
# Praepositionen
for j, p in enumerate(book["prepositions"], 1):
    register({"id": f"p{j}", "type": "preposition", "category": cat("Präpositionen & Orte"),
              "de": p["de"], "fusha": p["fusha"], "spoken": p["fusha"],
              "example": p.get("example", ""), "karim": False})
# Konjunktionen
for j, c in enumerate(book["conjunctions"], 1):
    register({"id": f"c{j}", "type": "conjunction", "category": cat("Konjunktionen"),
              "de": c["de"], "fusha": c["fusha"], "spoken": c["fusha"], "karim": False})
# Fragewoerter & Pronomen
for j, q in enumerate(book["questionwords"], 1):
    register({"id": f"q{j}", "type": "question", "category": cat("Fragewörter & Pronomen"),
              "de": q["de"], "fusha": q["fusha"], "spoken": q["fusha"], "karim": False})

# ------------------------------------------------------------------ #
# Karim einpflegen: matchen -> Flag setzen, sonst als Extra anlegen
# ------------------------------------------------------------------ #
matched, extras, flagged = [], [], []
kx = 0
for k in karim:
    f = norm_full(k["ar"])
    b = norm_bare(k["ar"])
    cands = full_idx.get(f)
    if not cands and len(b) >= 3:
        cands = bare_idx.get(b)
    idx = pick_candidate(cands, k["de"]) if cands else None
    # Kompatibilitaets-Schutz gegen Homographen (z.B. Gold ذهب vs. Verb ذهب):
    # Wenn Wortart nicht passt UND keine Bedeutungs-Ueberschneidung -> ablehnen.
    if idx is not None:
        looks_verb = k["de"].strip().startswith(("er ", "sie ", "es "))
        is_verb = vocab[idx]["type"] == "verb"
        if looks_verb != is_verb and not (norm_de(k["de"]) & norm_de(vocab[idx]["de"])):
            idx = None
    if idx is not None:
        vocab[idx]["karim"] = True
        matched.append((k["de"], vocab[idx]["de"], vocab[idx]["fusha"]))
        # Bedeutungs-Plausibilitaet pruefen
        if not (norm_de(k["de"]) & norm_de(vocab[idx]["de"])):
            flagged.append((k["de"], k["ar"], vocab[idx]["de"], vocab[idx]["fusha"]))
    else:
        kx += 1
        sp = k["ar"] if len(norm_full(k["ar"])) <= 3 else pausal(k["ar"])
        register({"id": f"k{kx}", "type": "karim", "category": cat("Meine Wörter"),
                  "de": k["de"], "fusha": k["ar"], "spoken": sp,
                  "karim": True, "source": "karim"})
        extras.append((k["de"], k["ar"]))

# ------------------------------------------------------------------ #
# Befehlsform (Imperativ) fuer jedes Verb aus dem Praesens ableiten
# ------------------------------------------------------------------ #
imp_count = 0
for v in vocab:
    if v["type"] != "verb":
        continue
    imp = imperative(v.get("present"))
    if imp:
        v["imperative"] = imp
        imp_count += 1

# ------------------------------------------------------------------ #
# Schreibfehler + Bedeutungen korrigieren, Plural und Genus für Nomen
# (Quelle: tools/noun_forms.py – arabische Plurale sind gebrochen und
#  lassen sich nicht ableiten, sie stehen dort Wort für Wort.)
# ------------------------------------------------------------------ #
plural_count = genus_count = 0
for v in vocab:
    f = nfc(v["fusha"])
    if f in SPELLING:
        v["fusha"] = SPELLING[f]
        v["spoken"] = pausal(v["fusha"])
        f = v["fusha"]
    if f in MEANING:
        v["de"] = MEANING[f]
    if v["type"] != "noun":
        continue
    entry = lookup(f)
    if entry is None:
        print("  ! noun_forms.py kennt kein:", v["de"], v["fusha"])
        continue
    plural, genus = entry
    v["genus"] = genus
    genus_count += 1
    if plural:
        v["plural"] = plural
        v["pluralSpoken"] = pausal(plural)
        plural_count += 1

# ------------------------------------------------------------------ #
# Beispielsätze mit Vokabeln verknüpfen (für „Im Satz …" auf den Karten)
# Striktes Matching: nur Harakat/Tatwil + Artikel weg, KEINE Buchstaben-
# Vereinheitlichung (sonst kollidiert z. B. مَاء „Wasser" mit مَا „was").
# ------------------------------------------------------------------ #
def strict(s):
    s = strip_marks(s).replace(" ", "").strip(".،؟!:")
    if s.startswith("ال"):
        s = s[2:]
    return s

tokmap = {}
for s in book["sentences"]:
    for w in s["words"]:
        tokmap.setdefault(strict(w["ar"]), set()).add(s["nr"])
    for t in s["fusha"].split():
        tokmap.setdefault(strict(t), set()).add(s["nr"])

ex_count = 0
for v in vocab:
    if v["type"] == "verb":
        continue  # Verben stehen in Sätzen konjugiert -> kein sauberes Matching
    nrs = sorted(tokmap.get(strict(v["fusha"]), []))
    if nrs:
        v["ex"] = nrs[:2]
        ex_count += 1

# ------------------------------------------------------------------ #
# Grammatik / Konjugationsmodell
# ------------------------------------------------------------------ #
grammar = {
    "model_verb": {"de": "gehen", "past": "ذَهَبَ", "present": "يَذْهَبُ",
                   "future": "سَيَذْهَبُ", "imperative": "اِذْهَبْ"},
    "conjugation": book["conjugation_model"],
    "notes": [
        "Im Wörterbuch steht ein Verb als „er tat“ (3. Person m. Sg. Vergangenheit).",
        "Präsens erkennst du an den Vorsilben أ، ن، ي، ت.",
        "Zukunft = سَـ (oder سَوْفَ) direkt vor das Präsens.",
        "Befehlsform: Präsens nehmen, das يـ streichen, die Endung auf Sukūn "
        "setzen – z. B. يَذْهَبُ → اِذْهَبْ („geh!“).",
    ],
}

# ------------------------------------------------------------------ #
# Meta
# ------------------------------------------------------------------ #
cat_counts = {}
for v in vocab:
    cat_counts[v["category"]] = cat_counts.get(v["category"], 0) + 1

meta = {
    "title": "Arabisch lernen",
    "categories": [{"name": c, "count": cat_counts.get(c, 0)} for c in CAT_ORDER],
    "counts": {
        "vocab_total": len(vocab),
        "karim_total": sum(1 for v in vocab if v["karim"]),
        "verbs": len(book["verbs"]),
        "nouns": len(book["nouns"]),
        "adjectives": len(book["adjectives"]),
        "sentences": len(book["sentences"]),
        "idioms": len(book["idioms"]),
        "imperatives": imp_count,
        "plurals": plural_count,
        "genus": genus_count,
    },
    "changes": changes,
    "karim_matched": len(matched),
    "karim_extras": len(extras),
}

# ------------------------------------------------------------------ #
# Schreiben
# ------------------------------------------------------------------ #
def dump(name, obj):
    with open(os.path.join(DATA, name), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))

dump("vocab.json", vocab)
dump("sentences.json", book["sentences"])
dump("idioms.json", book["idioms"])
dump("grammar.json", grammar)
dump("meta.json", meta)

# JS-Bundle: eine globale Variable window.APPDATA, damit die App auch
# ohne Server (file://) laeuft und der Service Worker nur eine Datei cachen muss.
bundle = {"vocab": vocab, "sentences": book["sentences"],
          "idioms": book["idioms"], "grammar": grammar, "meta": meta}
with open(os.path.join(DATA, "appdata.js"), "w", encoding="utf-8") as f:
    f.write("window.APPDATA=")
    json.dump(bundle, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")

print("FERTIG.")
print(f"  Beispielsätze verknüpft mit {ex_count} Vokabeln")
print(f"  Befehlsformen abgeleitet: {imp_count}")
print(f"  Vokabeln gesamt : {len(vocab)}")
print(f"  davon Karim     : {meta['counts']['karim_total']}  "
      f"(im Buch gefunden: {len(matched)}, als Extra angelegt: {len(extras)})")
print(f"  Satzmuster      : {len(book['sentences'])}")
print(f"  Redewendungen   : {len(book['idioms'])}")
print(f"  Kategorien      : {[c['name']+'='+str(c['count']) for c in meta['categories']]}")
print(f"\n  Korrekturen ({len(changes)}):")
for c in changes:
    print(f"    [{c['kind']:7s}] {c['de']:24s} {c['old']}  →  {c['new']}   ({c['why']})")
print(f"\n  Karim-Extras ({len(extras)}): {', '.join(d for d,_ in extras)}")
print(f"\n  ⚠ Prüfen – Bedeutung Karim vs. Buch weicht ab ({len(flagged)}):")
for kd, ka, bd, ba in flagged:
    print(f"    Karim '{kd}' {ka}  ==  Buch '{bd}' {ba}")
