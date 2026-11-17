/*!
 * Azora Forums widget — the whole azoraapp.com/forums page.
 *   <div data-azora-forums></div>
 *   <script src="https://YOUR-PROJECT.vercel.app/azora-forums.js" defer></script>
 *
 * Optional attributes on the <div>:
 *   data-login-url="/login"   data-signup-url="/signup"
 *
 * Everyone can read and search. Logged-in members can post, reply, mark things
 * helpful and report. Moderators and admins get the moderation tools.
 * The API checks every permission again on the server.
 */
(function () {
  "use strict";
  if (window.AzoraForums) return;
  window.AzoraForums = true;

  var SCRIPT = document.currentScript;
  var API = ((SCRIPT && SCRIPT.getAttribute("data-api")) ||
    (SCRIPT && SCRIPT.src ? new URL(SCRIPT.src).origin : "")).replace(/\/$/, "");

  /* ================================================================= CSS */
  var CSS = `
.azf, .azf *, .azf-ov, .azf-ov *, .azf-menu, .azf-menu *, .azf-lb, .azf-lb *, .azf-toast { box-sizing:border-box; }
.azf, .azf-ov, .azf-menu, .azf-lb, .azf-toast { --bg:#000; --panel:#0b0b12; --panel2:#10101a; --panel3:#151522; --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.14);
  --text:#f2f3f8; --silver:#c4c8d4; --dim:#8f95a8; --faint:#5d6375; --violet:#8b6cff; --blue:#4d8dff; --green:#38d39f; --amber:#ffbf47; --danger:#ff5d7a;
  --grad:linear-gradient(135deg,#7c4dff 0%,#5468ff 50%,#2f8cff 100%); --gradSoft:linear-gradient(135deg,rgba(124,77,255,.18),rgba(47,140,255,.14)); }
.azf { color:var(--text); font-size:15px; line-height:1.55; width:100%; max-width:1180px; margin:0 auto; padding:0 16px 80px; text-align:left;
  font-family:inherit; -webkit-font-smoothing:antialiased; }
:where(.azf, .azf-ov, .azf-menu, .azf-lb) :is(button, input, textarea, select) { font:inherit; color:inherit; }
:where(.azf, .azf-ov, .azf-menu, .azf-lb) button { cursor:pointer; border:0; background:none; padding:0; line-height:1.2; }
:where(.azf, .azf-ov, .azf-menu) :is(h1, h2, h3, h4, p, ul, ol) { margin:0; padding:0; }
:where(.azf, .azf-ov, .azf-menu) a { color:inherit; text-decoration:none; }
.azf-ov, .azf-menu, .azf-toast { font-family:inherit; -webkit-font-smoothing:antialiased; }
.azf svg, .azf-ov svg, .azf-menu svg { display:block; flex:none; }

/* ---------- hero ---------- */
.azf-hero { position:relative; border:1px solid var(--line); border-radius:22px; overflow:hidden; padding:34px 32px 28px; margin:8px 0 22px;
  background:radial-gradient(900px 260px at 0% 0%, rgba(124,77,255,.28), transparent 60%), radial-gradient(700px 240px at 100% 100%, rgba(47,140,255,.22), transparent 60%), #07070d; }
.azf-hero::after { content:""; position:absolute; inset:0; pointer-events:none; background-image:radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px); background-size:22px 22px; mask-image:linear-gradient(180deg,#000,transparent 85%); }
.azf-hero-top { position:relative; z-index:1; display:flex; gap:20px; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; }
.azf-eyebrow { font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--silver); opacity:.8; margin-bottom:8px; display:flex; align-items:center; gap:8px; }
.azf-eyebrow i { width:6px; height:6px; border-radius:50%; background:var(--green); box-shadow:0 0 10px var(--green); display:block; }
.azf-hero h1 { font-size:clamp(28px,4vw,40px); font-weight:700; letter-spacing:-.02em; line-height:1.1; }
.azf-hero h1 span { background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; }
.azf-hero p.azf-sub { color:var(--silver); margin-top:10px; max-width:560px; }
.azf-stats { display:flex; gap:22px; margin-top:16px; color:var(--dim); font-size:13px; flex-wrap:wrap; }
.azf-stats b { color:var(--text); font-weight:600; margin-right:4px; }
.azf-search { position:relative; z-index:1; margin-top:22px; display:flex; gap:10px; }
.azf-search-box { flex:1; display:flex; align-items:center; gap:10px; background:rgba(0,0,0,.55); border:1px solid var(--line2); border-radius:14px; padding:0 14px; transition:border-color .15s, box-shadow .15s; }
.azf-search-box:focus-within { border-color:rgba(139,108,255,.7); box-shadow:0 0 0 4px rgba(124,77,255,.15); }
.azf-search-box input { flex:1; min-width:0; background:none; border:0; outline:none; padding:14px 0; font-size:15px; }
.azf-search-box svg { color:var(--dim); }

/* ---------- buttons ---------- */
.azf-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; height:40px; padding:0 16px; border-radius:11px; font-weight:600; font-size:14px;
  background:var(--panel3); border:1px solid var(--line2) !important; color:var(--text); white-space:nowrap; transition:background .15s, transform .1s, border-color .15s; }
.azf-btn:hover { background:#1c1c2c; border-color:rgba(255,255,255,.22) !important; }
.azf-btn:active { transform:translateY(1px); }
.azf-btn.primary { background:var(--grad); border-color:transparent !important; box-shadow:0 10px 30px -12px rgba(84,104,255,.8); }
.azf-btn.primary:hover { filter:brightness(1.1); }
.azf-btn.big { height:50px; padding:0 22px; border-radius:14px; font-size:15px; }
.azf-btn.sm { height:32px; padding:0 11px; font-size:13px; border-radius:9px; }
.azf-btn.ghost { background:none; border-color:transparent !important; color:var(--silver); }
.azf-btn.ghost:hover { background:rgba(255,255,255,.06); color:var(--text); }
.azf-btn.danger { background:rgba(255,93,122,.12); border-color:rgba(255,93,122,.35) !important; color:#ff8fa3; }
.azf-btn[disabled] { opacity:.5; pointer-events:none; }
.azf-icon-btn { width:34px; height:34px; border-radius:9px; display:inline-flex; align-items:center; justify-content:center; color:var(--dim); transition:background .15s,color .15s; }
.azf-icon-btn:hover { background:rgba(255,255,255,.07); color:var(--text); }

/* ---------- layout ---------- */
.azf-layout { display:grid; grid-template-columns:250px minmax(0,1fr); gap:24px; align-items:start; }
.azf-side { position:sticky; top:16px; display:flex; flex-direction:column; gap:14px; }
.azf-card { background:var(--panel); border:1px solid var(--line); border-radius:16px; }
.azf-side-sec { padding:10px; }
.azf-side-h { font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--faint); padding:8px 10px 6px; display:flex; justify-content:space-between; align-items:center; }
.azf-nav { display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:10px; color:var(--silver); font-size:14px; transition:background .12s,color .12s; width:100%; text-align:left; }
.azf-nav:hover { background:rgba(255,255,255,.05); color:var(--text); }
.azf-nav.on { background:var(--gradSoft); color:#fff; box-shadow:inset 0 0 0 1px rgba(139,108,255,.3); }
.azf-nav .ic { width:28px; height:28px; border-radius:8px; background:var(--panel3); display:flex; align-items:center; justify-content:center; font-size:15px; flex:none; }
.azf-nav .nm { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.azf-nav .ct { font-size:12px; color:var(--faint); }
.azf-me { padding:14px; display:flex; flex-direction:column; gap:10px; }
.azf-me-row { display:flex; align-items:center; gap:10px; }
.azf-me-name { font-weight:600; font-size:14px; line-height:1.25; }
.azf-me-sub { font-size:12px; color:var(--dim); }
.azf-toggle { display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:13px; color:var(--silver); padding:4px 2px; width:100%; }
.azf-switch { width:36px; height:20px; border-radius:20px; background:#2a2a3a; position:relative; transition:background .15s; flex:none; }
.azf-switch::after { content:""; position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform .15s; }
.azf-switch.on { background:var(--blue); } .azf-switch.on::after { transform:translateX(16px); }
.azf-chips { display:none; gap:8px; overflow-x:auto; padding:2px 0 12px; scrollbar-width:none; }
.azf-chips::-webkit-scrollbar { display:none; }
.azf-chip { flex:none; display:inline-flex; align-items:center; gap:6px; height:34px; padding:0 12px; border-radius:20px; background:var(--panel2); border:1px solid var(--line) !important; font-size:13px; color:var(--silver); white-space:nowrap; }
.azf-chip.on { background:var(--gradSoft); color:#fff; border-color:rgba(139,108,255,.45) !important; }

/* ---------- feed ---------- */
.azf-feed-head > * { min-width:0; max-width:100%; }
.azf-feed-head { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; margin-bottom:12px; flex-wrap:wrap; }
.azf-feed-title h2 { font-size:22px; font-weight:700; letter-spacing:-.01em; display:flex; align-items:center; gap:10px; }
.azf-feed-title p { color:var(--dim); font-size:14px; margin-top:4px; max-width:620px; }
.azf-tabs { display:flex; gap:4px; background:var(--panel); border:1px solid var(--line); padding:4px; border-radius:12px; overflow-x:auto; scrollbar-width:none; }
.azf-tab { height:32px; padding:0 12px; border-radius:9px; font-size:13px; color:var(--dim); white-space:nowrap; font-weight:500; }
.azf-tab:hover { color:var(--text); }
.azf-tab.on { background:var(--panel3); color:#fff; box-shadow:inset 0 0 0 1px var(--line2); }
.azf-list { display:flex; flex-direction:column; gap:10px; }
.azf-item { display:flex; gap:16px; padding:16px 18px; background:var(--panel); border:1px solid var(--line); border-radius:16px; transition:border-color .15s, background .15s, transform .15s; position:relative; }
.azf-item:hover { border-color:rgba(139,108,255,.35); background:#0e0e17; }
.azf-item.pinned { border-color:rgba(255,191,71,.25); }
.azf-item-main { flex:1; min-width:0; }
.azf-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:12.5px; color:var(--dim); }
.azf-dot { width:3px; height:3px; border-radius:50%; background:var(--faint); display:block; }
.azf-item h3 { font-size:16.5px; font-weight:600; line-height:1.35; margin:7px 0 5px; color:#fff; letter-spacing:-.005em; }
.azf-item .ex { color:var(--silver); font-size:14px; opacity:.85; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.azf-item-foot { display:flex; align-items:center; gap:16px; margin-top:12px; font-size:13px; color:var(--dim); flex-wrap:wrap; }
.azf-item-foot .st { display:inline-flex; align-items:center; gap:6px; }
.azf-thumb { width:96px; height:96px; border-radius:12px; overflow:hidden; flex:none; background:var(--panel3); position:relative; align-self:center; }
.azf-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
.azf-thumb span { position:absolute; right:6px; bottom:6px; background:rgba(0,0,0,.7); font-size:11px; padding:2px 6px; border-radius:6px; }
.azf-badge { display:inline-flex; align-items:center; gap:4px; height:21px; padding:0 8px; border-radius:6px; font-size:11.5px; font-weight:600; letter-spacing:.01em; background:var(--panel3); color:var(--silver); border:1px solid var(--line); white-space:nowrap; }
.azf-badge.q { color:#b9a8ff; background:rgba(139,108,255,.1); border-color:rgba(139,108,255,.28); }
.azf-badge.tip { color:#8fc0ff; background:rgba(77,141,255,.1); border-color:rgba(77,141,255,.28); }
.azf-badge.solved { color:#6ff0c0; background:rgba(56,211,159,.1); border-color:rgba(56,211,159,.3); }
.azf-badge.pin { color:#ffd27a; background:rgba(255,191,71,.08); border-color:rgba(255,191,71,.28); }
.azf-badge.lock { color:var(--dim); }
.azf-badge.biz { color:#8fc0ff; background:rgba(77,141,255,.12); border-color:rgba(77,141,255,.3); height:19px; font-size:10.5px; padding:0 6px; }
.azf-badge.role { color:#d7c9ff; background:var(--grad); border:0; height:19px; font-size:10.5px; padding:0 7px; color:#fff; }
.azf-forum-chip { display:inline-flex; align-items:center; gap:5px; color:var(--silver); font-weight:500; }
.azf-forum-chip:hover { color:#fff; }
.azf-more { display:flex; justify-content:center; padding:16px 0; }
.azf-empty { text-align:center; padding:56px 20px; border:1px dashed var(--line2); border-radius:16px; color:var(--dim); }
.azf-empty .big { font-size:34px; margin-bottom:10px; }
.azf-empty h3 { color:#fff; font-size:17px; margin-bottom:6px; }
.azf-empty .azf-btn { margin-top:16px; }
.azf-skel { height:118px; border-radius:16px; background:linear-gradient(90deg,var(--panel) 0%,#12121c 50%,var(--panel) 100%); background-size:200% 100%; animation:azf-sh 1.2s infinite; border:1px solid var(--line); }
@keyframes azf-sh { to { background-position:-200% 0; } }

/* ---------- avatar / author ---------- */
.azf-av { width:32px; height:32px; border-radius:50%; overflow:hidden; flex:none; background:var(--grad); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; color:#fff; }
.azf-av img { width:100%; height:100%; object-fit:cover; display:block; }
.azf-av.sm { width:22px; height:22px; font-size:9.5px; }
.azf-av.lg { width:40px; height:40px; font-size:14px; }
.azf-author { display:inline-flex; align-items:center; gap:8px; min-width:0; }
.azf-author .nm { color:var(--text); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.azf-author .bz { color:var(--dim); font-size:12px; }

/* ---------- thread page ---------- */
.azf-back { display:inline-flex; align-items:center; gap:6px; color:var(--dim); font-size:14px; margin-bottom:14px; }
.azf-back:hover { color:#fff; }
.azf-post { padding:24px 26px; }
.azf-post h1 { font-size:clamp(21px,2.6vw,27px); font-weight:700; line-height:1.25; letter-spacing:-.015em; margin:12px 0 14px; }
.azf-post-author { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
.azf-post-author .when { font-size:12.5px; color:var(--dim); }
.azf-actions { display:flex; align-items:center; gap:6px; margin-top:18px; flex-wrap:wrap; }
.azf-helpful { display:inline-flex; align-items:center; gap:7px; height:34px; padding:0 12px; border-radius:20px; border:1px solid var(--line2) !important; color:var(--silver); font-size:13px; font-weight:600; transition:all .15s; }
.azf-helpful:hover { border-color:rgba(139,108,255,.6) !important; color:#fff; }
.azf-helpful.on { background:var(--gradSoft); border-color:rgba(139,108,255,.6) !important; color:#fff; }
.azf-helpful.on svg { color:#b9a8ff; }
.azf-act { display:inline-flex; align-items:center; gap:6px; height:34px; padding:0 10px; border-radius:9px; color:var(--dim); font-size:13px; font-weight:500; }
.azf-act:hover { background:rgba(255,255,255,.06); color:#fff; }
.azf-photos { display:grid; gap:8px; margin-top:16px; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); }
.azf-photos.one { grid-template-columns:minmax(0,560px); }
.azf-photos button { border-radius:12px; overflow:hidden; aspect-ratio:4/3; background:var(--panel3); border:1px solid var(--line) !important; }
.azf-photos.one button { aspect-ratio:auto; max-height:460px; }
.azf-photos img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .3s; }
.azf-photos button:hover img { transform:scale(1.03); }
.azf-locked-note, .azf-removed-note { display:flex; gap:10px; align-items:center; padding:12px 14px; border-radius:12px; font-size:13.5px; margin-top:14px; }
.azf-locked-note { background:rgba(255,255,255,.04); color:var(--silver); border:1px solid var(--line); }
.azf-removed-note { background:rgba(255,93,122,.08); color:#ff9cae; border:1px solid rgba(255,93,122,.25); margin:0 0 14px; }
.azf-ans-head { display:flex; align-items:center; justify-content:space-between; margin:28px 0 12px; }
.azf-ans-head h2 { font-size:17px; font-weight:700; }
.azf-ans { padding:18px 20px; margin-bottom:10px; scroll-margin-top:20px; }
.azf-ans.solution { border-color:rgba(56,211,159,.45); box-shadow:0 0 0 1px rgba(56,211,159,.15), 0 20px 50px -30px rgba(56,211,159,.5); }
.azf-ans.flash { animation:azf-flash 2s ease-out; }
@keyframes azf-flash { 0%,30% { box-shadow:0 0 0 2px rgba(139,108,255,.9); } 100% { box-shadow:none; } }
.azf-sol-tag { display:flex; align-items:center; gap:7px; color:#6ff0c0; font-size:12.5px; font-weight:700; margin-bottom:10px; letter-spacing:.02em; }
.azf-ans-top { display:flex; align-items:center; gap:10px; justify-content:space-between; }
.azf-ans-body { margin-top:10px; }
.azf-kids { margin-top:12px; margin-left:14px; padding-left:16px; border-left:2px solid var(--line); display:flex; flex-direction:column; gap:12px; }
.azf-kid { scroll-margin-top:20px; border-radius:10px; }
.azf-kid.flash { animation:azf-flash 2s ease-out; }
.azf-gone { color:var(--faint); font-style:italic; font-size:14px; }
.azf-modflag { color:#ff9cae; font-size:12px; font-weight:600; }

/* ---------- markdown ---------- */
.azf-md { color:#e3e5ee; font-size:15px; line-height:1.7; word-wrap:break-word; overflow-wrap:anywhere; }
.azf-md > * + * { margin-top:.75em; }
.azf-md h4 { font-size:16px; font-weight:700; color:#fff; margin-top:1.1em; }
.azf-md ul, .azf-md ol { padding-left:1.4em; }
.azf-md li + li { margin-top:.25em; }
.azf-md a { color:#9fbcff; text-decoration:underline; text-decoration-color:rgba(159,188,255,.4); text-underline-offset:2px; }
.azf-md code { background:rgba(255,255,255,.08); padding:.1em .4em; border-radius:5px; font-size:.9em; font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
.azf-md pre { background:#06060a; border:1px solid var(--line); border-radius:10px; padding:12px 14px; overflow:auto; }
.azf-md pre code { background:none; padding:0; }
.azf-md blockquote { border-left:3px solid var(--violet); padding:2px 0 2px 14px; color:var(--silver); }
.azf-md strong { color:#fff; }

/* ---------- composer ---------- */
.azf-compose { padding:16px; margin-top:16px; }
.azf-compose.inline { padding:12px; margin-top:10px; background:var(--panel2); }
.azf-ta { width:100%; min-height:110px; resize:vertical; background:#06060b; border:1px solid var(--line2); border-radius:12px; padding:12px 14px; outline:none; font-size:15px; line-height:1.6; display:block; transition:border-color .15s, box-shadow .15s; }
.azf-ta:focus, .azf-input:focus, .azf-select:focus { border-color:rgba(139,108,255,.7); box-shadow:0 0 0 4px rgba(124,77,255,.13); }
.azf-ta.sm { min-height:70px; font-size:14px; }
.azf-input, .azf-select { width:100%; height:46px; background:#06060b; border:1px solid var(--line2); border-radius:12px; padding:0 14px; outline:none; font-size:15px; transition:border-color .15s, box-shadow .15s; }
.azf-input.title { font-size:17px; font-weight:600; height:52px; }
.azf-select { appearance:none; -webkit-appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238f95a8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; }
.azf-select option { background:#0b0b12; }
.azf-compose-foot { display:flex; align-items:center; gap:8px; margin-top:10px; justify-content:space-between; flex-wrap:wrap; }
.azf-compose-foot .l { display:flex; gap:4px; align-items:center; color:var(--faint); font-size:12px; }
.azf-compose-foot .r { display:flex; gap:8px; margin-left:auto; }
.azf-thumbs { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
.azf-thumbs:empty { display:none; }
.azf-tthumb { width:74px; height:74px; border-radius:10px; overflow:hidden; position:relative; background:var(--panel3); border:1px solid var(--line); }
.azf-tthumb img { width:100%; height:100%; object-fit:cover; display:block; }
.azf-tthumb.busy img { opacity:.35; }
.azf-tthumb.busy::after { content:""; position:absolute; left:50%; top:50%; width:20px; height:20px; margin:-10px; border-radius:50%; border:2px solid rgba(255,255,255,.25); border-top-color:#fff; animation:azf-spin .7s linear infinite; }
.azf-tthumb button { position:absolute; top:4px; right:4px; width:22px; height:22px; border-radius:50%; background:rgba(0,0,0,.75); color:#fff; font-size:14px; line-height:22px; text-align:center; }
@keyframes azf-spin { to { transform:rotate(360deg); } }
.azf-login-cta { display:flex; align-items:center; gap:14px; justify-content:space-between; padding:18px 20px; margin-top:16px; flex-wrap:wrap; background:var(--gradSoft); border:1px solid rgba(139,108,255,.3); border-radius:16px; }
.azf-login-cta p { color:var(--silver); font-size:14px; }
.azf-login-cta b { color:#fff; display:block; font-size:15px; margin-bottom:2px; }

/* ---------- modal ---------- */
.azf-ov { position:fixed; inset:0; z-index:2147483000; background:rgba(0,0,0,.72); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); display:flex; align-items:flex-start; justify-content:center; padding:5vh 14px; overflow-y:auto; animation:azf-fade .15s ease-out; }
@keyframes azf-fade { from { opacity:0; } }
.azf-modal { width:100%; max-width:720px; background:#0a0a11; border:1px solid var(--line2); border-radius:20px; box-shadow:0 40px 120px -30px rgba(84,104,255,.45); animation:azf-pop .18s ease-out; color:var(--text); font-size:15px; line-height:1.55; text-align:left; }
.azf-modal.narrow { max-width:440px; }
@keyframes azf-pop { from { transform:translateY(10px) scale(.98); opacity:0; } }
.azf-modal-h { display:flex; align-items:center; justify-content:space-between; padding:18px 22px; border-bottom:1px solid var(--line); }
.azf-modal-h h3 { font-size:17px; font-weight:700; }
.azf-modal-b { padding:20px 22px; display:flex; flex-direction:column; gap:16px; }
.azf-modal-f { padding:14px 22px; border-top:1px solid var(--line); display:flex; justify-content:flex-end; gap:10px; align-items:center; }
.azf-modal-f .note { margin-right:auto; color:var(--faint); font-size:12.5px; }
.azf-label { font-size:13px; font-weight:600; color:var(--silver); margin-bottom:7px; display:flex; justify-content:space-between; }
.azf-label span { color:var(--faint); font-weight:400; }
.azf-seg { display:flex; gap:6px; flex-wrap:wrap; }
.azf-seg button { height:36px; padding:0 13px; border-radius:10px; border:1px solid var(--line2) !important; color:var(--silver); font-size:13.5px; font-weight:500; }
.azf-seg button.on { background:var(--gradSoft); border-color:rgba(139,108,255,.6) !important; color:#fff; }
.azf-row2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.azf-similar { background:rgba(77,141,255,.06); border:1px solid rgba(77,141,255,.22); border-radius:12px; padding:10px 12px; }
.azf-similar:empty { display:none; }
.azf-similar .h { font-size:12.5px; color:#9fc3ff; font-weight:600; margin-bottom:6px; }
.azf-similar a { display:flex; gap:8px; align-items:center; padding:6px 4px; font-size:14px; color:var(--text); border-radius:8px; }
.azf-similar a:hover { background:rgba(255,255,255,.05); }
.azf-similar a small { color:var(--dim); margin-left:auto; flex:none; font-size:12px; }
.azf-drop { border:1.5px dashed var(--line2); border-radius:12px; padding:14px; display:flex; align-items:center; gap:12px; color:var(--dim); font-size:13.5px; cursor:pointer; transition:border-color .15s, background .15s; }
.azf-drop:hover, .azf-drop.over { border-color:rgba(139,108,255,.6); background:rgba(124,77,255,.06); color:var(--silver); }
.azf-mdtabs { display:flex; gap:2px; margin-bottom:8px; }
.azf-mdtabs button { font-size:12.5px; padding:5px 10px; border-radius:7px; color:var(--dim); }
.azf-mdtabs button.on { background:var(--panel3); color:#fff; }
.azf-preview { min-height:110px; border:1px solid var(--line); border-radius:12px; padding:12px 14px; background:#06060b; }
.azf-err { color:#ff9cae; font-size:13.5px; background:rgba(255,93,122,.08); border:1px solid rgba(255,93,122,.25); border-radius:10px; padding:10px 12px; }
.azf-err:empty { display:none; }
.azf-hint { color:var(--faint); font-size:12.5px; }

/* ---------- menu ---------- */
.azf-menu { position:fixed; z-index:2147483100; min-width:210px; background:#0f0f18; border:1px solid var(--line2); border-radius:12px; padding:6px; box-shadow:0 24px 60px -10px rgba(0,0,0,.8); animation:azf-pop .12s ease-out; font-size:14px; color:var(--text); }
.azf-menu button { display:flex; align-items:center; gap:10px; width:100%; text-align:left; padding:9px 10px; border-radius:8px; color:var(--silver); }
.azf-menu button:hover { background:rgba(255,255,255,.06); color:#fff; }
.azf-menu button.danger { color:#ff8fa3; }
.azf-menu hr { border:0; border-top:1px solid var(--line); margin:5px 2px; }
.azf-menu .lbl { font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--faint); padding:6px 10px 4px; }

/* ---------- toast ---------- */
.azf-toast { position:fixed; left:50%; bottom:26px; transform:translateX(-50%); z-index:2147483200; background:#14141f; border:1px solid var(--line2); color:#fff; padding:11px 16px; border-radius:12px; font-size:14px; box-shadow:0 20px 50px -10px rgba(0,0,0,.8); animation:azf-pop .2s ease-out; max-width:calc(100vw - 32px); }
.azf-toast.err { border-color:rgba(255,93,122,.5); }

/* ---------- lightbox ---------- */
.azf-lb { position:fixed; inset:0; z-index:2147483300; background:rgba(0,0,0,.94); display:flex; align-items:center; justify-content:center; }
.azf-lb img { max-width:94vw; max-height:88vh; border-radius:8px; }
.azf-lb .x, .azf-lb .nav { position:absolute; width:44px; height:44px; border-radius:50%; background:rgba(255,255,255,.1); color:#fff; font-size:24px; display:flex; align-items:center; justify-content:center; }
.azf-lb .x { top:16px; right:16px; } .azf-lb .nav.p { left:16px; } .azf-lb .nav.n { right:16px; }
.azf-lb .ct { position:absolute; top:26px; left:50%; transform:translateX(-50%); color:var(--silver); font-size:13px; }

/* ---------- moderation ---------- */
.azf-mod-tabs { margin-bottom:16px; }
.azf-mrow { padding:16px 18px; display:flex; gap:14px; align-items:flex-start; }
.azf-mrow + .azf-mrow { border-top:1px solid var(--line); }
.azf-mrow .main { flex:1; min-width:0; }
.azf-mrow .t { font-weight:600; color:#fff; }
.azf-mrow .ex { color:var(--silver); font-size:14px; margin-top:4px; }
.azf-mrow .rs { margin-top:8px; display:flex; flex-direction:column; gap:3px; font-size:13px; color:var(--dim); }
.azf-mrow .btns { display:flex; gap:6px; flex-wrap:wrap; flex:none; }
.azf-count { min-width:22px; height:22px; border-radius:11px; background:var(--danger); color:#fff; font-size:12px; font-weight:700; display:inline-flex; align-items:center; justify-content:center; padding:0 6px; }
.azf-frow { display:grid; grid-template-columns:44px 1fr auto; gap:12px; align-items:center; padding:12px 16px; }
.azf-frow + .azf-frow { border-top:1px solid var(--line); }
.azf-frow .ic { width:44px; height:44px; border-radius:12px; background:var(--panel3); display:flex; align-items:center; justify-content:center; font-size:20px; }
.azf-log { font-size:13.5px; padding:10px 16px; display:flex; gap:12px; color:var(--silver); }
.azf-log + .azf-log { border-top:1px solid var(--line); }
.azf-log time { color:var(--faint); flex:none; width:90px; }

@media (max-width: 880px) {
  .azf-layout { grid-template-columns:1fr; }
  .azf-side { display:none; }
  .azf-chips { display:flex; }
  .azf-hero { padding:24px 20px 20px; border-radius:18px; }
  .azf-search { flex-direction:column; }
  .azf-post { padding:18px; }
  .azf-thumb { width:72px; height:72px; }
  .azf-row2 { grid-template-columns:1fr; }
  .azf-kids { margin-left:4px; padding-left:12px; }
}
@media (max-width: 520px) {
  .azf { padding:0 10px 60px; }
  .azf-item { padding:14px; gap:12px; }
  .azf-item h3 { font-size:15.5px; }
  .azf-feed-head { flex-direction:column; align-items:stretch; }
  .azf-author .bz { display:none; }
  .azf-item-foot { gap:12px; }
}
`;

  /* ================================================================ ICONS */
  var P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
    up: '<path d="M7 10v11"/><path d="M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 7a2 2 0 0 1-2 1.7H7V10l4-8a3 3 0 0 1 3 3.9Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkc: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    img: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    reply: '<path d="m9 14-5-5 5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v5"/>',
    flag: '<path d="M4 22V4a1 1 0 0 1 1-1h12l-2 5 2 5H5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    pin: '<path d="M12 17v5M9 3h6l-1 6 4 4H6l4-4Z"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    move: '<path d="M5 9 2 12l3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    restore: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
  };
  function icon(name, size) {
    var s = size || 16;
    var span = document.createElement("span");
    span.style.display = "inline-flex";
    span.innerHTML = '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + P[name] + "</svg>";
    return span.firstChild;
  }

  /* ============================================================ DOM utils */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "style") el.style.cssText = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (k === "value") el.value = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    add(el, kids);
    return el;
  }
  function add(el, kids) {
    if (kids === null || kids === undefined || kids === false) return;
    if (Array.isArray(kids)) { kids.forEach(function (k) { add(el, k); }); return; }
    el.appendChild(typeof kids === "string" || typeof kids === "number" ? document.createTextNode(String(kids)) : kids);
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  function ago(iso) {
    if (!iso) return "";
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 45) return "just now";
    if (s < 3600) return Math.round(s / 60) + "m ago";
    if (s < 86400) return Math.round(s / 3600) + "h ago";
    if (s < 86400 * 7) return Math.round(s / 86400) + "d ago";
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
  }
  function fullDate(iso) { return iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : ""; }
  function initials(name) {
    var p = String(name || "?").replace(/[^\p{L}\p{N}\s]/gu, "").trim().split(/\s+/).filter(Boolean);
    if (!p.length) return "?";
    return ((p[0] || "?")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }
  function avatar(a, size) {
    var el = h("div", { class: "azf-av" + (size ? " " + size : "") });
    if (a && a.avatar) {
      var img = h("img", { src: a.avatar, alt: "", loading: "lazy" });
      img.onerror = function () { clear(el); el.textContent = initials(a.business || a.name); };
      el.appendChild(img);
    } else el.textContent = initials(a && (a.business || a.name));
    return el;
  }
  function roleBadge(a) {
    if (a.role === "admin") return h("span", { class: "azf-badge role", text: "Azora team" });
    if (a.role === "moderator") return h("span", { class: "azf-badge role", text: "Moderator" });
    return null;
  }
  function authorLine(a, size) {
    var name = a.isBusiness && a.business ? a.business : a.name;
    return h("span", { class: "azf-author" }, [
      avatar(a, size),
      h("span", { class: "nm", text: name }),
      a.isBusiness ? h("span", { class: "azf-badge biz", text: "Business" }) : null,
      a.isBusiness && a.business && a.name && a.name !== a.business ? h("span", { class: "bz", text: "· " + a.name }) : null,
      roleBadge(a),
    ]);
  }
  function kindBadge(kind) {
    var label = (S.settings.kinds || {})[kind] || kind;
    return h("span", { class: "azf-badge " + (kind === "question" ? "q" : kind === "tip" ? "tip" : ""), text: label });
  }

  var toastTimer;
  function toast(msg, isErr) {
    var old = document.querySelector(".azf-toast");
    if (old) old.remove();
    var t = h("div", { class: "azf-toast" + (isErr ? " err" : ""), text: msg, role: "status" });
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, 3200);
  }

  /* ================================================================ modal */
  function modal(opts) {
    var prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    var box = h("div", { class: "azf-modal" + (opts.narrow ? " narrow" : ""), role: "dialog", "aria-modal": "true" });
    var ov = h("div", { class: "azf-ov" }, box);
    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      ov.remove();
      document.removeEventListener("keydown", key);
      document.documentElement.style.overflow = prev;
      opts.onClose && opts.onClose();
    }
    function key(e) {
      var all = document.querySelectorAll(".azf-ov");
      if (all[all.length - 1] !== ov || document.querySelector(".azf-lb")) return;
      if (e.key === "Escape" && (!opts.guard || opts.guard())) close();
    }
    ov.addEventListener("mousedown", function (e) { if (e.target === ov && (!opts.guard || opts.guard())) close(); });
    document.addEventListener("keydown", key);
    add(box, [
      h("div", { class: "azf-modal-h" }, [
        h("h3", { text: opts.title }),
        h("button", { class: "azf-icon-btn", type: "button", "aria-label": "Close", onclick: function () { if (!opts.guard || opts.guard()) close(); } }, icon("x", 18)),
      ]),
      opts.body ? h("div", { class: "azf-modal-b" }, opts.body) : null,
      opts.foot ? h("div", { class: "azf-modal-f" }, opts.foot) : null,
    ]);
    document.body.appendChild(ov);
    return close;
  }
  function confirmBox(title, text, okLabel, danger) {
    return new Promise(function (resolve) {
      var done = false, close;
      function fin(v) { if (done) return; done = true; resolve(v); close(); }
      close = modal({
        title: title, narrow: true,
        body: h("p", { style: "color:var(--silver)", text: text }),
        foot: [
          h("button", { class: "azf-btn ghost", type: "button", text: "Cancel", onclick: function () { fin(false); } }),
          h("button", { class: "azf-btn " + (danger === false ? "primary" : "danger"), type: "button", text: okLabel || "Delete", onclick: function () { fin(true); } }),
        ],
        onClose: function () { if (!done) { done = true; resolve(false); } },
      });
    });
  }
  function promptBox(title, label, placeholder, okLabel, danger) {
    return new Promise(function (resolve) {
      var done = false, close;
      var input = h("textarea", { class: "azf-ta sm", placeholder: placeholder || "", maxlength: "500" });
      function fin(v) { if (done) return; done = true; resolve(v); close(); }
      close = modal({
        title: title, narrow: true,
        body: [h("div", null, [h("div", { class: "azf-label", text: label }), input])],
        foot: [
          h("button", { class: "azf-btn ghost", type: "button", text: "Cancel", onclick: function () { fin(null); } }),
          h("button", { class: "azf-btn " + (danger ? "danger" : "primary"), type: "button", text: okLabel || "OK", onclick: function () { fin(input.value.trim()); } }),
        ],
        onClose: function () { if (!done) { done = true; resolve(null); } },
      });
      setTimeout(function () { input.focus(); }, 30);
    });
  }

  function menu(anchor, items) {
    var old = document.querySelector(".azf-menu");
    if (old) { var same = old._anchor === anchor; old._close(); if (same) return; }
    var m = h("div", { class: "azf-menu", role: "menu" });
    m._anchor = anchor;
    items.filter(Boolean).forEach(function (it) {
      if (it === "-") return m.appendChild(h("hr"));
      if (it.label) return m.appendChild(h("div", { class: "lbl", text: it.label }));
      m.appendChild(h("button", { type: "button", class: it.danger ? "danger" : "", onclick: function () { close(); it.run(); } }, [icon(it.icon), it.text]));
    });
    if (m.lastChild && m.lastChild.tagName === "HR") m.removeChild(m.lastChild);
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect();
    var mw = m.offsetWidth, mh = m.offsetHeight;
    var left = Math.min(window.innerWidth - mw - 10, Math.max(10, r.right - mw));
    var top = r.bottom + 6;
    if (top + mh > window.innerHeight - 10) top = Math.max(10, r.top - mh - 6);
    m.style.left = left + "px"; m.style.top = top + "px";
    function away(e) { if (!m.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) close(); }
    function close() { m.remove(); document.removeEventListener("mousedown", away); window.removeEventListener("scroll", close, true); }
    m._close = close;
    setTimeout(function () { document.addEventListener("mousedown", away); window.addEventListener("scroll", close, true); });
  }

  function lightbox(images, start) {
    var i = start || 0;
    var img = h("img", { alt: "" });
    var ct = h("div", { class: "ct" });
    var lb = h("div", { class: "azf-lb" }, [img,
      images.length > 1 ? ct : null,
      h("button", { class: "x", type: "button", "aria-label": "Close", text: "×", onclick: close }),
      images.length > 1 ? h("button", { class: "nav p", type: "button", "aria-label": "Previous", text: "‹", onclick: function (e) { e.stopPropagation(); step(-1); } }) : null,
      images.length > 1 ? h("button", { class: "nav n", type: "button", "aria-label": "Next", text: "›", onclick: function (e) { e.stopPropagation(); step(1); } }) : null,
    ]);
    function show() { img.src = images[i]; ct.textContent = (i + 1) + " / " + images.length; }
    function step(d) { i = (i + d + images.length) % images.length; show(); }
    function key(e) { if (e.key === "Escape") close(); if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); }
    function close() { lb.remove(); document.removeEventListener("keydown", key); }
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 45 && images.length > 1) step(dx < 0 ? 1 : -1); });
    document.addEventListener("keydown", key);
    document.body.appendChild(lb);
    show();
  }
  function photoGrid(images) {
    if (!images || !images.length) return null;
    return h("div", { class: "azf-photos" + (images.length === 1 ? " one" : "") }, images.map(function (u, i) {
      return h("button", { type: "button", "aria-label": "Open photo " + (i + 1), onclick: function () { lightbox(images, i); } }, h("img", { src: u, alt: "", loading: "lazy" }));
    }));
  }

  /* ============================================================= markdown */
  // Safe by construction: only elements + text nodes, never innerHTML.
  var INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(?:(?<![\w*])\*([^*\s][^*\n]*?)\*(?![\w*]))|(\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;
  function inline(text) {
    var out = [], last = 0, m;
    INLINE.lastIndex = 0;
    while ((m = INLINE.exec(text))) {
      if (m.index > last) out.push(text.slice(last, m.index));
      if (m[1]) out.push(h("code", { text: m[1].slice(1, -1) }));
      else if (m[2]) out.push(h("strong", { text: m[2].slice(2, -2) }));
      else if (m[3]) out.push(h("em", { text: m[3] }));
      else if (m[4]) out.push(h("a", { href: m[6], target: "_blank", rel: "noopener nofollow ugc", text: m[5] }));
      else if (m[7]) out.push(h("a", { href: m[7], target: "_blank", rel: "noopener nofollow ugc", text: m[7].replace(/^https?:\/\/(www\.)?/, "").slice(0, 60) }));
      last = INLINE.lastIndex;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }
  function markdown(src) {
    var root = h("div", { class: "azf-md" });
    var lines = String(src || "").split("\n"), i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (!line.trim()) { i++; continue; }
      if (/^\s*```/.test(line)) {
        var code = []; i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
        i++;
        root.appendChild(h("pre", null, h("code", { text: code.join("\n") })));
        continue;
      }
      var hd = /^#{1,4}\s+(.*)$/.exec(line);
      if (hd) { root.appendChild(h("h4", null, inline(hd[1]))); i++; continue; }
      if (/^\s*[-*]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
        var ordered = /^\s*\d/.test(line), list = h(ordered ? "ol" : "ul");
        var re = ordered ? /^\s*\d+[.)]\s+(.*)$/ : /^\s*[-*]\s+(.*)$/;
        while (i < lines.length && re.test(lines[i])) list.appendChild(h("li", null, inline(re.exec(lines[i++])[1])));
        root.appendChild(list);
        continue;
      }
      if (/^>\s?/.test(line)) {
        var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ""));
        root.appendChild(h("blockquote", null, inline(q.join(" "))));
        continue;
      }
      var para = [];
      while (i < lines.length && lines[i].trim() && !/^(\s*```|#{1,4}\s|\s*[-*]\s+|\s*\d+[.)]\s+|>)/.test(lines[i])) para.push(lines[i++]);
      var p = h("p");
      para.forEach(function (l, j) { if (j) p.appendChild(h("br")); add(p, inline(l)); });
      root.appendChild(p);
    }
    return root;
  }

  /* ===================================================== Memberstack + API */
  function memberstack(timeoutMs) {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function poll() {
        if (window.$memberstackDom) return resolve(window.$memberstackDom);
        if (Date.now() - t0 > (timeoutMs || 6000)) return resolve(null);
        setTimeout(poll, 100);
      })();
    });
  }
  async function token() {
    var ms = await memberstack();
    try { return ms ? await ms.getMemberCookie() : null; } catch (e) { return null; }
  }
  async function api(path, opts) {
    opts = opts || {};
    var headers = { "Content-Type": "application/json" };
    if (opts.auth || (S.me && opts.auth !== false)) {
      var t = await token();
      if (t) headers.Authorization = "Bearer " + t;
    }
    var r = await fetch(API + path, {
      method: opts.method || "GET", headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: headers.Authorization ? "no-store" : "default",
    });
    var data = {};
    try { data = await r.json(); } catch (e) {}
    if (!r.ok) {
      var err = new Error(data.error || "Something went wrong. Please try again.");
      err.status = r.status;
      throw err;
    }
    return data;
  }
  function act(body) { return api("/api/act", { method: "POST", body: body, auth: true }); }

  /* =============================================================== photos */
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) return reject(new Error("That file isn't a photo."));
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var max = 1800, w = img.naturalWidth, hh = img.naturalHeight;
        var s = Math.min(1, max / Math.max(w, hh));
        var c = document.createElement("canvas");
        c.width = Math.round(w * s); c.height = Math.round(hh * s);
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        var q = 0.86;
        (function out() {
          var data = c.toDataURL("image/jpeg", q);
          var b64 = data.split(",")[1];
          if (b64.length * 0.75 > 2.5e6 && q > 0.45) { q -= 0.1; return out(); }
          resolve({ data: b64, preview: data });
        })();
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Couldn't read that photo. Try a JPG or PNG.")); };
      img.src = url;
    });
  }
  // Photo picker shared by every composer. Returns { el, list(), busy(), addFiles }
  function photoPicker(initial, max, opts) {
    var photos = (initial || []).map(function (u) { return { url: u, preview: u }; });
    var busy = 0;
    var thumbs = h("div", { class: "azf-thumbs" });
    var file = h("input", { type: "file", accept: "image/*", multiple: true, style: "display:none" });
    file.addEventListener("change", function () { addFiles(file.files); file.value = ""; });
    function draw() {
      clear(thumbs);
      photos.forEach(function (p, i) {
        thumbs.appendChild(h("div", { class: "azf-tthumb" + (p.url ? "" : " busy") }, [
          h("img", { src: p.preview, alt: "" }),
          h("button", { type: "button", "aria-label": "Remove photo", text: "×", onclick: function () { photos.splice(i, 1); draw(); opts && opts.onChange && opts.onChange(); } }),
        ]));
      });
      opts && opts.onChange && opts.onChange();
    }
    async function addFiles(files) {
      files = [].slice.call(files || []).filter(function (f) { return /^image\//.test(f.type); });
      if (!files.length) return;
      if (photos.length + files.length > max) { toast("Up to " + max + " photos.", true); files = files.slice(0, Math.max(0, max - photos.length)); }
      for (var k = 0; k < files.length; k++) {
        (async function (f) {
          var p = { url: "", preview: "" };
          busy++;
          try {
            var s = await shrink(f);
            p.preview = s.preview;
            photos.push(p); draw();
            var r = await api("/api/upload", { method: "POST", auth: true, body: { data: s.data, contentType: "image/jpeg" } });
            p.url = r.url;
          } catch (e) {
            var idx = photos.indexOf(p);
            if (idx >= 0) photos.splice(idx, 1);
            toast(e.message, true);
          }
          busy--; draw();
        })(files[k]);
      }
    }
    function open() { file.click(); }
    // paste screenshots
    function onPaste(e) {
      var items = (e.clipboardData && e.clipboardData.files) || [];
      if (items.length) { e.preventDefault(); addFiles(items); }
    }
    return {
      thumbs: thumbs, input: file, open: open, addFiles: addFiles, onPaste: onPaste,
      list: function () { return photos.filter(function (p) { return p.url; }).map(function (p) { return p.url; }); },
      busy: function () { return busy > 0; },
      count: function () { return photos.length; },
    };
  }

  /* ================================================================ state */
  var S = { forums: [], stats: null, settings: { kinds: {} }, me: null, meLoaded: false };
  var root, mainEl, sideEl, chipsEl, heroEl;
  var LOGIN = "/login", SIGNUP = "/signup";
  var feedState = {};

  function forumBySlug(slug) { return S.forums.find(function (f) { return f.slug === slug; }); }
  function threadHref(t) { return "#/t/" + t.id + (t.slug ? "-" + t.slug : ""); }

  /* =============================================================== router */
  function parseRoute() {
    var raw = location.hash.replace(/^#/, "") || "/";
    var qi = raw.indexOf("?");
    var path = qi >= 0 ? raw.slice(0, qi) : raw;
    var params = new URLSearchParams(qi >= 0 ? raw.slice(qi + 1) : "");
    var parts = path.split("/").filter(Boolean);
    if (parts[0] === "t" && parts[1]) return { name: "thread", id: parseInt(parts[1], 10), reply: parseInt(params.get("r"), 10) || null };
    if (parts[0] === "f" && parts[1]) return { name: "forum", slug: decodeURIComponent(parts[1]), sort: params.get("sort") || "active" };
    if (parts[0] === "search") return { name: "search", q: params.get("q") || "" };
    if (parts[0] === "mine") return { name: "mine" };
    if (parts[0] === "mod") return { name: "mod", tab: params.get("tab") || "reports" };
    return { name: "home", sort: params.get("sort") || "active" };
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  var lastRouteName = null;
  function render() {
    var r = parseRoute();
    document.querySelectorAll(".azf-menu").forEach(function (m) { m._close ? m._close() : m.remove(); });
    heroEl.style.display = r.name === "home" ? "" : "none";
    drawSide(r);
    if (r.name !== lastRouteName || r.name === "thread") { try { if (root.getBoundingClientRect().top < -40) root.scrollIntoView({ block: "start" }); } catch (e) {} }
    lastRouteName = r.name;
    if (r.name === "thread") return viewThread(r);
    if (r.name === "mod") return viewMod(r);
    return viewFeed(r);
  }

  /* ============================================================== shell */
  function drawHero() {
    var input = h("input", { type: "search", placeholder: "Search questions, fixes & experiences…", "aria-label": "Search the forums", enterkeyhint: "search" });
    var form = h("form", { class: "azf-search", onsubmit: function (e) { e.preventDefault(); var q = input.value.trim(); if (q) go("#/search?q=" + encodeURIComponent(q)); } }, [
      h("label", { class: "azf-search-box" }, [icon("search", 18), input]),
      h("button", { class: "azf-btn primary big", type: "button", onclick: function () { ask(); } }, [icon("plus", 18), "Ask the community"]),
    ]);
    var stats = h("div", { class: "azf-stats" });
    clear(heroEl);
    add(heroEl, [
      h("div", { class: "azf-hero-top" }, [
        h("div", null, [
          h("div", { class: "azf-eyebrow" }, [h("i"), "Azora Forums"]),
          h("h1", null, ["Ask. Share. ", h("span", { text: "Learn from people who've been there." })]),
          h("p", { class: "azf-sub", text: "Hit a problem you've never seen before? Someone here probably has. Search first — if it isn't answered yet, post a few photos and ask." }),
          stats,
        ]),
      ]),
      form,
    ]);
    heroEl._stats = stats;
    drawStats();
  }
  function drawStats() {
    if (!heroEl._stats || !S.stats) return;
    clear(heroEl._stats);
    add(heroEl._stats, [
      h("span", null, [h("b", { text: S.stats.threads.toLocaleString() }), S.stats.threads === 1 ? "post" : "posts"]),
      h("span", null, [h("b", { text: S.stats.replies.toLocaleString() }), S.stats.replies === 1 ? "reply" : "replies"]),
      h("span", null, [h("b", { text: S.stats.solved.toLocaleString() }), "solved"]),
    ]);
  }

  function drawSide(r) {
    var active = r.name === "forum" ? r.slug : r.name;
    clear(sideEl);
    clear(chipsEl);
    // member card
    var me = S.me;
    var meCard = h("div", { class: "azf-card azf-me" });
    if (!S.meLoaded) {
      meCard.style.minHeight = "92px";
    } else if (me) {
      add(meCard, [
        h("div", { class: "azf-me-row" }, [avatar({ name: me.name, business: me.isBusiness ? me.business : "", avatar: me.avatar }, "lg"),
          h("div", { style: "min-width:0" }, [
            h("div", { class: "azf-me-name", text: me.isBusiness && me.business ? me.business : me.name }),
            h("div", { class: "azf-me-sub", text: me.role === "admin" ? "Azora team" : me.role === "moderator" ? "Moderator" : me.isBusiness ? "Business member" : "Member" }),
          ])]),
        me.banned ? h("div", { class: "azf-err", text: "Your account can't post right now." + (me.banReason ? " " + me.banReason : "") }) : null,
        h("button", { class: "azf-btn primary", type: "button", onclick: function () { ask(); } }, [icon("plus"), "New post"]),
        h("button", { class: "azf-toggle", type: "button", title: "Email me when someone replies to my posts", onclick: function () { toggleNotify(); } }, [
          h("span", { style: "display:flex;gap:8px;align-items:center" }, [icon("bell", 15), "Email me replies"]),
          h("span", { class: "azf-switch" + (me.notify ? " on" : "") }),
        ]),
      ]);
    } else {
      add(meCard, [
        h("div", { class: "azf-me-name", text: "Join the conversation" }),
        h("div", { class: "azf-me-sub", text: "Log in to ask questions, share fixes and mark answers helpful." }),
        h("div", { style: "display:flex;gap:8px" }, [
          h("a", { class: "azf-btn primary", href: LOGIN, style: "flex:1" }, "Log in"),
          h("a", { class: "azf-btn", href: SIGNUP, style: "flex:1" }, "Sign up"),
        ]),
      ]);
    }
    sideEl.appendChild(meCard);

    function nav(href, ic, name, count, on) {
      return h("a", { class: "azf-nav" + (on ? " on" : ""), href: href }, [
        h("span", { class: "ic" }, typeof ic === "string" && P[ic] ? icon(ic, 15) : ic), h("span", { class: "nm", text: name }),
        count !== undefined && count !== null ? h("span", { class: "ct", text: String(count) }) : null,
      ]);
    }
    var sec = h("div", { class: "azf-card azf-side-sec" }, [
      nav("#/", "home", "All posts", null, active === "home" || active === "search"),
      me ? nav("#/mine", "user", "My posts", null, active === "mine") : null,
      me && me.isMod ? nav("#/mod", "shield", "Moderation", null, active === "mod") : null,
      h("div", { class: "azf-side-h", text: "Forums" }),
    ]);
    S.forums.filter(function (f) { return !f.archived; }).forEach(function (f) {
      sec.appendChild(nav("#/f/" + f.slug, f.icon, f.name, f.threadCount, active === f.slug));
    });
    sideEl.appendChild(sec);

    // mobile chips
    function chip(href, label, on) { return h("a", { class: "azf-chip" + (on ? " on" : ""), href: href, text: label }); }
    add(chipsEl, [
      chip("#/", "All", active === "home"),
      me ? chip("#/mine", "My posts", active === "mine") : null,
      me && me.isMod ? chip("#/mod", "🛡️ Moderation", active === "mod") : null,
    ]);
    S.forums.filter(function (f) { return !f.archived; }).forEach(function (f) { chipsEl.appendChild(chip("#/f/" + f.slug, f.icon + " " + f.name, active === f.slug)); });
    var onChip = chipsEl.querySelector(".on");
    if (onChip && onChip.scrollIntoView) setTimeout(function () { chipsEl.scrollLeft = onChip.offsetLeft - 20; });
  }

  async function toggleNotify() {
    var on = !S.me.notify;
    S.me.notify = on;
    drawSide(parseRoute());
    try { await act({ action: "notify", on: on }); toast(on ? "We'll email you when someone replies." : "Reply emails turned off."); }
    catch (e) { S.me.notify = !on; drawSide(parseRoute()); toast(e.message, true); }
  }

  function needLogin(what) {
    var close = modal({
      title: "Log in to " + (what || "post"), narrow: true,
      body: h("p", { style: "color:var(--silver)", text: "Azora Forums are free for every member. Log in or create an account to ask questions, share what you've learned and help others." }),
      foot: [h("a", { class: "azf-btn", href: SIGNUP, onclick: function () { close(); } }, "Create account"), h("a", { class: "azf-btn primary", href: LOGIN }, "Log in")],
    });
  }

  /* ================================================================ feed */
  var SORTS = [["active", "Active"], ["new", "New"], ["top", "Most helpful"], ["unanswered", "Unanswered"], ["solved", "Solved"]];

  function threadItem(t, showForum) {
    var item = h("a", { class: "azf-item" + (t.pinned ? " pinned" : ""), href: threadHref(t) }, [
      h("div", { class: "azf-item-main" }, [
        h("div", { class: "azf-meta" }, [
          t.pinned ? h("span", { class: "azf-badge pin" }, [icon("pin", 11), "Pinned"]) : null,
          kindBadge(t.kind),
          t.solved ? h("span", { class: "azf-badge solved" }, [icon("check", 11), "Solved"]) : null,
          t.locked ? h("span", { class: "azf-badge lock" }, [icon("lock", 11), "Locked"]) : null,
          showForum && t.forum ? h("span", { class: "azf-forum-chip", text: t.forum.icon + " " + t.forum.name }) : null,
        ]),
        h("h3", { text: t.title }),
        t.excerpt ? h("p", { class: "ex", text: t.excerpt }) : null,
        h("div", { class: "azf-item-foot" }, [
          authorLine(t.author, "sm"),
          h("span", { title: fullDate(t.createdAt), text: ago(t.lastActivityAt && t.replyCount ? t.lastActivityAt : t.createdAt) }),
          h("span", { class: "st" }, [icon("chat", 14), String(t.replyCount)]),
          t.score ? h("span", { class: "st" }, [icon("up", 14), String(t.score)]) : null,
        ]),
      ]),
      t.image ? h("div", { class: "azf-thumb" }, [h("img", { src: t.image, alt: "", loading: "lazy" }), t.imageCount > 1 ? h("span", { text: "+" + (t.imageCount - 1) }) : null]) : null,
    ]);
    return item;
  }

  function skeleton(n) { return h("div", { class: "azf-list" }, Array.from({ length: n || 4 }, function () { return h("div", { class: "azf-skel" }); })); }

  async function viewFeed(r) {
    clear(mainEl);
    var forum = r.name === "forum" ? forumBySlug(r.slug) : null;
    var title, sub, iconTxt;
    if (r.name === "forum") {
      title = forum ? forum.name : "Forum"; sub = forum ? forum.description : ""; iconTxt = forum ? forum.icon : "💬";
    } else if (r.name === "search") { title = "Results for “" + r.q + "”"; sub = "Searching posts and every reply."; }
    else if (r.name === "mine") { title = "My posts"; sub = "Everything you've asked or shared."; }
    else { title = "All posts"; sub = ""; }

    var head = h("div", { class: "azf-feed-head" }, [
      h("div", { class: "azf-feed-title" }, [
        h("h2", null, [iconTxt ? h("span", { text: iconTxt }) : null, title]),
        sub ? h("p", { text: sub }) : null,
        forum && forum.modsOnly ? h("p", { class: "azf-hint", text: "Only the Azora team posts here. Everyone can reply." }) : null,
        forum && forum.archived ? h("p", { class: "azf-hint", text: "This forum is archived and read-only." }) : null,
      ]),
    ]);
    var sort = r.sort || "active";
    if (r.name === "home" || r.name === "forum") {
      var base = r.name === "forum" ? "#/f/" + r.slug : "#/";
      head.appendChild(h("div", { class: "azf-tabs", role: "tablist" }, SORTS.map(function (s) {
        return h("a", { class: "azf-tab" + (s[0] === sort ? " on" : ""), href: base + (s[0] === "active" ? "" : "?sort=" + s[0]), role: "tab", text: s[1], style: "display:inline-flex;align-items:center" });
      })));
    }
    if (r.name === "search") {
      var si = h("input", { class: "azf-input", type: "search", value: r.q, placeholder: "Search again…" });
      head.appendChild(h("form", { style: "width:100%;max-width:380px", onsubmit: function (e) { e.preventDefault(); if (si.value.trim()) go("#/search?q=" + encodeURIComponent(si.value.trim())); } }, si));
    }
    mainEl.appendChild(head);
    if (r.name === "forum" && !forum && S.forums.length) {
      mainEl.appendChild(empty("🤷", "That forum doesn't exist", "It may have been renamed.", h("a", { class: "azf-btn", href: "#/" }, "See all posts")));
      return;
    }
    if (r.name === "mine" && !S.me) { mainEl.appendChild(empty("🔒", "Log in to see your posts", "", h("a", { class: "azf-btn primary", href: LOGIN }, "Log in"))); return; }

    var list = h("div", { class: "azf-list" });
    var more = h("div", { class: "azf-more" });
    var sk = skeleton(5);
    mainEl.appendChild(sk);
    var params = new URLSearchParams();
    if (r.name === "forum") params.set("forum", r.slug);
    if (r.name === "search") params.set("q", r.q);
    if (r.name === "mine" && S.me) params.set("author", S.me.id);
    params.set("sort", sort);
    var page = 1, token0 = (feedState.token = {});

    async function load() {
      params.set("page", String(page));
      var data = await api("/api/threads?" + params.toString(), { auth: false });
      if (feedState.token !== token0) return;
      sk.remove();
      if (page === 1 && !data.threads.length) {
        if (r.name === "search") mainEl.appendChild(empty("🔎", "No posts match that yet", "Be the first to ask — someone has probably solved it.", h("button", { class: "azf-btn primary", type: "button", onclick: function () { ask({ title: r.q }); } }, [icon("plus"), "Ask about it"])));
        else if (sort === "unanswered") mainEl.appendChild(empty("🎉", "Every question has a reply", "Nice work, community."));
        else mainEl.appendChild(empty("✨", "Nothing here yet", "Start the first conversation.", (!forum || !forum.modsOnly || (S.me && S.me.isMod)) ? h("button", { class: "azf-btn primary", type: "button", onclick: function () { ask({ forum: forum && forum.slug }); } }, [icon("plus"), "New post"]) : null));
        return;
      }
      if (!list.parentNode) { mainEl.appendChild(list); mainEl.appendChild(more); }
      data.threads.forEach(function (t) { list.appendChild(threadItem(t, r.name !== "forum")); });
      clear(more);
      if (data.hasMore) {
        var b = h("button", { class: "azf-btn", type: "button", text: "Load more", onclick: async function () { b.disabled = true; b.textContent = "Loading…"; page++; try { await load(); } catch (e) { toast(e.message, true); b.disabled = false; b.textContent = "Load more"; } } });
        more.appendChild(b);
      }
    }
    try { await load(); } catch (e) { sk.remove(); mainEl.appendChild(empty("⚠️", "Couldn't load posts", e.message)); }
  }

  function empty(emoji, title, text, action) {
    return h("div", { class: "azf-empty" }, [h("div", { class: "big", text: emoji }), h("h3", { text: title }), text ? h("p", { text: text }) : null, action || null]);
  }

  /* ============================================================== thread */
  var current = null;

  async function viewThread(r, keepScroll) {
    if (!keepScroll) { clear(mainEl); mainEl.appendChild(skeleton(2)); }
    var data;
    try { data = await api("/api/thread?id=" + r.id); }
    catch (e) {
      clear(mainEl);
      mainEl.appendChild(empty("🫥", e.status === 404 ? "This post isn't here" : "Couldn't load this post", e.message, h("a", { class: "azf-btn", href: "#/" }, "Back to the forums")));
      return;
    }
    if (parseRoute().name !== "thread" || parseRoute().id !== r.id) return;
    current = data;
    var t = data.thread;
    var me = S.me;
    var isMine = me && me.id === t.author.id;
    var canReply = me && !me.banned && !t.deleted && ((!t.locked && !data.forumArchived) || me.isMod);
    var y = window.scrollY;

    clear(mainEl);
    var forum = forumBySlug(t.forum.slug) || t.forum;
    mainEl.appendChild(h("a", { class: "azf-back", href: "#/f/" + t.forum.slug }, [icon("back"), (forum.icon || "") + " " + forum.name]));

    var post = h("article", { class: "azf-card azf-post" }, [
      t.deleted ? h("div", { class: "azf-removed-note" }, [icon("trash"), "This post was removed. Only moderators can see it.",
        h("button", { class: "azf-btn sm", type: "button", style: "margin-left:auto", onclick: function () { modAct({ action: "restore", kind: "t", id: t.id }, "Post restored"); } }, [icon("restore", 14), "Restore"])]) : null,
      h("div", { class: "azf-meta" }, [
        t.pinned ? h("span", { class: "azf-badge pin" }, [icon("pin", 11), "Pinned"]) : null,
        kindBadge(t.kind),
        t.solved ? h("button", { class: "azf-badge solved", type: "button", onclick: function () { var el = document.getElementById("azf-r-" + t.solutionId); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); } }, [icon("check", 11), "Solved — jump to answer"]) : null,
        t.locked ? h("span", { class: "azf-badge lock" }, [icon("lock", 11), "Locked"]) : null,
      ]),
      h("h1", { text: t.title }),
      h("div", { class: "azf-post-author" }, [
        authorLine(t.author, "lg"),
        h("span", { class: "when", title: fullDate(t.createdAt), text: ago(t.createdAt) + (t.editedAt ? " · edited" : "") }),
      ]),
      t.body ? markdown(t.body) : null,
      photoGrid(t.images),
      t.locked ? h("div", { class: "azf-locked-note" }, [icon("lock"), "This post is locked. New replies are turned off."]) : null,
      h("div", { class: "azf-actions" }, [
        helpfulBtn("t", t.id, t.score, data.me && data.me.votedThread, isMine),
        h("button", { class: "azf-act", type: "button", onclick: function () { copyLink(location.href.split("#")[0] + threadHref(t)); } }, [icon("link", 15), "Share"]),
        me ? h("button", { class: "azf-icon-btn", type: "button", "aria-label": "More options", style: "margin-left:auto", onclick: function (e) { threadMenu(e.currentTarget, t, isMine); } }, icon("more", 18)) : null,
      ]),
    ]);
    mainEl.appendChild(post);

    // ---- replies
    var replies = data.replies;
    var top = replies.filter(function (x) { return !x.parentId; });
    var kids = {};
    replies.forEach(function (x) { if (x.parentId) (kids[x.parentId] = kids[x.parentId] || []).push(x); });
    var voted = (data.me && data.me.votedReplies) || [];
    top.sort(function (a, b) {
      if (a.id === t.solutionId) return -1;
      if (b.id === t.solutionId) return 1;
      return (b.score - a.score) || (new Date(a.createdAt) - new Date(b.createdAt));
    });
    var count = replies.filter(function (x) { return !x.deleted; }).length;
    mainEl.appendChild(h("div", { class: "azf-ans-head" }, [h("h2", { text: count ? plural(count, "reply", "replies") : "No replies yet" })]));
    if (!count && !t.deleted) mainEl.appendChild(h("p", { class: "azf-hint", style: "margin:-6px 0 12px", text: t.kind === "question" ? "Been through this before? Your experience could save someone a lot of trouble." : "Add your thoughts." }));

    top.forEach(function (a) {
      var isSol = a.id === t.solutionId;
      var card = h("div", { class: "azf-card azf-ans" + (isSol ? " solution" : ""), id: "azf-r-" + a.id }, [
        isSol ? h("div", { class: "azf-sol-tag" }, [icon("checkc", 15), "SOLUTION — marked by " + (t.author.id === (me && me.id) ? "you" : "the person who asked")]) : null,
        replyBody(a, t, voted, true),
      ]);
      var kidList = (kids[a.id] || []);
      var kidsEl = h("div", { class: "azf-kids" });
      kidList.forEach(function (k) {
        kidsEl.appendChild(h("div", { class: "azf-kid", id: "azf-r-" + k.id }, replyBody(k, t, voted, false)));
      });
      if (kidList.length) card.appendChild(kidsEl);
      card._kids = kidsEl;
      mainEl.appendChild(card);
    });

    // ---- composer
    if (t.deleted) {}
    else if (!me) {
      mainEl.appendChild(h("div", { class: "azf-login-cta" }, [
        h("p", null, [h("b", { text: t.kind === "question" ? "Know the answer?" : "Want to join in?" }), "Log in to reply, share photos and mark answers helpful."]),
        h("div", { style: "display:flex;gap:8px" }, [h("a", { class: "azf-btn", href: SIGNUP }, "Sign up"), h("a", { class: "azf-btn primary", href: LOGIN }, "Log in")]),
      ]));
    } else if (canReply) {
      mainEl.appendChild(replyComposer({ threadId: t.id, placeholder: t.kind === "question" ? "Share what worked for you — products, steps, risks to watch for…" : "Write a reply…" }));
    }

    if (keepScroll) window.scrollTo(0, y);
    if (r.reply && !keepScroll) {
      var target = document.getElementById("azf-r-" + r.reply);
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: "smooth", block: "center" }); target.classList.add("flash"); }, 60);
    }
  }

  function replyBody(x, t, voted, isTop) {
    var me = S.me;
    var wrap = h("div");
    if (x.deleted && !(me && me.isMod)) {
      wrap.appendChild(h("p", { class: "azf-gone", text: x.deletedByMod ? "Removed by a moderator." : "This reply was deleted." }));
      return wrap;
    }
    var mine = me && x.author.id === me.id;
    var canReply = me && !me.banned && !t.deleted && (!t.locked || me.isMod);
    var canSolve = me && isTop && t.kind === "question" && !x.deleted && (t.author.id === me.id || me.isMod);
    var bodyWrap = h("div", { class: "azf-ans-body" }, [x.body ? markdown(x.body) : null, photoGrid(x.images)]);
    add(wrap, [
      h("div", { class: "azf-ans-top" }, [
        h("div", { class: "azf-meta" }, [authorLine(x.author, isTop ? "" : "sm"),
          h("span", { title: fullDate(x.createdAt), text: ago(x.createdAt) + (x.editedAt ? " · edited" : "") }),
          x.deleted ? h("span", { class: "azf-modflag", text: "REMOVED (only mods see this)" }) : null,
          t.author.id === x.author.id && x.author.id ? h("span", { class: "azf-badge", text: "Asker" }) : null,
        ]),
        me ? h("button", { class: "azf-icon-btn", type: "button", "aria-label": "More options", onclick: function (e) { replyMenu(e.currentTarget, x, t, mine, bodyWrap); } }, icon("more", 17)) : null,
      ]),
      bodyWrap,
      x.deleted ? h("div", { class: "azf-actions" }, [h("button", { class: "azf-btn sm", type: "button", onclick: function () { modAct({ action: "restore", kind: "r", id: x.id }, "Reply restored"); } }, [icon("restore", 14), "Restore"])]) :
      h("div", { class: "azf-actions", style: "margin-top:12px" }, [
        helpfulBtn("r", x.id, x.score, voted.indexOf(x.id) >= 0, mine),
        canReply ? h("button", { class: "azf-act", type: "button", onclick: function (e) { openInlineReply(e.currentTarget, x, t); } }, [icon("reply", 15), "Reply"]) : null,
        canSolve ? h("button", { class: "azf-act", type: "button", style: x.id === t.solutionId ? "color:#6ff0c0" : "", onclick: function () { solve(t, x.id === t.solutionId ? null : x.id); } },
          [icon("checkc", 15), x.id === t.solutionId ? "Unmark solution" : "This solved it"]) : null,
      ]),
    ]);
    return wrap;
  }

  function openInlineReply(btn, x, t) {
    var card = btn.closest(".azf-ans");
    var existing = card.querySelector(".azf-compose.inline");
    if (existing) { existing.querySelector("textarea").focus(); return; }
    var c = replyComposer({
      threadId: t.id, parentId: x.parentId || x.id, inline: true,
      placeholder: "Reply to " + (x.author.isBusiness && x.author.business ? x.author.business : x.author.name) + "…",
      onCancel: function () { c.remove(); },
    });
    card.appendChild(c);
    c.querySelector("textarea").focus();
  }

  function helpfulBtn(kind, id, score, on, mine) {
    var b = h("button", { class: "azf-helpful" + (on ? " on" : ""), type: "button", title: mine ? "Your own post" : "Mark as helpful", "aria-pressed": on ? "true" : "false" });
    function draw() { clear(b); add(b, [icon("up", 15), "Helpful" + (score ? " · " + score : "")]); }
    draw();
    b.addEventListener("click", async function () {
      if (!S.me) return needLogin("mark posts helpful");
      if (mine) return toast("You can't mark your own post as helpful.");
      on = !on; score += on ? 1 : -1; b.classList.toggle("on", on); draw();
      try { var r = await act({ action: "vote", kind: kind, id: id }); score = r.score; on = r.voted; b.classList.toggle("on", on); draw(); }
      catch (e) { on = !on; score += on ? 1 : -1; b.classList.toggle("on", on); draw(); toast(e.message, true); }
    });
    return b;
  }

  async function solve(t, replyId) {
    try {
      await act({ action: "solve", threadId: t.id, replyId: replyId });
      toast(replyId ? "Marked as the solution. Thanks for closing the loop!" : "Solution unmarked.");
      viewThread(parseRoute(), true);
    } catch (e) { toast(e.message, true); }
  }

  function copyLink(url) {
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast("Link copied"); }, function () { window.prompt("Copy this link:", url); });
  }

  async function modAct(body, msg) {
    try { await act(body); if (msg) toast(msg); refreshForums(); viewThread(parseRoute(), true); }
    catch (e) { toast(e.message, true); }
  }

  function threadMenu(anchor, t, isMine) {
    var me = S.me;
    menu(anchor, [
      (isMine || me.isMod) && !t.deleted ? { icon: "edit", text: "Edit post", run: function () { editThread(t); } } : null,
      !isMine && !t.deleted ? { icon: "flag", text: "Report", run: function () { report("t", t.id); } } : null,
      me.isMod ? "-" : null,
      me.isMod ? { label: "Moderator" } : null,
      me.isMod && !t.deleted ? { icon: "pin", text: t.pinned ? "Unpin" : "Pin to top of forum", run: function () { modAct({ action: "pin", threadId: t.id, on: !t.pinned }, t.pinned ? "Unpinned" : "Pinned"); } } : null,
      me.isMod && !t.deleted ? { icon: "lock", text: t.locked ? "Unlock replies" : "Lock replies", run: function () { modAct({ action: "lock", threadId: t.id, on: !t.locked }, t.locked ? "Unlocked" : "Locked"); } } : null,
      me.isMod && !t.deleted ? { icon: "move", text: "Move to another forum", run: function () { moveThread(t); } } : null,
      me.isMod && !isMine && t.author.role === "member" ? { icon: "ban", text: "Ban " + t.author.name, run: function () { ban(t.author); } } : null,
      (isMine || me.isMod) && !t.deleted ? "-" : null,
      (isMine || me.isMod) && !t.deleted ? { icon: "trash", text: isMine ? "Delete post" : "Remove post", danger: true, run: async function () {
        if (!await confirmBox(isMine ? "Delete this post?" : "Remove this post?", isMine ? "It will disappear from the forums along with its replies." : "It will be hidden from everyone. You can restore it from the Moderation panel.", isMine ? "Delete" : "Remove")) return;
        try { await api("/api/thread?id=" + t.id, { method: "DELETE", auth: true }); toast(isMine ? "Post deleted" : "Post removed"); refreshForums(); go("#/f/" + t.forum.slug); }
        catch (e) { toast(e.message, true); }
      } } : null,
    ]);
  }

  function replyMenu(anchor, x, t, mine, bodyWrap) {
    var me = S.me;
    menu(anchor, [
      (mine || me.isMod) && !x.deleted ? { icon: "edit", text: "Edit reply", run: function () { editReplyInline(x, bodyWrap); } } : null,
      { icon: "link", text: "Copy link to reply", run: function () { copyLink(location.href.split("#")[0] + threadHref(t) + "?r=" + x.id); } },
      !mine && !x.deleted ? { icon: "flag", text: "Report", run: function () { report("r", x.id); } } : null,
      me.isMod && !mine && x.author.role === "member" && x.author.id ? "-" : null,
      me.isMod && !mine && x.author.role === "member" && x.author.id ? { icon: "ban", text: "Ban " + x.author.name, run: function () { ban(x.author); } } : null,
      (mine || me.isMod) && !x.deleted ? "-" : null,
      (mine || me.isMod) && !x.deleted ? { icon: "trash", text: mine ? "Delete reply" : "Remove reply", danger: true, run: async function () {
        if (!await confirmBox(mine ? "Delete this reply?" : "Remove this reply?", mine ? "This can't be undone." : "It will be hidden from everyone. You can restore it later.", mine ? "Delete" : "Remove")) return;
        try { await api("/api/replies?id=" + x.id, { method: "DELETE", auth: true }); toast(mine ? "Reply deleted" : "Reply removed"); viewThread(parseRoute(), true); }
        catch (e) { toast(e.message, true); }
      } } : null,
    ]);
  }

  async function report(kind, id) {
    var reasons = ["Spam or advertising", "Rude or abusive", "Unsafe advice", "Off-topic", "Something else"];
    var picked = reasons[0];
    var seg = h("div", { class: "azf-seg" });
    reasons.forEach(function (r) {
      seg.appendChild(h("button", { type: "button", class: r === picked ? "on" : "", text: r, onclick: function () { picked = r; [].forEach.call(seg.children, function (b) { b.classList.toggle("on", b.textContent === r); }); } }));
    });
    var more = h("textarea", { class: "azf-ta sm", placeholder: "Anything the moderators should know? (optional)", maxlength: "400" });
    var close = modal({
      title: "Report " + (kind === "t" ? "post" : "reply"), narrow: true,
      body: [h("p", { class: "azf-hint", style: "font-size:14px;color:var(--silver)", text: "Reports are private. The Azora team will take a look." }), seg, more],
      foot: [
        h("button", { class: "azf-btn ghost", type: "button", text: "Cancel", onclick: function () { close(); } }),
        h("button", { class: "azf-btn primary", type: "button", text: "Send report", onclick: async function (e) {
          e.currentTarget.disabled = true;
          try { await act({ action: "report", kind: kind, id: id, reason: picked + (more.value.trim() ? ": " + more.value.trim() : "") }); close(); toast("Thanks — the moderators will review it."); }
          catch (err) { e.currentTarget.disabled = false; toast(err.message, true); }
        } }),
      ],
    });
  }

  async function ban(a) {
    var reason = await promptBox("Ban " + a.name + "?", "Reason (they'll see this)", "e.g. Repeated spam", "Ban member", true);
    if (reason === null) return;
    modAct({ action: "ban", memberId: a.id, reason: reason }, a.name + " can no longer post.");
  }

  function moveThread(t) {
    var sel = h("select", { class: "azf-select" }, S.forums.filter(function (f) { return !f.archived; }).map(function (f) {
      var o = h("option", { value: f.slug, text: f.icon + "  " + f.name });
      if (f.slug === t.forum.slug) o.selected = true;
      return o;
    }));
    var close = modal({
      title: "Move post", narrow: true, body: [h("div", null, [h("div", { class: "azf-label", text: "Move to" }), sel])],
      foot: [h("button", { class: "azf-btn ghost", type: "button", text: "Cancel", onclick: function () { close(); } }),
        h("button", { class: "azf-btn primary", type: "button", text: "Move", onclick: function () { close(); modAct({ action: "move", threadId: t.id, forum: sel.value }, "Post moved"); } })],
    });
  }

  /* ============================================================ composers */
  function writeArea(value, placeholder, max, small) {
    var ta = h("textarea", { class: "azf-ta" + (small ? " sm" : ""), placeholder: placeholder, maxlength: String(max) });
    ta.value = value || "";
    var preview = h("div", { class: "azf-preview", style: "display:none" });
    var tabs = h("div", { class: "azf-mdtabs" });
    var mode = "write";
    [["write", "Write"], ["preview", "Preview"]].forEach(function (m) {
      tabs.appendChild(h("button", { type: "button", class: m[0] === mode ? "on" : "", text: m[1], onclick: function () {
        mode = m[0];
        [].forEach.call(tabs.children, function (b, i) { b.classList.toggle("on", (i === 0) === (mode === "write")); });
        ta.style.display = mode === "write" ? "" : "none";
        preview.style.display = mode === "write" ? "none" : "";
        if (mode === "preview") { clear(preview); preview.appendChild(ta.value.trim() ? markdown(ta.value) : h("p", { class: "azf-hint", text: "Nothing to preview yet." })); }
      } }));
    });
    return { ta: ta, preview: preview, tabs: tabs };
  }

  function replyComposer(o) {
    var max = S.settings.replyMax || 5000;
    var w = writeArea("", o.placeholder, max, o.inline);
    var pics = photoPicker([], S.settings.imagesPerReply || 3);
    var err = h("div", { class: "azf-err" });
    var send = h("button", { class: "azf-btn primary" + (o.inline ? " sm" : ""), type: "button", text: o.inline ? "Reply" : "Post reply" });
    var wrap = h("div", { class: "azf-card azf-compose" + (o.inline ? " inline" : "") }, [
      o.inline ? null : w.tabs, w.ta, o.inline ? null : w.preview, pics.thumbs, pics.input,
      h("div", { class: "azf-compose-foot" }, [
        h("div", { class: "l" }, [
          h("button", { class: "azf-act", type: "button", onclick: pics.open }, [icon("img", 15), "Photo"]),
          o.inline ? null : h("span", { class: "azf-hint", text: "**bold**, - lists, links work" }),
        ]),
        h("div", { class: "r" }, [o.onCancel ? h("button", { class: "azf-btn ghost sm", type: "button", text: "Cancel", onclick: o.onCancel }) : null, send]),
      ]),
      err,
    ]);
    w.ta.addEventListener("paste", pics.onPaste);
    w.ta.addEventListener("keydown", function (e) { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send.click(); });
    wrap.addEventListener("dragover", function (e) { e.preventDefault(); });
    wrap.addEventListener("drop", function (e) { e.preventDefault(); pics.addFiles(e.dataTransfer.files); });
    send.addEventListener("click", async function () {
      err.textContent = "";
      if (pics.busy()) return toast("Hang on — photos are still uploading.");
      if (!w.ta.value.trim() && !pics.list().length) { w.ta.focus(); return; }
      send.disabled = true; send.textContent = "Posting…";
      try {
        var r = await api("/api/replies", { method: "POST", auth: true, body: { threadId: o.threadId, parentId: o.parentId || null, body: w.ta.value, images: pics.list() } });
        refreshForums();
        history.replaceState(null, "", location.href.split("#")[0] + "#/t/" + o.threadId + "?r=" + r.id);
        await viewThread({ name: "thread", id: o.threadId, reply: r.id });
      } catch (e) { err.textContent = e.message; send.disabled = false; send.textContent = o.inline ? "Reply" : "Post reply"; }
    });
    return wrap;
  }

  function editReplyInline(x, bodyWrap) {
    var w = writeArea(x.body, "", S.settings.replyMax || 5000, true);
    var pics = photoPicker(x.images, S.settings.imagesPerReply || 3);
    var err = h("div", { class: "azf-err" });
    var save = h("button", { class: "azf-btn primary sm", type: "button", text: "Save" });
    var box = h("div", { class: "azf-compose inline azf-card" }, [w.ta, pics.thumbs, pics.input, h("div", { class: "azf-compose-foot" }, [
      h("div", { class: "l" }, h("button", { class: "azf-act", type: "button", onclick: pics.open }, [icon("img", 15), "Photo"])),
      h("div", { class: "r" }, [h("button", { class: "azf-btn ghost sm", type: "button", text: "Cancel", onclick: function () { viewThread(parseRoute(), true); } }), save]),
    ]), err]);
    w.ta.addEventListener("paste", pics.onPaste);
    clear(bodyWrap).appendChild(box);
    w.ta.focus();
    save.addEventListener("click", async function () {
      if (pics.busy()) return toast("Hang on — photos are still uploading.");
      save.disabled = true;
      try { await api("/api/replies?id=" + x.id, { method: "PATCH", auth: true, body: { body: w.ta.value, images: pics.list() } }); toast("Reply updated"); viewThread(parseRoute(), true); }
      catch (e) { err.textContent = e.message; save.disabled = false; }
    });
  }

  function editThread(t) {
    threadEditor({ thread: t });
  }

  function ask(prefill) {
    if (!S.meLoaded) { setTimeout(function () { ask(prefill); }, 300); return; }
    if (!S.me) return needLogin("ask a question");
    if (S.me.banned) return toast("Your account can't post right now.", true);
    var r = parseRoute();
    var forumSlug = (prefill && prefill.forum) || (r.name === "forum" ? r.slug : "") || (current && r.name === "thread" ? current.thread.forum.slug : "");
    threadEditor({ forum: forumSlug, title: prefill && prefill.title });
  }

  function threadEditor(o) {
    var editing = !!o.thread;
    var t = o.thread || {};
    var me = S.me;
    var kinds = S.settings.kinds || {};
    var kind = t.kind || "question";
    var saving = false;

    var available = S.forums.filter(function (f) { return !f.archived && (!f.modsOnly || me.isMod); });
    var sel = h("select", { class: "azf-select" }, [h("option", { value: "", text: "Choose a forum…" })].concat(available.map(function (f) {
      return h("option", { value: f.slug, text: f.icon + "  " + f.name });
    })));
    sel.value = (editing ? t.forum.slug : o.forum) || "";
    if (editing) sel.disabled = true;
    if (!sel.value) sel.value = "";

    var seg = h("div", { class: "azf-seg" });
    Object.keys(kinds).forEach(function (k) {
      seg.appendChild(h("button", { type: "button", class: k === kind ? "on" : "", text: kinds[k], onclick: function () {
        kind = k; [].forEach.call(seg.children, function (b) { b.classList.toggle("on", b.textContent === kinds[k]); }); placeholders();
      } }));
    });
    var title = h("input", { class: "azf-input title", maxlength: String(S.settings.titleMax || 150), value: t.title || o.title || "" });
    var titleCount = h("span");
    var similar = h("div", { class: "azf-similar" });
    var w = writeArea(t.body || "", "", S.settings.bodyMax || 10000);
    w.ta.style.minHeight = "170px";
    var pics = photoPicker(t.images || [], S.settings.imagesPerThread || 4, { onChange: function () { dropTxt.textContent = pics.count() ? pics.count() + " / " + (S.settings.imagesPerThread || 4) + " photos — add more" : "Add photos — drag them here, paste a screenshot, or click to choose"; } });
    var dropTxt = h("span", { text: "Add photos — drag them here, paste a screenshot, or click to choose" });
    var drop = h("div", { class: "azf-drop", role: "button", tabindex: "0", onclick: pics.open }, [icon("img", 20), dropTxt]);
    drop.addEventListener("dragover", function (e) { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", function () { drop.classList.remove("over"); });
    drop.addEventListener("drop", function (e) { e.preventDefault(); drop.classList.remove("over"); pics.addFiles(e.dataTransfer.files); });
    w.ta.addEventListener("paste", pics.onPaste);
    var err = h("div", { class: "azf-err" });
    var submit = h("button", { class: "azf-btn primary", type: "button", text: editing ? "Save changes" : "Post" });

    function placeholders() {
      title.placeholder = kind === "question" ? "e.g. How do I get rust stains off new concrete without etching it?" : kind === "tip" ? "e.g. My go-to surface cleaner setup for stamped concrete" : "Give it a clear title";
      w.ta.placeholder = kind === "question" ? "What's the situation? What have you tried? Surface, products, conditions — details help people give you the right answer." : "Share the details…";
    }
    placeholders();
    function counts() { titleCount.textContent = title.value.length + " / " + (S.settings.titleMax || 150); }
    counts();

    var simTimer, lastSim = "";
    title.addEventListener("input", function () {
      counts();
      if (editing) return;
      clearTimeout(simTimer);
      simTimer = setTimeout(async function () {
        var q = title.value.trim();
        if (q.length < 8 || q === lastSim) { if (q.length < 8) clear(similar); return; }
        lastSim = q;
        try {
          var d = await api("/api/threads?similar=" + encodeURIComponent(q), { auth: false });
          if (title.value.trim() !== q) return;
          clear(similar);
          if (d.threads.length) {
            similar.appendChild(h("div", { class: "h", text: "These might already answer it:" }));
            d.threads.forEach(function (s) {
              similar.appendChild(h("a", { href: threadHref(s), target: "_blank" }, [
                s.solved ? h("span", { class: "azf-badge solved" }, icon("check", 11)) : h("span", { style: "width:4px" }),
                h("span", { text: s.title, style: "min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }),
                h("small", { text: plural(s.replyCount, "reply", "replies") }),
              ]));
            });
          }
        } catch (e) {}
      }, 450);
    });

    function dirty() { return !editing && (title.value.trim() || w.ta.value.trim() || pics.count()); }
    var close = modal({
      title: editing ? "Edit post" : "New post",
      guard: function () { return saving ? false : !dirty() || window.confirm("Discard this post?"); },
      body: [
        h("div", { class: "azf-row2" }, [
          h("div", null, [h("div", { class: "azf-label", text: "Forum" }), sel]),
          h("div", null, [h("div", { class: "azf-label", text: "Type" }), seg]),
        ]),
        h("div", null, [h("div", { class: "azf-label" }, ["Title", titleCount]), title]),
        similar,
        h("div", null, [h("div", { class: "azf-label" }, ["Details", h("span", { text: "**bold**, *italic*, - lists and links work" })]), w.tabs, w.ta, w.preview]),
        h("div", null, [drop, pics.thumbs, pics.input]),
        err,
      ],
      foot: [h("span", { class: "note", text: editing ? "" : "Be kind and specific. ⌘/Ctrl + Enter to post" }),
        h("button", { class: "azf-btn ghost", type: "button", text: "Cancel", onclick: function () { if (!dirty() || window.confirm("Discard this post?")) close(); } }), submit],
    });
    setTimeout(function () { (sel.value || editing ? title : sel).focus(); }, 40);
    [title, w.ta].forEach(function (el) { el.addEventListener("keydown", function (e) { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit.click(); }); });

    submit.addEventListener("click", async function () {
      err.textContent = "";
      if (!editing && !sel.value) { err.textContent = "Please choose a forum."; sel.focus(); return; }
      if (title.value.trim().length < 6) { err.textContent = "Give your post a title (at least 6 characters)."; title.focus(); return; }
      if (pics.busy()) { err.textContent = "Hang on — photos are still uploading."; return; }
      saving = true; submit.disabled = true; submit.textContent = editing ? "Saving…" : "Posting…";
      var body = { forum: sel.value, kind: kind, title: title.value, body: w.ta.value, images: pics.list() };
      try {
        if (editing) {
          await api("/api/thread?id=" + t.id, { method: "PATCH", auth: true, body: body });
          saving = false; close(); toast("Post updated"); viewThread(parseRoute(), true);
        } else {
          var r = await api("/api/threads", { method: "POST", auth: true, body: body });
          saving = false; close(); toast("Posted! We'll let you know when someone replies.");
          refreshForums();
          go("#/t/" + r.id + (r.slug ? "-" + r.slug : ""));
        }
      } catch (e) { saving = false; err.textContent = e.message; submit.disabled = false; submit.textContent = editing ? "Save changes" : "Post"; }
    });
  }

  /* ========================================================== moderation */
  async function viewMod(r) {
    clear(mainEl);
    if (!S.meLoaded) { mainEl.appendChild(skeleton(3)); return; }
    if (!S.me || !S.me.isMod) { mainEl.appendChild(empty("🛡️", "Moderators only", "Log in with a moderator or admin account to see this page.")); return; }
    var tabs = [["reports", "Reports"], ["forums", "Forums"], ["removed", "Removed"], ["banned", "Banned"], ["log", "Activity"]];
    var tab = r.tab;
    var counter = h("span");
    mainEl.appendChild(h("div", { class: "azf-feed-head" }, [
      h("div", { class: "azf-feed-title" }, [h("h2", null, [icon("shield", 22), "Moderation"]), h("p", { text: "Review reports, manage forums and keep things helpful." })]),
    ]));
    mainEl.appendChild(h("div", { class: "azf-tabs azf-mod-tabs" }, tabs.map(function (t) {
      return h("a", { class: "azf-tab" + (t[0] === tab ? " on" : ""), href: "#/mod?tab=" + t[0], style: "display:inline-flex;align-items:center;gap:6px" }, [t[1], t[0] === "reports" ? counter : null]);
    })));
    var body = h("div");
    mainEl.appendChild(body);
    body.appendChild(skeleton(3));

    var data;
    try { data = await api("/api/mod", { auth: true }); } catch (e) { clear(body).appendChild(empty("⚠️", "Couldn't load", e.message)); return; }
    if (parseRoute().name !== "mod") return;
    if (data.reports.length) add(counter, h("span", { class: "azf-count", text: String(data.reports.length) }));
    clear(body);
    var reload = function () { viewMod(parseRoute()); };

    if (tab === "reports") {
      if (!data.reports.length) return body.appendChild(empty("✅", "No open reports", "All clear."));
      var card = h("div", { class: "azf-card" });
      data.reports.forEach(function (rp) {
        var link = "#/t/" + rp.threadId + (rp.kind === "r" ? "?r=" + rp.targetId : "");
        card.appendChild(h("div", { class: "azf-mrow" }, [
          h("span", { class: "azf-count", text: String(rp.count) }),
          h("div", { class: "main" }, [
            h("div", { class: "azf-meta" }, [h("span", { class: "azf-badge", text: rp.kind === "t" ? "Post" : "Reply" }), "by " + rp.authorName, h("span", { class: "azf-dot" }), ago(rp.lastAt), rp.removed ? h("span", { class: "azf-modflag", text: "already removed" }) : null]),
            h("a", { class: "t", href: link, text: rp.title, style: "display:block;margin-top:6px" }),
            rp.excerpt ? h("p", { class: "ex", text: rp.excerpt }) : null,
            h("div", { class: "rs" }, rp.items.map(function (i) { return h("div", null, ["🚩 ", h("b", { style: "color:var(--silver)", text: i.reason || "No reason" }), " — " + i.by + ", " + ago(i.at)]); })),
          ]),
          h("div", { class: "btns" }, [
            h("a", { class: "azf-btn sm", href: link, text: "View" }),
            h("button", { class: "azf-btn sm", type: "button", text: "Dismiss", onclick: async function () { try { await act({ action: "resolve", reportId: rp.reportId }); toast("Report dismissed"); reload(); } catch (e) { toast(e.message, true); } } }),
            !rp.removed ? h("button", { class: "azf-btn sm danger", type: "button", text: "Remove", onclick: async function () {
              if (!await confirmBox("Remove this " + (rp.kind === "t" ? "post" : "reply") + "?", "It will be hidden from everyone. You can restore it later.", "Remove")) return;
              try { await api(rp.kind === "t" ? "/api/thread?id=" + rp.targetId : "/api/replies?id=" + rp.targetId, { method: "DELETE", auth: true }); toast("Removed"); refreshForums(); reload(); } catch (e) { toast(e.message, true); }
            } }) : null,
            rp.authorId ? h("button", { class: "azf-btn sm ghost", type: "button", title: "Ban author", onclick: function () { ban({ id: rp.authorId, name: rp.authorName }).then(reload); } }, icon("ban", 15)) : null,
          ]),
        ]));
      });
      body.appendChild(card);
    }

    if (tab === "forums") {
      if (!S.me.canManageForums) return body.appendChild(empty("🔒", "Admins manage forums", "Ask an Azora admin to add or change forums."));
      var list = await api("/api/forums?all=1", { auth: true }).catch(function () { return { forums: S.forums }; });
      var fc = h("div", { class: "azf-card" });
      list.forums.forEach(function (f, i) {
        fc.appendChild(h("div", { class: "azf-frow", style: f.archived ? "opacity:.55" : "" }, [
          h("div", { class: "ic", text: f.icon }),
          h("div", { style: "min-width:0" }, [
            h("div", { style: "font-weight:600;color:#fff;display:flex;gap:8px;align-items:center;flex-wrap:wrap" }, [f.name,
              f.modsOnly ? h("span", { class: "azf-badge", text: "Team posts only" }) : null,
              f.archived ? h("span", { class: "azf-badge", text: "Archived" }) : null]),
            h("div", { class: "azf-hint", text: "/" + f.slug + " · " + plural(f.threadCount, "post") + (f.description ? " · " + f.description : ""), style: "white-space:nowrap;overflow:hidden;text-overflow:ellipsis" }),
          ]),
          h("div", { style: "display:flex;gap:4px" }, [
            h("button", { class: "azf-icon-btn", type: "button", title: "Move up", disabled: i === 0 ? true : null, onclick: function () { swapOrder(list.forums, i, i - 1).then(reload); }, text: "↑" }),
            h("button", { class: "azf-icon-btn", type: "button", title: "Move down", disabled: i === list.forums.length - 1 ? true : null, onclick: function () { swapOrder(list.forums, i, i + 1).then(reload); }, text: "↓" }),
            h("button", { class: "azf-btn sm", type: "button", onclick: function () { forumEditor(f, reload); } }, [icon("edit", 14), "Edit"]),
          ]),
        ]));
      });
      body.appendChild(h("div", { style: "display:flex;justify-content:flex-end;margin-bottom:12px" }, h("button", { class: "azf-btn primary", type: "button", onclick: function () { forumEditor(null, reload); } }, [icon("plus"), "New forum"])));
      body.appendChild(fc);
    }

    if (tab === "removed") {
      if (!data.removed.length) return body.appendChild(empty("🧹", "Nothing removed recently", ""));
      var rc = h("div", { class: "azf-card" });
      data.removed.forEach(function (x) {
        rc.appendChild(h("div", { class: "azf-mrow" }, [
          h("div", { class: "main" }, [
            h("div", { class: "azf-meta" }, [h("span", { class: "azf-badge", text: x.kind === "t" ? "Post" : "Reply" }), "by " + x.authorName, h("span", { class: "azf-dot" }), "removed " + ago(x.removedAt) + (x.removedBy ? " by " + x.removedBy : "")]),
            h("a", { class: "t", href: "#/t/" + x.threadId + (x.kind === "r" ? "?r=" + x.id : ""), text: x.title, style: "display:block;margin-top:6px" }),
            x.excerpt ? h("p", { class: "ex", text: x.excerpt }) : null,
          ]),
          h("div", { class: "btns" }, h("button", { class: "azf-btn sm", type: "button", onclick: async function () { try { await act({ action: "restore", kind: x.kind, id: x.id }); toast("Restored"); refreshForums(); reload(); } catch (e) { toast(e.message, true); } } }, [icon("restore", 14), "Restore"])),
        ]));
      });
      body.appendChild(rc);
    }

    if (tab === "banned") {
      if (!data.banned.length) return body.appendChild(empty("🕊️", "Nobody is banned", "Ban someone from the ⋯ menu on any of their posts."));
      var bc = h("div", { class: "azf-card" });
      data.banned.forEach(function (m) {
        bc.appendChild(h("div", { class: "azf-mrow" }, [
          avatar(m),
          h("div", { class: "main" }, [h("div", { class: "t", text: m.name }), h("div", { class: "azf-hint", text: "Banned " + ago(m.bannedAt) + (m.bannedBy ? " by " + m.bannedBy : "") + (m.reason ? " — " + m.reason : "") })]),
          h("div", { class: "btns" }, h("button", { class: "azf-btn sm", type: "button", text: "Unban", onclick: async function () { try { await act({ action: "unban", memberId: m.id }); toast(m.name + " can post again"); reload(); } catch (e) { toast(e.message, true); } } })),
        ]));
      });
      body.appendChild(bc);
    }

    if (tab === "log") {
      if (!data.log.length) return body.appendChild(empty("📜", "No activity yet", ""));
      var NAMES = { "thread.pin": "pinned", "thread.unpin": "unpinned", "thread.lock": "locked", "thread.unlock": "unlocked", "thread.move": "moved", "thread.remove": "removed post", "thread.restore": "restored post", "thread.edit": "edited post", "thread.solve": "marked solution", "thread.unsolve": "unmarked solution", "reply.remove": "removed reply", "reply.restore": "restored reply", "reply.edit": "edited reply", "member.ban": "banned", "member.unban": "unbanned", "forum.create": "created forum", "forum.edit": "edited forum", "forum.archive": "archived forum", "forum.delete": "deleted forum", "report.dismiss": "dismissed report" };
      var lc = h("div", { class: "azf-card" });
      data.log.forEach(function (l) {
        lc.appendChild(h("div", { class: "azf-log" }, [h("time", { text: ago(l.at), title: fullDate(l.at) }),
          h("div", { style: "min-width:0" }, [h("b", { style: "color:#fff", text: l.actor }), " " + (NAMES[l.action] || l.action) + " ",
            l.threadId ? h("a", { href: "#/t/" + l.threadId, style: "color:#9fbcff", text: l.detail || "post #" + l.threadId }) : h("span", { text: l.detail })])]));
      });
      body.appendChild(lc);
    }
  }

  async function swapOrder(list, i, j) {
    var a = list[i], b = list[j];
    var ao = a.sortOrder, bo = b.sortOrder;
    if (ao === bo) { bo = ao + (j > i ? 1 : -1); }
    try {
      await api("/api/forums?id=" + a.id, { method: "PATCH", auth: true, body: { sortOrder: bo } });
      await api("/api/forums?id=" + b.id, { method: "PATCH", auth: true, body: { sortOrder: ao } });
      await refreshForums();
    } catch (e) { toast(e.message, true); }
  }

  function forumEditor(f, done) {
    var editing = !!f;
    f = f || {};
    var name = h("input", { class: "azf-input", maxlength: "60", value: f.name || "", placeholder: "e.g. Power Washing & Detailing" });
    var ic = h("input", { class: "azf-input", maxlength: "8", value: f.icon || "💬", style: "text-align:center;font-size:20px" });
    var slug = h("input", { class: "azf-input", maxlength: "50", value: f.slug || "", placeholder: "made from the name" });
    var desc = h("textarea", { class: "azf-ta sm", maxlength: "300", placeholder: "What belongs here?" });
    desc.value = f.description || "";
    var mods = h("input", { type: "checkbox" }); mods.checked = !!f.modsOnly;
    var arch = h("input", { type: "checkbox" }); arch.checked = !!f.archived;
    var err = h("div", { class: "azf-err" });
    var save = h("button", { class: "azf-btn primary", type: "button", text: editing ? "Save" : "Create forum" });
    var check = function (el, label, hint) { return h("label", { style: "display:flex;gap:10px;align-items:flex-start;cursor:pointer;font-size:14px" }, [el, h("span", null, [label, h("div", { class: "azf-hint", text: hint })])]); };
    var close = modal({
      title: editing ? "Edit forum" : "New forum", narrow: true,
      body: [
        h("div", { style: "display:grid;grid-template-columns:72px 1fr;gap:10px" }, [h("div", null, [h("div", { class: "azf-label", text: "Icon" }), ic]), h("div", null, [h("div", { class: "azf-label", text: "Name" }), name])]),
        h("div", null, [h("div", { class: "azf-label" }, ["Link name", h("span", { text: "azoraapp.com/forums#/f/…" })]), slug]),
        h("div", null, [h("div", { class: "azf-label", text: "Description" }), desc]),
        check(mods, "Only the Azora team can start posts", "Good for announcements. Everyone can still reply."),
        editing ? check(arch, "Archived", "Hidden from the list and read-only. Posts stay reachable by link.") : null,
        err,
      ],
      foot: [
        editing ? h("button", { class: "azf-btn danger", type: "button", style: "margin-right:auto", text: f.threadCount ? "Archive" : "Delete", onclick: async function () {
          if (!await confirmBox(f.threadCount ? "Archive this forum?" : "Delete this forum?", f.threadCount ? "It has posts, so it'll be archived (hidden and read-only) instead of deleted." : "It has no posts, so it will be deleted.", f.threadCount ? "Archive" : "Delete")) return;
          try { await api("/api/forums?id=" + f.id, { method: "DELETE", auth: true }); close(); toast("Done"); await refreshForums(); done(); } catch (e) { err.textContent = e.message; }
        } }) : null,
        h("button", { class: "azf-btn ghost", type: "button", text: "Cancel", onclick: function () { close(); } }), save,
      ],
    });
    setTimeout(function () { name.focus(); }, 30);
    save.addEventListener("click", async function () {
      err.textContent = "";
      save.disabled = true;
      var body = { name: name.value, icon: ic.value, description: desc.value, modsOnly: mods.checked };
      if (slug.value.trim()) body.slug = slug.value;
      if (editing) body.archived = arch.checked;
      try {
        await api(editing ? "/api/forums?id=" + f.id : "/api/forums", { method: editing ? "PATCH" : "POST", auth: true, body: body });
        close(); toast(editing ? "Forum saved" : "Forum created"); await refreshForums(); done();
      } catch (e) { err.textContent = e.message; save.disabled = false; }
    });
  }

  /* ================================================================ boot */
  async function refreshForums() {
    try {
      var d = await api("/api/forums?t=" + Date.now(), { auth: false });
      S.forums = d.forums; S.stats = d.stats; S.settings = d.settings;
      drawStats(); drawSide(parseRoute());
    } catch (e) {}
  }

  async function loadMe() {
    var ms = await memberstack(4000);
    var hasMember = false;
    try { if (ms) { var r = await ms.getCurrentMember(); hasMember = !!(r && r.data); } } catch (e) {}
    if (hasMember) {
      try { var d = await api("/api/me", { auth: true }); S.me = d.member; } catch (e) { S.me = null; }
    }
    S.meLoaded = true;
  }

  async function boot(el) {
    root = el;
    LOGIN = el.getAttribute("data-login-url") || LOGIN;
    SIGNUP = el.getAttribute("data-signup-url") || SIGNUP;
    if (!document.getElementById("azf-css")) document.head.appendChild(h("style", { id: "azf-css", text: CSS }));
    el.classList.add("azf");
    clear(el);
    heroEl = h("section", { class: "azf-hero" });
    chipsEl = h("nav", { class: "azf-chips", "aria-label": "Forums" });
    sideEl = h("aside", { class: "azf-side" });
    mainEl = h("main", { class: "azf-main", style: "min-width:0" });
    add(el, [heroEl, chipsEl, h("div", { class: "azf-layout" }, [sideEl, mainEl])]);
    drawHero();
    var forumsP = api("/api/forums", { auth: false }).then(function (d) { S.forums = d.forums; S.stats = d.stats; S.settings = d.settings; drawStats(); })
      .catch(function (e) { clear(mainEl).appendChild(empty("⚠️", "The forums couldn't load", e.message)); throw e; });
    var meP = loadMe();
    try { await forumsP; } catch (e) { return; }
    render();
    window.addEventListener("hashchange", render);
    await meP;
    var r = parseRoute();
    if (S.me) render(); else drawSide(r);
  }

  function start() {
    var el = document.querySelector("[data-azora-forums]");
    if (el) boot(el);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
