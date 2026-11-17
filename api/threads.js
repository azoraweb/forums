// /api/threads
//   GET  ?forum=slug&sort=active|new|top|unanswered|solved&kind=&q=&page=&author=
//   GET  ?similar=<title text>          up to 5 existing posts that look like it (for "ask" form)
//   POST { forum, kind, title, body, images[] }       start a new post (logged-in members)

const config = require("../config");
const db = require("../lib/db");
const { gate } = require("../lib/features");
const { handler, HttpError, noStore } = require("../lib/http");
const { viewer, requireActive } = require("../lib/auth");
const F = require("../lib/forum");

module.exports = handler(async (req, res) => {
  await gate(req, "forums");
  if (req.method === "GET") return req.query.similar !== undefined ? similar(req, res) : list(req, res);
  if (req.method === "POST") return create(req, res);
  throw new HttpError(405, "Method not allowed");
});

/** Turn free text into a safe Postgres prefix query: "etch concrete" -> "etch:* & concrete:*" */
function tsQuery(raw, joiner) {
  const words = (String(raw || "").toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
    .filter((w) => w.length > 1 || /\d/.test(w))
    .slice(0, 10);
  return words.length ? words.map((w) => `${w}:*`).join(joiner) : "";
}

const SELECT = `SELECT t.*, f.slug AS f_slug, f.name AS f_name, f.icon AS f_icon, ${F.AUTHOR_COLS}
  FROM threads t JOIN forums f ON f.id = t.forum_id JOIN members m ON m.id = t.author_id`;

async function list(req, res) {
  const p = [];
  const add = (v) => { p.push(v); return `$${p.length}`; };
  const where = ["t.deleted_at IS NULL"];
  const forumSlug = String(req.query.forum || "").trim();
  if (forumSlug) where.push(`f.slug = ${add(forumSlug)}`);
  else where.push("NOT f.archived");
  if (req.query.kind && config.KINDS[req.query.kind]) where.push(`t.kind = ${add(req.query.kind)}`);
  if (req.query.author) where.push(`t.author_id = ${add(String(req.query.author).slice(0, 80))}`);

  const sort = String(req.query.sort || "active");
  const tsq = tsQuery(req.query.q, " & ");
  let order;
  if (req.query.q !== undefined && String(req.query.q).trim()) {
    if (!tsq) return { threads: [], hasMore: false, page: 1 };
    const qp = add(tsq);
    where.push(`(t.search_vec @@ to_tsquery('english', ${qp}) OR EXISTS (
      SELECT 1 FROM replies r WHERE r.thread_id = t.id AND r.deleted_at IS NULL AND r.search_vec @@ to_tsquery('english', ${qp})))`);
    order = `ts_rank(t.search_vec, to_tsquery('english', ${qp}))
      + 0.4 * coalesce((SELECT max(ts_rank(r.search_vec, to_tsquery('english', ${qp}))) FROM replies r
                         WHERE r.thread_id = t.id AND r.deleted_at IS NULL), 0)
      + CASE WHEN t.solution_id IS NOT NULL THEN 0.05 ELSE 0 END DESC, t.last_activity_at DESC`;
  } else if (sort === "new") {
    order = "t.created_at DESC";
  } else if (sort === "top") {
    order = "t.score DESC, t.reply_count DESC, t.created_at DESC";
  } else if (sort === "unanswered") {
    where.push("t.reply_count = 0", "t.kind = 'question'");
    order = "t.created_at DESC";
  } else if (sort === "solved") {
    where.push("t.solution_id IS NOT NULL");
    order = "t.last_activity_at DESC";
  } else {
    order = (forumSlug ? "t.pinned DESC, " : "") + "t.last_activity_at DESC";
  }

  const page = Math.max(1, Math.min(500, parseInt(req.query.page, 10) || 1));
  const size = config.PAGE_SIZE;
  const rows = await db.q(
    `${SELECT} WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ${size + 1} OFFSET ${(page - 1) * size}`,
    p
  );
  res.setHeader("Cache-Control", `public, s-maxage=${config.FEED_CACHE_SECONDS}, stale-while-revalidate=60`);
  return { threads: rows.slice(0, size).map(F.threadSummary), hasMore: rows.length > size, page };
}

async function similar(req, res) {
  const tsq = tsQuery(req.query.similar, " | ");
  if (!tsq) return { threads: [] };
  const rows = await db.q(
    `${SELECT} WHERE t.deleted_at IS NULL AND t.search_vec @@ to_tsquery('english', $1)
      ORDER BY ts_rank(t.search_vec, to_tsquery('english', $1)) + CASE WHEN t.solution_id IS NOT NULL THEN 0.1 ELSE 0 END DESC
      LIMIT 5`,
    [tsq]
  );
  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
  return { threads: rows.map(F.threadSummary) };
}

async function create(req, res) {
  noStore(res);
  const v = await viewer(req);
  requireActive(v);
  const b = req.body;
  const forum = await db.one(`SELECT * FROM forums WHERE slug = $1`, [String(b.forum || "")]);
  if (!forum || forum.archived) throw new HttpError(400, "Please choose a forum.");
  if (forum.mods_only && !v.isMod) throw new HttpError(403, "Only moderators can post in this forum.");

  const title = F.text(b.title, config.TITLE_MAX_CHARS, "Title", { required: true, min: 6 });
  const body = F.text(b.body, config.BODY_MAX_CHARS, "Details", { multiline: true });
  const images = F.images(b.images, config.IMAGES_PER_THREAD);
  const kind = F.kind(b.kind);
  if (!body && !images.length && kind === "question" && title.length < 20) {
    throw new HttpError(400, "Add a few details or a photo so people can help.");
  }
  await F.rateLimit(v, "threads", "author_id", config.THREADS_PER_HOUR, "new posts");

  const row = await db.one(
    `INSERT INTO threads (forum_id, author_id, kind, title, body, images)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING id, title`,
    [forum.id, v.id, kind, title, body, db.json(images)]
  );
  return { id: Number(row.id), slug: F.slugify(row.title, 70) };
}
