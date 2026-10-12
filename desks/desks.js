// Fills the live desk tape from data/stats.json.
// Null and missing figures stay an em dash. This file never invents a number.
(function () {
  var EMPTY = "\u2014";
  var ROLES = {
    Arcus: "Perp volume farm",
    "Profit Taking": "Multi-chain 2\u00d7 take-profit",
    Youtube: "Media",
    Mochee: "Media",
    Yochee: "Media",
  };
  var METRICS = [
    ["volume_usd_7d", "Volume 7d", "usd"],
    ["volume_usd_total", "Volume total", "usd"],
    ["pnl_usd_7d", "PnL 7d", "pnl"],
    ["trades_7d", "Trades 7d", "count"],
  ];

  var menu = document.getElementById("menu-toggle");
  var nav = document.getElementById("site-nav");
  if (menu && nav) {
    var setMenu = function (open) {
      menu.setAttribute("aria-expanded", open ? "true" : "false");
      menu.textContent = open ? "Close" : "Menu";
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
    };
    menu.addEventListener("click", function () {
      setMenu(menu.getAttribute("aria-expanded") !== "true");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenu(false);
    });
  }

  var board = document.getElementById("desk-board");
  var updated = document.getElementById("updated-at");
  var soon = document.getElementById("updates-soon");
  var loadNote = document.getElementById("load-note");
  if (!board) return;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function isBlank(value) {
    return value === null || value === undefined || value === "";
  }

  function formatNumber(value, kind) {
    if (typeof value !== "number" || !isFinite(value)) return null;
    if (kind === "usd" || kind === "pnl") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 20 }).format(value);
  }

  function formatStamp(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    var trimmed = value.trim();
    var parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return { text: trimmed, iso: "" };
    return {
      text:
        new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        }).format(parsed) + " UTC",
      iso: parsed.toISOString(),
    };
  }

  function statusView(value) {
    if (value === "live") return { text: "Live", className: "live-status is-live" };
    if (value === "paused") return { text: "Paused", className: "live-status is-paused" };
    return { text: EMPTY, className: "live-status is-blank" };
  }

  function paintUpdated(value) {
    var stamp = formatStamp(value);
    if (!updated) return stamp;
    if (!stamp) {
      updated.textContent = EMPTY;
      updated.removeAttribute("datetime");
      return null;
    }
    updated.textContent = stamp.text;
    if (stamp.iso) updated.setAttribute("datetime", stamp.iso);
    else updated.removeAttribute("datetime");
    return stamp;
  }

  function metricNode(label, value, kind) {
    var wrap = el("div");
    wrap.appendChild(el("p", null, label));
    var text = formatNumber(value, kind);
    var valueNode = el("p", null, text == null ? EMPTY : text);
    if (kind === "pnl" && typeof value === "number" && isFinite(value)) {
      if (value > 0) valueNode.classList.add("up");
      else if (value < 0) valueNode.classList.add("down");
      else valueNode.classList.add("is-flat");
    }
    wrap.appendChild(valueNode);
    return wrap;
  }

  function render(data) {
    if (!data || typeof data !== "object" || !Array.isArray(data.desks)) {
      throw new Error("stats shape");
    }

    var fileStamp = formatStamp(data.updated_at);
    var anyNull = fileStamp == null;
    paintUpdated(data.updated_at);
    board.replaceChildren();

    data.desks.forEach(function (desk, index) {
      if (!desk || typeof desk !== "object") {
        anyNull = true;
        return;
      }

      var name = typeof desk.name === "string" && desk.name.trim() ? desk.name.trim() : EMPTY;
      var role = ROLES[name] || "";
      var card = el("article", "live-card");
      card.setAttribute("data-desk", name);

      var top = el("div", "live-card-top");
      top.appendChild(el("p", "idx", String(index + 1).padStart(2, "0")));
      var status = statusView(desk.status);
      if (status.text === EMPTY) anyNull = true;
      top.appendChild(el("p", status.className, status.text));
      card.appendChild(top);

      card.appendChild(el("h2", null, name));
      if (role) card.appendChild(el("p", "live-role", role));

      var metrics = el("div", "metric-grid");
      METRICS.forEach(function (spec) {
        var key = spec[0];
        if (isBlank(desk[key]) || typeof desk[key] !== "number" || !isFinite(desk[key])) {
          anyNull = true;
        }
        metrics.appendChild(metricNode(spec[1], desk[key], spec[2]));
      });
      card.appendChild(metrics);

      var stamp = formatStamp(desk.updated_at);
      if (!stamp) anyNull = true;
      var updatedLine = el("p", "desk-updated");
      updatedLine.appendChild(document.createTextNode("Updated "));
      var time = el("time", null, stamp ? stamp.text : EMPTY);
      if (stamp && stamp.iso) time.setAttribute("datetime", stamp.iso);
      updatedLine.appendChild(time);
      card.appendChild(updatedLine);

      board.appendChild(card);
    });

    if (!data.desks.length) {
      anyNull = true;
      board.appendChild(el("p", "section-lede", "No desks in the stats file."));
    }

    if (soon) soon.hidden = !anyNull;
    if (loadNote) loadNote.hidden = true;
  }

  var statsUrl = board.getAttribute("data-stats");
  if (!statsUrl) return;

  board.setAttribute("aria-busy", "true");
  fetch(statsUrl, { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("stats status");
      return response.json();
    })
    .then(render)
    .catch(function () {
      if (loadNote) loadNote.hidden = false;
      if (soon) soon.hidden = false;
    })
    .then(function () {
      board.removeAttribute("aria-busy");
    });
})();
