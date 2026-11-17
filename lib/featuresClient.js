// This function is sent to the browser as /azora-features.js with the current
// switches baked in (see api/features-script.js). It runs on EVERY page of the
// site, so it must be small, fast and self-contained (no outside variables).
//
// For each feature in "dev" mode:
//   admins + developers  -> see it as normal, with a DEV badge / banner
//   everyone else        -> "Under construction. Back soon."
//
// Other scripts can use window.AzoraFeatures:
//   AzoraFeatures.mode("businesses")        -> "live" | "dev"
//   await AzoraFeatures.ready               -> { staff, previewing }
//   AzoraFeatures.blocked("businesses")     -> true if this visitor should see "under construction"
//   AzoraFeatures.placeholder("businesses") -> an "Under construction" element
//   AzoraFeatures.badge("businesses")       -> a small DEV badge element

module.exports = function client(D) {
  "use strict";
  if (window.AzoraFeatures) return;
  var doc = document, html = doc.documentElement;
  var byKey = {};
  D.features.forEach(function (f) { byKey[f.key] = f; });
  var dev = D.features.filter(function (f) { return f.mode === "dev"; });
  var PREVIEW_KEY = "azora_preview_member";
  var previewing = false;
  try { previewing = localStorage.getItem(PREVIEW_KEY) === "1"; } catch (e) {}

  function norm(p) {
    p = String(p || "/").toLowerCase().split(/[?#]/)[0];
    if (p.length > 1) p = p.replace(/\/+$/, "");
    return p || "/";
  }
  function pathMatches(path, pattern) {
    pattern = norm(pattern);
    if (pattern.slice(-2) === "/*") return path === pattern.slice(0, -2) || path.indexOf(pattern.slice(0, -1)) === 0;
    return path === pattern;
  }
  var here = norm(location.pathname);
  var pageFeature = null;
  dev.forEach(function (f) {
    if (!pageFeature && (f.paths || []).some(function (p) { return pathMatches(here, p); })) pageFeature = f;
  });
  function selectorsOf(f) {
    return ['[data-azora-feature="' + f.key + '"]'].concat(f.selectors || []).filter(function (s) {
      try { doc.createDocumentFragment().querySelector(s); return true; } catch (e) { return false; }
    });
  }
  var gated = [];
  dev.forEach(function (f) { selectorsOf(f).forEach(function (s) { gated.push({ f: f, sel: s }); }); });

  /* ---- 1. hide anything in dev mode until we know who is looking ---- */
  var css = "";
  if (pageFeature) css += "html.azfx-pending body{visibility:hidden!important}";
  if (gated.length) css += gated.map(function (g) { return "html.azfx-pending " + g.sel; }).join(",") + "{visibility:hidden!important}";
  css += [
    ".azfx-card{box-sizing:border-box;margin:12px 0;padding:28px 24px;border-radius:18px;text-align:center;color:#eef0f6;font:15px/1.5 inherit;font-family:inherit;",
    "background:radial-gradient(500px 160px at 50% 0%,rgba(124,77,255,.22),transparent 70%),#0b0b12;border:1px solid rgba(139,108,255,.35)}",
    ".azfx-card .i{font-size:30px;line-height:1;margin-bottom:10px}",
    ".azfx-card .t{font-size:18px;font-weight:700;color:#fff;margin:0 0 4px}",
    ".azfx-card .m{color:#b9bdcc;margin:0;white-space:pre-line}",
    ".azfx-badge{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:7px;font:700 11px/1 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.06em;",
    "color:#1a1300;background:linear-gradient(135deg,#ffd36b,#ffb238);box-shadow:0 4px 14px -4px rgba(255,178,56,.6);white-space:nowrap;vertical-align:middle;text-transform:uppercase}",
    ".azfx-badge.inline{height:17px;padding:0 6px;font-size:9.5px;margin-left:6px;border-radius:5px}",
    ".azfx-mark{display:block;margin:0 0 6px}",
    ".azfx-staff{outline:2px dashed rgba(255,191,71,.65)!important;outline-offset:4px}",
    ".azfx-bar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483600;display:flex;align-items:center;gap:12px;max-width:calc(100vw - 24px);",
    "padding:10px 12px 10px 14px;border-radius:14px;background:#14110a;border:1px solid rgba(255,191,71,.45);color:#ffe7b0;font:13.5px/1.35 -apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 20px 50px -12px rgba(0,0,0,.8)}",
    ".azfx-bar b{color:#fff}.azfx-bar button,.azfx-bar a{all:unset;cursor:pointer;padding:7px 11px;border-radius:9px;background:rgba(255,255,255,.08);color:#fff;font-weight:600;font-size:12.5px;white-space:nowrap}",
    ".azfx-bar button:hover,.azfx-bar a:hover{background:rgba(255,255,255,.16)}",
    ".azfx-uc{position:fixed;inset:0;z-index:2147483500;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;color:#eef0f6;",
    "font-family:inherit;background:radial-gradient(900px 400px at 50% 20%,rgba(124,77,255,.25),transparent 60%),radial-gradient(700px 300px at 50% 100%,rgba(47,140,255,.18),transparent 60%),#000}",
    ".azfx-uc .w{max-width:520px}.azfx-uc .i{font-size:46px;margin-bottom:14px}",
    ".azfx-uc h1{margin:0 0 10px;font-size:clamp(28px,5vw,42px);line-height:1.1;font-weight:800;letter-spacing:-.02em;background:linear-gradient(135deg,#a58bff,#5b8cff 60%,#3fa4ff);-webkit-background-clip:text;background-clip:text;color:transparent}",
    ".azfx-uc p{margin:0 0 26px;color:#b9bdcc;font-size:16px;white-space:pre-line}",
    ".azfx-uc .n{color:#7d8396;font-size:13px;margin-bottom:8px;letter-spacing:.12em;text-transform:uppercase}",
    ".azfx-uc a{display:inline-block;padding:13px 22px;border-radius:12px;background:linear-gradient(135deg,#7c4dff,#3d7bff);color:#fff;text-decoration:none;font-weight:600}",
    "html.azfx-locked,html.azfx-locked body{overflow:hidden!important}",
  ].join("");
  var style = doc.createElement("style");
  style.id = "azfx-css";
  style.textContent = css;
  (doc.head || html).appendChild(style);
  if (pageFeature || gated.length) html.classList.add("azfx-pending");

  /* ---- 2. helpers other scripts can use ---- */
  function msg(f) { return (f && f.message) || D.defaultMessage; }
  // "Under construction. Back soon." -> ["Under construction.", "Back soon."]
  function split(text) {
    var i = String(text).indexOf(". ");
    return i > 0 ? [text.slice(0, i + 1), text.slice(i + 2)] : ["Under construction", text];
  }
  function placeholder(key) {
    var f = byKey[key] || { name: "", message: "" };
    var el = doc.createElement("div");
    el.className = "azfx-card";
    el.setAttribute("data-azfx", key);
    var parts = split(msg(f));
    el.innerHTML = '<div class="i">🚧</div><p class="t"></p><p class="m"></p>';
    el.querySelector(".t").textContent = parts[0];
    el.querySelector(".m").textContent = parts[1];
    return el;
  }
  function badge(key, inline) {
    var f = byKey[key] || { name: key };
    var b = doc.createElement("span");
    b.className = "azfx-badge" + (inline ? " inline" : "");
    b.textContent = inline ? "Dev" : "🚧 Dev mode · " + f.name;
    b.title = (f.name || key) + " is in dev mode. Only admins and developers can see it.";
    return b;
  }

  /* ---- 3. who is looking? (Memberstack) ---- */
  function waitFor(test, ms) {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function poll() {
        var v = test();
        if (v || Date.now() - t0 > ms) return resolve(v || null);
        setTimeout(poll, 60);
      })();
    });
  }
  var LIVE = /^(active|trialing|past_due)$/i;
  function hasPlan(m, id) {
    return !!(m && (m.planConnections || []).some(function (p) { return (p.planId === id || (p.plan && p.plan.id === id)) && LIVE.test(String(p.status || "active")); }));
  }
  var resolveReady;
  var state = { staff: false, previewing: false, done: false };
  var ready = new Promise(function (r) { resolveReady = r; });

  function blocked(key) {
    var f = byKey[key];
    return !!(f && f.mode === "dev" && (!state.staff || state.previewing));
  }

  window.AzoraFeatures = {
    list: D.features,
    mode: function (key) { return (byKey[key] && byKey[key].mode) || "live"; },
    ready: ready,
    blocked: blocked,
    placeholder: placeholder,
    badge: badge,
    get isStaff() { return state.staff; },
    previewAsMember: function (on) {
      try { on ? localStorage.setItem(PREVIEW_KEY, "1") : localStorage.removeItem(PREVIEW_KEY); } catch (e) {}
      location.reload();
    },
  };

  var anyDev = dev.length > 0;
  var who = anyDev
    ? waitFor(function () { return window.$memberstackDom; }, 5000).then(function (ms) {
        if (!ms) return null;
        return Promise.race([
          ms.getCurrentMember().then(function (r) { return (r && r.data) || null; }).catch(function () { return null; }),
          new Promise(function (r) { setTimeout(function () { r(null); }, 5000); }),
        ]);
      })
    : Promise.resolve(null);

  function domReady() {
    return new Promise(function (r) { doc.readyState === "loading" ? doc.addEventListener("DOMContentLoaded", function () { r(); }) : r(); });
  }

  Promise.all([who, domReady()]).then(function (res) {
    var m = res[0];
    state.staff = hasPlan(m, D.plans.admin) || hasPlan(m, D.plans.developer);
    state.isAdmin = hasPlan(m, D.plans.admin);
    state.previewing = state.staff && previewing;
    state.done = true;
    apply();
    html.classList.remove("azfx-pending");
    resolveReady({ staff: state.staff, previewing: state.previewing });
  });

  /* ---- 4. apply ---- */
  function apply() {
    var showAsStaff = state.staff && !state.previewing;
    if (pageFeature) {
      if (showAsStaff) bar([pageFeature.name + " is in ", "dev mode", ". Members see “Under construction”."]);
      else underConstruction(pageFeature);
    } else if (state.previewing && anyDev) {
      bar(["Previewing as a member — ", "dev-mode features are hidden", "."]);
    }
    if (!gated.length) return;
    function scan() {
      gated.forEach(function (g) {
        var els = doc.querySelectorAll(g.sel);
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          if (el.__azfx || el.closest(".azfx-card,.azfx-uc,.azfx-bar")) continue;
          el.__azfx = true;
          if (showAsStaff) {
            el.classList.add("azfx-staff");
            var mark = badge(g.f.key);
            var wrap = doc.createElement("div");
            wrap.className = "azfx-mark";
            wrap.appendChild(mark);
            el.parentNode && el.parentNode.insertBefore(wrap, el);
          } else {
            el.style.setProperty("display", "none", "important");
            el.parentNode && el.parentNode.insertBefore(placeholder(g.f.key), el);
          }
        }
      });
    }
    scan();
    // catch sections that other scripts add to the page later
    var queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      setTimeout(function () { queued = false; scan(); }, 50);
    }).observe(doc.body, { childList: true, subtree: true });
  }

  function underConstruction(f) {
    var uc = doc.createElement("div");
    uc.className = "azfx-uc";
    uc.setAttribute("role", "main");
    var parts = split(msg(f));
    uc.innerHTML = '<div class="w"><div class="i">🚧</div><div class="n"></div><h1></h1><p></p><a href="/">Back to Azora</a></div>';
    uc.querySelector(".n").textContent = f.name;
    uc.querySelector("h1").textContent = parts[0];
    uc.querySelector("p").textContent = parts[1];
    doc.body.appendChild(uc);
    html.classList.add("azfx-locked");
    doc.title = f.name + " · Under construction";
    if (state.previewing) bar(["", "Previewing as a member", "."]);
  }

  // parts = [before, bold, after] — set as text, never HTML
  function bar(parts) {
    if (doc.querySelector(".azfx-bar")) return;
    var b = doc.createElement("div");
    b.className = "azfx-bar";
    b.setAttribute("role", "status");
    b.innerHTML = '<span style="font-size:18px">🚧</span><span class="x"><span></span><b></b><span></span></span>';
    var x = b.querySelector(".x").children;
    x[0].textContent = parts[0]; x[1].textContent = parts[1]; x[2].textContent = parts[2];
    var prev = doc.createElement("button");
    prev.type = "button";
    prev.textContent = state.previewing ? "Exit preview" : "Preview as member";
    prev.onclick = function () { window.AzoraFeatures.previewAsMember(!state.previewing); };
    b.appendChild(prev);
    if (state.isAdmin) {
      var a = doc.createElement("a");
      a.href = D.adminPage;
      a.textContent = "Manage";
      b.appendChild(a);
    }
    doc.body.appendChild(b);
  }
};
