// /api/team — the Meet the team page.
//   GET                          the team, in order (public, cached briefly)
//   GET    ?admin=1   (admins)   everyone incl. hidden, names/photos refreshed from Memberstack
//   GET    ?search=   (admins)   find Azora members to add
//   POST   (admins)              { memberId, role, quote, nameOverride, photoOverride, link, hidden }
//   POST   (admins)              { action: "reorder", ids: [teamId, ...] }
//   PATCH  ?id=  (admins)        any of the fields above
//   DELETE ?id=  (admins)        take someone off the page

const db = require("../lib/db");
const { handler, HttpError, noStore } = require("../lib/http");
const { viewer, fetchMember, listAllMembers, profileOf } = require("../lib/auth");
const { gate } = require("../lib/features");
const F = require("../lib/forum");

module.exports = handler(async (req, res) => {
  await gate(req, "team");
  switch (req.method) {
    case "GET":
      if (req.query.search !== undefined) return search(req, res);
      if (req.query.admin) return adminList(req, res);
      return publicList(req, res);
    case "POST": return req.body.action === "reorder" ? reorder(req, res) : create(req, res);
    case "PATCH": return edit(req, res);
    case "DELETE": return remove(req, res);
    default: throw new HttpError(405, "Method not allowed");
  }
});

function serialize(r, { admin = false } = {}) {
  const out = {
    id: Number(r.id),
    name: r.name_override || r.name || "Azora member",
    photo: r.photo_override || r.avatar || "",
    role: r.role || "",
    quote: r.quote || "",
    link: r.link || "",
  };
  if (admin) {
    Object.assign(out, {
      memberId: r.member_id,
      memberName: r.name || "",
      memberPhoto: r.avatar || "",
      nameOverride: r.name_override || "",
      photoOverride: r.photo_override || "",
      hidden: !!r.hidden,
      sortOrder: Number(r.sort_order || 0),
    });
  }
  return out;
}

async function requireAdmin(req, res) {
  noStore(res);
  const v = await viewer(req);
  if (!v.isAdmin) throw new HttpError(403, "Only Azora admins can edit the team page.");
  return v;
}

async function publicList(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=300");
  const rows = await db.q(`SELECT * FROM team WHERE NOT hidden ORDER BY sort_order, id`);
  return { team: rows.map((r) => serialize(r)) };
}

async function adminList(req, res) {
  await requireAdmin(req, res);
  const rows = await db.q(`SELECT * FROM team ORDER BY sort_order, id`);
  // Keep names and photos in step with their Memberstack profiles.
  await Promise.all(rows.map(async (r) => {
    try {
      const m = await fetchMember(r.member_id);
      if (!m) return;
      const p = profileOf(m);
      if (p.name !== r.name || p.avatar !== r.avatar) {
        await db.q(`UPDATE team SET name = $2, avatar = $3 WHERE id = $1`, [r.id, p.name, p.avatar]);
        r.name = p.name; r.avatar = p.avatar;
      }
    } catch (e) { /* keep the saved copy */ }
  }));
  return { team: rows.map((r) => serialize(r, { admin: true })) };
}

async function search(req, res) {
  await requireAdmin(req, res);
  const q = String(req.query.search || "").trim().toLowerCase();
  const [members, onTeam] = await Promise.all([
    listAllMembers(),
    db.q(`SELECT member_id FROM team`),
  ]);
  const taken = new Set(onTeam.map((r) => r.member_id));
  const words = q.split(/\s+/).filter(Boolean);
  const found = [];
  for (const m of members) {
    const p = profileOf(m);
    const email = String(m.auth?.email || "");
    const hay = `${p.name} ${email} ${m.customFields?.["business-name"] || ""}`.toLowerCase();
    if (words.every((w) => hay.includes(w))) {
      found.push({ id: m.id, name: p.name, email, avatar: p.avatar, business: String(m.customFields?.["business-name"] || ""), onTeam: taken.has(m.id) });
      if (found.length >= 25) break;
    }
  }
  return { members: found, total: members.length };
}

function cleanUrl(raw, label) {
  const s = String(raw || "").trim();
  if (!s) return "";
  let u;
  try { u = new URL(/^https?:\/\//i.test(s) ? s : "https://" + s); } catch { throw new HttpError(400, `${label} isn't a valid link.`); }
  if (!/^https?:$/.test(u.protocol) || s.length > 500) throw new HttpError(400, `${label} isn't a valid link.`);
  return u.toString();
}

function fields(b) {
  const out = {};
  if (b.role !== undefined) out.role = F.text(b.role, 80, "Role");
  if (b.quote !== undefined) out.quote = F.text(b.quote, 400, "Quote", { multiline: true });
  if (b.nameOverride !== undefined) out.name_override = F.text(b.nameOverride, 80, "Display name");
  if (b.photoOverride !== undefined) out.photo_override = b.photoOverride ? F.images([b.photoOverride], 1)[0] : "";
  if (b.link !== undefined) out.link = cleanUrl(b.link, "Link");
  if (b.hidden !== undefined) out.hidden = !!b.hidden;
  return out;
}

async function create(req, res) {
  await requireAdmin(req, res);
  const memberId = String(req.body.memberId || "").slice(0, 80);
  if (!memberId) throw new HttpError(400, "Choose a member to add.");
  const m = await fetchMember(memberId);
  if (!m) throw new HttpError(404, "That member wasn't found in Memberstack.");
  const p = profileOf(m);
  const f = fields(req.body);
  const max = await db.one(`SELECT coalesce(max(sort_order), 0) + 10 AS n FROM team`);
  const row = await db.one(
    `INSERT INTO team (member_id, name, avatar, role, quote, name_override, photo_override, link, hidden, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (member_id) DO NOTHING RETURNING *`,
    [memberId, p.name, p.avatar, f.role || "", f.quote || "", f.name_override || "", f.photo_override || "", f.link || "", !!f.hidden, Number(max.n)]
  );
  if (!row) throw new HttpError(409, `${p.name} is already on the team page.`);
  return { member: serialize(row, { admin: true }) };
}

async function edit(req, res) {
  await requireAdmin(req, res);
  const id = F.intId(req.query.id, "team member");
  const f = fields(req.body);
  const keys = Object.keys(f);
  if (!keys.length) throw new HttpError(400, "Nothing to change.");
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const row = await db.one(`UPDATE team SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`, [id, ...keys.map((k) => f[k])]);
  if (!row) throw new HttpError(404, "That team member was already removed.");
  return { member: serialize(row, { admin: true }) };
}

async function reorder(req, res) {
  await requireAdmin(req, res);
  const ids = (Array.isArray(req.body.ids) ? req.body.ids : []).map((x) => F.intId(x, "team member")).slice(0, 500);
  await db.q(
    `UPDATE team t SET sort_order = o.ord * 10
       FROM (SELECT value::int AS id, ordinality AS ord FROM jsonb_array_elements_text($1::jsonb) WITH ORDINALITY) o
      WHERE t.id = o.id`,
    [db.json(ids.map(String))]
  );
  return { ok: true };
}

async function remove(req, res) {
  await requireAdmin(req, res);
  const id = F.intId(req.query.id, "team member");
  await db.q(`DELETE FROM team WHERE id = $1`, [id]);
  return { ok: true };
}
