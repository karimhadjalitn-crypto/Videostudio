/* Mīzān – Bausteine der Oberfläche. */
var UI = (function () {
  "use strict";

  /* el("div.card", {onclick:fn}, [kinder]) */
  function el(spec, attr, kinder) {
    var teile = String(spec).split(/(?=[.#])/);
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

  function gruppe(titel, zeilen) {
    return el("div.block", [
      titel ? el("div.blockkopf", { text: titel }) : null,
      el("div.gruppe", zeilen)
    ]);
  }

  function zeile(opt) {
    var kinder = [];
    if (opt.haken !== undefined) {
      kinder.push(el("span.haken"));
    }
    kinder.push(el("span.zt", { text: opt.text }));
    if (opt.ar) kinder.push(el("span.ar", { text: opt.ar }));
    if (opt.wert) kinder.push(el("span.zw", { text: opt.wert }));
    if (opt.rechts) kinder.push(opt.rechts);
    var z = el("div.zeile" + (opt.haken ? ".erledigt" : ""), { onclick: opt.onclick }, kinder);
    if (opt.onclick) z.classList.add("tippbar");
    return z;
  }

  /* Fortschrittsring, 0..1 */
  function ring(wert, zahl, groesse) {
    groesse = groesse || 66;
    var r = (groesse - 10) / 2;
    var u = 2 * Math.PI * r;
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", groesse); svg.setAttribute("height", groesse);
    svg.setAttribute("viewBox", "0 0 " + groesse + " " + groesse);
    svg.setAttribute("aria-hidden", "true");
    [["rgba(255,255,255,.09)", u, 0], ["var(--jade)", u, u * (1 - Math.max(0, Math.min(1, wert)))]]
      .forEach(function (s, i) {
        var c = document.createElementNS(ns, "circle");
        c.setAttribute("cx", groesse / 2); c.setAttribute("cy", groesse / 2);
        c.setAttribute("r", r); c.setAttribute("fill", "none");
        c.setAttribute("stroke", s[0]); c.setAttribute("stroke-width", 5);
        c.setAttribute("stroke-linecap", "round");
        if (i) { c.setAttribute("stroke-dasharray", s[1]); c.setAttribute("stroke-dashoffset", s[2]); }
        svg.appendChild(c);
      });
    return el("div.ring", [svg, el("span.ringwert", { text: zahl == null ? "" : String(zahl) })]);
  }

  function balken(anteil, klasse) {
    return el("div.balken" + (klasse ? "." + klasse : ""), [
      el("i", { style: "width:" + Math.round(Math.max(0, Math.min(1, anteil)) * 100) + "%" })
    ]);
  }

  function knopf(text, opt) {
    opt = opt || {};
    return el("button.knopf" + (opt.klasse ? "." + opt.klasse : ""),
      { type: "button", onclick: opt.onclick }, text);
  }

  /* ---------- Kopfzeile ---------- */
  function kopf(titel, links, rechts) {
    return el("div.kopf", [
      el("h1", { text: titel }),
      el("div.kopfzeile", [
        el("span", { text: links || "" }),
        el("span.hij", { text: rechts || "" })
      ])
    ]);
  }

  /* ---------- Meldung ---------- */
  var meldungTimer = null;
  function meldung(text) {
    var alt = document.querySelector(".meldung");
    if (alt) alt.remove();
    var m = el("div.meldung", { text: text });
    document.body.appendChild(m);
    requestAnimationFrame(function () { m.classList.add("an"); });
    clearTimeout(meldungTimer);
    meldungTimer = setTimeout(function () {
      m.classList.remove("an");
      setTimeout(function () { m.remove(); }, 300);
    }, 2200);
  }

  /* ---------- Formate ---------- */
  var WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  var MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni",
                "Juli", "August", "September", "Oktober", "November", "Dezember"];

  function datumLang(d) {
    return WOCHENTAGE[d.getDay()] + ", " + d.getDate() + ". " + MONATE[d.getMonth()];
  }
  function zahl(n, stellen) {
    return Number(n).toLocaleString("de-DE", {
      minimumFractionDigits: stellen || 0, maximumFractionDigits: stellen || 0
    });
  }

  return {
    el: el, leeren: leeren, karte: karte, gruppe: gruppe, zeile: zeile,
    ring: ring, balken: balken, knopf: knopf, kopf: kopf, meldung: meldung,
    datumLang: datumLang, zahl: zahl, WOCHENTAGE: WOCHENTAGE, MONATE: MONATE
  };
})();
