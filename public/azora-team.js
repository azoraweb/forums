/*!
 * Azora "Meet the team" page.
 *   <div data-azora-team></div>
 *   <script src="https://YOUR-PROJECT.vercel.app/azora-team.js" defer></script>
 *
 * Optional on the <div>: data-title="…"  data-subtitle="…"
 *
 * Everyone sees the team. Admins also get "Add team member" and, on every
 * card, edit / move / hide / remove (the API checks the admin plan).
 */
(function () {
  "use strict";
  if (window.AzoraTeam) return;
  window.AzoraTeam = true;

  var SCRIPT = document.currentScript;
  var API = ((SCRIPT && SCRIPT.getAttribute("data-api")) ||
    (SCRIPT && SCRIPT.src ? new URL(SCRIPT.src).origin : "")).replace(/\/$/, "");
  var ADMIN_PLAN = "pln_administrator-jz1ge0dzd";

  var CSS = `
.azt, .azt *, .azt-ov, .azt-ov *, .azt-toast { box-sizing:border-box; }
.azt, .azt-ov, .azt-toast { --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.14); --panel:#0b0b12; --panel2:#11111a; --panel3:#171724;
  --text:#f2f3f8; --silver:#c4c8d4; --dim:#8f95a8; --faint:#5d6375; --amber:#ffbf47; --danger:#ff5d7a;
  --grad:linear-gradient(135deg,#7c4dff 0%,#5468ff 50%,#2f8cff 100%); }
.azt { color:var(--text); font-size:16px; line-height:1.55; width:100%; max-width:1180px; margin:0 auto; padding:8px 18px 90px; text-align:left; -webkit-font-smoothing:antialiased; }
:where(.azt, .azt-ov) :is(button, input, textarea) { font:inherit; color:inherit; }
:where(.azt, .azt-ov) button { cursor:pointer; border:0; background:none; padding:0; }
:where(.azt, .azt-ov) :is(h1,h2,h3,p,blockquote) { margin:0; padding:0; }
.azt a { color:inherit; text-decoration:none; }

.azt-hero { text-align:center; padding:56px 20px 10px; position:relative; }
.azt-hero::before { content:""; position:absolute; left:50%; top:-40px; width:760px; max-width:100%; height:340px; transform:translateX(-50%); pointer-events:none;
  background:radial-gradient(closest-side, rgba(124,77,255,.28), transparent); filter:blur(10px); }
.azt-hero > * { position:relative; }
.azt-eyebrow { display:inline-flex; align-items:center; gap:8px; font-size:12px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--silver); }
.azt-eyebrow i { width:7px; height:7px; border-radius:50%; background:var(--grad); display:block; }
.azt-hero h1 { font-size:clamp(36px,6vw,64px); font-weight:800; letter-spacing:-.035em; line-height:1.04; margin-top:14px; }
.azt-hero h1 span { background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.azt-hero p { color:var(--silver); font-size:clamp(16px,1.6vw,18.5px); max-width:620px; margin:16px auto 0; }

.azt-admin { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin:34px 0 0; padding:12px 14px 12px 18px; border-radius:16px;
  background:rgba(255,191,71,.06); border:1px solid rgba(255,191,71,.28); color:#ffe2a8; font-size:14px; }
.azt-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; height:42px; padding:0 17px; border-radius:12px; font-weight:600; font-size:14.5px;
  background:var(--panel3); border:1px solid var(--line2) !important; color:#fff; white-space:nowrap; transition:background .15s, filter .15s; }
.azt-btn:hover { background:#1f1f30; }
.azt-btn.p { background:var(--grad); border-color:transparent !important; box-shadow:0 12px 30px -12px rgba(84,104,255,.85); }
.azt-btn.p:hover { filter:brightness(1.1); }
.azt-btn.ghost { background:none; border-color:transparent !important; color:var(--silver); }
.azt-btn.danger { background:rgba(255,93,122,.12); border-color:rgba(255,93,122,.35) !important; color:#ff8fa3; }
.azt-btn.sm { height:34px; padding:0 12px; font-size:13px; border-radius:10px; }
.azt-btn[disabled] { opacity:.5; pointer-events:none; }

.azt-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(290px, 370px)); justify-content:center; gap:18px; margin-top:40px; }
.azt-card { position:relative; display:flex; flex-direction:column; border:1px solid var(--line); border-radius:24px; background:var(--panel); overflow:hidden; transition:border-color .2s, transform .2s; }
.azt-card:hover { border-color:rgba(139,108,255,.35); transform:translateY(-2px); }
.azt-card.hidden { opacity:.5; border-style:dashed; }
.azt-photo { position:relative; aspect-ratio:1/1; background:radial-gradient(circle at 30% 20%, #2a2160, #0f1430 70%); overflow:hidden; }
.azt-photo img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .5s; }
.azt-card:hover .azt-photo img { transform:scale(1.03); }
.azt-photo::after { content:""; position:absolute; inset:auto 0 0 0; height:45%; background:linear-gradient(180deg, transparent, rgba(11,11,18,.95)); pointer-events:none; }
.azt-initials { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:84px; font-weight:800; letter-spacing:-.04em;
  background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; opacity:.9; }
.azt-who { position:absolute; left:22px; right:22px; bottom:18px; z-index:1; }
.azt-who h3 { font-size:24px; font-weight:800; letter-spacing:-.02em; line-height:1.15; color:#fff; text-shadow:0 2px 20px rgba(0,0,0,.6); }
.azt-role { display:inline-block; margin-top:8px; font-size:12.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#fff;
  padding:5px 11px; border-radius:20px; background:var(--grad); box-shadow:0 8px 24px -10px rgba(84,104,255,.9); }
.azt-body { padding:22px 22px 24px; display:flex; flex-direction:column; flex:1; }
.azt-quote { position:relative; color:#e3e5ee; font-size:16.5px; line-height:1.6; font-style:italic; padding-left:32px; white-space:pre-line; }
.azt-quote::before { content:"“"; position:absolute; left:-2px; top:-10px; font-size:52px; line-height:1; font-style:normal; font-weight:800;
  background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.azt-link { margin-top:auto; padding-top:18px; display:inline-flex; align-items:center; gap:6px; color:#9fbcff; font-weight:600; font-size:14px; align-self:flex-start; }
.azt-link:hover { color:#c2d4ff; }
.azt-tools { position:absolute; top:12px; right:12px; z-index:2; display:flex; gap:4px; padding:4px; border-radius:12px; background:rgba(0,0,0,.65); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); border:1px solid var(--line2); }
.azt-tools button { width:32px; height:32px; border-radius:8px; color:#dfe2ea; font-size:15px; display:flex; align-items:center; justify-content:center; }
.azt-tools button:hover { background:rgba(255,255,255,.12); }
.azt-tools button[disabled] { opacity:.3; pointer-events:none; }
.azt-hiddenflag { position:absolute; top:14px; left:14px; z-index:2; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:4px 8px; border-radius:7px; background:rgba(0,0,0,.7); color:var(--amber); border:1px solid rgba(255,191,71,.4); }
.azt-empty { text-align:center; padding:70px 20px; border:1px dashed var(--line2); border-radius:22px; color:var(--dim); margin-top:40px; }
.azt-empty .big { font-size:40px; margin-bottom:10px; } .azt-empty h3 { color:#fff; font-size:19px; margin-bottom:6px; }
.azt-empty .azt-btn { margin-top:18px; }
.azt-skel { aspect-ratio:3/4; border-radius:24px; border:1px solid var(--line); background:linear-gradient(90deg,var(--panel) 0%,#12121c 50%,var(--panel) 100%); background-size:200% 100%; animation:azt-sh 1.2s infinite; }
@keyframes azt-sh { to { background-position:-200% 0; } }

.azt-ov { position:fixed; inset:0; z-index:2147483000; background:rgba(0,0,0,.72); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); display:flex; align-items:flex-start; justify-content:center; padding:5vh 14px; overflow-y:auto; font-size:15px; line-height:1.55; color:var(--text); }
.azt-modal { width:100%; max-width:560px; background:#0a0a11; border:1px solid var(--line2); border-radius:20px; box-shadow:0 40px 120px -30px rgba(84,104,255,.45); text-align:left; }
.azt-mh { display:flex; justify-content:space-between; align-items:center; padding:18px 22px; border-bottom:1px solid var(--line); }
.azt-mh h3 { font-size:17px; font-weight:700; }
.azt-x { width:32px; height:32px; border-radius:8px; color:var(--dim); font-size:22px; line-height:1; }
.azt-x:hover { background:rgba(255,255,255,.07); color:#fff; }
.azt-mb { padding:20px 22px; display:flex; flex-direction:column; gap:16px; }
.azt-mf { padding:14px 22px; border-top:1px solid var(--line); display:flex; gap:10px; justify-content:flex-end; align-items:center; }
.azt-label { font-size:13px; font-weight:600; color:var(--silver); margin-bottom:7px; display:flex; justify-content:space-between; gap:10px; }
.azt-label span { color:var(--faint); font-weight:400; }
.azt-input, .azt-ta { width:100%; background:#06060b; border:1px solid var(--line2); border-radius:12px; padding:0 14px; outline:none; font-size:15px; transition:border-color .15s, box-shadow .15s; }
.azt-input { height:46px; }
.azt-ta { padding:11px 14px; min-height:100px; resize:vertical; line-height:1.55; }
.azt-input:focus, .azt-ta:focus { border-color:rgba(139,108,255,.7); box-shadow:0 0 0 4px rgba(124,77,255,.13); }
.azt-results { display:flex; flex-direction:column; gap:4px; margin-top:8px; max-height:280px; overflow-y:auto; }
.azt-res { display:flex; align-items:center; gap:12px; padding:9px 10px; border-radius:11px; text-align:left; width:100%; transition:background .12s; }
.azt-res:hover { background:rgba(255,255,255,.06); }
.azt-res[disabled] { opacity:.45; pointer-events:none; }
.azt-res .nm { font-weight:600; font-size:14.5px; } .azt-res .em { color:var(--dim); font-size:12.5px; }
.azt-res .tag { margin-left:auto; font-size:11.5px; color:var(--dim); }
.azt-av { width:38px; height:38px; border-radius:50%; overflow:hidden; flex:none; background:var(--grad); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; color:#fff; }
.azt-av img { width:100%; height:100%; object-fit:cover; display:block; }
.azt-picked { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:14px; background:var(--panel2); border:1px solid rgba(139,108,255,.4); }
.azt-picked .nm { font-weight:700; } .azt-picked .em { color:var(--dim); font-size:12.5px; }
.azt-picked button { margin-left:auto; }
.azt-photo-row { display:flex; align-items:center; gap:12px; }
.azt-photo-row .azt-av { width:56px; height:56px; border-radius:14px; font-size:18px; }
.azt-hint { color:var(--faint); font-size:12.5px; margin-top:6px; }
.azt-check { display:flex; gap:10px; align-items:center; font-size:14px; color:var(--silver); cursor:pointer; }
.azt-err { color:#ff9cae; font-size:13.5px; background:rgba(255,93,122,.08); border:1px solid rgba(255,93,122,.25); border-radius:10px; padding:10px 12px; }
.azt-err:empty { display:none; }
.azt-toast { position:fixed; left:50%; bottom:26px; transform:translateX(-50%); z-index:2147483200; background:#14141f; border:1px solid var(--line2); color:#fff; padding:11px 16px; border-radius:12px; font-size:14px; box-shadow:0 20px 50px -10px rgba(0,0,0,.8); max-width:calc(100vw - 32px); }
.azt-toast.err { border-color:rgba(255,93,122,.5); }
@media (max-width:520px) { .azt { padding:0 12px 70px; } .azt-grid { grid-template-columns:1fr; } .azt-who h3 { font-size:22px; } }
`;

  /* ---------------------------------------------------------- helpers */
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
  function initials(name) {
    var p = String(name || "?").replace(/[^\p{L}\p{N}\s]/gu, "").trim().split(/\s+/).filter(Boolean);
    if (!p.length) return "?";
    return ((p[0] || "?")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }
  function avatar(name, url) {
    var el = h("div", { class: "azt-av" });
    if (url) { var img = h("img", { src: url, alt: "" }); img.onerror = function () { clear(el); el.textContent = initials(name); }; el.appendChild(img); }
    else el.textContent = initials(name);
    return el;
  }
  var tt;
  function toast(msg, err) {
    var o = document.querySelector(".azt-toast"); if (o) o.remove();
    var t = h("div", { class: "azt-toast" + (err ? " err" : ""), text: msg, role: "status" });
    document.body.appendChild(t);
    clearTimeout(tt); tt = setTimeout(function () { t.remove(); }, 3200);
  }
  function memberstack() {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function poll() {
        if (window.$memberstackDom) return resolve(window.$memberstackDom);
        if (Date.now() - t0 > 5000) return resolve(null);
        setTimeout(poll, 100);
      })();
    });
  }
  async function api(path, opts) {
    opts = opts || {};
    var headers = { "Content-Type": "application/json" };
    if (opts.auth) {
      var ms = await memberstack();
      var t = null;
      try { t = ms ? await ms.getMemberCookie() : null; } catch (e) {}
      if (t) headers.Authorization = "Bearer " + t;
    }
    var r = await fetch(API + path, { method: opts.method || "GET", headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined, cache: opts.auth ? "no-store" : "default" });
    var data = {};
    try { data = await r.json(); } catch (e) {}
    if (!r.ok) { var err = new Error(data.error || "Something went wrong. Please try again."); err.status = r.status; throw err; }
    return data;
  }
  function modal(title, body, foot) {
    var prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    var ov = h("div", { class: "azt-ov" }, h("div", { class: "azt-modal", role: "dialog", "aria-modal": "true" }, [
      h("div", { class: "azt-mh" }, [h("h3", { text: title }), h("button", { class: "azt-x", type: "button", "aria-label": "Close", text: "×", onclick: function () { close(); } })]),
      h("div", { class: "azt-mb" }, body),
      h("div", { class: "azt-mf" }, foot),
    ]));
    function key(e) { if (e.key === "Escape") close(); }
    function close() { ov.remove(); document.removeEventListener("keydown", key); document.documentElement.style.overflow = prev; }
    ov.addEventListener("mousedown", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", key);
    document.body.appendChild(ov);
    return close;
  }
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var max = 1200, w = img.naturalWidth, hh = img.naturalHeight, s = Math.min(1, max / Math.max(w, hh));
        var c = document.createElement("canvas"); c.width = Math.round(w * s); c.height = Math.round(hh * s);
        var ctx = c.getContext("2d"); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.88).split(",")[1]);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Couldn't read that photo.")); };
      img.src = url;
    });
  }

  /* ------------------------------------------------------------ state */
  var S = { team: [], admin: false };
  var root, gridEl;

  function card(m, i) {
    var photo = h("div", { class: "azt-photo" });
    if (m.photo) {
      var img = h("img", { src: m.photo, alt: m.name, loading: "lazy" });
      img.onerror = function () { img.remove(); photo.insertBefore(h("div", { class: "azt-initials", text: initials(m.name) }), photo.firstChild); };
      photo.appendChild(img);
    } else photo.appendChild(h("div", { class: "azt-initials", text: initials(m.name) }));
    photo.appendChild(h("div", { class: "azt-who" }, [h("h3", { text: m.name }), m.role ? h("span", { class: "azt-role", text: m.role }) : null]));

    var c = h("article", { class: "azt-card" + (m.hidden ? " hidden" : "") }, [
      photo,
      h("div", { class: "azt-body" }, [
        m.quote ? h("blockquote", { class: "azt-quote", text: m.quote }) : null,
        m.link ? h("a", { class: "azt-link", href: m.link, target: "_blank", rel: "noopener" }, ["Connect with " + m.name.split(" ")[0] + " →"]) : null,
      ]),
    ]);
    if (S.admin) {
      if (m.hidden) c.appendChild(h("span", { class: "azt-hiddenflag", text: "Hidden" }));
      c.appendChild(h("div", { class: "azt-tools" }, [
        h("button", { type: "button", title: "Move earlier", "aria-label": "Move earlier", disabled: i === 0 ? true : null, text: "←", onclick: function () { move(i, -1); } }),
        h("button", { type: "button", title: "Move later", "aria-label": "Move later", disabled: i === S.team.length - 1 ? true : null, text: "→", onclick: function () { move(i, 1); } }),
        h("button", { type: "button", title: "Edit", "aria-label": "Edit", text: "✎", onclick: function () { editor(m); } }),
        h("button", { type: "button", title: m.hidden ? "Show on page" : "Hide from page", "aria-label": m.hidden ? "Show" : "Hide", text: m.hidden ? "◉" : "◌", onclick: function () { toggleHidden(m); } }),
      ]));
    }
    return c;
  }

  function draw() {
    clear(gridEl);
    if (!S.team.length) {
      gridEl.style.display = "block";
      gridEl.appendChild(h("div", { class: "azt-empty" }, [h("div", { class: "big", text: "✨" }),
        h("h3", { text: S.admin ? "Add your first team member" : "Our team page is coming together" }),
        h("p", { text: S.admin ? "Pick any Azora member, then give them a role and a quote." : "Check back soon to meet the people behind Azora." }),
        S.admin ? h("button", { class: "azt-btn p", type: "button", text: "+ Add team member", onclick: function () { editor(null); } }) : null]));
      return;
    }
    gridEl.style.display = "";
    S.team.forEach(function (m, i) { gridEl.appendChild(card(m, i)); });
  }

  async function move(i, d) {
    var j = i + d;
    if (j < 0 || j >= S.team.length) return;
    var t = S.team[i]; S.team[i] = S.team[j]; S.team[j] = t;
    draw();
    try { await api("/api/team", { method: "POST", auth: true, body: { action: "reorder", ids: S.team.map(function (m) { return m.id; }) } }); }
    catch (e) { toast(e.message, true); load(); }
  }
  async function toggleHidden(m) {
    try {
      await api("/api/team?id=" + m.id, { method: "PATCH", auth: true, body: { hidden: !m.hidden } });
      m.hidden = !m.hidden; draw();
      toast(m.hidden ? m.name + " is hidden from the page." : m.name + " is back on the page.");
    } catch (e) { toast(e.message, true); }
  }

  function editor(m) {
    var editing = !!m;
    var picked = editing ? { id: m.memberId, name: m.memberName, avatar: m.memberPhoto } : null;
    var photoOverride = editing ? m.photoOverride : "";
    var err = h("div", { class: "azt-err" });

    // member picker
    var pickBox = h("div");
    function drawPick() {
      clear(pickBox);
      if (picked) {
        pickBox.appendChild(h("div", { class: "azt-picked" }, [avatar(picked.name, picked.avatar),
          h("div", null, [h("div", { class: "nm", text: picked.name }), picked.email ? h("div", { class: "em", text: picked.email }) : null]),
          editing ? null : h("button", { class: "azt-btn ghost sm", type: "button", text: "Change", onclick: function () { picked = null; drawPick(); drawPhoto(); } })]));
        return;
      }
      var q = h("input", { class: "azt-input", type: "search", placeholder: "Search members by name, email or business…", autocomplete: "off" });
      var results = h("div", { class: "azt-results" });
      var timer, seq = 0;
      async function run() {
        var my = ++seq;
        clear(results).appendChild(h("div", { class: "azt-hint", text: "Searching…" }));
        try {
          var d = await api("/api/team?search=" + encodeURIComponent(q.value.trim()), { auth: true });
          if (my !== seq) return;
          clear(results);
          if (!d.members.length) results.appendChild(h("div", { class: "azt-hint", text: "No members match that." }));
          d.members.forEach(function (x) {
            results.appendChild(h("button", { class: "azt-res", type: "button", disabled: x.onTeam ? true : null, onclick: function () { picked = x; drawPick(); drawPhoto(); setTimeout(function () { role.focus(); }, 20); } }, [
              avatar(x.name, x.avatar),
              h("div", { style: "min-width:0" }, [h("div", { class: "nm", text: x.name }), h("div", { class: "em", text: [x.email, x.business].filter(Boolean).join(" · ") })]),
              x.onTeam ? h("span", { class: "tag", text: "Already on the team" }) : null,
            ]));
          });
        } catch (e) { if (my === seq) clear(results).appendChild(h("div", { class: "azt-err", text: e.message })); }
      }
      q.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(run, 250); });
      pickBox.appendChild(q); pickBox.appendChild(results);
      run();
      setTimeout(function () { q.focus(); }, 30);
    }

    var role = h("input", { class: "azt-input", maxlength: "80", value: editing ? m.role : "", placeholder: "e.g. Founder & CEO" });
    var quote = h("textarea", { class: "azt-ta", maxlength: "400", placeholder: "Something they live by, or why they're here." });
    quote.value = editing ? m.quote : "";
    var count = h("span", { text: quote.value.length + " / 400" });
    quote.addEventListener("input", function () { count.textContent = quote.value.length + " / 400"; });
    var name = h("input", { class: "azt-input", maxlength: "80", value: editing ? m.nameOverride : "", placeholder: "Leave blank to use their profile name" });
    var link = h("input", { class: "azt-input", maxlength: "500", value: editing ? m.link : "", placeholder: "Optional: LinkedIn, website, business page…" });
    var hidden = h("input", { type: "checkbox" }); hidden.checked = editing && m.hidden;

    // photo
    var photoBox = h("div", { class: "azt-photo-row" });
    var file = h("input", { type: "file", accept: "image/*", style: "display:none" });
    var uploading = false;
    function drawPhoto() {
      clear(photoBox);
      var current = photoOverride || (picked && picked.avatar) || "";
      photoBox.appendChild(avatar((picked && picked.name) || "?", current));
      photoBox.appendChild(h("div", { style: "flex:1;min-width:0;font-size:13.5px;color:var(--silver)", text: uploading ? "Uploading…" : photoOverride ? "Custom photo" : current ? "Their profile photo" : "No photo yet (initials will show)" }));
      photoBox.appendChild(h("button", { class: "azt-btn sm", type: "button", text: "Upload photo", onclick: function () { file.click(); } }));
      if (photoOverride) photoBox.appendChild(h("button", { class: "azt-btn ghost sm", type: "button", text: "Use profile photo", onclick: function () { photoOverride = ""; drawPhoto(); } }));
    }
    file.addEventListener("change", async function () {
      var f = file.files[0]; file.value = "";
      if (!f) return;
      uploading = true; drawPhoto();
      try {
        var data = await shrink(f);
        var r = await api("/api/upload", { method: "POST", auth: true, body: { data: data, contentType: "image/jpeg" } });
        photoOverride = r.url;
      } catch (e) { toast(e.message, true); }
      uploading = false; drawPhoto();
    });

    var save = h("button", { class: "azt-btn p", type: "button", text: editing ? "Save" : "Add to team" });
    var close = modal(editing ? "Edit " + m.name : "Add a team member", [
      h("div", null, [h("div", { class: "azt-label", text: "Member" }), pickBox]),
      h("div", null, [h("div", { class: "azt-label", text: "Role" }), role]),
      h("div", null, [h("div", { class: "azt-label" }, ["Quote", count]), quote]),
      h("div", null, [h("div", { class: "azt-label", text: "Photo" }), photoBox, file]),
      h("div", null, [h("div", { class: "azt-label" }, ["Display name", h("span", { text: "optional" })]), name]),
      h("div", null, [h("div", { class: "azt-label" }, ["Link", h("span", { text: "optional" })]), link]),
      h("label", { class: "azt-check" }, [hidden, "Hide from the page for now"]),
      err,
    ], [
      editing ? h("button", { class: "azt-btn danger", type: "button", text: "Remove", style: "margin-right:auto", onclick: async function () {
        if (!window.confirm("Take " + m.name + " off the team page?")) return;
        try { await api("/api/team?id=" + m.id, { method: "DELETE", auth: true }); close(); toast(m.name + " removed from the team page."); load(); } catch (e) { err.textContent = e.message; }
      } }) : null,
      h("button", { class: "azt-btn ghost", type: "button", text: "Cancel", onclick: function () { close(); } }),
      save,
    ]);
    drawPick(); drawPhoto();
    if (editing) setTimeout(function () { role.focus(); }, 30);

    save.addEventListener("click", async function () {
      err.textContent = "";
      if (!picked) { err.textContent = "Search for a member and pick them first."; return; }
      if (uploading) { err.textContent = "Hang on, the photo is still uploading."; return; }
      var body = { role: role.value, quote: quote.value, nameOverride: name.value, photoOverride: photoOverride, link: link.value, hidden: hidden.checked };
      save.disabled = true;
      try {
        if (editing) await api("/api/team?id=" + m.id, { method: "PATCH", auth: true, body: body });
        else { body.memberId = picked.id; await api("/api/team", { method: "POST", auth: true, body: body }); }
        close(); toast(editing ? "Saved" : (picked.name + " added to the team!")); load();
      } catch (e) { err.textContent = e.message; save.disabled = false; }
    });
  }

  async function load() {
    try {
      var d;
      if (S.admin) d = await api("/api/team?admin=1", { auth: true });
      else {
        try { d = await api("/api/team"); }
        catch (e) { if (e.status === 503) d = await api("/api/team", { auth: true }); else throw e; } // dev mode: developers can still see it
      }
      S.team = d.team;
    } catch (e) {
      clear(gridEl); gridEl.style.display = "block";
      gridEl.appendChild(h("div", { class: "azt-empty" }, [h("div", { class: "big", text: e.status === 503 ? "🚧" : "⚠️" }), h("h3", { text: e.status === 503 ? "Under construction" : "Couldn't load the team" }), h("p", { text: e.message })]));
      return;
    }
    draw();
  }

  async function boot(el) {
    root = el;
    if (!document.getElementById("azt-css")) document.head.appendChild(h("style", { id: "azt-css", text: CSS }));
    el.classList.add("azt");
    clear(el);
    var title = el.getAttribute("data-title");
    var sub = el.getAttribute("data-subtitle") || "Every dream needs a team. These are the people turning Azora's into reality, one connection at a time.";
    el.appendChild(h("section", { class: "azt-hero" }, [
      h("div", { class: "azt-eyebrow" }, [h("i"), "The Dream Team"]),
      title ? h("h1", { text: title }) : h("h1", null, ["Meet the people ", h("span", { text: "behind Azora." })]),
      h("p", { text: sub }),
    ]));
    var adminSlot = h("div");
    el.appendChild(adminSlot);
    gridEl = h("div", { class: "azt-grid" }, [h("div", { class: "azt-skel" }), h("div", { class: "azt-skel" }), h("div", { class: "azt-skel" })]);
    el.appendChild(gridEl);

    // Are they an admin? (the server double-checks every change)
    var ms = await memberstack();
    try {
      var m = ms ? ((await ms.getCurrentMember()) || {}).data : null;
      S.admin = !!(m && (m.planConnections || []).some(function (p) { return p.planId === ADMIN_PLAN && /^(active|trialing)$/i.test(String(p.status || "active")); }));
    } catch (e) {}
    if (S.admin) {
      adminSlot.appendChild(h("div", { class: "azt-admin" }, [
        h("span", null, "✎ You're an admin: add, edit, reorder or hide team members right here."),
        h("button", { class: "azt-btn p sm", type: "button", text: "+ Add team member", onclick: function () { editor(null); } }),
      ]));
    }
    load();
  }

  function start() { var el = document.querySelector("[data-azora-team]"); if (el) boot(el); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
