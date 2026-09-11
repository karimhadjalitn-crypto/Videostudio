# -*- coding: utf-8 -*-
"""
quran_grammar.py
Grammatik fuer den Quran-Bereich.

Ausdruecklich NUR das, was man braucht, um die Verse zu verstehen.
Keine Kasuslehre, keine Feinheiten der Syntax - wer den Quran lesen will,
braucht zuerst: wem gehoert was (Suffixe), wer tut etwas (Praesensvorsilben),
wie haengen zwei Nomen zusammen (Genitivverbindung), und die paar Partikeln,
die auf jeder Seite stehen.

Jede Regel wird an einem Vers gezeigt, der in quran_texts.py steht - Karim
begegnet ihr also in einem Text, den er ohnehin liest.

"ref" verweist auf Text und Vers: "fatiha:2" = al-Fatiha, Vers 2.
"""

GRAMMAR = [
    {
        "id": "suffixe",
        "title": "Wem gehört es?",
        "short": "mein, dein, sein – als Endung",
        "intro": "Im Arabischen steht der Besitzer nicht als eigenes Wort davor, "
                 "sondern hängt hinten am Wort. رَبّ heißt „Herr“ – wer welcher Herr "
                 "gemeint ist, sagt die Endung.",
        "rows": [
            {"ar": "ـِي", "de": "mein", "example": "رَبِّي", "exampleDe": "mein Herr", "ref": "ruku_sujud:1"},
            {"ar": "ـكَ", "de": "dein (m)", "example": "رَبِّكَ", "exampleDe": "dein Herr", "ref": "nasr:3"},
            {"ar": "ـهُ", "de": "sein", "example": "عَبْدُهُ", "exampleDe": "Sein Diener", "ref": "tashahhud:4"},
            {"ar": "ـهَا", "de": "ihr (w)", "example": "فِيهَا", "exampleDe": "in ihr", "ref": "qadr:4"},
            {"ar": "ـنَا", "de": "unser / uns", "example": "رَبَّنَا", "exampleDe": "unser Herr", "ref": "ruku_sujud:4"},
            {"ar": "ـكُمْ", "de": "euer", "example": "دِينُكُمْ", "exampleDe": "eure Religion", "ref": "kafirun:6"},
            {"ar": "ـهِمْ", "de": "ihr (Mehrzahl)", "example": "رَبِّهِمْ", "exampleDe": "ihres Herrn", "ref": "qadr:4"},
        ],
        "note": "Dieselben Endungen hängen auch an Präpositionen: "
                "عَلَيْهِمْ „auf sie“, لَهُ „ihm“, فِيهَا „in ihr“.",
    },
    {
        "id": "praesens",
        "title": "Wer tut es?",
        "short": "die Vorsilben im Präsens",
        "intro": "Beim Verb in der Gegenwart steht die handelnde Person vorne "
                 "als einzelner Buchstabe. Der Wortstamm bleibt gleich – hier عبد "
                 "(dienen).",
        "rows": [
            {"ar": "أَ", "de": "ich", "example": "أَعْبُدُ", "exampleDe": "ich diene", "ref": "kafirun:2"},
            {"ar": "تَ", "de": "du", "example": "تَعْبُدُونَ", "exampleDe": "ihr dient", "ref": "kafirun:2"},
            {"ar": "يَ", "de": "er / sie (Mehrzahl)", "example": "يَدْخُلُونَ", "exampleDe": "sie treten ein", "ref": "nasr:2"},
            {"ar": "نَ", "de": "wir", "example": "نَعْبُدُ", "exampleDe": "wir dienen", "ref": "fatiha:5"},
        ],
        "note": "Die Endung ـُونَ zeigt die Mehrzahl an: تَعْبُدُونَ „ihr dient“, "
                "عَابِدُونَ „Dienende“.",
    },
    {
        "id": "idafa",
        "title": "Zwei Nomen hintereinander",
        "short": "die Genitivverbindung",
        "intro": "Stehen zwei Nomen direkt nebeneinander, gehört das zweite zum "
                 "ersten – wie im Deutschen „Tag des Gerichts“. Das erste Wort "
                 "trägt dabei nie einen Artikel.",
        "rows": [
            {"ar": "يَوْمِ الدِّينِ", "de": "Tag des Gerichts", "example": "مَالِكِ يَوْمِ الدِّينِ",
             "exampleDe": "Herrscher am Tag des Gerichts", "ref": "fatiha:4"},
            {"ar": "رَبِّ الْعَالَمِينَ", "de": "Herr der Welten", "example": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
             "exampleDe": "Lob gebührt Allah, dem Herrn der Welten", "ref": "fatiha:2"},
            {"ar": "لَيْلَةِ الْقَدْرِ", "de": "Nacht der Bestimmung", "example": "فِي لَيْلَةِ الْقَدْرِ",
             "exampleDe": "in der Nacht der Bestimmung", "ref": "qadr:1"},
        ],
        "note": "Erkennungszeichen: das zweite Wort endet auf ـِ (Kasra) und trägt "
                "oft den Artikel الـ.",
    },
    {
        "id": "artikel",
        "title": "Der Artikel الـ",
        "short": "und warum man ihn manchmal nicht hört",
        "intro": "الـ ist „der/die/das“. Vor etwa der Hälfte der Buchstaben wird "
                 "das ل aber nicht gesprochen – stattdessen verdoppelt sich der "
                 "folgende Buchstabe. Das Zeichen dafür ist die Schadda ّ.",
        "rows": [
            {"ar": "الرَّحْمَٰن", "de": "ar-Rahmān (nicht al-Rahmān)",
             "example": "الرَّحْمَٰنِ الرَّحِيمِ", "exampleDe": "der Allerbarmer, der Barmherzige", "ref": "fatiha:3"},
            {"ar": "الصِّرَاط", "de": "aṣ-ṣirāṭ", "example": "الصِّرَاطَ الْمُسْتَقِيمَ",
             "exampleDe": "den geraden Weg", "ref": "fatiha:6"},
            {"ar": "النَّاس", "de": "an-nās", "example": "مَلِكِ النَّاسِ",
             "exampleDe": "dem König der Menschen", "ref": "nas:2"},
            {"ar": "الْحَمْد", "de": "al-ḥamd – hier bleibt das ل hörbar",
             "example": "الْحَمْدُ لِلَّهِ", "exampleDe": "das Lob gebührt Allah", "ref": "fatiha:2"},
        ],
        "note": "Du musst die Regel nicht auswendig lernen: steht auf dem Buchstaben "
                "nach الـ eine Schadda ّ, wird das ل verschluckt.",
    },
    {
        "id": "verneinung",
        "title": "Verneinen",
        "short": "لَا، مَا، لَمْ، لَنْ",
        "intro": "Vier Wörtchen, die ständig vorkommen – und die sich darin "
                 "unterscheiden, welche Zeit sie verneinen.",
        "rows": [
            {"ar": "لَا", "de": "nicht (Gegenwart)", "example": "لَا أَعْبُدُ",
             "exampleDe": "ich diene nicht", "ref": "kafirun:2"},
            {"ar": "لَمْ", "de": "hat nicht (Vergangenheit)", "example": "لَمْ يَلِدْ",
             "exampleDe": "Er hat nicht gezeugt", "ref": "ikhlas:3"},
            {"ar": "لَنْ", "de": "wird niemals (Zukunft)", "example": "لَنْ تَنَالُوا",
             "exampleDe": "ihr werdet nicht erlangen"},
            {"ar": "مَا", "de": "nicht – oder: was", "example": "مَا تَعْبُدُونَ",
             "exampleDe": "das, dem ihr dient", "ref": "kafirun:2"},
        ],
        "note": "Achtung bei مَا: es heißt sowohl „was/das, was“ als auch „nicht“. "
                "Welches gemeint ist, verrät der Satz – vor einem Verb in der "
                "Vergangenheit ist es meist „nicht“.",
    },
    {
        "id": "partikeln",
        "title": "Kleine Wörter, große Wirkung",
        "short": "إِنَّ، إِذَا، قُلْ …",
        "intro": "Diese paar Wörter stehen auf fast jeder Seite. Wer sie kennt, "
                 "versteht sofort, wohin ein Satz läuft.",
        "rows": [
            {"ar": "إِنَّ", "de": "wahrlich, gewiss", "example": "إِنَّ الْإِنْسَانَ لَفِي خُسْرٍ",
             "exampleDe": "Der Mensch ist wahrlich im Verlust", "ref": "asr:2"},
            {"ar": "قُلْ", "de": "sag! (Befehl an den Propheten)", "example": "قُلْ هُوَ اللَّهُ أَحَدٌ",
             "exampleDe": "Sag: Er ist Allah, ein Einziger", "ref": "ikhlas:1"},
            {"ar": "إِذَا", "de": "wenn, als", "example": "إِذَا جَاءَ نَصْرُ اللَّهِ",
             "exampleDe": "Wenn Allahs Hilfe kommt", "ref": "nasr:1"},
            {"ar": "إِلَّا", "de": "außer", "example": "إِلَّا الَّذِينَ آمَنُوا",
             "exampleDe": "außer denen, die glauben", "ref": "asr:3"},
            {"ar": "الَّذِينَ", "de": "diejenigen, die", "example": "الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ",
             "exampleDe": "denen Du Gnade erwiesen hast", "ref": "fatiha:7"},
        ],
        "note": "الَّذِي (einer) und الَّذِينَ (mehrere) leiten einen Nebensatz ein – "
                "im Deutschen „der/die/das“ oder „diejenigen, die“.",
    },
    {
        "id": "wurzeln",
        "title": "Die Wurzel",
        "short": "warum Wörter verwandt aussehen",
        "intro": "Fast jedes arabische Wort baut auf drei Grundbuchstaben auf. "
                 "Kennst du die Wurzel, erkennst du eine ganze Wortfamilie – auch "
                 "Wörter, die du nie gelernt hast.",
        "rows": [
            {"ar": "ع ب د", "de": "dienen", "example": "عَبْد · عَابِد · نَعْبُدُ · عِبَاد",
             "exampleDe": "Diener · Dienender · wir dienen · Diener (Mz.)"},
            {"ar": "ر ح م", "de": "sich erbarmen", "example": "الرَّحْمَٰن · الرَّحِيم · رَحْمَة",
             "exampleDe": "der Allerbarmer · der Barmherzige · Barmherzigkeit"},
            {"ar": "ح م د", "de": "loben", "example": "الْحَمْد · حَمِدَهُ · مُحَمَّد",
             "exampleDe": "das Lob · er lobt Ihn · der Gepriesene"},
            {"ar": "س ل م", "de": "heil sein", "example": "السَّلَام · مُسْلِم · أَسْلَمَ",
             "exampleDe": "der Friede · Gottergebener · sich hingeben"},
        ],
        "note": "Auf jeder Quran-Vokabelkarte steht die Wurzel mit dabei. Achte "
                "darauf – ab einem gewissen Punkt erschließt du dir Wörter selbst.",
    },
]
