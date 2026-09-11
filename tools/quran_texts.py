# -*- coding: utf-8 -*-
"""
quran_texts.py
Suren und Gebetstexte, Wort fuer Wort aufgeschluesselt.

Grundsaetze:
  * Vollstaendige Vokalisierung. Ohne Ausnahme.
  * Keine Sprechform/Pausalform - der Quran steht, wie er steht.
  * Jedes Wort traegt seine Form AUS DEM VERS ("ar"), dazu die Grundform
    ("lemma", nur wenn sie abweicht) und die Wurzel ("root").
    Auf der Vokabelkarte wird die Grundform gelernt, im Vers steht die
    flektierte Form - sonst erkennt man das Gelernte im Mushaf nicht wieder.
  * Schreibung: moderne vokalisierte Standardform (imlaʾi) mit Dolch-Alif,
    ohne die Uthmani-Sonderzeichen, die auf Web-Schriften unzuverlaessig
    dargestellt werden.

Struktur:
  kind   "sura"  = Sure aus dem Quran
         "dhikr" = Gebetstext (Taschahhud, Rukuʿ, Sujud ...)
  nr     Surennummer (nur bei kind="sura")
"""

TEXTS = [
    # ------------------------------------------------------------------ #
    {
        "id": "fatiha", "kind": "sura", "nr": 1,
        "name": "الْفَاتِحَة", "nameDe": "Die Eröffnung",
        "note": "Wird in jedem Gebet gelesen – 17-mal am Tag.",
        "ayat": [
            {"nr": 1, "de": "Im Namen Allahs, des Allerbarmers, des Barmherzigen.",
             "words": [
                 {"ar": "بِسْمِ", "de": "im Namen", "lemma": "اِسْم", "root": "س م و"},
                 {"ar": "اللَّهِ", "de": "Allahs", "lemma": "اللَّه", "root": "أ ل ه"},
                 {"ar": "الرَّحْمَٰنِ", "de": "des Allerbarmers", "lemma": "الرَّحْمَٰن", "root": "ر ح م"},
                 {"ar": "الرَّحِيمِ", "de": "des Barmherzigen", "lemma": "الرَّحِيم", "root": "ر ح م"},
             ]},
            {"nr": 2, "de": "Alles Lob gebührt Allah, dem Herrn der Welten.",
             "words": [
                 {"ar": "الْحَمْدُ", "de": "das Lob", "lemma": "حَمْد", "root": "ح م د"},
                 {"ar": "لِلَّهِ", "de": "gebührt Allah", "lemma": "اللَّه", "root": "أ ل ه"},
                 {"ar": "رَبِّ", "de": "dem Herrn", "lemma": "رَبّ", "root": "ر ب ب"},
                 {"ar": "الْعَالَمِينَ", "de": "der Welten", "lemma": "عَالَم", "root": "ع ل م"},
             ]},
            {"nr": 3, "de": "Dem Allerbarmer, dem Barmherzigen.",
             "words": [
                 {"ar": "الرَّحْمَٰنِ", "de": "dem Allerbarmer", "lemma": "الرَّحْمَٰن", "root": "ر ح م"},
                 {"ar": "الرَّحِيمِ", "de": "dem Barmherzigen", "lemma": "الرَّحِيم", "root": "ر ح م"},
             ]},
            {"nr": 4, "de": "Dem Herrscher am Tag des Gerichts.",
             "words": [
                 {"ar": "مَالِكِ", "de": "dem Herrscher", "lemma": "مَالِك", "root": "م ل ك"},
                 {"ar": "يَوْمِ", "de": "am Tag", "lemma": "يَوْم", "root": "ي و م"},
                 {"ar": "الدِّينِ", "de": "des Gerichts", "lemma": "دِين", "root": "د ي ن"},
             ]},
            {"nr": 5, "de": "Dir allein dienen wir, und Dich allein bitten wir um Hilfe.",
             "words": [
                 {"ar": "إِيَّاكَ", "de": "Dir allein", "root": "—"},
                 {"ar": "نَعْبُدُ", "de": "dienen wir", "lemma": "عَبَدَ", "root": "ع ب د"},
                 {"ar": "وَإِيَّاكَ", "de": "und Dich allein", "root": "—"},
                 {"ar": "نَسْتَعِينُ", "de": "bitten wir um Hilfe", "lemma": "اِسْتَعَانَ", "root": "ع و ن"},
             ]},
            {"nr": 6, "de": "Leite uns den geraden Weg.",
             "words": [
                 {"ar": "اهْدِنَا", "de": "leite uns", "lemma": "هَدَى", "root": "ه د ي"},
                 {"ar": "الصِّرَاطَ", "de": "den Weg", "lemma": "صِرَاط", "root": "ص ر ط"},
                 {"ar": "الْمُسْتَقِيمَ", "de": "den geraden", "lemma": "مُسْتَقِيم", "root": "ق و م"},
             ]},
            {"nr": 7, "de": "Den Weg derer, denen Du Gnade erwiesen hast, nicht derer, die Deinen Zorn erregt haben, und nicht der Irregehenden.",
             "words": [
                 {"ar": "صِرَاطَ", "de": "den Weg", "lemma": "صِرَاط", "root": "ص ر ط"},
                 {"ar": "الَّذِينَ", "de": "derer, die", "root": "—"},
                 {"ar": "أَنْعَمْتَ", "de": "Du Gnade erwiesen hast", "lemma": "أَنْعَمَ", "root": "ن ع م"},
                 {"ar": "عَلَيْهِمْ", "de": "ihnen", "lemma": "عَلَى", "root": "ع ل و"},
                 {"ar": "غَيْرِ", "de": "nicht", "lemma": "غَيْر", "root": "غ ي ر"},
                 {"ar": "الْمَغْضُوبِ", "de": "derer, die Zorn erregt haben", "lemma": "غَضِبَ", "root": "غ ض ب"},
                 {"ar": "عَلَيْهِمْ", "de": "über sie", "lemma": "عَلَى", "root": "ع ل و"},
                 {"ar": "وَلَا", "de": "und nicht", "root": "—"},
                 {"ar": "الضَّالِّينَ", "de": "der Irregehenden", "lemma": "ضَلَّ", "root": "ض ل ل"},
             ]},
        ],
    },
    # ------------------------------------------------------------------ #
    {
        "id": "ikhlas", "kind": "sura", "nr": 112,
        "name": "الْإِخْلَاص", "nameDe": "Die Aufrichtigkeit",
        "note": "Entspricht dem Lohn nach einem Drittel des Quran.",
        "ayat": [
            {"nr": 1, "de": "Sag: Er ist Allah, ein Einziger.",
             "words": [
                 {"ar": "قُلْ", "de": "sag", "lemma": "قَالَ", "root": "ق و ل"},
                 {"ar": "هُوَ", "de": "Er (ist)", "root": "—"},
                 {"ar": "اللَّهُ", "de": "Allah", "lemma": "اللَّه", "root": "أ ل ه"},
                 {"ar": "أَحَدٌ", "de": "ein Einziger", "lemma": "أَحَد", "root": "أ ح د"},
             ]},
            {"nr": 2, "de": "Allah, der Absolute.",
             "words": [
                 {"ar": "اللَّهُ", "de": "Allah", "lemma": "اللَّه", "root": "أ ل ه"},
                 {"ar": "الصَّمَدُ", "de": "der Absolute, auf den alles angewiesen ist", "lemma": "صَمَد", "root": "ص م د"},
             ]},
            {"nr": 3, "de": "Er hat nicht gezeugt und ist nicht gezeugt worden.",
             "words": [
                 {"ar": "لَمْ", "de": "nicht (Vergangenheit)", "root": "—"},
                 {"ar": "يَلِدْ", "de": "hat Er gezeugt", "lemma": "وَلَدَ", "root": "و ل د"},
                 {"ar": "وَلَمْ", "de": "und nicht", "root": "—"},
                 {"ar": "يُولَدْ", "de": "ist Er gezeugt worden", "lemma": "وُلِدَ", "root": "و ل د"},
             ]},
            {"nr": 4, "de": "Und niemand ist Ihm gleich.",
             "words": [
                 {"ar": "وَلَمْ", "de": "und nicht", "root": "—"},
                 {"ar": "يَكُنْ", "de": "ist", "lemma": "كَانَ", "root": "ك و ن"},
                 {"ar": "لَهُ", "de": "Ihm", "root": "—"},
                 {"ar": "كُفُوًا", "de": "gleich", "lemma": "كُفُؤ", "root": "ك ف أ"},
                 {"ar": "أَحَدٌ", "de": "irgendjemand", "lemma": "أَحَد", "root": "أ ح د"},
             ]},
        ],
    },
    # ------------------------------------------------------------------ #
    {
        "id": "falaq", "kind": "sura", "nr": 113,
        "name": "الْفَلَق", "nameDe": "Das Frühlicht",
        "note": "Schutzsure – zusammen mit an-Nās „al-Muʿawwidhatān“.",
        "ayat": [
            {"nr": 1, "de": "Sag: Ich nehme Zuflucht beim Herrn des Frühlichts",
             "words": [
                 {"ar": "قُلْ", "de": "sag", "lemma": "قَالَ", "root": "ق و ل"},
                 {"ar": "أَعُوذُ", "de": "ich nehme Zuflucht", "lemma": "عَاذَ", "root": "ع و ذ"},
                 {"ar": "بِرَبِّ", "de": "beim Herrn", "lemma": "رَبّ", "root": "ر ب ب"},
                 {"ar": "الْفَلَقِ", "de": "des Frühlichts", "lemma": "فَلَق", "root": "ف ل ق"},
             ]},
            {"nr": 2, "de": "vor dem Übel dessen, was Er erschaffen hat,",
             "words": [
                 {"ar": "مِنْ", "de": "vor", "root": "—"},
                 {"ar": "شَرِّ", "de": "dem Übel", "lemma": "شَرّ", "root": "ش ر ر"},
                 {"ar": "مَا", "de": "dessen, was", "root": "—"},
                 {"ar": "خَلَقَ", "de": "Er erschaffen hat", "lemma": "خَلَقَ", "root": "خ ل ق"},
             ]},
            {"nr": 3, "de": "und vor dem Übel der Dunkelheit, wenn sie hereinbricht,",
             "words": [
                 {"ar": "وَمِنْ", "de": "und vor", "root": "—"},
                 {"ar": "شَرِّ", "de": "dem Übel", "lemma": "شَرّ", "root": "ش ر ر"},
                 {"ar": "غَاسِقٍ", "de": "der Dunkelheit", "lemma": "غَاسِق", "root": "غ س ق"},
                 {"ar": "إِذَا", "de": "wenn", "root": "—"},
                 {"ar": "وَقَبَ", "de": "sie hereinbricht", "lemma": "وَقَبَ", "root": "و ق ب"},
             ]},
            {"nr": 4, "de": "und vor dem Übel der Knotenanblaserinnen",
             "words": [
                 {"ar": "وَمِنْ", "de": "und vor", "root": "—"},
                 {"ar": "شَرِّ", "de": "dem Übel", "lemma": "شَرّ", "root": "ش ر ر"},
                 {"ar": "النَّفَّاثَاتِ", "de": "der Anblaserinnen", "lemma": "نَفَّاثَة", "root": "ن ف ث"},
                 {"ar": "فِي", "de": "in", "root": "—"},
                 {"ar": "الْعُقَدِ", "de": "die Knoten", "lemma": "عُقْدَة", "root": "ع ق د"},
             ]},
            {"nr": 5, "de": "und vor dem Übel eines Neiders, wenn er neidet.",
             "words": [
                 {"ar": "وَمِنْ", "de": "und vor", "root": "—"},
                 {"ar": "شَرِّ", "de": "dem Übel", "lemma": "شَرّ", "root": "ش ر ر"},
                 {"ar": "حَاسِدٍ", "de": "eines Neiders", "lemma": "حَاسِد", "root": "ح س د"},
                 {"ar": "إِذَا", "de": "wenn", "root": "—"},
                 {"ar": "حَسَدَ", "de": "er neidet", "lemma": "حَسَدَ", "root": "ح س د"},
             ]},
        ],
    },
    # ------------------------------------------------------------------ #
    {
        "id": "nas", "kind": "sura", "nr": 114,
        "name": "النَّاس", "nameDe": "Die Menschen",
        "note": "Schutzsure – die letzte Sure des Quran.",
        "ayat": [
            {"nr": 1, "de": "Sag: Ich nehme Zuflucht beim Herrn der Menschen,",
             "words": [
                 {"ar": "قُلْ", "de": "sag", "lemma": "قَالَ", "root": "ق و ل"},
                 {"ar": "أَعُوذُ", "de": "ich nehme Zuflucht", "lemma": "عَاذَ", "root": "ع و ذ"},
                 {"ar": "بِرَبِّ", "de": "beim Herrn", "lemma": "رَبّ", "root": "ر ب ب"},
                 {"ar": "النَّاسِ", "de": "der Menschen", "lemma": "نَاس", "root": "ن و س"},
             ]},
            {"nr": 2, "de": "dem König der Menschen,",
             "words": [
                 {"ar": "مَلِكِ", "de": "dem König", "lemma": "مَلِك", "root": "م ل ك"},
                 {"ar": "النَّاسِ", "de": "der Menschen", "lemma": "نَاس", "root": "ن و س"},
             ]},
            {"nr": 3, "de": "dem Gott der Menschen,",
             "words": [
                 {"ar": "إِلَٰهِ", "de": "dem Gott", "lemma": "إِلَٰه", "root": "أ ل ه"},
                 {"ar": "النَّاسِ", "de": "der Menschen", "lemma": "نَاس", "root": "ن و س"},
             ]},
            {"nr": 4, "de": "vor dem Übel des Einflüsterers, des Zurückweichenden,",
             "words": [
                 {"ar": "مِنْ", "de": "vor", "root": "—"},
                 {"ar": "شَرِّ", "de": "dem Übel", "lemma": "شَرّ", "root": "ش ر ر"},
                 {"ar": "الْوَسْوَاسِ", "de": "des Einflüsterers", "lemma": "وَسْوَاس", "root": "و س و س"},
                 {"ar": "الْخَنَّاسِ", "de": "des Zurückweichenden", "lemma": "خَنَّاس", "root": "خ ن س"},
             ]},
            {"nr": 5, "de": "der in die Brust der Menschen einflüstert,",
             "words": [
                 {"ar": "الَّذِي", "de": "der", "root": "—"},
                 {"ar": "يُوَسْوِسُ", "de": "einflüstert", "lemma": "وَسْوَسَ", "root": "و س و س"},
                 {"ar": "فِي", "de": "in", "root": "—"},
                 {"ar": "صُدُورِ", "de": "die Brust", "lemma": "صَدْر", "root": "ص د ر"},
                 {"ar": "النَّاسِ", "de": "der Menschen", "lemma": "نَاس", "root": "ن و س"},
             ]},
            {"nr": 6, "de": "von den Dschinn und den Menschen.",
             "words": [
                 {"ar": "مِنَ", "de": "von", "root": "—"},
                 {"ar": "الْجِنَّةِ", "de": "den Dschinn", "lemma": "جِنَّة", "root": "ج ن ن"},
                 {"ar": "وَالنَّاسِ", "de": "und den Menschen", "lemma": "نَاس", "root": "ن و س"},
             ]},
        ],
    },
    # ------------------------------------------------------------------ #
    {
        "id": "asr", "kind": "sura", "nr": 103,
        "name": "الْعَصْر", "nameDe": "Der Nachmittag",
        "note": "Drei Verse, die den ganzen Weg zusammenfassen.",
        "ayat": [
            {"nr": 1, "de": "Bei der Zeit!",
             "words": [
                 {"ar": "وَالْعَصْرِ", "de": "bei der Zeit", "lemma": "عَصْر", "root": "ع ص ر"},
             ]},
            {"nr": 2, "de": "Der Mensch ist wahrlich im Verlust,",
             "words": [
                 {"ar": "إِنَّ", "de": "wahrlich", "root": "—"},
                 {"ar": "الْإِنْسَانَ", "de": "der Mensch", "lemma": "إِنْسَان", "root": "أ ن س"},
                 {"ar": "لَفِي", "de": "ist gewiss in", "root": "—"},
                 {"ar": "خُسْرٍ", "de": "Verlust", "lemma": "خُسْر", "root": "خ س ر"},
             ]},
            {"nr": 3, "de": "außer denen, die glauben und rechtschaffene Werke tun und einander die Wahrheit nahelegen und einander die Geduld nahelegen.",
             "words": [
                 {"ar": "إِلَّا", "de": "außer", "root": "—"},
                 {"ar": "الَّذِينَ", "de": "denen, die", "root": "—"},
                 {"ar": "آمَنُوا", "de": "glauben", "lemma": "آمَنَ", "root": "أ م ن"},
                 {"ar": "وَعَمِلُوا", "de": "und tun", "lemma": "عَمِلَ", "root": "ع م ل"},
                 {"ar": "الصَّالِحَاتِ", "de": "rechtschaffene Werke", "lemma": "صَالِحَة", "root": "ص ل ح"},
                 {"ar": "وَتَوَاصَوْا", "de": "und einander nahelegen", "lemma": "تَوَاصَى", "root": "و ص ي"},
                 {"ar": "بِالْحَقِّ", "de": "die Wahrheit", "lemma": "حَقّ", "root": "ح ق ق"},
                 {"ar": "وَتَوَاصَوْا", "de": "und einander nahelegen", "lemma": "تَوَاصَى", "root": "و ص ي"},
                 {"ar": "بِالصَّبْرِ", "de": "die Geduld", "lemma": "صَبْر", "root": "ص ب ر"},
             ]},
        ],
    },
    # ------------------------------------------------------------------ #
    {
        "id": "kawthar", "kind": "sura", "nr": 108,
        "name": "الْكَوْثَر", "nameDe": "Die Fülle",
        "note": "Die kürzeste Sure des Quran.",
        "ayat": [
            {"nr": 1, "de": "Wir haben dir die Fülle gegeben.",
             "words": [
                 {"ar": "إِنَّا", "de": "wahrlich, Wir", "root": "—"},
                 {"ar": "أَعْطَيْنَاكَ", "de": "haben dir gegeben", "lemma": "أَعْطَى", "root": "ع ط و"},
                 {"ar": "الْكَوْثَرَ", "de": "die Fülle", "lemma": "كَوْثَر", "root": "ك ث ر"},
             ]},
            {"nr": 2, "de": "So bete zu deinem Herrn und opfere.",
             "words": [
                 {"ar": "فَصَلِّ", "de": "so bete", "lemma": "صَلَّى", "root": "ص ل و"},
                 {"ar": "لِرَبِّكَ", "de": "zu deinem Herrn", "lemma": "رَبّ", "root": "ر ب ب"},
                 {"ar": "وَانْحَرْ", "de": "und opfere", "lemma": "نَحَرَ", "root": "ن ح ر"},
             ]},
            {"nr": 3, "de": "Wahrlich, dein Hasser ist derjenige, der ohne Nachkommen bleibt.",
             "words": [
                 {"ar": "إِنَّ", "de": "wahrlich", "root": "—"},
                 {"ar": "شَانِئَكَ", "de": "dein Hasser", "lemma": "شَانِئ", "root": "ش ن أ"},
                 {"ar": "هُوَ", "de": "er (ist)", "root": "—"},
                 {"ar": "الْأَبْتَرُ", "de": "der ohne Nachkommen Bleibende", "lemma": "أَبْتَر", "root": "ب ت ر"},
             ]},
        ],
    },
    # ------------------------------------------------------------------ #
    {
        "id": "nasr", "kind": "sura", "nr": 110,
        "name": "النَّصْر", "nameDe": "Die Hilfe",
        "ayat": [
            {"nr": 1, "de": "Wenn Allahs Hilfe und der Sieg kommt",
             "words": [
                 {"ar": "إِذَا", "de": "wenn", "root": "—"},
                 {"ar": "جَاءَ", "de": "kommt", "lemma": "جَاءَ", "root": "ج ي أ"},
                 {"ar": "نَصْرُ", "de": "die Hilfe", "lemma": "نَصْر", "root": "ن ص ر"},
                 {"ar": "اللَّهِ", "de": "Allahs", "lemma": "اللَّه", "root": "أ ل ه"},
                 {"ar": "وَالْفَتْحُ", "de": "und der Sieg", "lemma": "فَتْح", "root": "ف ت ح"},
             ]},
            {"nr": 2, "de": "und du die Menschen in Scharen in Allahs Religion eintreten siehst,",
             "words": [
                 {"ar": "وَرَأَيْتَ", "de": "und du siehst", "lemma": "رَأَى", "root": "ر أ ي"},
                 {"ar": "النَّاسَ", "de": "die Menschen", "lemma": "نَاس", "root": "ن و س"},
                 {"ar": "يَدْخُلُونَ", "de": "eintreten", "lemma": "دَخَلَ", "root": "د خ ل"},
                 {"ar": "فِي", "de": "in", "root": "—"},
                 {"ar": "دِينِ", "de": "die Religion", "lemma": "دِين", "root": "د ي ن"},
                 {"ar": "اللَّهِ", "de": "Allahs", "lemma": "اللَّه", "root": "أ ل ه"},
                 {"ar": "أَفْوَاجًا", "de": "in Scharen", "lemma": "فَوْج", "root": "ف و ج"},
             ]},
            {"nr": 3, "de": "dann lobpreise deinen Herrn und bitte Ihn um Vergebung. Er ist wahrlich Reue-Annehmend.",
             "words": [
                 {"ar": "فَسَبِّحْ", "de": "dann lobpreise", "lemma": "سَبَّحَ", "root": "س ب ح"},
                 {"ar": "بِحَمْدِ", "de": "mit dem Lob", "lemma": "حَمْد", "root": "ح م د"},
                 {"ar": "رَبِّكَ", "de": "deines Herrn", "lemma": "رَبّ", "root": "ر ب ب"},
                 {"ar": "وَاسْتَغْفِرْهُ", "de": "und bitte Ihn um Vergebung", "lemma": "اِسْتَغْفَرَ", "root": "غ ف ر"},
                 {"ar": "إِنَّهُ", "de": "wahrlich, Er", "root": "—"},
                 {"ar": "كَانَ", "de": "ist", "lemma": "كَانَ", "root": "ك و ن"},
                 {"ar": "تَوَّابًا", "de": "Reue-Annehmend", "lemma": "تَوَّاب", "root": "ت و ب"},
             ]},
        ],
    },
    # ------------------------------------------------------------------ #
    # Gebetstexte
    # ------------------------------------------------------------------ #
    {
        "id": "tashahhud", "kind": "dhikr",
        "name": "التَّشَهُّد", "nameDe": "Das Taschahhud",
        "note": "Im Sitzen nach der zweiten und der letzten Gebetseinheit.",
        "ayat": [
            {"nr": 1, "de": "Die Grüße gebühren Allah, und die Gebete und die guten Dinge.",
             "words": [
                 {"ar": "التَّحِيَّاتُ", "de": "die Grüße", "lemma": "تَحِيَّة", "root": "ح ي ي"},
                 {"ar": "لِلَّهِ", "de": "gebühren Allah", "lemma": "اللَّه", "root": "أ ل ه"},
                 {"ar": "وَالصَّلَوَاتُ", "de": "und die Gebete", "lemma": "صَلَاة", "root": "ص ل و"},
                 {"ar": "وَالطَّيِّبَاتُ", "de": "und die guten Dinge", "lemma": "طَيِّبَة", "root": "ط ي ب"},
             ]},
            {"nr": 2, "de": "Friede sei auf dir, o Prophet, und Allahs Barmherzigkeit und Sein Segen.",
             "words": [
                 {"ar": "السَّلَامُ", "de": "der Friede", "lemma": "سَلَام", "root": "س ل م"},
                 {"ar": "عَلَيْكَ", "de": "sei auf dir", "lemma": "عَلَى", "root": "ع ل و"},
                 {"ar": "أَيُّهَا", "de": "o", "root": "—"},
                 {"ar": "النَّبِيُّ", "de": "Prophet", "lemma": "نَبِيّ", "root": "ن ب أ"},
                 {"ar": "وَرَحْمَةُ", "de": "und die Barmherzigkeit", "lemma": "رَحْمَة", "root": "ر ح م"},
                 {"ar": "اللَّهِ", "de": "Allahs", "lemma": "اللَّه", "root": "أ ل ه"},
                 {"ar": "وَبَرَكَاتُهُ", "de": "und Sein Segen", "lemma": "بَرَكَة", "root": "ب ر ك"},
             ]},
            {"nr": 3, "de": "Friede sei auf uns und auf den rechtschaffenen Dienern Allahs.",
             "words": [
                 {"ar": "السَّلَامُ", "de": "der Friede", "lemma": "سَلَام", "root": "س ل م"},
                 {"ar": "عَلَيْنَا", "de": "sei auf uns", "lemma": "عَلَى", "root": "ع ل و"},
                 {"ar": "وَعَلَىٰ", "de": "und auf", "lemma": "عَلَى", "root": "ع ل و"},
                 {"ar": "عِبَادِ", "de": "den Dienern", "lemma": "عَبْد", "root": "ع ب د"},
                 {"ar": "اللَّهِ", "de": "Allahs", "lemma": "اللَّه", "root": "أ ل ه"},
                 {"ar": "الصَّالِحِينَ", "de": "den rechtschaffenen", "lemma": "صَالِح", "root": "ص ل ح"},
             ]},
            {"nr": 4, "de": "Ich bezeuge, dass es keinen Gott gibt außer Allah, und ich bezeuge, dass Muhammad Sein Diener und Sein Gesandter ist.",
             "words": [
                 {"ar": "أَشْهَدُ", "de": "ich bezeuge", "lemma": "شَهِدَ", "root": "ش ه د"},
                 {"ar": "أَنْ", "de": "dass", "root": "—"},
                 {"ar": "لَا", "de": "es gibt kein", "root": "—"},
                 {"ar": "إِلَٰهَ", "de": "Gott", "lemma": "إِلَٰه", "root": "أ ل ه"},
                 {"ar": "إِلَّا", "de": "außer", "root": "—"},
                 {"ar": "اللَّهُ", "de": "Allah", "lemma": "اللَّه", "root": "أ ل ه"},
                 {"ar": "وَأَشْهَدُ", "de": "und ich bezeuge", "lemma": "شَهِدَ", "root": "ش ه د"},
                 {"ar": "أَنَّ", "de": "dass", "root": "—"},
                 {"ar": "مُحَمَّدًا", "de": "Muhammad", "root": "ح م د", "name": True},
                 {"ar": "عَبْدُهُ", "de": "Sein Diener (ist)", "lemma": "عَبْد", "root": "ع ب د"},
                 {"ar": "وَرَسُولُهُ", "de": "und Sein Gesandter", "lemma": "رَسُول", "root": "ر س ل"},
             ]},
        ],
    },
    # ------------------------------------------------------------------ #
    {
        "id": "ruku_sujud", "kind": "dhikr",
        "name": "أَذْكَارُ الرُّكُوعِ وَالسُّجُودِ", "nameDe": "Verbeugung und Niederwerfung",
        "note": "Je dreimal in Rukūʿ und Sujūd.",
        "ayat": [
            {"nr": 1, "de": "Gepriesen sei mein Herr, der Gewaltige. (in der Verbeugung)",
             "words": [
                 {"ar": "سُبْحَانَ", "de": "gepriesen sei", "lemma": "سُبْحَان", "root": "س ب ح"},
                 {"ar": "رَبِّيَ", "de": "mein Herr", "lemma": "رَبّ", "root": "ر ب ب"},
                 {"ar": "الْعَظِيمِ", "de": "der Gewaltige", "lemma": "عَظِيم", "root": "ع ظ م"},
             ]},
            {"nr": 2, "de": "Gepriesen sei mein Herr, der Höchste. (in der Niederwerfung)",
             "words": [
                 {"ar": "سُبْحَانَ", "de": "gepriesen sei", "lemma": "سُبْحَان", "root": "س ب ح"},
                 {"ar": "رَبِّيَ", "de": "mein Herr", "lemma": "رَبّ", "root": "ر ب ب"},
                 {"ar": "الْأَعْلَى", "de": "der Höchste", "lemma": "أَعْلَى", "root": "ع ل و"},
             ]},
            {"nr": 3, "de": "Allah hört den, der Ihn lobt. (beim Aufrichten)",
             "words": [
                 {"ar": "سَمِعَ", "de": "hört", "lemma": "سَمِعَ", "root": "س م ع"},
                 {"ar": "اللَّهُ", "de": "Allah", "lemma": "اللَّه", "root": "أ ل ه"},
                 {"ar": "لِمَنْ", "de": "den, der", "root": "—"},
                 {"ar": "حَمِدَهُ", "de": "Ihn lobt", "lemma": "حَمِدَ", "root": "ح م د"},
             ]},
            {"nr": 4, "de": "Unser Herr, Dir gebührt das Lob.",
             "words": [
                 {"ar": "رَبَّنَا", "de": "unser Herr", "lemma": "رَبّ", "root": "ر ب ب"},
                 {"ar": "وَلَكَ", "de": "und Dir", "root": "—"},
                 {"ar": "الْحَمْدُ", "de": "gebührt das Lob", "lemma": "حَمْد", "root": "ح م د"},
             ]},
            {"nr": 5, "de": "Mein Herr, vergib mir. (zwischen den beiden Niederwerfungen)",
             "words": [
                 {"ar": "رَبِّ", "de": "mein Herr", "lemma": "رَبّ", "root": "ر ب ب"},
                 {"ar": "اغْفِرْ", "de": "vergib", "lemma": "غَفَرَ", "root": "غ ف ر"},
                 {"ar": "لِي", "de": "mir", "root": "—"},
             ]},
        ],
    },
]
