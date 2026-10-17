// StaRK hero object: a bevelled hex coin with an "S" plate, lit by a procedural
// studio environment. Bundled with three.js into js/vendor/starkcoin.js by tools/build-coin.sh.
// No network requests. Everything is generated in code.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Shape, ExtrudeGeometry, CircleGeometry,
  MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial, BoxGeometry, PlaneGeometry, BackSide,
  CanvasTexture, SRGBColorSpace, PMREMGenerator, NeutralToneMapping, DirectionalLight, AmbientLight, Color, MathUtils
} from "three";

function hexShape(r) {
  var s = new Shape();
  for (var i = 0; i < 6; i++) {
    var a = Math.PI / 2 + (i * Math.PI) / 3, x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

function plateTextures() {
  var N = 1024, c = document.createElement("canvas"); c.width = c.height = N;
  var g = c.getContext("2d");
  var gr = g.createLinearGradient(160, 80, 860, 960);
  gr.addColorStop(0, "#ff9a3c"); gr.addColorStop(0.5, "#c34fe0"); gr.addColorStop(1, "#6d4aff");
  g.fillStyle = gr; g.fillRect(0, 0, N, N);
  var sh = g.createRadialGradient(330, 260, 20, 330, 260, 620);
  sh.addColorStop(0, "rgba(255,255,255,.38)"); sh.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = sh; g.fillRect(0, 0, N, N);
  g.font = "700 640px 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif";
  g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.fillStyle = "rgba(20,10,60,.35)"; g.fillText("S", 512 + 10, 746 + 14);
  g.fillStyle = "#fff"; g.fillText("S", 512, 746);
  var map = new CanvasTexture(c); map.colorSpace = SRGBColorSpace; map.anisotropy = 8;
  // bump: S raised
  var b = document.createElement("canvas"); b.width = b.height = 512;
  var h = b.getContext("2d"); h.fillStyle = "#000"; h.fillRect(0, 0, 512, 512);
  h.filter = "blur(3px)"; h.font = "700 320px 'IBM Plex Sans', Arial, sans-serif"; h.textAlign = "center";
  h.fillStyle = "#fff"; h.fillText("S", 256, 373);
  var bump = new CanvasTexture(b);
  return { map: map, bump: bump };
}

function studio(renderer) {
  var s = new Scene();
  var room = new Mesh(new BoxGeometry(24, 24, 24), new MeshBasicMaterial({ color: 0x55617a, side: BackSide }));
  s.add(room);
  function panel(w, h, col, intensity, x, y, z) {
    var m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(col).multiplyScalar(intensity), side: 2 }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  }
  panel(12, 7, 0xffffff, 9, 0, 10, 4);        // top softbox
  panel(3, 14, 0xffffff, 7, -10, 1, 3);       // left strip
  panel(3, 12, 0xcfeaff, 4, 10, 1, 2);        // right cool strip
  panel(8, 3, 0xffd58a, 4, 2, -9, 5);         // warm kicker below
  panel(5, 5, 0xb9a4ff, 3, 6, 4, -9);         // violet rim
  panel(5, 5, 0x9cf3ff, 3, -7, 3, -9);        // cyan rim
  var pm = new PMREMGenerator(renderer);
  var rt = pm.fromScene(s, 0.03);
  pm.dispose();
  s.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return rt.texture;
}

export function initCoin(box, opts) {
  opts = opts || {};
  var canvas = document.createElement("canvas");
  var renderer = new WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: !!opts.capture });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = NeutralToneMapping; renderer.toneMappingExposure = 1.05;
  var scene = new Scene();
  scene.environment = studio(renderer);
  var cam = new PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(0, 0, 6.9);

  var body = new MeshPhysicalMaterial({ color: 0xf4f6fa, metalness: 1, roughness: 0.16, clearcoat: 0.6, clearcoatRoughness: 0.12, envMapIntensity: 1.15 });
  var tex = plateTextures();
  var face = new MeshPhysicalMaterial({ map: tex.map, bumpMap: tex.bump, bumpScale: 3, metalness: 0.1, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.5 });

  var coin = new Group();
  var geo = new ExtrudeGeometry(hexShape(1), { depth: 0.34, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 6, curveSegments: 1 });
  geo.center();
  var slab = new Mesh(geo, body); coin.add(slab);
  var z = 0.17 + 0.07 + 0.002;
  var pg = new CircleGeometry(0.82, 6, Math.PI / 2);
  var f = new Mesh(pg, face); f.position.z = z; coin.add(f);
  var b = new Mesh(pg, face); b.position.z = -z; b.rotation.y = Math.PI; coin.add(b);
  // inner rim ring
  var rim = new Mesh(new ExtrudeGeometry((function () { var s = hexShape(0.9); var h = new Shape(); var p = hexShape(0.86).getPoints(); h.setFromPoints(p); s.holes.push(h); return s; })(), { depth: 0.02, bevelEnabled: false }), new MeshStandardMaterial({ color: 0xf2c14e, metalness: 1, roughness: 0.18, envMapIntensity: 1.2 }));
  rim.position.z = z - 0.012; coin.add(rim);
  var rim2 = rim.clone(); rim2.position.z = -z - 0.008; coin.add(rim2);

  var root = new Group(); root.add(coin); scene.add(root);
  scene.add(new AmbientLight(0xffffff, 0.15));
  var key = new DirectionalLight(0xffffff, 1.2); key.position.set(3, 4, 6); scene.add(key);

  // satellites
  var sats = [];
  [[0x22d3ee, 0.2, 1.9, 0.6, 0.9], [0x8b5cf6, 0.26, 2.2, -0.5, 2.6], [0xf5b83d, 0.16, 1.7, 1.1, 4.4]].forEach(function (d) {
    var m = new Mesh(geo, new MeshPhysicalMaterial({ color: d[0], metalness: 0.4, roughness: 0.12, clearcoat: 1, envMapIntensity: 1.1 }));
    m.scale.setScalar(d[1]); m.userData = { r: d[2], y: d[3], p: d[4] }; scene.add(m); sats.push(m);
  });

  var w = 1, h = 1;
  function size() {
    var r = box.getBoundingClientRect(); w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
    renderer.setPixelRatio(opts.capture ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false); cam.aspect = w / h;
    cam.position.z = w / h < 0.9 ? 8.2 : 6.9; cam.updateProjectionMatrix();
  }
  canvas.className = "coin-canvas"; canvas.setAttribute("aria-hidden", "true");
  box.appendChild(canvas); size();

  var rotY = opts.capture ? -0.5 : 0.3, rotX = opts.capture ? 0.12 : 0, vy = 0, drag = false, lx = 0, ly = 0, tx = 0, ty = 0, t0 = performance.now(), idle = 0;
  if (opts.capture) {
    sats.forEach(function (m, i) { var u = m.userData; m.position.set(Math.cos(u.p) * u.r, u.y, Math.sin(u.p) * 0.6); m.rotation.set(0.5 + i, 0.8 * i, 0.3); });
    root.rotation.set(rotX, rotY, 0); renderer.render(scene, cam); return { canvas: canvas, renderer: renderer };
  }
  canvas.style.touchAction = "pan-y";
  canvas.addEventListener("pointerdown", function (e) { drag = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); box.classList.add("grab"); });
  canvas.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5); ty = ((e.clientY - r.top) / r.height - 0.5);
    if (drag) { vy += (e.clientX - lx) * 0.012; rotX = MathUtils.clamp(rotX + (e.clientY - ly) * 0.006, -0.7, 0.7); lx = e.clientX; ly = e.clientY; idle = 0; }
  });
  function up() { drag = false; box.classList.remove("grab"); }
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("pointerleave", function () { tx = 0; ty = 0; });

  var visible = true, raf = 0, last = performance.now();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000); last = now; var t = (now - t0) / 1000;
    idle += dt;
    rotY += (0.28 + vy) * dt; vy *= Math.pow(0.04, dt);
    if (!drag) rotX += (ty * 0.35 - rotX) * Math.min(1, dt * 2.5);
    root.rotation.y = rotY + tx * 0.35; root.rotation.x = rotX + Math.sin(t * 0.7) * 0.05;
    coin.position.y = Math.sin(t * 1.1) * 0.08;
    sats.forEach(function (m, i) {
      var u = m.userData, a = u.p + t * (0.28 + i * 0.07);
      m.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 0.9 + i) * 0.12, Math.sin(a) * u.r * 0.55);
      m.rotation.x += dt * (0.6 + i * 0.2); m.rotation.y += dt * 0.8;
    });
    renderer.render(scene, cam);
  }
  function start() { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(box);
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  if ("ResizeObserver" in window) new ResizeObserver(size).observe(box); else window.addEventListener("resize", size);
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); stop(); box.classList.remove("gl"); });
  start();
  return { canvas: canvas };
}
window.StarkCoin = { init: initCoin };
