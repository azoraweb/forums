/*!
 * Azora Inbox — a button for the navbar that opens a half-page drawer.
 *   In the navbar, next to DASH, add an Embed:
 *     <div data-azora-inbox></div>
 *   In Site settings → Custom code → Footer:
 *     <script src="https://YOUR-PROJECT.vercel.app/azora-inbox.js" defer></script>
 *
 * Optional on the <div>: data-label="Inbox" (shows text next to the icon)
 * Optional on the <script>: data-accounts-api="https://azora-accounts.vercel.app"
 *
 * Members see updates about their business, LKBi registrations and groups.
 * Admins also get a "Needs review" tab for new registrations, with buttons
 * to decide right there. Hidden when logged out.
 * Open it from any link with #inbox.
 */
(function () {
  "use strict";
  if (window.AzoraInbox) return;

  var SCRIPT = document.currentScript;
  var API = ((SCRIPT && SCRIPT.getAttribute("data-api")) ||
    (SCRIPT && SCRIPT.src ? new URL(SCRIPT.src).origin : "")).replace(/\/$/, "");
  var ACCOUNTS = ((SCRIPT && SCRIPT.getAttribute("data-accounts-api")) || "https://azora-accounts.vercel.app").replace(/\/$/, "");
  var POLL_MS = 60000;

  var CSS = `
.azi-btn { position:relative; display:inline-flex; align-items:center; justify-content:center; gap:8px; height:38px; min-width:38px; padding:0 10px; border-radius:8px;
  background:#2b1a4d; border:1px solid rgba(139,108,255,.35); color:#fff; cursor:pointer; font:600 14px/1 inherit; font-family:inherit; letter-spacing:.02em; vertical-align:middle; transition:background .15s, border-color .15s, transform .1s; }
.azi-btn:hover { background:#3a2468; border-color:rgba(139,108,255,.7); }
.azi-btn:active { transform:translateY(1px); }
.azi-btn svg { display:block; }
.azi-badge { position:absolute; top:-6px; right:-6px; min-width:19px; height:19px; padding:0 5px; border-radius:10px; background:#ff4d6d; color:#fff; font:700 11px/19px -apple-system,Segoe UI,Roboto,sans-serif; text-align:center;
  box-shadow:0 0 0 2px #000, 0 4px 12px rgba(255,77,109,.5); animation:azi-pop .25s ease-out; }
@keyframes azi-pop { from { transform:scale(.4); } }
.azi, .azi * { box-sizing:border-box; }
.azi { --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.14); --panel:#0d0d15; --panel2:#13131d; --text:#f2f3f8; --silver:#c4c8d4; --dim:#8f95a8; --faint:#5d6375;
  --green:#38d39f; --amber:#ffbf47; --danger:#ff5d7a; --grad:linear-gradient(135deg,#7c4dff 0%,#5468ff 50%,#2f8cff 100%);
  position:fixed; inset:0; z-index:2147482000; font-family:inherit; font-size:15px; line-height:1.5; color:var(--text); text-align:left; -webkit-font-smoothing:antialiased; }
.azi :where(button, textarea) { font:inherit; color:inherit; }
.azi :where(button) { cursor:pointer; border:0; background:none; padding:0; }
.azi :where(h2, h3, p) { margin:0; padding:0; }
.azi a { color:inherit; text-decoration:none; }
.azi-shade { position:absolute; inset:0; background:rgba(0,0,0,.6); opacity:0; transition:opacity .3s; }
.azi.open .azi-shade { opacity:1; }
.azi-panel { position:absolute; top:0; right:0; bottom:0; width:min(560px, 50vw); min-width:min(420px, 100vw); background:#08080d; border-left:1px solid var(--line2);
  box-shadow:-30px 0 80px -20px rgba(84,104,255,.35); display:flex; flex-direction:column; transform:translateX(100%); transition:transform .32s cubic-bezier(.2,.8,.2,1); }
.azi.open .azi-panel { transform:none; }
.azi-head { padding:20px 22px 14px; border-bottom:1px solid var(--line); background:radial-gradient(500px 140px at 0% 0%, rgba(124,77,255,.22), transparent 70%); }
.azi-top { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.azi-head h2 { font-size:22px; font-weight:800; letter-spacing:-.02em; display:flex; align-items:center; gap:10px; }
.azi-x { width:36px; height:36px; border-radius:10px; color:var(--dim); font-size:24px; line-height:1; display:flex; align-items:center; justify-content:center; }
.azi-x:hover { background:rgba(255,255,255,.07); color:#fff; }
.azi-tabs { display:flex; gap:4px; margin-top:14px; background:var(--panel); border:1px solid var(--line); padding:4px; border-radius:12px; }
.azi-tab { flex:1; height:34px; border-radius:9px; font-size:13.5px; font-weight:600; color:var(--dim); display:flex; align-items:center; justify-content:center; gap:7px; }
.azi-tab.on { background:#1a1a28; color:#fff; box-shadow:inset 0 0 0 1px var(--line2); }
.azi-tab i { font-style:normal; min-width:18px; height:18px; padding:0 5px; border-radius:9px; background:#ff4d6d; color:#fff; font-size:11px; font-weight:700; line-height:18px; }
.azi-tools { display:flex; justify-content:space-between; align-items:center; margin-top:10px; font-size:12.5px; color:var(--faint); min-height:20px; }
.azi-tools button { color:#9fbcff; font-weight:600; font-size:12.5px; }
.azi-tools button:hover { color:#c2d4ff; }
.azi-list { flex:1; overflow-y:auto; padding:14px 16px 30px; display:flex; flex-direction:column; gap:10px; overscroll-behavior:contain; }
.azi-item { position:relative; display:flex; gap:13px; padding:15px 16px; border-radius:16px; background:var(--panel); border:1px solid var(--line); transition:border-color .15s; }
.azi-item.unread { border-color:rgba(139,108,255,.4); background:linear-gradient(180deg, rgba(124,77,255,.07), transparent 70%), var(--panel); }
.azi-item.unread::after { content:""; position:absolute; top:19px; right:16px; width:8px; height:8px; border-radius:50%; background:#8b6cff; box-shadow:0 0 10px #8b6cff; }
.azi-ico { width:40px; height:40px; border-radius:12px; flex:none; display:flex; align-items:center; justify-content:center; font-size:19px; background:rgba(255,255,255,.05); border:1px solid var(--line); }
.azi-main { flex:1; min-width:0; }
.azi-title { font-weight:700; font-size:15px; line-height:1.35; padding-right:22px; }
.azi-body { color:var(--silver); font-size:14px; margin-top:4px; white-space:pre-line; overflow-wrap:anywhere; }
.azi-meta { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:9px; font-size:12.5px; color:var(--faint); }
.azi-meta a, .azi-meta button { color:#9fbcff; font-weight:600; }
.azi-meta a:hover, .azi-meta button:hover { color:#c2d4ff; }
.azi-dismiss { position:absolute; bottom:12px; right:12px; width:28px; height:28px; border-radius:8px; color:var(--faint); font-size:17px; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity .15s; }
.azi-item:hover .azi-dismiss, .azi-dismiss:focus { opacity:1; }
.azi-dismiss:hover { background:rgba(255,255,255,.08); color:#fff; }
.azi-review.open { border-color:rgba(255,191,71,.4); background:linear-gradient(180deg, rgba(255,191,71,.06), transparent 60%), var(--panel); }
.azi-kv { display:grid; grid-template-columns:auto 1fr; gap:4px 12px; margin-top:10px; font-size:13.5px; }
.azi-kv dt { color:var(--faint); } .azi-kv dd { margin:0; color:var(--silver); overflow-wrap:anywhere; }
.azi-kv a { color:#9fbcff; }
.azi-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:14px; }
.azi-b { height:36px; padding:0 14px; border-radius:10px; font-size:13.5px; font-weight:700; background:#1a1a28; border:1px solid var(--line2) !important; color:#fff; display:inline-flex; align-items:center; gap:6px; transition:filter .15s, background .15s; }
.azi-b:hover { background:#232336; }
.azi-b.ok { background:var(--grad); border-color:transparent !important; }
.azi-b.ok:hover { filter:brightness(1.1); }
.azi-b.gold { background:rgba(255,191,71,.12); border-color:rgba(255,191,71,.4) !important; color:#ffd27a; }
.azi-b.no { background:rgba(255,93,122,.1); border-color:rgba(255,93,122,.35) !important; color:#ff8fa3; }
.azi-b.link { background:none; border-color:transparent !important; color:var(--dim); font-weight:600; padding:0 6px; }
.azi-b[disabled] { opacity:.5; pointer-events:none; }
.azi-note { width:100%; margin-top:10px; min-height:70px; resize:vertical; background:#06060b; border:1px solid var(--line2); border-radius:11px; padding:10px 12px; outline:none; font-size:14px; }
.azi-note:focus { border-color:rgba(255,93,122,.6); }
.azi-done { display:inline-flex; align-items:center; gap:6px; margin-top:12px; font-size:12.5px; font-weight:700; padding:5px 10px; border-radius:8px; }
.azi-done.good { color:#6ff0c0; background:rgba(56,211,159,.1); border:1px solid rgba(56,211,159,.3); }
.azi-done.bad { color:#ff9cae; background:rgba(255,93,122,.08); border:1px solid rgba(255,93,122,.3); }
.azi-done.meh { color:var(--silver); background:rgba(255,255,255,.05); border:1px solid var(--line2); }
.azi-sec { font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--faint); margin:10px 4px 0; }
.azi-empty { text-align:center; color:var(--dim); padding:70px 20px; }
.azi-empty .big { font-size:42px; margin-bottom:10px; }
.azi-empty h3 { color:#fff; font-size:18px; margin-bottom:4px; }
.azi-err { color:#ff9cae; font-size:13px; margin-top:8px; }
.azi-skel { height:96px; border-radius:16px; border:1px solid var(--line); background:linear-gradient(90deg,var(--panel) 0%,#14141e 50%,var(--panel) 100%); background-size:200% 100%; animation:azi-sh 1.2s infinite; }
@keyframes azi-sh { to { background-position:-200% 0; } }
@media (max-width:700px) { .azi-panel { width:100vw; min-width:0; border-left:0; } .azi-dismiss { opacity:1; } }
`;

  var ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>';
  var KIND_ICON = {
    "business.review": "🏪", "business.received": "🏪", "business.approved": "🎉", "business.declined": "📝",
    "lkbi.review": "🧒", "lkbi.received": "🧒", "lkbi.approved": "🎉", "lkbi.active": "🎒", "lkbi.canceled": "📝",
    "group.added": "🤝", "group.removed": "👋", "business.follower": "👥", "business.post": "📣",
  };

  /* ------------------------------------------------------------ helpers */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v; // only used for our fixed SVG icon
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
    if (s < 86400 * 7) return Math.round(s / 86400) + "d ago";
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
  async function token() {
    var ms = await memberstack();
    try { return ms ? await ms.getMemberCookie() : null; } catch (e) { return null; }
  }
  async function call(base, path, opts) {
    opts = opts || {};
    var t = await token();
    var r = await fetch(base + path, {
      method: opts.method || "GET", cache: "no-store",
      headers: Object.assign({ "Content-Type": "application/json" }, t ? { Authorization: "Bearer " + t } : {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    var data = {};
    try { data = await r.json(); } catch (e) {}
    if (!r.ok) { var err = new Error(data.error || "Something went wrong. Please try again."); err.status = r.status; throw err; }
    return data;
  }
  var api = function (path, opts) { return call(API, path, opts); };

  /* -------------------------------------------------------------- state */
  var S = { count: 0, items: [], review: [], isAdmin: false, tab: "you", open: false, loaded: false };
  var buttons = [];
  var drawer, listEl, tabsEl, toolsEl;

  function drawBadges() {
    buttons.forEach(function (b) {
      var old = b.querySelector(".azi-badge");
      if (old) old.remove();
      b.setAttribute("aria-label", S.count ? "Inbox, " + S.count + " new" : "Inbox");
      if (S.count) b.appendChild(h("span", { class: "azi-badge", text: S.count > 99 ? "99+" : String(S.count) }));
    });
  }
  async function refreshCount() {
    try { var d = await api("/api/inbox?count=1"); if (d.count !== S.count) { S.count = d.count; drawBadges(); } } catch (e) {}
  }

  /* ------------------------------------------------------------- drawer */
  function buildDrawer() {
    listEl = h("div", { class: "azi-list", role: "list" });
    tabsEl = h("div", { class: "azi-tabs", role: "tablist" });
    toolsEl = h("div", { class: "azi-tools" });
    var panel = h("aside", { class: "azi-panel", role: "dialog", "aria-modal": "true", "aria-label": "Inbox" }, [
      h("div", { class: "azi-head" }, [
        h("div", { class: "azi-top" }, [h("h2", null, [h("span", { html: ICON.replace(/18/g, "22") }), "Inbox"]), h("button", { class: "azi-x", type: "button", "aria-label": "Close inbox", text: "×", onclick: close })]),
        tabsEl, toolsEl,
      ]),
      listEl,
    ]);
    drawer = h("div", { class: "azi" }, [h("div", { class: "azi-shade", onclick: close }), panel]);
    drawer.style.display = "none";
    document.body.appendChild(drawer);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && S.open) close(); });
  }

  var prevOverflow = "";
  function open(tab) {
    if (!drawer) buildDrawer();
    if (tab) S.tab = tab;
    S.open = true;
    drawer.style.display = "";
    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(function () { requestAnimationFrame(function () { drawer.classList.add("open"); }); });
    if (!S.loaded) { clear(listEl); listEl.appendChild(h("div", { class: "azi-skel" })); listEl.appendChild(h("div", { class: "azi-skel" })); }
    load();
  }
  function close() {
    if (!drawer || !S.open) return;
    S.open = false;
    drawer.classList.remove("open");
    document.documentElement.style.overflow = prevOverflow;
    setTimeout(function () { if (!S.open) drawer.style.display = "none"; }, 330);
    if (location.hash === "#inbox") history.replaceState(null, "", location.pathname + location.search);
  }

  async function load() {
    try {
      var d = await api("/api/inbox");
      S.items = d.items; S.review = d.review; S.isAdmin = d.isAdmin; S.loaded = true;
      if (!S.isAdmin) S.tab = "you";
      else if (S.tab === "you" && !S.items.some(unread) && S.review.some(isOpen)) S.tab = "review";
      draw();
      markSeen();
    } catch (e) {
      clear(listEl).appendChild(h("div", { class: "azi-empty" }, [h("div", { class: "big", text: e.status === 503 ? "🚧" : "⚠️" }), h("h3", { text: e.status === 503 ? "Under construction" : "Couldn't load your inbox" }), h("p", { text: e.message })]));
    }
  }
  function unread(x) { return !x.read; }
  function isOpen(x) { return x.status === "open"; }

  var seenTimer;
  function markSeen() {
    clearTimeout(seenTimer);
    if (S.tab !== "you" || !S.items.some(unread)) return;
    seenTimer = setTimeout(async function () {
      if (!S.open || S.tab !== "you") return;
      try { var d = await api("/api/inbox", { method: "POST", body: { action: "read" } }); S.count = d.count; drawBadges(); } catch (e) {}
      // keep the highlight until the drawer is reopened
      S.items.forEach(function (x) { x.read = true; });
    }, 1500);
  }

  function draw() {
    var youNew = S.items.filter(unread).length;
    var openN = S.review.filter(isOpen).length;
    clear(tabsEl);
    tabsEl.style.display = S.isAdmin ? "" : "none";
    if (S.isAdmin) {
      [["you", "For you", youNew], ["review", "Needs review", openN]].forEach(function (t) {
        tabsEl.appendChild(h("button", { class: "azi-tab" + (S.tab === t[0] ? " on" : ""), type: "button", role: "tab", onclick: function () { S.tab = t[0]; draw(); markSeen(); } },
          [t[1], t[2] ? h("i", { text: String(t[2]) }) : null]));
      });
    }
    clear(toolsEl);
    if (S.tab === "you") {
      toolsEl.appendChild(h("span", { text: youNew ? youNew + " new" : S.items.length ? "You're all caught up" : "" }));
    } else {
      toolsEl.appendChild(h("span", { text: openN ? openN + " waiting for a decision" : "Nothing waiting on you" }));
    }
    toolsEl.appendChild(h("button", { type: "button", text: "Refresh", onclick: load }));

    clear(listEl);
    if (S.tab === "you") {
      if (!S.items.length) return listEl.appendChild(empty("📭", "No updates yet", "News about your business, LKBi registrations and groups will show up here."));
      S.items.forEach(function (x) { listEl.appendChild(itemCard(x)); });
    } else {
      var open_ = S.review.filter(isOpen), done = S.review.filter(function (x) { return !isOpen(x); });
      if (!open_.length && !done.length) return listEl.appendChild(empty("✅", "All caught up", "New business and LKBi registrations will show up here for review."));
      if (!open_.length) listEl.appendChild(empty("✅", "All caught up", "Nothing is waiting for a decision."));
      open_.forEach(function (x) { listEl.appendChild(reviewCard(x)); });
      if (done.length) {
        listEl.appendChild(h("div", { class: "azi-sec", text: "Recently handled" }));
        done.forEach(function (x) { listEl.appendChild(reviewCard(x)); });
      }
    }
  }
  function empty(icon, title, text) { return h("div", { class: "azi-empty" }, [h("div", { class: "big", text: icon }), h("h3", { text: title }), h("p", { text: text })]); }

  function itemCard(x) {
    return h("div", { class: "azi-item" + (x.read ? "" : " unread"), role: "listitem" }, [
      h("div", { class: "azi-ico", text: KIND_ICON[x.kind] || "🔔" }),
      h("div", { class: "azi-main" }, [
        h("div", { class: "azi-title", text: x.title }),
        x.body ? h("p", { class: "azi-body", text: x.body }) : null,
        h("div", { class: "azi-meta" }, [h("span", { text: ago(x.createdAt) }), x.link ? h("a", { href: x.link, onclick: close }, x.kind === "business.post" ? "See the post →" : "Open dashboard →") : null]),
      ]),
      h("button", { class: "azi-dismiss", type: "button", title: "Clear", "aria-label": "Clear this update", text: "×", onclick: async function () {
        S.items = S.items.filter(function (y) { return y !== x; }); draw();
        try { var d = await api("/api/inbox", { method: "POST", body: { action: "dismiss", id: x.id } }); S.count = d.count; drawBadges(); } catch (e) {}
      } }),
    ]);
  }

  var RES = {
    approve: ["good", "✓ Approved"], approved: ["good", "✓ Approved"], scholarship: ["good", "✓ Scholarship approved"],
    active: ["good", "✓ Enrolled"], decline: ["bad", "✕ Declined"], declined: ["bad", "✕ Declined"], canceled: ["bad", "✕ Declined"], handled: ["meh", "Marked as handled"],
  };

  function reviewCard(x) {
    var d = x.data || {};
    var isBiz = x.kind === "business.review";
    var kv = h("dl", { class: "azi-kv" });
    function row(k, v, href) { if (!v) return; kv.appendChild(h("dt", { text: k })); kv.appendChild(h("dd", null, href ? h("a", { href: href, target: href.indexOf("http") === 0 ? "_blank" : null, rel: "noopener", text: v }) : v)); }
    if (isBiz) {
      row("Business", d.businessName); row("Location", d.location); row("Contact", d.contactName);
      row("Email", d.email, d.email && "mailto:" + d.email); row("Phone", d.phone, d.phone && "tel:" + d.phone.replace(/[^\d+]/g, ""));
      row("Website", d.website && d.website.replace(/^https?:\/\/(www\.)?/, ""), d.website); row("Services", d.tags);
    } else {
      row("Student", d.child); row("Age", d.age); row("Grade", d.grade); row("Group", d.groupName);
      row("Parent", d.parentName); row("Email", d.parentEmail, d.parentEmail && "mailto:" + d.parentEmail);
      row("Phone", d.parentPhone, d.parentPhone && "tel:" + d.parentPhone.replace(/[^\d+]/g, "")); row("Notes", d.notes);
    }
    var err = h("div", { class: "azi-err" });
    var card = h("div", { class: "azi-item azi-review" + (x.status === "open" ? " open" : ""), role: "listitem" }, [
      h("div", { class: "azi-ico", text: KIND_ICON[x.kind] || "📝" }),
      h("div", { class: "azi-main" }, [
        h("div", { class: "azi-title", text: x.title }),
        h("div", { class: "azi-meta", style: "margin-top:3px" }, [h("span", { text: (isBiz ? "Business registration" : "LKBi registration") + " · " + ago(x.createdAt) })]),
        kv,
        x.status === "open" ? actions(x, isBiz, card, err) : done(x),
        err,
      ]),
    ]);
    return card;
  }

  function done(x) {
    var r = RES[x.resolution] || ["meh", x.resolution ? x.resolution.charAt(0).toUpperCase() + x.resolution.slice(1) : "Handled"];
    var note = x.data && x.data.note;
    return h("div", null, [
      h("span", { class: "azi-done " + r[0], text: r[1] + (x.resolvedBy ? " by " + x.resolvedBy : "") + " · " + ago(x.resolvedAt) }),
      note ? h("p", { class: "azi-body", style: "margin-top:8px", text: "Note: " + note }) : null,
    ]);
  }

  function actions(x, isBiz, card, err) {
    var wrap = h("div");
    var row = h("div", { class: "azi-actions" });
    function busy(on) { [].forEach.call(row.querySelectorAll("button"), function (b) { b.disabled = on; }); }
    async function decideBiz(decision, note) {
      err.textContent = ""; busy(true);
      try {
        await api("/api/inbox", { method: "POST", body: { action: "decide", id: x.id, decision: decision, note: note || "" } });
        await load(); refreshCount();
      } catch (e) { err.textContent = e.message; busy(false); if (e.status === 409) load(); }
    }
    async function decideLkbi(kind) {
      err.textContent = ""; busy(true);
      try {
        var info = await call(ACCOUNTS, "/api/lkbi");
        var rx = kind === "approved" ? /approv|accept/i : /declin|reject|cancel|inactive/i;
        var opt = (info.statuses || []).find(function (o) { return rx.test(o.name); });
        if (!opt) throw new Error('Add an "' + (kind === "approved" ? "Approved" : "Declined") + '" option to the LKBi Status field in Webflow.');
        await call(ACCOUNTS, "/api/lkbi", { method: "POST", body: { action: "status", id: x.data.regId, status: opt.id } });
        // The accounts project tells the inbox (and the parent). Close it here too in case that's not set up yet.
        await api("/api/inbox", { method: "POST", body: { action: "decide", id: x.id, decision: "handled", label: kind === "approved" ? "approved" : "declined" } }).catch(function () {});
        await load(); refreshCount();
      } catch (e) { err.textContent = e.message; busy(false); }
    }
    function declineBox(run) {
      var note = h("textarea", { class: "azi-note", placeholder: "Optional note they'll see, e.g. what to fix before re-applying", maxlength: "500" });
      clear(row);
      row.appendChild(h("button", { class: "azi-b no", type: "button", text: "Decline", onclick: function () { run(note.value.trim()); } }));
      row.appendChild(h("button", { class: "azi-b link", type: "button", text: "Cancel", onclick: function () { clear(wrap); wrap.appendChild(actions(x, isBiz, card, err)); } }));
      wrap.insertBefore(note, row);
      note.focus();
    }
    if (isBiz) {
      row.appendChild(h("button", { class: "azi-b ok", type: "button", text: "Approve", title: "They choose a monthly or yearly plan to activate", onclick: function () { decideBiz("approve"); } }));
      row.appendChild(h("button", { class: "azi-b gold", type: "button", text: "Scholarship", title: "Free listing, forever", onclick: function () { decideBiz("scholarship"); } }));
      row.appendChild(h("button", { class: "azi-b no", type: "button", text: "Decline…", onclick: function () { declineBox(function (n) { decideBiz("decline", n); }); } }));
    } else {
      row.appendChild(h("button", { class: "azi-b ok", type: "button", text: "Approve", title: "The parent can then activate & pay", onclick: function () { decideLkbi("approved"); } }));
      row.appendChild(h("button", { class: "azi-b no", type: "button", text: "Decline", onclick: function () { if (window.confirm("Decline this LKBi registration?")) decideLkbi("declined"); } }));
    }
    row.appendChild(h("button", { class: "azi-b link", type: "button", text: "Already handled", title: "Close it without changing anything", onclick: function () { decideBiz("handled"); } }));
    wrap.appendChild(row);
    return wrap;
  }

  /* --------------------------------------------------------------- boot */
  function mountButton(el) {
    if (el.__azi) return;
    el.__azi = true;
    var label = el.getAttribute("data-label");
    var b = h("button", { class: "azi-btn", type: "button", "aria-label": "Inbox", title: "Inbox", onclick: function () { open(); } }, [h("span", { html: ICON }), label ? h("span", { text: label }) : null]);
    el.appendChild(b);
    buttons.push(b);
  }

  async function boot() {
    var mounts = document.querySelectorAll("[data-azora-inbox]");
    if (!mounts.length) return;
    if (!document.getElementById("azi-css")) document.head.appendChild(h("style", { id: "azi-css", text: CSS }));
    // Logged out? Show nothing.
    var ms = await memberstack();
    var m = null;
    try { m = ms ? ((await ms.getCurrentMember()) || {}).data : null; } catch (e) {}
    if (!m) return;
    // Feature switch: in dev mode only admins & developers see the inbox.
    if (window.AzoraFeatures) { await window.AzoraFeatures.ready; if (window.AzoraFeatures.blocked("inbox")) return; }
    [].forEach.call(mounts, mountButton);
    window.AzoraInbox = { open: open, close: close, refresh: refreshCount };
    await refreshCount();
    setInterval(function () { if (!document.hidden) refreshCount(); }, POLL_MS);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) refreshCount(); });
    if (location.hash === "#inbox") open();
    window.addEventListener("hashchange", function () { if (location.hash === "#inbox") open(); });
  }
  window.AzoraInbox = window.AzoraInbox || { pending: true };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
