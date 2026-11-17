/*!
 * Azora Admin panel — feature switches.
 *   <div data-azora-admin></div>
 *   <script src="https://YOUR-PROJECT.vercel.app/azora-admin.js" defer></script>
 *
 * Admins only (the API checks the admin plan on every change).
 * Flip any feature between Live and Dev mode. In dev mode, admins and
 * developers still see it (with a DEV badge); everyone else sees
 * "Under construction. Back soon."
 */
(function () {
  "use strict";
  if (window.AzoraAdmin) return;
  window.AzoraAdmin = true;

  var SCRIPT = document.currentScript;
  var API = ((SCRIPT && SCRIPT.getAttribute("data-api")) ||
    (SCRIPT && SCRIPT.src ? new URL(SCRIPT.src).origin : "")).replace(/\/$/, "");

  var CSS = `
.aza, .aza *, .aza-ov, .aza-ov *, .aza-toast { box-sizing:border-box; }
.aza, .aza-ov, .aza-toast { --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.14); --panel:#0b0b12; --panel2:#11111a; --panel3:#171724;
  --text:#f2f3f8; --silver:#c4c8d4; --dim:#8f95a8; --faint:#5d6375; --green:#38d39f; --amber:#ffbf47; --danger:#ff5d7a;
  --grad:linear-gradient(135deg,#7c4dff 0%,#5468ff 50%,#2f8cff 100%); }
.aza { color:var(--text); font-size:15px; line-height:1.55; width:100%; max-width:1000px; margin:0 auto; padding:8px 16px 80px; text-align:left; -webkit-font-smoothing:antialiased; }
:where(.aza, .aza-ov) :is(button, input, textarea) { font:inherit; color:inherit; }
:where(.aza, .aza-ov) button { cursor:pointer; border:0; background:none; padding:0; }
:where(.aza, .aza-ov) :is(h1,h2,h3,p) { margin:0; padding:0; }
.aza-head { border:1px solid var(--line); border-radius:22px; padding:28px; margin-bottom:20px; position:relative; overflow:hidden;
  background:radial-gradient(800px 240px at 0% 0%, rgba(124,77,255,.26), transparent 60%), radial-gradient(600px 220px at 100% 100%, rgba(47,140,255,.18), transparent 60%), #07070d; }
.aza-eyebrow { font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--silver); opacity:.8; margin-bottom:8px; }
.aza-head h1 { font-size:clamp(26px,3.6vw,36px); font-weight:800; letter-spacing:-.02em; line-height:1.1; }
.aza-head h1 span { background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.aza-head p { color:var(--silver); margin-top:10px; max-width:620px; }
.aza-sum { display:flex; gap:10px; margin-top:18px; flex-wrap:wrap; align-items:center; }
.aza-pill { display:inline-flex; align-items:center; gap:7px; height:32px; padding:0 12px; border-radius:20px; background:rgba(0,0,0,.4); border:1px solid var(--line2); font-size:13px; color:var(--silver); }
.aza-pill i { width:8px; height:8px; border-radius:50%; display:block; }
.aza-pill b { color:#fff; }
.aza-tools { display:flex; justify-content:space-between; align-items:center; gap:12px; margin:0 0 12px; flex-wrap:wrap; }
.aza-tools h2 { font-size:18px; font-weight:700; }
.aza-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; height:40px; padding:0 16px; border-radius:11px; font-weight:600; font-size:14px;
  background:var(--panel3); border:1px solid var(--line2) !important; color:var(--text); white-space:nowrap; transition:background .15s, filter .15s; text-decoration:none; }
.aza-btn:hover { background:#1f1f30; }
.aza-btn.primary { background:var(--grad); border-color:transparent !important; box-shadow:0 10px 30px -12px rgba(84,104,255,.8); }
.aza-btn.primary:hover { filter:brightness(1.1); }
.aza-btn.ghost { background:none; border-color:transparent !important; color:var(--silver); }
.aza-btn.danger { background:rgba(255,93,122,.12); border-color:rgba(255,93,122,.35) !important; color:#ff8fa3; }
.aza-btn.sm { height:32px; padding:0 11px; font-size:13px; border-radius:9px; }
.aza-btn[disabled] { opacity:.5; pointer-events:none; }
.aza-list { display:flex; flex-direction:column; gap:10px; }
.aza-feat { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:16px; align-items:center; padding:18px 20px; background:var(--panel); border:1px solid var(--line); border-radius:16px; transition:border-color .2s, box-shadow .2s; }
.aza-feat.dev { border-color:rgba(255,191,71,.4); box-shadow:0 0 0 1px rgba(255,191,71,.08), 0 18px 50px -30px rgba(255,191,71,.5); }
.aza-feat h3 { font-size:16px; font-weight:700; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.aza-key { font:12px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; color:var(--dim); background:rgba(255,255,255,.05); padding:2px 7px; border-radius:6px; font-weight:400; }
.aza-desc { color:var(--silver); font-size:14px; margin-top:3px; }
.aza-where { display:flex; gap:6px; flex-wrap:wrap; margin-top:10px; }
.aza-chip { display:inline-flex; align-items:center; gap:5px; height:24px; padding:0 9px; border-radius:7px; background:var(--panel3); border:1px solid var(--line); font:12px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; color:var(--silver); max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.aza-chip.pg::before { content:"📄"; font-size:11px; }
.aza-chip.el::before { content:"◻︎"; font-size:11px; opacity:.7; }
.aza-meta { color:var(--faint); font-size:12.5px; margin-top:8px; }
.aza-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; }
.aza-seg { display:inline-flex; padding:4px; border-radius:12px; background:#06060b; border:1px solid var(--line2); position:relative; }
.aza-seg button { position:relative; z-index:1; height:34px; min-width:96px; padding:0 14px; border-radius:9px; font-size:13.5px; font-weight:700; color:var(--dim); transition:color .2s; display:inline-flex; align-items:center; justify-content:center; gap:7px; }
.aza-seg button i { width:8px; height:8px; border-radius:50%; background:currentColor; display:block; opacity:.8; }
.aza-seg .knob { position:absolute; top:4px; bottom:4px; left:4px; width:calc(50% - 4px); border-radius:9px; transition:transform .22s cubic-bezier(.3,.7,.2,1), background .2s; }
.aza-seg.live .knob { background:rgba(56,211,159,.16); box-shadow:inset 0 0 0 1px rgba(56,211,159,.45); }
.aza-seg.dev .knob { transform:translateX(100%); background:rgba(255,191,71,.16); box-shadow:inset 0 0 0 1px rgba(255,191,71,.5); }
.aza-seg.live button.l { color:#6ff0c0; } .aza-seg.dev button.d { color:#ffd27a; }
.aza-seg.busy { opacity:.6; pointer-events:none; }
.aza-help { margin-top:24px; padding:18px 20px; border-radius:16px; border:1px dashed var(--line2); color:var(--silver); font-size:14px; }
.aza-help h3 { color:#fff; font-size:15px; margin-bottom:8px; }
.aza-help code { background:rgba(255,255,255,.08); padding:2px 6px; border-radius:5px; font-size:13px; color:#fff; }
.aza-help ol { margin:6px 0 0 18px; padding:0; } .aza-help li + li { margin-top:4px; }
.aza-empty { text-align:center; padding:60px 20px; border:1px dashed var(--line2); border-radius:16px; color:var(--dim); }
.aza-empty .big { font-size:36px; margin-bottom:8px; } .aza-empty h3 { color:#fff; font-size:18px; margin-bottom:6px; }
.aza-empty .aza-btn { margin-top:16px; }
.aza-skel { height:96px; border-radius:16px; border:1px solid var(--line); background:linear-gradient(90deg,var(--panel) 0%,#12121c 50%,var(--panel) 100%); background-size:200% 100%; animation:aza-sh 1.2s infinite; }
@keyframes aza-sh { to { background-position:-200% 0; } }
.aza-ov { position:fixed; inset:0; z-index:2147483000; background:rgba(0,0,0,.72); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); display:flex; align-items:flex-start; justify-content:center; padding:6vh 14px; overflow-y:auto; font-size:15px; line-height:1.55; color:var(--text); }
.aza-modal { width:100%; max-width:560px; background:#0a0a11; border:1px solid var(--line2); border-radius:20px; box-shadow:0 40px 120px -30px rgba(84,104,255,.45); text-align:left; }
.aza-mh { display:flex; justify-content:space-between; align-items:center; padding:18px 22px; border-bottom:1px solid var(--line); }
.aza-mh h3 { font-size:17px; font-weight:700; }
.aza-x { width:32px; height:32px; border-radius:8px; color:var(--dim); font-size:22px; line-height:1; }
.aza-x:hover { background:rgba(255,255,255,.07); color:#fff; }
.aza-mb { padding:20px 22px; display:flex; flex-direction:column; gap:16px; }
.aza-mf { padding:14px 22px; border-top:1px solid var(--line); display:flex; gap:10px; justify-content:flex-end; align-items:center; }
.aza-label { font-size:13px; font-weight:600; color:var(--silver); margin-bottom:7px; display:flex; justify-content:space-between; gap:10px; }
.aza-label span { color:var(--faint); font-weight:400; text-align:right; }
.aza-input, .aza-ta { width:100%; background:#06060b; border:1px solid var(--line2); border-radius:12px; padding:0 14px; outline:none; font-size:15px; transition:border-color .15s, box-shadow .15s; }
.aza-input { height:46px; }
.aza-ta { padding:11px 14px; min-height:84px; resize:vertical; line-height:1.55; }
.aza-ta.mono { font:13.5px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
.aza-input:focus, .aza-ta:focus { border-color:rgba(139,108,255,.7); box-shadow:0 0 0 4px rgba(124,77,255,.13); }
.aza-hint { color:var(--faint); font-size:12.5px; margin-top:6px; }
.aza-err { color:#ff9cae; font-size:13.5px; background:rgba(255,93,122,.08); border:1px solid rgba(255,93,122,.25); border-radius:10px; padding:10px 12px; }
.aza-err:empty { display:none; }
.aza-toast { position:fixed; left:50%; bottom:26px; transform:translateX(-50%); z-index:2147483200; background:#14141f; border:1px solid var(--line2); color:#fff; padding:11px 16px; border-radius:12px; font-size:14px; box-shadow:0 20px 50px -10px rgba(0,0,0,.8); max-width:calc(100vw - 32px); }
.aza-toast.err { border-color:rgba(255,93,122,.5); }
@media (max-width:640px) {
  .aza-head { padding:22px 18px; }
  .aza-feat { grid-template-columns:1fr; }
  .aza-right { align-items:stretch; }
  .aza-seg { display:flex; } .aza-seg button { flex:1; }
}
`;

  /* ------------------------------------------------------------- helpers */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "value") el.value = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function ago(iso) {
    if (!iso) return "";
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 45) return "just now";
    if (s < 3600) return Math.round(s / 60) + "m ago";
    if (s < 86400) return Math.round(s / 3600) + "h ago";
    if (s < 86400 * 30) return Math.round(s / 86400) + "d ago";
    return new Date(iso).toLocaleDateString();
  }
  var tt;
  function toast(msg, err) {
    var o = document.querySelector(".aza-toast"); if (o) o.remove();
    var t = h("div", { class: "aza-toast" + (err ? " err" : ""), text: msg, role: "status" });
    document.body.appendChild(t);
    clearTimeout(tt); tt = setTimeout(function () { t.remove(); }, 3500);
  }
  function memberstack() {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function poll() {
        if (window.$memberstackDom) return resolve(window.$memberstackDom);
        if (Date.now() - t0 > 6000) return resolve(null);
        setTimeout(poll, 100);
      })();
    });
  }
  async function api(path, opts) {
    opts = opts || {};
    var ms = await memberstack();
    var token = null;
    try { token = ms ? await ms.getMemberCookie() : null; } catch (e) {}
    var headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;
    var r = await fetch(API + path, { method: opts.method || "GET", headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined, cache: "no-store" });
    var data = {};
    try { data = await r.json(); } catch (e) {}
    if (!r.ok) { var err = new Error(data.error || "Something went wrong. Please try again."); err.status = r.status; throw err; }
    return data;
  }

  function modal(title, body, foot) {
    var prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    var ov = h("div", { class: "aza-ov" }, h("div", { class: "aza-modal", role: "dialog", "aria-modal": "true" }, [
      h("div", { class: "aza-mh" }, [h("h3", { text: title }), h("button", { class: "aza-x", type: "button", "aria-label": "Close", text: "×", onclick: function () { close(); } })]),
      h("div", { class: "aza-mb" }, body),
      h("div", { class: "aza-mf" }, foot),
    ]));
    function key(e) { if (e.key === "Escape") close(); }
    function close() { ov.remove(); document.removeEventListener("keydown", key); document.documentElement.style.overflow = prev; }
    ov.addEventListener("mousedown", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", key);
    document.body.appendChild(ov);
    return close;
  }

  /* --------------------------------------------------------------- state */
  var S = { features: [], settings: {} };
  var root, listEl, sumEl;

  function previewing() { try { return localStorage.getItem("azora_preview_member") === "1"; } catch (e) { return false; } }

  function drawSummary() {
    clear(sumEl);
    var live = S.features.filter(function (f) { return f.mode === "live"; }).length;
    var dev = S.features.length - live;
    sumEl.appendChild(h("span", { class: "aza-pill" }, [h("i", { style: "background:var(--green);box-shadow:0 0 8px var(--green)" }), h("b", { text: String(live) }), " live"]));
    sumEl.appendChild(h("span", { class: "aza-pill" }, [h("i", { style: "background:var(--amber);box-shadow:0 0 8px var(--amber)" }), h("b", { text: String(dev) }), " in dev mode"]));
    var p = previewing();
    sumEl.appendChild(h("button", { class: "aza-btn sm", type: "button", style: "margin-left:auto", title: "See the site the way a regular member does (on this browser only)",
      onclick: function () {
        try { p ? localStorage.removeItem("azora_preview_member") : localStorage.setItem("azora_preview_member", "1"); } catch (e) {}
        toast(p ? "Preview off — you'll see dev-mode features again." : "Preview on — browse the site to see what members see. Turn it off here or from the banner.");
        drawSummary();
      } }, p ? "👁️ Previewing as member — turn off" : "👁️ Preview site as a member"));
  }

  function featureCard(f) {
    var seg = h("div", { class: "aza-seg " + f.mode, role: "radiogroup", "aria-label": f.name + " mode" }, [
      h("span", { class: "knob" }),
      h("button", { class: "l", type: "button", role: "radio", "aria-checked": String(f.mode === "live"), onclick: function () { setMode(f, "live", seg); } }, [h("i"), "Live"]),
      h("button", { class: "d", type: "button", role: "radio", "aria-checked": String(f.mode === "dev"), onclick: function () { setMode(f, "dev", seg); } }, [h("i"), "Dev mode"]),
    ]);
    var where = h("div", { class: "aza-where" });
    (f.paths || []).forEach(function (p) { where.appendChild(h("span", { class: "aza-chip pg", text: p, title: "Page" })); });
    (f.selectors || []).forEach(function (s) { where.appendChild(h("span", { class: "aza-chip el", text: s, title: "Page section" })); });
    where.appendChild(h("span", { class: "aza-chip el", text: 'data-azora-feature="' + f.key + '"', title: "Any Webflow element with this custom attribute" }));
    return h("div", { class: "aza-feat" + (f.mode === "dev" ? " dev" : ""), "data-key": f.key }, [
      h("div", { style: "min-width:0" }, [
        h("h3", null, [f.name, h("span", { class: "aza-key", text: f.key })]),
        f.description ? h("p", { class: "aza-desc", text: f.description }) : null,
        where,
        f.updatedBy ? h("div", { class: "aza-meta", text: "Last changed " + ago(f.updatedAt) + " by " + f.updatedBy }) : null,
      ]),
      h("div", { class: "aza-right" }, [seg, h("button", { class: "aza-btn sm ghost", type: "button", text: "Edit", onclick: function () { editor(f); } })]),
    ]);
  }

  function drawList() {
    clear(listEl);
    if (!S.features.length) {
      listEl.appendChild(h("div", { class: "aza-empty" }, [h("div", { class: "big", text: "🎛️" }), h("h3", { text: "No features yet" }), h("p", { text: "Add the parts of Azora you want to be able to switch." }),
        h("button", { class: "aza-btn primary", type: "button", text: "+ Add feature", onclick: function () { editor(null); } })]));
      return;
    }
    S.features.forEach(function (f) { listEl.appendChild(featureCard(f)); });
  }

  async function setMode(f, mode, seg) {
    if (f.mode === mode) return;
    var before = f.mode;
    f.mode = mode;
    seg.className = "aza-seg " + mode + " busy";
    seg.closest(".aza-feat").classList.toggle("dev", mode === "dev");
    try {
      var r = await api("/api/features?key=" + encodeURIComponent(f.key), { method: "PATCH", body: { mode: mode } });
      Object.assign(f, r.feature);
      toast(mode === "dev" ? "🚧 " + f.name + " is in dev mode. Members will see “Under construction” within about 15 seconds." : "✅ " + f.name + " is live for everyone (within about 15 seconds).");
    } catch (e) { f.mode = before; toast(e.message, true); }
    drawList(); drawSummary();
  }

  function validSelector(s) { try { document.createDocumentFragment().querySelector(s); return true; } catch (e) { return false; } }

  function editor(f) {
    var editing = !!f;
    f = f || { mode: "live", paths: [], selectors: [] };
    var name = h("input", { class: "aza-input", maxlength: "60", value: f.name || "", placeholder: "e.g. Business directory" });
    var key = h("input", { class: "aza-input", maxlength: "40", value: f.key || "", placeholder: "e.g. businesses", style: "font-family:ui-monospace,Menlo,Consolas,monospace" });
    if (editing) key.disabled = true;
    var desc = h("input", { class: "aza-input", maxlength: "300", value: f.description || "", placeholder: "What is it? (only admins see this)" });
    var msg = h("textarea", { class: "aza-ta", maxlength: "300", placeholder: S.settings.defaultMessage || "Under construction. Back soon." });
    msg.value = f.message || "";
    var paths = h("textarea", { class: "aza-ta mono", placeholder: "/forums\n/business/*" });
    paths.value = (f.paths || []).join("\n");
    var sels = h("textarea", { class: "aza-ta mono", placeholder: "[data-azora-forums]\n.business-posts-section" });
    sels.value = (f.selectors || []).join("\n");
    var err = h("div", { class: "aza-err" });
    var keyTouched = editing;
    key.addEventListener("input", function () { keyTouched = true; });
    name.addEventListener("input", function () {
      if (!keyTouched) key.value = name.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
    });
    var save = h("button", { class: "aza-btn primary", type: "button", text: editing ? "Save" : "Add feature" });
    var close = modal(editing ? "Edit " + f.name : "Add a feature", [
      h("div", null, [h("div", { class: "aza-label", text: "Name" }), name]),
      h("div", null, [h("div", { class: "aza-label" }, ["Key", h("span", { text: editing ? "can't be changed" : "used in Webflow attributes" })]), key]),
      h("div", null, [h("div", { class: "aza-label", text: "Description" }), desc]),
      h("div", null, [h("div", { class: "aza-label" }, ["Message members see", h("span", { text: "first sentence becomes the title" })]), msg]),
      h("div", null, [h("div", { class: "aza-label" }, ["Whole pages", h("span", { text: "one per line · /path/* covers everything under it" })]), paths,
        h("div", { class: "aza-hint", text: "In dev mode, members visiting these pages get a full-screen “Under construction”." })]),
      h("div", null, [h("div", { class: "aza-label" }, ["Page sections", h("span", { text: "CSS selectors, one per line (optional)" })]), sels,
        h("div", { class: "aza-hint", text: "Easier: in Webflow, give any element the custom attribute data-azora-feature = " + (f.key || "your-key") + "." })]),
      err,
    ], [
      editing ? h("button", { class: "aza-btn danger", type: "button", text: "Delete", style: "margin-right:auto", onclick: async function () {
        if (!window.confirm("Delete the " + f.name + " switch? Anything it covers will simply stay visible.")) return;
        try { await api("/api/features?key=" + encodeURIComponent(f.key), { method: "DELETE" }); close(); toast(f.name + " switch deleted"); load(); } catch (e) { err.textContent = e.message; }
      } }) : null,
      h("button", { class: "aza-btn ghost", type: "button", text: "Cancel", onclick: function () { close(); } }),
      save,
    ]);
    setTimeout(function () { name.focus(); }, 30);
    save.addEventListener("click", async function () {
      err.textContent = "";
      var selList = sels.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      var bad = selList.filter(function (s) { return !validSelector(s); });
      if (bad.length) { err.textContent = "These aren't valid CSS selectors: " + bad.join(", "); return; }
      var body = { name: name.value, description: desc.value, message: msg.value, paths: paths.value.split("\n"), selectors: selList };
      if (!editing) { body.key = key.value; body.mode = "live"; }
      save.disabled = true;
      try {
        if (editing) await api("/api/features?key=" + encodeURIComponent(f.key), { method: "PATCH", body: body });
        else await api("/api/features", { method: "POST", body: body });
        close(); toast(editing ? "Saved" : "Feature added — it starts out live."); load();
      } catch (e) { err.textContent = e.message; save.disabled = false; }
    });
  }

  async function load() {
    try {
      var d = await api("/api/features?admin=1");
      S.features = d.features; S.settings = d.settings || {};
      drawList(); drawSummary();
    } catch (e) {
      clear(root);
      root.appendChild(h("div", { class: "aza-empty" }, [h("div", { class: "big", text: e.status === 401 || e.status === 403 ? "🔒" : "⚠️" }),
        h("h3", { text: e.status === 401 ? "Please log in" : e.status === 403 ? "Admins only" : "Couldn't load the admin panel" }),
        h("p", { text: e.status === 401 ? "Log in with your Azora admin account to manage features." : e.message }),
        e.status === 401 ? h("a", { class: "aza-btn primary", href: root.getAttribute("data-login-url") || "/login", text: "Log in" }) : null]));
    }
  }

  async function boot(el) {
    root = el;
    if (!document.getElementById("aza-css")) document.head.appendChild(h("style", { id: "aza-css", text: CSS }));
    el.classList.add("aza");
    clear(el);
    // Hide everything from non-admins before anything shows.
    var ms = await memberstack();
    var m = null;
    try { m = ms ? ((await ms.getCurrentMember()) || {}).data : null; } catch (e) {}
    if (!m) {
      el.appendChild(h("div", { class: "aza-empty" }, [h("div", { class: "big", text: "🔒" }), h("h3", { text: "Please log in" }), h("p", { text: "Log in with your Azora admin account to manage features." }),
        h("a", { class: "aza-btn primary", href: el.getAttribute("data-login-url") || "/login", text: "Log in" })]));
      return;
    }
    sumEl = h("div", { class: "aza-sum" });
    listEl = h("div", { class: "aza-list" }, [h("div", { class: "aza-skel" }), h("div", { class: "aza-skel" }), h("div", { class: "aza-skel" })]);
    el.appendChild(h("section", { class: "aza-head" }, [
      h("div", { class: "aza-eyebrow", text: "Azora Admin" }),
      h("h1", null, ["Feature ", h("span", { text: "switches" })]),
      h("p", { text: "Working on something? Flip it to Dev mode. Members see “Under construction. Back soon.” — admins and developers still see it, marked with a DEV badge." }),
      sumEl,
    ]));
    el.appendChild(h("div", { class: "aza-tools" }, [h("h2", { text: "Features" }), h("button", { class: "aza-btn primary", type: "button", text: "+ Add feature", onclick: function () { editor(null); } })]));
    el.appendChild(listEl);
    el.appendChild(h("div", { class: "aza-help" }, [
      h("h3", { text: "Putting something new under a switch" }),
      h("ol", null, [
        h("li", null, ["Add a feature here (or use an existing one) and note its ", h("b", { text: "key" }), "."]),
        h("li", null, ["Whole page? Add its path, like ", h("code", { text: "/forums" }), " or ", h("code", { text: "/business/*" }), " for every business page."]),
        h("li", null, ["Just part of a page? In Webflow, select the element → Settings → Custom attributes → add ", h("code", { text: "data-azora-feature" }), " with the key as the value. Publish."]),
        h("li", null, ["Directory tabs (businesses, groups, audios, churches, lkbi) are switched automatically by their key."]),
      ]),
    ]));
    drawSummary();
    load();
  }

  function start() { var el = document.querySelector("[data-azora-admin]"); if (el) boot(el); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
