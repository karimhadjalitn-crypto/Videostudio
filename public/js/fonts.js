// Sorgt dafür, dass die edlen Schriften geladen sind, bevor Canvas-Text gezeichnet wird.
const NEEDED = [
  '900 40px Montserrat', '800 40px Montserrat', '600 40px Montserrat',
  '700 40px "Playfair Display"', '900 40px "Playfair Display"',
  '400 40px "Bebas Neue"', '400 40px Anton', '600 40px Oswald',
  '700 40px "Cormorant Garamond"', '800 40px Inter', '400 40px Inter',
];

export async function ensureFonts() {
  if (!document.fonts) return;
  try {
    await Promise.race([
      Promise.all(NEEDED.map(f => document.fonts.load(f).catch(() => {}))),
      new Promise(r => setTimeout(r, 3500)),
    ]);
    await document.fonts.ready;
  } catch (e) { /* offline -> System-Fallback */ }
}
