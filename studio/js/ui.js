/* Sūq – Bausteine der Oberfläche.
   Gleiche Handschrift wie Mīzān: Flächen statt Rahmen, wenig Farbe,
   Farbe nur dort, wo sie etwas bedeutet. */
var UI = (function () {
  "use strict";

  /* el("div.karte", {onclick:fn}, [kinder]) — ".karte" ohne Tag ergibt ein div */
  function el(spec, attr, kinder) {
    var text = String(spec);
    if (text.charAt(0) === "." || text.charAt(0) === "#") text = "div" + text;
    var teile = text.split(/(?=[.#])/);
    var node = document.createElement(teile[0] || "div");
    teile.slice(1).forEach(function (t) {
      if (t[0] === ".") node.classList.add(t.slice(1));
      if (t[0] === "#") node.id = t.slice(1);
    });
    if (attr && (typeof attr === "string" || Array.isArray(attr) || attr instanceof Node)) {
      kinder = attr; attr = null;
    }
    Object.keys(attr || {}).forEach(function (k) {
      var v = attr[k];
      if (k === "text") node.textContent = v;
      else if (k === "html") node.innerHTML = v;
      else if (k.indexOf("on") === 0 && typeof v === "function") node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, "");
      else if (v !== false && v != null) node.setAttribute(k, v);
    });
    anhaengen(node, kinder);
    return node;
  }

  function anhaengen(node, kinder) {
    if (kinder == null) return;
    (Array.isArray(kinder) ? kinder : [kinder]).forEach(function (k) {
      if (k == null || k === false) return;
      node.appendChild(typeof k === "string" || typeof k === "number"
        ? document.createTextNode(String(k)) : k);
    });
  }

  function leeren(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

  /* ---------- Bausteine ---------- */
  function karte(klasse, kinder) { return el("div.karte" + (klasse ? "." + klasse : ""), kinder); }

  function block(titel, kinder, rechts) {
    return el("div.block", [
      titel ? el("div.blockkopf", [
        el("span", { text: titel }),
        rechts || null
      ].filter(Boolean)) : null,
      el("div.gruppe", kinder)
    ]);
  }

  function zeile(opt) {
    var kinder = [];
    if (opt.haken !== undefined) kinder.push(el("span.haken" + (opt.haken ? ".an" : "")));
    kinder.push(el("span.zt" + (opt.dehnbar ? ".dehnbar" : ""), { text: opt.text }));
    if (opt.unter) kinder.push(el("span.zu", { text: opt.unter }));
    if (opt.wert) kinder.push(el("span.zw", { text: opt.wert }));
    if (opt.rechts) kinder.push(opt.rechts);
    var z = el("div.zeile", { onclick: opt.onclick }, kinder);
    if (opt.onclick) z.classList.add("tippbar");
    if (opt.klasse) z.classList.add(opt.klasse);
    return z;
  }

  function kopf(titel, links, rechts) {
    return el("div.kopf", [
      el("h1", { text: titel }),
      (links || rechts) ? el("div.kopfzeile", [
        el("span", { text: links || "" }),
        el("span.rechts", { text: rechts || "" })
      ]) : null
    ].filter(Boolean));
  }

  function knopf(text, opt) {
    opt = opt || {};
    return el("button.mini" + (opt.klasse ? "." + opt.klasse : ""),
      { type: "button", onclick: opt.onclick, disabled: opt.aus || false }, text);
  }

  function cta(text, opt) {
    opt = opt || {};
    return el("button.cta" + (opt.klasse ? "." + opt.klasse : ""),
      { type: "button", onclick: opt.onclick, disabled: opt.aus || false }, text);
  }

  function balken(anteil, klasse) {
    return el("div.balken" + (klasse ? "." + klasse : ""), [
      el("i", { style: "width:" + Math.round(Math.max(0, Math.min(1, anteil)) * 100) + "%" })
    ]);
  }

  /* ---------- Felder ---------- */
  function feld(opt) {
    var f = el("input.feld", {
      type: opt.typ || "text",
      value: opt.wert == null ? "" : opt.wert,
      placeholder: opt.platzhalter || "",
      inputmode: opt.inputmode || null,
      oninput: opt.oninput || null,
      onchange: opt.onchange || null
    });
    return f;
  }

  function beschriftet(text, node, hinweis) {
    return el("label.beschriftet", [
      el("span.bl", { text: text }),
      node,
      hinweis ? el("span.bh", { text: hinweis }) : null
    ].filter(Boolean));
  }

  function textfeld(opt) {
    return el("textarea.textfeld" + (opt.klasse ? "." + opt.klasse : ""), {
      value: opt.wert == null ? "" : opt.wert,
      placeholder: opt.platzhalter || "",
      rows: opt.zeilen || 3,
      oninput: opt.oninput || null,
      onblur: opt.onblur || null
    });
  }

  function auswahl(opt) {
    var s = el("select.feld", { onchange: opt.onchange || null });
    (opt.werte || []).forEach(function (w) {
      var wert = typeof w === "string" ? w : w.wert;
      var name = typeof w === "string" ? w : w.name;
      s.appendChild(el("option", { value: wert, selected: wert === opt.wert }, name));
    });
    return s;
  }

  function chips(werte, aktiv, beiWahl, klasse) {
    return el("div.chips" + (klasse ? "." + klasse : ""), werte.map(function (w) {
      var wert = typeof w === "string" ? w : w.wert;
      var name = typeof w === "string" ? w : w.name;
      return el("button.chip" + (wert === aktiv ? ".an" : ""), {
        type: "button", onclick: function () { beiWahl(wert); }
      }, name);
    }));
  }

  function schalter(text, an, beiWechsel, hinweis) {
    return el("div.schaltzeile" + (an ? ".an" : ""), {
      onclick: function () { beiWechsel(!an); }
    }, [
      el("div.sz", [
        el("span.szt", { text: text }),
        hinweis ? el("span.szh", { text: hinweis }) : null
      ].filter(Boolean)),
      el("span.wippe" + (an ? ".an" : ""), [el("i")])
    ]);
  }

  /* ---------- Meldung ---------- */
  var meldungTimer = null;
  function meldung(text, klasse) {
    var alt = document.querySelector(".meldung");
    if (alt) alt.remove();
    var m = el("div.meldung" + (klasse ? "." + klasse : ""), { text: text });
    document.body.appendChild(m);
    requestAnimationFrame(function () { m.classList.add("an"); });
    clearTimeout(meldungTimer);
    meldungTimer = setTimeout(function () {
      m.classList.remove("an");
      setTimeout(function () { m.remove(); }, 300);
    }, 2600);
  }

  /* In die Zwischenablage. Der Rückfallweg ist nicht Zierde: in einer
     PWA ohne sicheren Kontext gibt es die Clipboard-Schnittstelle nicht. */
  function kopieren(text, was) {
    function gemeldet() { meldung((was || "Text") + " kopiert."); }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(gemeldet).catch(altWeg);
    }
    return Promise.resolve(altWeg());
    function altWeg() {
      var t = document.createElement("textarea");
      t.value = text;
      t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); gemeldet(); }
      catch (e) { meldung("Kopieren ging nicht — bitte von Hand markieren."); }
      t.remove();
    }
  }

  /* ---------- Rückfrage ----------
     Für alles, was sich nicht rückgängig machen lässt. */
  function rueckfrage(titel, text, bestaetigung) {
    return new Promise(function (ok) {
      var huelle = el("div.schleier");
      function schliessen(antwort) { huelle.remove(); ok(antwort); }
      huelle.appendChild(el("div.dialog", [
        el("div.dt", { text: titel }),
        el("p.dtext", { text: text }),
        el("div.dknoepfe", [
          knopf("Abbrechen", { onclick: function () { schliessen(false); } }),
          knopf(bestaetigung || "Löschen", {
            klasse: "gefahr", onclick: function () { schliessen(true); }
          })
        ])
      ]));
      huelle.addEventListener("click", function (e) {
        if (e.target === huelle) schliessen(false);
      });
      document.body.appendChild(huelle);
    });
  }

  /* ---------- Erscheinungsbild ---------- */
  function themaAnwenden(thema) {
    thema = thema || (Store.einstellungen && Store.einstellungen.thema) || "hell";
    document.documentElement.setAttribute("data-theme", thema);
    var dunkel = thema === "dunkel" ||
      (thema === "system" && window.matchMedia &&
       window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.style.colorScheme = dunkel ? "dark" : "light";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dunkel ? "#12100D" : "#F4F0E8");
  }

  /* ---------- Formate ---------- */
  function euro(n) {
    if (n == null || n === "") return "—";
    return Number(n).toLocaleString("de-DE", {
      style: "currency", currency: "EUR", minimumFractionDigits: 2
    });
  }

  function zahl(n) {
    if (n == null || n === "") return "—";
    return Number(n).toLocaleString("de-DE");
  }

  function sek(n) {
    return (Math.round((n || 0) * 10) / 10).toLocaleString("de-DE", {
      minimumFractionDigits: 1, maximumFractionDigits: 1
    }) + " s";
  }

  function datum(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    return d.getDate() + ". " + MONATE[d.getMonth()] + " " + d.getFullYear();
  }

  function plural(n, einzahl, mehrzahl) {
    return n + " " + (n === 1 ? einzahl : mehrzahl);
  }

  var MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni",
                "Juli", "August", "September", "Oktober", "November", "Dezember"];

  return {
    el: el, leeren: leeren, karte: karte, block: block, zeile: zeile, kopf: kopf,
    knopf: knopf, cta: cta, balken: balken,
    feld: feld, beschriftet: beschriftet, textfeld: textfeld, auswahl: auswahl,
    chips: chips, schalter: schalter,
    meldung: meldung, kopieren: kopieren, rueckfrage: rueckfrage,
    themaAnwenden: themaAnwenden,
    euro: euro, zahl: zahl, sek: sek, datum: datum, plural: plural, MONATE: MONATE
  };
})();
