/* ============================================================
   audio.js – Aussprache über die Sprachausgabe des Browsers
   ============================================================ */
window.AR = window.AR || {};
(function (AR) {
  "use strict";
  var synth = window.speechSynthesis || null;
  var arVoice = null, triedInit = false;

  function pickVoice() {
    if (!synth) return null;
    var voices = synth.getVoices() || [];
    // bevorzugt arabische Stimme
    for (var i = 0; i < voices.length; i++) {
      if (/^ar(\b|-)/i.test(voices[i].lang)) return voices[i];
    }
    return null;
  }
  function init() {
    if (!synth || triedInit) return;
    triedInit = true;
    arVoice = pickVoice();
    if (synth.onvoiceschanged !== undefined) {
      synth.addEventListener("voiceschanged", function () { arVoice = pickVoice(); });
    }
  }

  function available() { return !!synth; }
  function hasArabicVoice() { return !!arVoice; }

  function speak(text) {
    if (!synth || !text || !AR.store.get("audio")) return;
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-SA";
      if (arVoice) u.voice = arVoice;
      u.rate = 0.85;
      synth.speak(u);
    } catch (e) { /* still ok */ }
  }

  AR.audio = { init: init, speak: speak, available: available, hasArabicVoice: hasArabicVoice };
})(window.AR);
