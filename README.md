# 🎬 Cinema Studio

Ein professionelles Videobearbeitungsstudio im Browser – gebaut für **faceless TikTok-Content (Psychologie & Bildung)**. Cinematischer, cleaner, hochwertiger Look. Läuft komplett lokal, ganz ohne Installation von Zusatzsoftware. Auf Deutsch, leicht zu bedienen, mit einem KI-Feld, dem Du in normaler Sprache sagst, was es tun soll.

---

## 🚀 Schnellstart

Du brauchst nur **Node.js** (Version 18 oder neuer). Sonst nichts – keine weiteren Pakete, kein FFmpeg, kein `npm install`.

```bash
npm start
```

Dann im Browser öffnen: **http://localhost:3000**

**Vom Handy bearbeiten (gleiches WLAN):** Beim Start zeigt das Terminal eine Adresse wie `http://192.168.x.x:3000` an – die auf dem Handy öffnen. So lädst Du Deine Handy-Videos direkt ins Studio.

> Alternativ ohne npm: `node server.js`

---

## ✨ Was das Studio kann

| Bereich | Funktionen |
|---|---|
| **🎞️ Medien** | Cinematische B-Roll per Klick oder Drag&Drop importieren, mehrere Clips gleichzeitig |
| **✂️ Schnitt** | Clips trimmen, verschieben, neu anordnen, am Abspielkopf teilen (Taste `S`) |
| **🎨 Farbe / Grading** | 9 cinematische Look-Vorlagen (Cinematic, Moody, Warm, Kühl, Noir, Vintage, Traum, Bold) + Feinregler: Belichtung, Kontrast, Sättigung, Temperatur, Farbton, Fade, Teal&Orange, Vignette, Filmkorn – **pro Clip** |
| **🅣 Text & Untertitel** | Hook-Text (Aufmacher), TikTok-Untertitel, Titel, Bauchbinde · edle Schriften (Auto-Mix) · Animationen: Fade, Slide, Pop, Schreibmaschine · in der Vorschau frei verschiebbar |
| **🖼️ Cinema-Frame** | Abgerundeter Rahmen mit einstellbarem Radius, Rand & Farbe · Cinemascope-Balken · TikTok-Safe-Zones |
| **🎙️ Ton** | Voiceover / Naschid / Ambient importieren, Lautstärke, Wellenform · B-Roll stummschalten (**bewusst ohne Musik-Bibliothek**) |
| **📎 Referenz** | Beispiel-Videos/Bilder einfügen. Das Studio **analysiert** Farbstimmung, Kontrast, Helligkeit & Palette – ändert aber **nichts automatisch**, bis Du es sagst |
| **📱 Formate** | 16:9, 9:16 (Hochformat/TikTok), 1:1, 2.39:1 Cinemascope – ein Klick |
| **💾 Export** | Bis **4K (2160p)**, direkt als Video-Datei (MP4, sonst WebM) |
| **✨ Auto-Edit** | Ein Klick: einheitlicher cinematisch-cleaner Look über alle Clips |

---

## 💬 Das KI-Feld – sag mir, was ich tun soll

Unten im Studio ist ein Feld, in das Du in **normaler Sprache** schreibst. Ich übernehme das Editing. Beispiele:

- `mach es wärmer und cinematisch`
- `übernimm das Editing für das ganze Video`
- `schneide die ersten 2 Sekunden weg`
- `füge einen Hook-Text hinzu`
- `titel „Warum wir prokrastinieren“`
- `mach Schwarzweiß mit Filmkorn`
- `hochformat für TikTok`
- `cinema frame mit runden Ecken`
- `nur Voiceover, B-Roll stumm`
- `übernimm den Look der Referenz`
- `teile den Clip hier`
- `exportiere in 4K`

Mehrere Befehle in einem Satz gehen auch: *„mach es wärmer und cinematisch, schneide die ersten 2 Sekunden weg, füge Hook-Text hinzu"*.

Tipp: Text am besten in **„Anführungszeichen"** setzen, dann weiß ich genau, was auf den Screen soll.

---

## 📎 Referenzen – „zeig mir, was Du meinst"

1. Gehe links auf **Referenz** und füge ein Beispiel-Video oder -Bild ein.
2. Das Studio analysiert sofort Farbstimmung, Kontrast, Helligkeit und die Farbpalette – **ohne etwas zu verändern**.
3. Wenn Dir der Look gefällt, sag mir: **„übernimm den Look der Referenz"** – dann wende ich ihn auf den ausgewählten Clip (oder mit „auf alle" auf alle Clips) an.

> Hinweis: Die genaue **Schriftart** eines Beispiel-Videos kann das Studio offline nicht automatisch erkennen. Nenne mir einfach den Namen (z. B. „nimm Playfair") oder wähle im Text-Panel eine passende Schrift.

---

## ⌨️ Tastenkürzel

| Taste | Funktion |
|---|---|
| `Leertaste` | Abspielen / Pause |
| `S` | Clip am Abspielkopf teilen |
| `←` / `→` | 1 Sek. zurück / vor (mit `Shift`: 5 Sek.) |
| `Entf` | Ausgewähltes Element löschen |
| `Strg/Cmd + Z` | Rückgängig |
| `Strg/Cmd + Shift + Z` (oder `Y`) | Wiederholen |

---

## 🎯 Empfohlener Workflow für Deinen TikTok

1. **B-Roll** hochladen und in der Timeline anordnen.
2. **Voiceover** (z. B. aus ElevenLabs) unter **Ton** importieren, **B-Roll stummschalten**.
3. **Auto-Edit** klicken für den cinematisch-cleanen Grundlook – dann pro Clip feinjustieren.
4. **Hook-Text** für die ersten Sekunden + **Untertitel** einfügen (Safe-Zones anschalten, damit nichts hinter den TikTok-Buttons verschwindet).
5. Auf **9:16** stellen, **exportieren** (4K oder 1080p) und bei TikTok hochladen.

---

## ℹ️ Gut zu wissen

- **Musikfrei by design:** Es gibt bewusst keine Musik-Bibliothek. Ton-Import ist für Voiceover, Naschid oder Ambient gedacht.
- **Format:** Standard ist 16:9 (wie gewünscht). Für die TikTok-Reichweite ist 9:16 direkt als Ein-Klick-Umschalter dabei.
- **Edle Schriften:** Für die schönsten Schriften (Playfair, Montserrat, Bebas …) lädt das Studio Web-Schriften – dafür beim Bearbeiten kurz online sein. Offline funktioniert alles mit System-Schriften weiter.
- **Export läuft in Echtzeit:** Das Video wird einmal abgespielt und dabei aufgenommen. Den Tab während des Exports geöffnet lassen.
- **Beim Neuladen der Seite** müssen die Medien neu geladen werden (der Browser speichert große Videodateien nicht dauerhaft).
- Am besten in **Google Chrome** nutzen (bester Export, dann meist direkt als MP4).

---

*Viel Erfolg auf dem Weg ins Creator Rewards Programm. 🎬*
