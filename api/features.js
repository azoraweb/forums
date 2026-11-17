// /api/features — the feature switches behind the admin panel.
//   GET                      every feature and its mode (public, cached briefly)
//   GET     ?script=1        the site-wide /azora-features.js script
//   POST    (admins)         { key, name, description, mode, message, paths[], selectors[] }
//   PATCH   ?key= (admins)   any of those fields (e.g. { mode: "dev" })
//   DELETE  ?key= (admins)

const config = require("../config");
const db = require("../lib/db");
const { handler, HttpError, noStore } = require("../lib/http");
const { viewer } = require("../lib/auth");
const FT = require("../lib/features");
const F = require("../lib/forum");
const client = require("../lib/featuresClient");

module.exports = handler(async (req, res) => {
  switch (req.method) {
    case "GET": return get(req, res);
    case "POST": return create(req, res);
    case "PATCH": return edit(req, res);
    case "DELETE": return remove(req, res);
    default: throw new HttpError(405, "Method not allowed");
  }
});

// GET /azora-features.js -> /api/features?script=1 (vercel.json rewrite)
// The site-wide script with the current switches baked in.
async function script(req, res) {
  let features = [];
  let ok = true;
  try {
    features = (await FT.list()).map((f) => ({ key: f.key, name: f.name, mode: f.mode, message: f.message, paths: f.paths, selectors: f.selectors }));
  } catch (e) {
    ok = false; // database unreachable: everything stays visible (fail open)
    console.error("[features] couldn't load switches", e);
  }
  const data = {
    features,
    plans: { admin: config.ADMIN_PLAN_ID, developer: config.DEVELOPER_PLAN_ID },
    defaultMessage: FT.DEFAULT_MESSAGE,
    adminPage: config.ADMIN_PAGE,
  };
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", ok ? "public, max-age=0, s-maxage=15, stale-while-revalidate=300" : "no-store");
  res.end(`/* Azora feature switches */\n(${client.toString()})(${JSON.stringify(data).replace(/</g, "\\u003c")});\n`);
}

async function get(req, res) {
  if (req.query.script) return script(req, res);
  if (req.query.admin) {
    noStore(res);
    const v = await viewer(req);
    if (!v.isAdmin) throw new HttpError(403, "Only Azora admins can open the admin panel.");
    return { features: await FT.list(), me: { name: v.name, isAdmin: true }, settings: { defaultMessage: FT.DEFAULT_MESSAGE, adminPage: config.ADMIN_PAGE } };
  }
  res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=60");
  const features = (await FT.list()).map((f) => ({ key: f.key, name: f.name, mode: f.mode, message: f.message, paths: f.paths, selectors: f.selectors }));
  return { features };
}

async function requireAdmin(req, res) {
  noStore(res);
  const v = await viewer(req);
  if (!v.isAdmin) throw new HttpError(403, "Only Azora admins can change feature switches.");
  return v;
}

function list(raw, label, check) {
  const items = (Array.isArray(raw) ? raw : String(raw || "").split("\n"))
    .map((s) => String(s).trim()).filter(Boolean);
  if (items.length > 30) throw new HttpError(400, `Up to 30 ${label}.`);
  return [...new Set(items.map(check))];
}

function cleanPath(p) {
  let s = p.replace(/^https?:\/\/[^/]+/i, "").split(/[?#]/)[0].trim().toLowerCase();
  if (!s.startsWith("/")) s = "/" + s;
  if (s.length > 1) s = s.replace(/\/+$/, "") || "/";
  if (s.length > 200 || !/^\/[a-z0-9\-_/.*]*$/.test(s)) throw new HttpError(400, `"${p}" isn't a valid page path.`);
  return s;
}

function cleanSelector(sel) {
  if (sel.length > 200 || /[{}<>;]/.test(sel)) throw new HttpError(400, `"${sel}" isn't a valid element selector.`);
  return sel;
}

function fields(b, { partial }) {
  const out = {};
  if (!partial || b.name !== undefined) out.name = F.text(b.name, 60, "Name", { required: true });
  if (b.description !== undefined) out.description = F.text(b.description, 300, "Description");
  if (b.message !== undefined) out.message = F.text(b.message, 300, "Message", { multiline: true });
  if (b.mode !== undefined) {
    if (!FT.MODES.includes(b.mode)) throw new HttpError(400, "Mode must be live or dev.");
    out.mode = b.mode;
  }
  if (b.paths !== undefined) out.paths = list(b.paths, "pages", cleanPath);
  if (b.selectors !== undefined) out.selectors = list(b.selectors, "elements", cleanSelector);
  if (b.sortOrder !== undefined) out.sort_order = Math.round(Number(b.sortOrder) || 0);
  return out;
}

async function create(req, res) {
  const v = await requireAdmin(req, res);
  const b = req.body;
  const key = F.slugify(b.key || b.name, 40);
  if (!key) throw new HttpError(400, "Give the feature a key, like \"businesses\".");
  const f = fields(b, { partial: false });
  const max = await db.one(`SELECT coalesce(max(sort_order), 0) + 10 AS n FROM features`);
  const row = await db.one(
    `INSERT INTO features (key, name, description, mode, message, paths, selectors, sort_order, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9) ON CONFLICT (key) DO NOTHING RETURNING *`,
    [key, f.name, f.description || "", f.mode || "live", f.message || "", db.json(f.paths || []), db.json(f.selectors || []), Number(max.n), v.name]
  );
  if (!row) throw new HttpError(409, `A feature with the key "${key}" already exists.`);
  FT.bust();
  await F.log(v, "feature.create", { detail: f.name });
  return { feature: FT.serialize(row) };
}

async function edit(req, res) {
  const v = await requireAdmin(req, res);
  const key = String(req.query.key || "");
  const f = fields(req.body, { partial: true });
  const keys = Object.keys(f);
  if (!keys.length) throw new HttpError(400, "Nothing to change.");
  const sets = keys.map((k, i) => `${k} = $${i + 2}${k === "paths" || k === "selectors" ? "::jsonb" : ""}`).join(", ");
  const vals = keys.map((k) => (k === "paths" || k === "selectors" ? db.json(f[k]) : f[k]));
  const row = await db.one(
    `UPDATE features SET ${sets}, updated_at = now(), updated_by = $${keys.length + 2} WHERE key = $1 RETURNING *`,
    [key, ...vals, v.name]
  );
  if (!row) throw new HttpError(404, "That feature no longer exists.");
  FT.bust();
  await F.log(v, f.mode ? `feature.${f.mode}` : "feature.edit", { detail: row.name });
  return { feature: FT.serialize(row) };
}

async function remove(req, res) {
  const v = await requireAdmin(req, res);
  const row = await db.one(`DELETE FROM features WHERE key = $1 RETURNING name`, [String(req.query.key || "")]);
  if (!row) throw new HttpError(404, "That feature no longer exists.");
  FT.bust();
  await F.log(v, "feature.delete", { detail: row.name });
  return { ok: true };
}
