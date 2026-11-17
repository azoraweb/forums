// /api/forums
//   GET                         the forum list (with post counts) + settings
//   GET    ?all=1  (mods)       also includes archived forums
//   POST   { name, slug?, description, icon, modsOnly, sortOrder }   create (mods/admins)
//   PATCH  ?id=  { same + archived }                                  edit
//   DELETE ?id=                 deletes an empty forum, archives one that has posts

const config = require("../config");
const db = require("../lib/db");
const { handler, HttpError, noStore } = require("../lib/http");
const { viewer } = require("../lib/auth");
const F = require("../lib/forum");

module.exports = handler(async (req, res) => {
  switch (req.method) {
    case "GET": return list(req, res);
    case "POST": return create(req, res);
    case "PATCH": return edit(req, res);
    case "DELETE": return remove(req, res);
    default: throw new HttpError(405, "Method not allowed");
  }
});

async function list(req, res) {
  let includeArchived = false;
  if (req.query.all) {
    noStore(res);
    const v = await viewer(req);
    includeArchived = v.isMod;
  } else {
    res.setHeader("Cache-Control", `public, s-maxage=${config.FEED_CACHE_SECONDS}, stale-while-revalidate=60`);
  }
  const [rows, stats] = await Promise.all([
    db.q(
      `SELECT f.*, coalesce(c.n, 0) AS thread_count, c.last_activity
         FROM forums f
         LEFT JOIN (SELECT forum_id, count(*)::int AS n, max(last_activity_at) AS last_activity
                      FROM threads WHERE deleted_at IS NULL GROUP BY forum_id) c ON c.forum_id = f.id
        WHERE $1 OR NOT f.archived
        ORDER BY f.archived, f.sort_order, f.name`,
      [includeArchived]
    ),
    db.one(
      `SELECT (SELECT count(*)::int FROM threads WHERE deleted_at IS NULL) AS threads,
              (SELECT count(*)::int FROM replies WHERE deleted_at IS NULL) AS replies,
              (SELECT count(*)::int FROM threads WHERE deleted_at IS NULL AND solution_id IS NOT NULL) AS solved`
    ),
  ]);
  return {
    forums: rows.map(F.forum),
    stats: { threads: Number(stats.threads), replies: Number(stats.replies), solved: Number(stats.solved) },
    settings: F.settings(),
  };
}

async function requireManager(req, res) {
  noStore(res);
  const v = await viewer(req);
  if (!v.canManageForums) throw new HttpError(403, "Only Azora admins and moderators can manage forums.");
  return v;
}

function fields(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.name !== undefined) out.name = F.text(body.name, 60, "Forum name", { required: true });
  if (!partial || body.description !== undefined) out.description = F.text(body.description, 300, "Description");
  if (!partial || body.icon !== undefined) out.icon = F.text(body.icon, 8, "Icon") || "💬";
  if (body.modsOnly !== undefined) out.mods_only = !!body.modsOnly;
  if (body.sortOrder !== undefined) out.sort_order = Math.max(-100000, Math.min(100000, Math.round(Number(body.sortOrder) || 0)));
  if (body.archived !== undefined) out.archived = !!body.archived;
  if (body.slug !== undefined && String(body.slug).trim()) {
    out.slug = F.slugify(body.slug, 50);
    if (!out.slug) throw new HttpError(400, "That link name isn't valid.");
  }
  return out;
}

async function create(req, res) {
  const v = await requireManager(req, res);
  const f = fields(req.body);
  const slug = f.slug || F.slugify(f.name, 50) || `forum-${Date.now().toString(36)}`;
  const max = await db.one(`SELECT coalesce(max(sort_order), 0) + 10 AS n FROM forums`);
  try {
    const row = await db.one(
      `INSERT INTO forums (slug, name, description, icon, mods_only, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [slug, f.name, f.description, f.icon, !!f.mods_only, f.sort_order ?? Number(max.n)]
    );
    await F.log(v, "forum.create", { detail: f.name });
    return { forum: F.forum(row) };
  } catch (e) {
    if (String(e.message).includes("forums_slug_key") || e.code === "23505") {
      throw new HttpError(409, "A forum with that link name already exists.");
    }
    throw e;
  }
}

async function edit(req, res) {
  const v = await requireManager(req, res);
  const id = F.intId(req.query.id, "forum id");
  const f = fields(req.body, { partial: true });
  const keys = Object.keys(f);
  if (!keys.length) throw new HttpError(400, "Nothing to change.");
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  try {
    const row = await db.one(`UPDATE forums SET ${sets} WHERE id = $1 RETURNING *`, [id, ...keys.map((k) => f[k])]);
    if (!row) throw new HttpError(404, "That forum no longer exists.");
    await F.log(v, "forum.edit", { detail: `${row.name}: ${keys.join(", ")}` });
    return { forum: F.forum(row) };
  } catch (e) {
    if (e.code === "23505" || String(e.message).includes("forums_slug_key")) {
      throw new HttpError(409, "A forum with that link name already exists.");
    }
    throw e;
  }
}

async function remove(req, res) {
  const v = await requireManager(req, res);
  const id = F.intId(req.query.id, "forum id");
  const used = await db.one(`SELECT count(*)::int AS n FROM threads WHERE forum_id = $1`, [id]);
  if (Number(used.n) > 0) {
    const row = await db.one(`UPDATE forums SET archived = true WHERE id = $1 RETURNING *`, [id]);
    if (!row) throw new HttpError(404, "That forum no longer exists.");
    await F.log(v, "forum.archive", { detail: row.name });
    return { archived: true, forum: F.forum(row) };
  }
  const row = await db.one(`DELETE FROM forums WHERE id = $1 RETURNING name`, [id]);
  if (!row) throw new HttpError(404, "That forum no longer exists.");
  await F.log(v, "forum.delete", { detail: row.name });
  return { deleted: true, id };
}
