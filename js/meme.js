// StaRK Bots meme-v4. No trackers, no external requests.
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.remove("no-js"); root.classList.add("js");
  var base = (document.currentScript && document.currentScript.src) ? new URL("../", document.currentScript.src).href : "../";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function num(v) { return typeof v === "number" && isFinite(v) ? v : null; }
  var nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  var pf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

  // menu
  var menu = $("#menu-btn"), nav = $("#nav");
  if (menu && nav) {
    var setMenu = function (o) { nav.classList.toggle("open", o); menu.setAttribute("aria-expanded", o ? "true" : "false"); menu.textContent = o ? "close" : "menu"; };
    menu.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  // lazy video
  var conn = navigator.connection || {};
  var lowData = conn.saveData || /2g/.test(conn.effectiveType || "");
  $$("video[data-lazy]").forEach(function (v) {
    if (reduce || lowData || !("IntersectionObserver" in window)) return;
    var vo = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; vo.disconnect();
      var s = v.querySelector("source[data-src]"); if (s) { s.src = s.getAttribute("data-src"); s.removeAttribute("data-src"); v.load(); }
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }); }, { rootMargin: "200px" });
    vo.observe(v);
  });

  // contract address
  var PLACEHOLDER = "Coming at launch";
  var c = window.STARKBOT_CONFIG, ca = c && typeof c.contractAddress === "string" ? c.contractAddress.trim() : "";
  if (ca.toLowerCase() === PLACEHOLDER.toLowerCase()) ca = "";
  $$("[data-ca]").forEach(function (n) { n.textContent = ca || PLACEHOLDER; n.classList.toggle("empty", !ca); });
  var copyBtn = $("[data-copy]"), help = $("#copy-help");
  if (copyBtn) {
    copyBtn.disabled = !ca;
    if (help) help.textContent = ca ? "copy the published contract address." : "copy turns on when the contract is published here.";
    copyBtn.addEventListener("click", function () {
      if (!ca) return;
      var done = function () { copyBtn.textContent = "copied"; setTimeout(function () { copyBtn.textContent = "copy ca"; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ca).then(done, function () {});
    });
  }

  // stats.json overrides the baked-in seed numbers
  function setText(sel, txt) { $$(sel).forEach(function (n) { n.textContent = txt; }); }
  function render(d) {
    if (!d || typeof d !== "object") return;
    var cb = d.combined || {};
    if (num(cb.volume_usd) !== null) setText('[data-stat="vol"]', "$" + nf.format(Math.round(cb.volume_usd)));
    if (num(cb.fills) !== null) setText('[data-stat="fills"]', nf.format(cb.fills));
    if (num(cb.points) !== null) setText('[data-stat="points"]', pf.format(cb.points));
    (d.desks || []).forEach(function (k) {
      ["volume_usd", "fills", "maker_pct", "points"].forEach(function (f) {
        var v = num(k[f]); if (v === null) return;
        var t = f === "volume_usd" ? "$" + nf.format(Math.round(v)) : f === "maker_pct" ? v.toFixed(1) + "%" : f === "points" ? pf.format(v) : nf.format(v);
        setText('[data-d="' + k.slug + "." + f + '"]', t);
      });
    });
    var p = d.period, per = $("#period");
    if (per && p && p.start && p.end) per.textContent = "period: " + p.start + " to " + p.end + " · points are owner-stated · unknown numbers say \"tracking soon\", we don't make stuff up";
  }
  if ($("#receipts")) {
    fetch(base + "data/stats.json", { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(render)
      .catch(function () { var n = $("#load-note"); if (n) n.textContent = "stats file unavailable, showing the baked-in 45-day numbers (updated oct 21, 2026)."; });
  }

  // terminal typing
  var lines = $$("#term .ln");
  if (lines.length) {
    if (reduce) lines.forEach(function (l) { l.classList.add("show"); });
    else lines.forEach(function (l, i) { setTimeout(function () { l.classList.add("show"); }, 500 + i * 650); });
  }

  // glitch headline on hover/periodically
  var gl = $$("[data-glitch]");
  function glitch() { if (reduce || !gl.length) return; var n = gl[Math.floor(Math.random() * gl.length)]; n.classList.remove("glitch"); void n.offsetWidth; n.classList.add("glitch"); }
  gl.forEach(function (n) { n.addEventListener("pointerenter", glitch); });
  if (!reduce) setInterval(glitch, 5000);

  // music
  var KEY = "stark-sound", TARGET = 0.14, FADE_MS = 3000;
  var btn = $("#sound-btn"), label = $("#sound-label");
  if (btn) {
    var audio = null, started = false, wantOn = true, raf = 0;
    try { wantOn = localStorage.getItem(KEY) !== "off"; } catch (e) {}
    var paint = function () {
      btn.setAttribute("aria-pressed", wantOn ? "true" : "false");
      btn.setAttribute("aria-label", wantOn ? "Mute background music" : "Unmute background music");
      if (label) label.textContent = wantOn ? "sound on" : "sound off";
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
    var evs = ["pointerdown", "keydown", "touchstart"];
    var cleanup = function () { evs.forEach(function (n) { window.removeEventListener(n, first, true); }); };
    var first = function (e) { if (btn.contains(e.target)) return; cleanup(); if (wantOn && !started) play(); };
    evs.forEach(function (n) { window.addEventListener(n, first, true); });
    btn.addEventListener("click", function () { cleanup(); wantOn = !wantOn; save(); paint(); if (wantOn) play(); else stop(); });
    document.addEventListener("visibilitychange", function () {
      if (!audio) return;
      if (document.hidden) audio.pause(); else if (wantOn && started) audio.play().catch(function () {});
    });
  }

  // ---- chaos: cursor trail, popups, konami, logo egg ----
  var NS = "http://www.w3.org/2000/svg";
  function icon(id) { var s = document.createElementNS(NS, "svg"), u = document.createElementNS(NS, "use"); u.setAttribute("href", base + "img/doodles.svg#" + id); s.appendChild(u); return s; }
  function toast(t) {
    var n = document.createElement("div"); n.className = "toast"; n.setAttribute("role", "status"); n.textContent = t; document.body.appendChild(n);
    setTimeout(function () { n.remove(); }, 3200);
  }
  if (fine && !reduce) {
    var last = 0, cols = ["#39ff14", "#ff2bd6", "#ffe600", "#00e5ff"];
    window.addEventListener("pointermove", function (e) {
      var now = performance.now(); if (now - last < 40) return; last = now;
      var d = document.createElement("div"); d.className = "trail";
      d.style.left = e.clientX + (Math.random() * 10 - 5) + "px"; d.style.top = e.clientY + (Math.random() * 10 - 5) + "px";
      d.style.background = cols[Math.floor(Math.random() * cols.length)]; d.style.border = "2px solid #000";
      document.body.appendChild(d); setTimeout(function () { d.remove(); }, 720);
    }, { passive: true });
  }
  var POPS = [
    ["botchan", "ur not early. ur not late. ur just here"],
    ["ngmi", "ngmi if you ape without reading the risk notice"],
    ["wagmi", "wagmi (not financial advice)"],
    ["chud", "this popup is not an ad. we have no ads"],
    ["botchan", "the bots do not sleep. the owner does"],
    ["wagmi", "$STARKBOT: not issued. touch grass"]
  ];
  var popCount = 0;
  function popup() {
    if (reduce || document.hidden || popCount >= 4 || $(".pop")) return;
    var p = POPS[Math.floor(Math.random() * POPS.length)];
    var w = document.createElement("div"); w.className = "win pop"; w.setAttribute("role", "dialog"); w.setAttribute("aria-label", "meme popup");
    var tb = document.createElement("div"); tb.className = "tb"; var sp = document.createElement("span"); sp.textContent = "totally_not_an_ad.exe";
    var x = document.createElement("button"); x.type = "button"; x.textContent = "x"; x.setAttribute("aria-label", "close popup"); x.addEventListener("click", function () { w.remove(); });
    tb.appendChild(sp); tb.appendChild(x);
    var b = document.createElement("div"); b.className = "wb"; b.appendChild(icon(p[0])); b.appendChild(document.createTextNode(p[1]));
    w.appendChild(tb); w.appendChild(b);
    var vw = window.innerWidth, vh = window.innerHeight, ww = Math.min(280, vw - 24);
    w.style.left = Math.max(8, Math.random() * (vw - ww - 16)) + "px";
    if (vw < 700) { w.style.left = "12px"; w.style.bottom = "12px"; } else w.style.top = (80 + Math.random() * Math.max(10, vh - 320)) + "px";
    document.body.appendChild(w); popCount++;
    setTimeout(function () { w.remove(); }, 9000);
  }
  if (!reduce) { setTimeout(popup, 14000); setInterval(function () { if (Math.random() < 0.6) popup(); }, 32000); }

  var EMO = ["🪙", "🤖", "📈", "💎", "🐸", "🚀", "🥃"];
  function rain() {
    if (reduce) return;
    for (var i = 0; i < 40; i++) (function (i) { setTimeout(function () {
      var n = document.createElement("div"); n.className = "rain"; n.textContent = EMO[Math.floor(Math.random() * EMO.length)];
      n.style.left = Math.random() * 100 + "vw"; n.style.animationDuration = 2 + Math.random() * 2.5 + "s"; document.body.appendChild(n);
      setTimeout(function () { n.remove(); }, 4800);
    }, i * 90); })(i);
  }
  var K = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"], ki = 0;
  document.addEventListener("keydown", function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    ki = k === K[ki] ? ki + 1 : (k === K[0] ? 1 : 0);
    if (ki === K.length) {
      ki = 0; document.body.classList.toggle("degen");
      toast("degen mode " + (document.body.classList.contains("degen") ? "on. wagmi." : "off. ngmi.")); rain();
    }
  });
  var logo = $("#logo"), clicks = 0, ct = 0;
  if (logo) logo.addEventListener("click", function () {
    clicks++; clearTimeout(ct); ct = setTimeout(function () { clicks = 0; }, 1200);
    if (clicks === 5) { clicks = 0; toast("you found the secret. there is no secret. gm."); rain(); }
  });
  console.log("%cgm. no trackers here. not financial advice.", "color:#39ff14;background:#000;padding:4px");

  // 3D coin (self-hosted three.js), falls back to the still image
  var box = $("#coin-box");
  function hasGL() { try { var cv = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (cv.getContext("webgl2") || cv.getContext("webgl"))); } catch (e) { return false; } }
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
