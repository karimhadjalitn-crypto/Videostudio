/* ============================================================
   audio.js – Aussprache über die Sprachausgabe des Browsers
   ============================================================ */
window.AR = window.AR || {};
(function (AR) {
  "use strict";
  var synth = window.speechSynthesis || null;
  var arVoice = null, triedInit = false;

  function arabicVoices() {
    if (!synth) return [];
    var voices = synth.getVoices() || [];
    return voices.filter(function (v) { return /^ar(\b|-)/i.test(v.lang); });
  }
  // Bevorzugt die in den Einstellungen gewählte Stimme, sonst die erste gefundene arabische.
  function pickVoice() {
    var list = arabicVoices();
    if (!list.length) return null;
    var wanted = AR.store && AR.store.get("voiceURI");
    if (wanted) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].voiceURI === wanted) return list[i];
      }
    }
    return list[0];
  }
  function refreshVoice() { arVoice = pickVoice(); return arVoice; }
  function init() {
    if (!synth || triedInit) return;
    triedInit = true;
    refreshVoice();
    if (synth.onvoiceschanged !== undefined) {
      synth.addEventListener("voiceschanged", function () {
        refreshVoice();
        if (AR.audio.onVoicesReady) AR.audio.onVoicesReady();
      });
    }
  }

  function available() { return !!synth; }
  function hasArabicVoice() { return !!arVoice; }
  // Vom Einstellungen-Screen aufgerufen, wenn der Nutzer eine Stimme wählt (voiceURI oder "" = automatisch).
  function setVoice(voiceURI) {
    if (AR.store) AR.store.set("voiceURI", voiceURI || "");
    return refreshVoice();
  }

  function speak(text) {
    if (!synth || !text || !AR.store.get("audio")) return;
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = arVoice ? arVoice.lang : "ar-SA";
      if (arVoice) u.voice = arVoice;
      u.rate = 0.85;
      synth.speak(u);
    } catch (e) { /* still ok */ }
  }

  AR.audio = { init: init, speak: speak, available: available, hasArabicVoice: hasArabicVoice,
    arabicVoices: arabicVoices, setVoice: setVoice };
})(window.AR);
