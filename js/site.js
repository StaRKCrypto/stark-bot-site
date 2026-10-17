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
  $$(".rv").forEach(function (n) {
    var sib = $$(":scope > .rv", n.parentNode), i = sib.indexOf(n);
    if (i > 0 && sib.length > 1) n.style.setProperty("--d", Math.min(i, 6) * 70 + "ms");
  });
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
  function fmtKind(k, v) { return k === "usd" ? fmtUsd(v) : k === "usdM" ? "$" + (v / 1e6).toFixed(2) + "M" : k === "pct" ? fmtPct(v) : fmtInt(v); }
  function numNode(tag, cls, kind, v) {
    var n = el(tag, cls, fmtKind(kind, v)); n.setAttribute("data-count", String(v)); n.setAttribute("data-kind", kind); return n;
  }
  function statList(d, withStatus) {
    var dl = el("dl", "stat-list");
    var rows = [
      ["Volume", "usd", d.volume_usd],
      ["Fills", "int", d.fills],
      ["Maker %", "pct", d.maker_pct],
      ["Points", "int", d.points, num(d.points) !== null && d.points_label ? String(d.points_label) : null]
    ];
    rows.forEach(function (r) {
      var w = el("div"); w.appendChild(el("dt", null, r[0]));
      var dd = el("dd", num(r[2]) === null ? "dash" : "");
      if (num(r[2]) === null) dd.textContent = EMPTY; else dd.appendChild(numNode("span", "n", r[1], r[2]));
      if (r[3]) dd.appendChild(el("span", "sub", r[3]));
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
      [["Combined volume", "usd", c.volume_usd], ["Combined fills", "int", c.fills], ["Combined points", "int", c.points]].forEach(function (r) {
        var w = el("div"); w.appendChild(el("small", null, r[0]));
        w.appendChild(num(r[2]) === null ? el("strong", "dash", EMPTY) : numNode("strong", "", r[1], r[2])); comb.appendChild(w);
      });
      if (num(c.points) !== null && c.points_label) comb.appendChild(el("p", "meta", "Points are " + c.points_label + "."));
    }
    var cc = data.combined || {};
    $$("[data-stat]").forEach(function (n) {
      var k = n.getAttribute("data-stat"), map = { vol: ["usdM", cc.volume_usd], fills: ["int", cc.fills], points: ["int", cc.points] }[k];
      if (!map || num(map[1]) === null) { n.textContent = EMPTY; n.removeAttribute("data-count"); return; }
      n.textContent = fmtKind(map[0], map[1]); n.setAttribute("data-count", String(map[1])); n.setAttribute("data-kind", map[0]);
    });
    var per = $("#period"), p = data.period;
    if (per) per.textContent = p && p.start && p.end ? (p.label || "Period") + ": " + p.start + " to " + p.end : "Period: " + EMPTY;
    if (window.__fx) window.__fx();
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

  // ---------- effects: header, progress, parallax, counters, tilt, magnetic, 3D hero ----------
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var header = $(".site-header"), bar = document.createElement("div");
  bar.className = "progress"; bar.setAttribute("aria-hidden", "true"); document.body.appendChild(bar);
  var pars = $$("[data-par]"), ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.pageYOffset || 0, max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    bar.style.transform = "scaleX(" + Math.min(1, y / max).toFixed(4) + ")";
    if (header) header.classList.toggle("scrolled", y > 8);
    if (!reduce && y < window.innerHeight * 3) pars.forEach(function (n) {
      var r = n.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      var mid = r.top + r.height / 2 - window.innerHeight / 2;
      n.style.setProperty("--py", (mid * parseFloat(n.getAttribute("data-par"))).toFixed(1) + "px");
    });
    if (!reduce) pars.forEach(function () {});
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll); onScroll();

  // active nav link
  var navLinks = $$(".nav a[href^='#']");
  if (navLinks.length && "IntersectionObserver" in window) {
    var secs = navLinks.map(function (a) { return $(a.getAttribute("href")); }).filter(Boolean);
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); }); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secs.forEach(function (n) { so.observe(n); });
  }

  // animated counters
  var cio = ("IntersectionObserver" in window && !reduce) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { cio.unobserve(e.target); countUp(e.target); } });
  }, { threshold: 0.3 }) : null;
  function countUp(n) {
    var v = parseFloat(n.getAttribute("data-count")), k = n.getAttribute("data-kind"), t0 = performance.now(), D = 1400;
    if (!isFinite(v)) return;
    (function step(now) {
      var p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 4);
      n.textContent = fmtKind(k, k === "pct" ? v * e : Math.round(v * e)); if (p < 1) requestAnimationFrame(step); else n.textContent = fmtKind(k, v);
    })(t0);
  }
  // tilt cards
  function tilt(n) {
    if (n.__tilt) return; n.__tilt = 1;
    var max = parseFloat(n.getAttribute("data-tilt")) || 5, sh = el("span", "sheen"); sh.setAttribute("aria-hidden", "true"); n.appendChild(sh);
    n.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = n.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      n.style.setProperty("--ry", ((px - 0.5) * 2 * max).toFixed(2) + "deg"); n.style.setProperty("--rx", ((0.5 - py) * 2 * max).toFixed(2) + "deg");
      n.style.setProperty("--mx", (px * 100).toFixed(1) + "%"); n.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      n.classList.add("tilting"); n.classList.remove("tilt-rest");
    });
    n.addEventListener("pointerleave", function () { n.classList.remove("tilting"); n.classList.add("tilt-rest"); n.style.setProperty("--rx", "0deg"); n.style.setProperty("--ry", "0deg"); });
  }
  function fx() {
    if (cio) $$("[data-count]").forEach(function (n) { if (!n.__c) { n.__c = 1; cio.observe(n); } });
    if (fine && !reduce) $$(".card,.proof,.launch-card,.road li,.bot,.facts li,[data-tilt]").forEach(function (n) { if (!n.hasAttribute("data-tilt")) n.setAttribute("data-tilt", n.matches(".bot,.launch-card") ? "1.6" : "4"); tilt(n); });
  }
  window.__fx = fx; fx();
  // magnetic buttons
  if (fine && !reduce) $$(".btn.primary,.btn:not([disabled])").forEach(function (b) {
    b.addEventListener("pointermove", function (e) { var r = b.getBoundingClientRect(); b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.14).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * 0.22 - 2).toFixed(1) + "px)"; });
    b.addEventListener("pointerleave", function () { b.style.transform = ""; });
  });

  // 3D hero coin (Three.js, self-hosted). Falls back to the static HD image.
  var box = $("#coin-box");
  function hasGL() { try { var c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); } catch (e) { return false; } }
  if (box && !reduce && !lowData && hasGL()) {
    var load = function () {
      var sc = document.createElement("script"); sc.src = base + "js/vendor/starkcoin.js";
      sc.onload = function () {
        var go = function () { try { window.StarkCoin.init(box); box.classList.add("gl"); } catch (e) { box.classList.remove("gl"); } };
        if (document.fonts && document.fonts.load) document.fonts.load("700 64px 'IBM Plex Sans'").then(go, go); else go();
      };
      document.head.appendChild(sc);
    };
    if ("requestIdleCallback" in window) requestIdleCallback(load, { timeout: 1500 }); else setTimeout(load, 300);
  }
})();
