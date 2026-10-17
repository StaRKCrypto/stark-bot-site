// StaRK Bots site. No trackers, no external requests.
(function () {
  "use strict";
  var EMPTY = "\u2014";
  var root = document.documentElement;
  root.classList.remove("no-js");
  var base = (document.currentScript && document.currentScript.src) ? new URL("../", document.currentScript.src).href : "../";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var DESKS = [
    { slug: "arcus", name: "Arcus", role: "Perp volume farm" },
    { slug: "nado", name: "Nado", role: "Perp volume farm" },
    { slug: "lighter-rh", name: "Lighter RH", role: "Order-book desk" },
    { slug: "profit-taking", name: "Profit Taking", role: "Multi-chain 2\u00d7 take-profit" },
    { slug: "youtube", name: "Youtube", role: "Media bot" },
    { slug: "mochee-yochee", name: "Mochee and Yochee", role: "Media bots" }
  ];

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function num(v) { return typeof v === "number" && isFinite(v) ? v : null; }
  var nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  function fmtUsd(v) { v = num(v); return v === null ? null : "$" + nf.format(Math.round(v)); }
  function fmtInt(v) { v = num(v); return v === null ? null : nf.format(v); }
  function fmtPct(v) { v = num(v); return v === null ? null : v.toFixed(1) + "%"; }
  function fmtStatus(v) { return v === "live" || v === "paused" ? v : null; }

  // ---------- menu ----------
  var menu = $("#menu-btn"), nav = $("#nav");
  if (menu && nav) {
    var setMenu = function (o) { nav.classList.toggle("open", o); menu.setAttribute("aria-expanded", o ? "true" : "false"); menu.textContent = o ? "Close" : "Menu"; };
    menu.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  // ---------- reveal ----------
  var rv = $$(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (n) { io.observe(n); });
  } else { rv.forEach(function (n) { n.classList.add("in"); }); }

  // ---------- lazy media ----------
  var conn = navigator.connection || {};
  var lowData = conn.saveData || /2g/.test(conn.effectiveType || "");
  $$("video[data-lazy]").forEach(function (v) {
    if (reduce || lowData) return;
    var go = function () { var s = v.querySelector("source[data-src]"); if (s) { s.src = s.getAttribute("data-src"); s.removeAttribute("data-src"); v.load(); } var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    if ("IntersectionObserver" in window) {
      var vo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { go(); vo.disconnect(); } }); }, { rootMargin: "200px" });
      vo.observe(v);
    }
  });

  // ---------- pointer glow ----------
  $$(".card").forEach(function (c) {
    c.addEventListener("pointermove", function (e) { var r = c.getBoundingClientRect(); c.style.setProperty("--mx", (e.clientX - r.left) + "px"); });
  });

  // ---------- contract address ----------
  var PLACEHOLDER = "Coming at launch";
  function getCA() {
    var c = window.STARKBOT_CONFIG, v = c && typeof c.contractAddress === "string" ? c.contractAddress.trim() : "";
    return !v || v.toLowerCase() === PLACEHOLDER.toLowerCase() ? "" : v;
  }
  var ca = getCA();
  $$("[data-ca]").forEach(function (n) { n.textContent = ca || PLACEHOLDER; n.classList.toggle("empty", !ca); });
  var copyBtn = $("[data-copy]"), help = $("#copy-help");
  if (copyBtn) {
    copyBtn.disabled = !ca;
    if (help) help.textContent = ca ? "Copy the published contract address." : "Copy turns on when the contract is published here.";
    copyBtn.addEventListener("click", function () {
      if (!ca) return;
      var done = function () { copyBtn.textContent = "Copied"; setTimeout(function () { copyBtn.textContent = "Copy CA"; }, 1800); };
      if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(ca).then(done, function () {}); return; }
      var t = document.createElement("textarea"); t.value = ca; t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); done(); } catch (e) {} document.body.removeChild(t);
    });
  }

  // ---------- stats ----------
  function statList(d, withStatus) {
    var dl = el("dl", "stat-list");
    var rows = [
      ["Volume", fmtUsd(d.volume_usd)],
      ["Fills", fmtInt(d.fills)],
      ["Maker %", fmtPct(d.maker_pct)],
      ["Points", fmtInt(d.points), num(d.points) !== null && d.points_label ? String(d.points_label) : null]
    ];
    rows.forEach(function (r) {
      var w = el("div"); w.appendChild(el("dt", null, r[0]));
      var dd = el("dd", r[1] === null ? "dash" : "", r[1] === null ? EMPTY : r[1]);
      if (r[2]) dd.appendChild(el("span", "sub", r[2]));
      w.appendChild(dd); dl.appendChild(w);
    });
    return dl;
  }
  function badge(d) { var s = fmtStatus(d.status); var b = el("span", "badge", s || "status " + EMPTY); if (s) b.setAttribute("data-status", s); return b; }
  function stamp(v) { if (typeof v !== "string" || !v) return null; var t = new Date(v); return isNaN(t) ? null : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(t); }

  function render(data) {
    data = data && typeof data === "object" ? data : {};
    var list = Array.isArray(data.desks) ? data.desks : [];
    var by = {};
    list.forEach(function (d) { if (d && d.slug) by[d.slug] = d; });
    var get = function (slug) { return by[slug] || {}; };

    var board = $("#desk-board");
    if (board) {
      board.textContent = "";
      DESKS.forEach(function (m) {
        var d = get(m.slug), c = el("article", "card glass");
        var h = el("div", "card-head"); var t = el("div"); t.appendChild(el("h3", null, m.name)); t.appendChild(el("div", "note", m.role));
        h.appendChild(t); h.appendChild(badge(d)); c.appendChild(h); c.appendChild(statList(d));
        var s = stamp(d.updated_at); c.appendChild(el("p", "meta", s ? "As of " + s : "No data yet"));
        board.appendChild(c);
      });
    }
    $$("[data-bot-stats]").forEach(function (n) {
      var d = get(n.getAttribute("data-bot-stats")); n.textContent = "";
      var wrap = el("div"); wrap.appendChild(el("h4", null, "Stats")); n.appendChild(wrap);
      var top = el("div", "card-head"); top.style.margin = "12px 0"; top.appendChild(badge(d)); n.appendChild(top);
      n.appendChild(statList(d));
      if (n.hasAttribute("data-nostats")) n.appendChild(el("p", "meta", "This bot does not publish desk stats."));
    });

    var comb = $("#combined");
    if (comb) {
      var c = data.combined || {}; comb.textContent = "";
      [["Combined volume", fmtUsd(c.volume_usd)], ["Combined fills", fmtInt(c.fills)], ["Combined points", fmtInt(c.points)]].forEach(function (r) {
        var w = el("div"); w.appendChild(el("small", null, r[0])); w.appendChild(el("strong", r[1] === null ? "dash" : "", r[1] === null ? EMPTY : r[1])); comb.appendChild(w);
      });
      if (num(c.points) !== null && c.points_label) comb.appendChild(el("p", "meta", "Points are " + c.points_label + "."));
    }
    var hv = $("#hero-vol"), hf = $("#hero-fills"), cc = data.combined || {};
    if (hv) { var v = num(cc.volume_usd); hv.textContent = v === null ? EMPTY : "$" + (v / 1e6).toFixed(2) + "M"; }
    if (hf) hf.textContent = fmtInt(cc.fills) || EMPTY;
    var per = $("#period"), p = data.period;
    if (per) per.textContent = p && p.start && p.end ? (p.label || "Period") + ": " + p.start + " to " + p.end : "Period: " + EMPTY;
  }

  var needs = $("#desk-board") || $$("[data-bot-stats]").length;
  if (needs) {
    render({});
    fetch(base + "data/stats.json", { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(render).catch(function () { var n = $("#load-note"); if (n) n.textContent = "Stats are not available right now. Showing dashes."; });
  }

  // ---------- background music ----------
  var KEY = "stark-sound", TARGET = 0.14, FADE_MS = 3000;
  var btn = $("#sound-btn"), label = $("#sound-label");
  if (btn) {
    var audio = null, started = false, wantOn = true, raf = 0;
    try { wantOn = localStorage.getItem(KEY) !== "off"; } catch (e) {}
    var paint = function () {
      var on = wantOn;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute("aria-label", on ? "Mute background music" : "Unmute background music");
      if (label) label.textContent = on ? "Sound on" : "Sound off";
    };
    var save = function () { try { localStorage.setItem(KEY, wantOn ? "on" : "off"); } catch (e) {} };
    var fade = function (to, ms, done) {
      cancelAnimationFrame(raf);
      var from = audio.volume, t0 = performance.now();
      (function step(now) {
        var k = Math.min(1, (now - t0) / ms), e = k * k * (3 - 2 * k);
        audio.volume = Math.max(0, Math.min(1, from + (to - from) * e));
        if (k < 1) raf = requestAnimationFrame(step); else if (done) done();
      })(t0);
    };
    var play = function () {
      if (!audio) { audio = new Audio(base + "brand/glass.mp3"); audio.loop = true; audio.preload = "auto"; audio.volume = 0; }
      var p = audio.play();
      var ok = function () { started = true; fade(TARGET, reduce ? 300 : FADE_MS); };
      if (p && p.then) p.then(ok, function () { started = false; }); else ok();
    };
    var stop = function () { if (audio && !audio.paused) fade(0, 600, function () { audio.pause(); }); };
    paint();
    var first = function (e) {
      if (btn.contains(e.target)) return; // the toggle handles itself
      cleanup(); if (wantOn && !started) play();
    };
    var evs = ["pointerdown", "keydown", "touchstart"];
    var cleanup = function () { evs.forEach(function (n) { window.removeEventListener(n, first, true); }); };
    evs.forEach(function (n) { window.addEventListener(n, first, true); });
    btn.addEventListener("click", function () {
      cleanup(); wantOn = !wantOn; save(); paint();
      if (wantOn) play(); else stop();
    });
    document.addEventListener("visibilitychange", function () {
      if (!audio) return;
      if (document.hidden) audio.pause(); else if (wantOn && started) { audio.play().catch(function () {}); }
    });
  }
})();
