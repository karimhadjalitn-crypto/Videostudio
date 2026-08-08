/* ============================================================
   views/add.js – Eigene Vokabeln hinzufügen
   Tippen (mit arab. Tastatur) · Datei (.txt/.csv/.docx) · Bild (OCR)
   ============================================================ */
window.AR = window.AR || {};
AR.views = AR.views || {};
(function (AR) {
  "use strict";
  var el = AR.ui.el, ui = AR.ui, store = AR.store, data = AR.data;

  var mode = "type";           // type | file | image
  var activeAr = null;         // aktuell fokussiertes arabisches Feld
  var pending = null;          // Vorschau-Liste beim Import

  var CATS = null;
  function categories() {
    if (CATS) return CATS;
    CATS = (data.meta.categories || []).map(function (c) { return c.name; });
    if (CATS.indexOf("Meine Wörter") < 0) CATS.push("Meine Wörter");
    return CATS;
  }

  function render(main) {
    var view = el("div", { class: "view" });
    view.appendChild(el("h2", { text: "Vokabeln hinzufügen" }));
    view.appendChild(el("div", { class: "seg", style: "margin:10px 0 16px" }, [
      seg("type", "✍️ Tippen"), seg("file", "📄 Datei"), seg("image", "📷 Bild")
    ]));

    var body = el("div", {});
    if (mode === "type") renderType(body);
    else if (mode === "file") renderFile(body);
    else renderImage(body);
    view.appendChild(body);

    if (pending) view.appendChild(previewBlock());

    view.appendChild(userList());
    AR.ui.clear(main).appendChild(view);
  }
  function seg(id, label) {
    return el("button", { class: mode === id ? "active" : "", text: label,
      onclick: function () { mode = id; pending = null; render(main()); } });
  }
  function main() { return document.getElementById("main"); }

  /* ---------------- Manuell tippen ---------------- */
  function renderType(body) {
    var form = el("div", { class: "card stack" });
    var deI = el("input", { type: "text", placeholder: "z.B. Apfel" });
    var typeSel = el("select", {}, ["noun", "verb", "adjective", "preposition", "conjunction", "question"].map(function (t) {
      return el("option", { value: t, text: { noun: "Nomen", verb: "Verb", adjective: "Adjektiv",
        preposition: "Präposition", conjunction: "Konjunktion", question: "Frage/Pronomen" }[t] });
    }));
    var catSel = el("select", {}, categories().map(function (c) {
      var o = el("option", { value: c, text: c }); if (c === "Meine Wörter") o.selected = true; return o;
    }));
    var fushaI = arInput("das Wort auf Arabisch (mit Harakat)");
    var spokenI = arInput("Sprechform (optional)");
    var presentI = arInput("Präsens يَفْعَلُ");
    var futureI = arInput("Zukunft سَيَفْعَلُ");
    var imperativeI = arInput("Befehlsform اِفْعَلْ");
    // Befehlsform automatisch aus dem Präsens ableiten, solange nicht selbst getippt
    imperativeI.addEventListener("input", function () { imperativeI.dataset.touched = "1"; });
    presentI.addEventListener("input", function () {
      if (imperativeI.dataset.touched) return;
      imperativeI.value = data.deriveImperative(presentI.value.trim()) || "";
    });
    var verbBox = el("div", { class: "stack hidden" }, [
      el("label", { class: "field", text: "Präsens (Gegenwart)" }), presentI,
      el("label", { class: "field", text: "Zukunft" }), futureI,
      el("label", { class: "field", text: "Befehlsform (wird automatisch ergänzt)" }), imperativeI
    ]);
    typeSel.addEventListener("change", function () { verbBox.classList.toggle("hidden", typeSel.value !== "verb"); });

    // gemeinsame arabische Tastatur (zielt auf das aktive Feld)
    var kbd = ui.arabicKeyboard(function () { return activeAr; });
    var kbdWrap = el("div", { class: "hidden" }, kbd);
    var kbdToggle = el("button", { class: "btn btn-sm", type: "button",
      onclick: function () { kbdWrap.classList.toggle("hidden"); } }, "⌨️ Arabische Tastatur");

    form.appendChild(el("label", { class: "field", text: "Deutsch" })); form.appendChild(deI);
    form.appendChild(el("div", { class: "row", style: "gap:10px" }, [
      el("div", { style: "flex:1" }, [el("label", { class: "field", text: "Wortart" }), typeSel]),
      el("div", { style: "flex:1" }, [el("label", { class: "field", text: "Kategorie" }), catSel])
    ]));
    form.appendChild(el("label", { class: "field", text: "Arabisch (Fuṣḥā)" })); form.appendChild(fushaI);
    form.appendChild(el("label", { class: "field", text: "Sprechform (optional)" })); form.appendChild(spokenI);
    form.appendChild(verbBox);
    form.appendChild(el("div", { class: "row", style: "gap:8px;margin-top:6px" }, [kbdToggle]));
    form.appendChild(kbdWrap);
    form.appendChild(el("button", { class: "btn btn-primary btn-lg block", style: "margin-top:8px",
      onclick: function () {
        var de = deI.value.trim(), fusha = fushaI.value.trim();
        if (!de || !fusha) { ui.toast("Bitte Deutsch und Arabisch ausfüllen"); return; }
        var card = { de: de, fusha: fusha, spoken: spokenI.value.trim() || pausal(fusha),
          type: typeSel.value, category: catSel.value };
        if (typeSel.value === "verb") {
          card.present = presentI.value.trim();
          card.future = futureI.value.trim();
          card.imperative = imperativeI.value.trim() || data.deriveImperative(card.present) || "";
        }
        store.addUserCard(card);
        ui.toast("„" + de + "“ hinzugefügt ✓");
        render(main());
      } }, "Hinzufügen"));

    body.appendChild(form);
  }
  function arInput(ph) {
    var i = el("input", { type: "text", class: "ar", placeholder: ph, dir: "rtl", spellcheck: "false" });
    i.addEventListener("focus", function () { activeAr = i; });
    return i;
  }
  function pausal(s) { return (s || "").replace(/[ً-ْ]$/,"").replace(/[ً-ِ]$/,""); }

  /* ---------------- Datei-Import ---------------- */
  function renderFile(body) {
    var input = el("input", { type: "file", accept: ".txt,.csv,.docx,text/plain,text/csv", style: "display:none" });
    input.addEventListener("change", function () {
      var f = input.files[0]; if (!f) return;
      readFile(f);
    });
    body.appendChild(el("div", { class: "card stack" }, [
      el("div", { class: "big-emoji center", text: "📄" }),
      el("p", { class: "center muted", text: "Lade eine Liste als .txt, .csv oder .docx hoch. Format pro Zeile:" }),
      el("div", { class: "chip", style: "margin:0 auto", text: "Deutsch / Arabisch" }),
      el("button", { class: "btn btn-primary btn-lg block", style: "margin-top:8px",
        onclick: function () { input.click(); } }, "Datei auswählen"),
      el("p", { class: "muted center", style: "font-size:12px",
        text: "Trennzeichen: „/“, Komma, Tab oder „ - “ werden erkannt." })
    ]));
    body.appendChild(input);
  }

  function readFile(f) {
    var name = (f.name || "").toLowerCase();
    if (name.endsWith(".docx")) {
      f.arrayBuffer().then(readDocx).then(function (text) { preview(parseLines(text), f.name); })
        .catch(function (e) { ui.toast("DOCX konnte nicht gelesen werden"); console.warn(e); });
    } else {
      var r = new FileReader();
      r.onload = function () { preview(parseLines(String(r.result)), f.name); };
      r.readAsText(f, "utf-8");
    }
  }

  /* ---- .docx im Browser entpacken (native DecompressionStream) ---- */
  function readDocx(buf) {
    var xmlBytes = extractZipEntry(new Uint8Array(buf), "word/document.xml");
    if (!xmlBytes) return Promise.reject("document.xml nicht gefunden");
    return xmlBytes.then(function (bytes) {
      var xml = new TextDecoder("utf-8").decode(bytes);
      // Text je Absatz zusammensetzen
      var paras = xml.split(/<\/w:p>/);
      var lines = paras.map(function (p) {
        var m = p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
        return m.map(function (t) { return t.replace(/<[^>]+>/g, ""); }).join("")
          .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
      }).filter(function (l) { return l.trim(); });
      return lines.join("\n");
    });
  }
  // Liest eine Datei aus dem ZIP (nur die gesuchte), inflate via DecompressionStream
  function extractZipEntry(u8, target) {
    var dv = new DataView(u8.buffer);
    // End of Central Directory finden
    var eocd = -1;
    for (var i = u8.length - 22; i >= 0 && i > u8.length - 65558; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) return null;
    var cdOffset = dv.getUint32(eocd + 16, true);
    var cdCount = dv.getUint16(eocd + 10, true);
    var p = cdOffset;
    for (var n = 0; n < cdCount; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      var method = dv.getUint16(p + 10, true);
      var compSize = dv.getUint32(p + 20, true);
      var fnLen = dv.getUint16(p + 28, true);
      var exLen = dv.getUint16(p + 30, true);
      var cmLen = dv.getUint16(p + 32, true);
      var localOff = dv.getUint32(p + 42, true);
      var name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + fnLen));
      if (name === target) {
        var lfnLen = dv.getUint16(localOff + 26, true);
        var lexLen = dv.getUint16(localOff + 28, true);
        var dataStart = localOff + 30 + lfnLen + lexLen;
        var comp = u8.subarray(dataStart, dataStart + compSize);
        if (method === 0) return Promise.resolve(comp);
        return inflateRaw(comp);
      }
      p += 46 + fnLen + exLen + cmLen;
    }
    return null;
  }
  function inflateRaw(bytes) {
    if (typeof DecompressionStream === "undefined") return Promise.reject("DecompressionStream fehlt");
    var ds = new DecompressionStream("deflate-raw");
    var stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Response(stream).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
  }

  /* Zeilen zu {de, ar} parsen */
  function parseLines(text) {
    var out = [];
    text.split(/\r?\n/).forEach(function (line) {
      line = line.trim(); if (!line) return;
      var parts = null;
      var seps = [/\t/, /\s\/\s/, /\//, /\s-\s/, /;/, /,/];
      for (var s = 0; s < seps.length; s++) {
        var idx = line.search(seps[s]);
        if (idx >= 0) { var m = line.split(seps[s]); parts = [m[0], m.slice(1).join(" ")]; break; }
      }
      if (!parts) return;
      var a = parts[0].trim(), b = parts[1].trim();
      var aAr = hasArabic(a), bAr = hasArabic(b);
      var de, ar;
      if (bAr && !aAr) { de = a; ar = b; }
      else if (aAr && !bAr) { de = b; ar = a; }
      else return;
      if (de && ar) out.push({ de: de, ar: ar, type: "noun", category: "Meine Wörter" });
    });
    return out;
  }
  function hasArabic(s) { return /[؀-ۿ]/.test(s || ""); }

  /* ---------------- Bild (OCR) ---------------- */
  function renderImage(body) {
    var input = el("input", { type: "file", accept: "image/*", style: "display:none" });
    var status = el("div", { class: "muted center", style: "margin-top:8px" });
    var textArea = el("textarea", { class: "hidden", placeholder: "Erkannter Text – bitte prüfen und korrigieren" });
    input.addEventListener("change", function () {
      var f = input.files[0]; if (!f) return;
      runOCR(f, status, textArea);
    });
    body.appendChild(el("div", { class: "card stack" }, [
      el("div", { class: "big-emoji center", text: "📷" }),
      el("p", { class: "center muted", text: "Fotografiere oder wähle ein Bild deiner Vokabelliste. Die Texterkennung (Arabisch + Deutsch) läuft direkt auf deinem Gerät." }),
      el("span", { class: "chip gold", style: "margin:0 auto", text: "Beta – bitte Erkennung prüfen" }),
      el("button", { class: "btn btn-primary btn-lg block", style: "margin-top:8px",
        onclick: function () { input.click(); } }, "Bild auswählen"),
      status, textArea,
      el("button", { class: "btn btn-lg block hidden", id: "ocrImport",
        onclick: function () { preview(parseLines(textArea.value), "Bild"); } }, "Aus Text importieren")
    ]));
    body.appendChild(input);
  }

  var tesseractLoading = null;
  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (tesseractLoading) return tesseractLoading;
    tesseractLoading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
      s.onload = function () { resolve(window.Tesseract); };
      s.onerror = function () { reject(new Error("Tesseract konnte nicht geladen werden")); };
      document.head.appendChild(s);
    });
    return tesseractLoading;
  }
  function runOCR(file, status, textArea) {
    status.textContent = "Texterkennung wird geladen…";
    loadTesseract().then(function (T) {
      status.textContent = "Erkenne Text… 0%";
      return T.recognize(file, "ara+deu", {
        logger: function (m) {
          if (m.status === "recognizing text") status.textContent = "Erkenne Text… " + Math.round(m.progress * 100) + "%";
        }
      });
    }).then(function (res) {
      status.textContent = "Fertig – bitte Text prüfen:";
      textArea.value = res.data.text || "";
      textArea.classList.remove("hidden");
      document.getElementById("ocrImport").classList.remove("hidden");
    }).catch(function (e) {
      status.textContent = "";
      ui.toast("Texterkennung nicht verfügbar (Internet nötig). Nutze stattdessen „Datei“ oder „Tippen“.");
      console.warn(e);
    });
  }

  /* ---------------- Vorschau & Import ---------------- */
  function preview(rows, source) {
    pending = { rows: rows, source: source };
    if (!rows.length) ui.toast("Keine Vokabeln erkannt");
    render(main());
  }
  function previewBlock() {
    var p = pending;
    var card = el("div", { class: "card stack" });
    card.appendChild(el("div", { class: "row", style: "justify-content:space-between" }, [
      el("h3", { style: "margin:0", text: "Vorschau (" + p.rows.length + ")" }),
      el("span", { class: "muted", style: "font-size:12px", text: p.source })
    ]));
    if (!p.rows.length) {
      card.appendChild(el("p", { class: "muted", text: "Nichts erkannt. Prüfe das Format „Deutsch / Arabisch“." }));
      return card;
    }
    var catSel = el("select", {}, categories().map(function (c) {
      var o = el("option", { value: c, text: c }); if (c === "Meine Wörter") o.selected = true; return o;
    }));
    var tbl = el("table", { class: "preview" }, [
      el("tr", {}, [el("th", { text: "Deutsch" }), el("th", { text: "Arabisch" }), el("th", {})])
    ]);
    p.rows.forEach(function (r, i) {
      tbl.appendChild(el("tr", {}, [
        el("td", { text: r.de }),
        el("td", { class: "ar" }, ui.ar(r.ar)),
        el("td", { class: "x" }, el("button", { text: "✕", onclick: function () { p.rows.splice(i, 1); render(main()); } }))
      ]));
    });
    card.appendChild(el("label", { class: "field", text: "Kategorie für alle" }));
    card.appendChild(catSel);
    card.appendChild(el("div", { style: "overflow-x:auto" }, tbl));
    card.appendChild(el("button", { class: "btn btn-primary btn-lg block",
      onclick: function () {
        p.rows.forEach(function (r) {
          store.addUserCard({ de: r.de, fusha: r.ar, spoken: pausal(r.ar), type: "noun", category: catSel.value });
        });
        ui.toast(p.rows.length + " Vokabeln importiert ✓");
        pending = null; render(main());
      } }, p.rows.length + " Vokabeln importieren"));
    card.appendChild(el("button", { class: "btn btn-ghost block", onclick: function () { pending = null; render(main()); } }, "Abbrechen"));
    return card;
  }

  /* ---------------- Liste eigener Wörter ---------------- */
  function userList() {
    var cards = store.userCards();
    var wrap = el("div", {});
    wrap.appendChild(el("div", { class: "section-title", text: "Meine hinzugefügten Wörter (" + cards.length + ")" }));
    if (!cards.length) {
      wrap.appendChild(el("div", { class: "empty" }, [
        el("div", { class: "big", text: "✍️" }),
        el("p", { text: "Noch keine eigenen Wörter. Füge oben welche hinzu!" })
      ]));
      return wrap;
    }
    var list = el("div", { class: "card stack" });
    cards.slice().reverse().forEach(function (c) {
      list.appendChild(el("div", { class: "row", style: "justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:8px" }, [
        el("div", {}, [ el("div", { style: "font-weight:600", text: c.de }), ui.ar(data.arText(c.fusha)) ]),
        el("button", { class: "iconbtn", style: "color:var(--danger)", title: "Löschen",
          onclick: function () { store.deleteUserCard(c.id); ui.toast("gelöscht"); render(main()); }, text: "🗑" })
      ]));
    });
    wrap.appendChild(list);
    return wrap;
  }

  AR.views.add = { render: render };
})(window.AR);
