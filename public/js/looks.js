// Cinematische Look-Vorlagen (Color-Grades) + Slider-Definitionen.

// Regler, die im Farb-Panel erscheinen (in dieser Reihenfolge).
export const SLIDERS = [
  { key: 'exposure',   label: 'Belichtung',    min: -100, max: 100 },
  { key: 'contrast',   label: 'Kontrast',      min: -100, max: 100 },
  { key: 'saturation', label: 'Sättigung',     min: -100, max: 100 },
  { key: 'temperature',label: 'Temperatur',    min: -100, max: 100 },
  { key: 'tint',       label: 'Farbton',       min: -100, max: 100 },
  { key: 'fade',       label: 'Fade / Weich',  min: 0,    max: 100 },
  { key: 'tealOrange', label: 'Teal & Orange', min: 0,    max: 100 },
  { key: 'vignette',   label: 'Vignette',      min: 0,    max: 100 },
  { key: 'grain',      label: 'Filmkorn',      min: 0,    max: 100 },
];

// Look-Presets: nur die abweichenden Werte, Rest = 0.
export const LOOKS = [
  { id: 'none',      name: 'Original',    swatch: 'linear-gradient(135deg,#3a4048,#20242b)', grade: {} },
  { id: 'cinematic', name: 'Cinematic',   swatch: 'linear-gradient(135deg,#1f6f78,#e08a3c)', grade: { contrast: 12, saturation: -6, temperature: 8, tealOrange: 58, vignette: 20, fade: 8 } },
  { id: 'moody',     name: 'Moody',       swatch: 'linear-gradient(135deg,#12181f,#2b3a4a)', grade: { exposure: -10, contrast: 18, saturation: -14, temperature: -6, vignette: 34, fade: 10, tealOrange: 26, grain: 8 } },
  { id: 'warm',      name: 'Warm Film',   swatch: 'linear-gradient(135deg,#7a4a20,#e6b073)', grade: { temperature: 28, saturation: 8, contrast: 6, vignette: 12, grain: 6 } },
  { id: 'cold',      name: 'Kühl',        swatch: 'linear-gradient(135deg,#1c3a55,#5b7fa6)', grade: { temperature: -30, tint: -6, saturation: -8, contrast: 8, vignette: 18 } },
  { id: 'noir',      name: 'Noir S/W',    swatch: 'linear-gradient(135deg,#0a0a0a,#c9c9c9)', grade: { saturation: -100, contrast: 30, vignette: 35, grain: 14, exposure: -4 } },
  { id: 'vintage',   name: 'Vintage',     swatch: 'linear-gradient(135deg,#6b5836,#c9a76b)', grade: { temperature: 16, saturation: -18, fade: 34, grain: 24, contrast: -6, vignette: 22 } },
  { id: 'dream',     name: 'Traum',       swatch: 'linear-gradient(135deg,#5b6a86,#d9c6e0)', grade: { fade: 40, exposure: 8, saturation: 6, contrast: -12, vignette: 10 } },
  { id: 'bold',      name: 'Bold',        swatch: 'linear-gradient(135deg,#134a55,#e07a2c)', grade: { contrast: 34, saturation: 20, tealOrange: 20, vignette: 14 } },
];

export function lookById(id) { return LOOKS.find(l => l.id === id); }

// UI-Wert (-100..100) -> Shader-Uniforms
export function gradeToUniforms(g) {
  return {
    exposure:    (g.exposure || 0) / 100,          // -1..1 (Blenden)
    contrast:    1 + (g.contrast || 0) / 200,       // 0.5..1.5
    saturation:  1 + (g.saturation || 0) / 100,     // 0..2
    temperature: (g.temperature || 0) / 100 * 0.18, // -0.18..0.18
    tint:        (g.tint || 0) / 100 * 0.12,
    lift:        (g.lift || 0) / 100 * 0.15,
    gamma:       Math.max(0.2, 1 - (g.gamma || 0) / 250),
    gain:        1 + (g.gain || 0) / 300,
    vignette:    (g.vignette || 0) / 100,
    grain:       (g.grain || 0) / 100,
    fade:        (g.fade || 0) / 100,
    tealOrange:  (g.tealOrange || 0) / 100,
  };
}
