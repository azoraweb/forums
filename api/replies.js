// /api/replies
//   POST            { threadId, parentId?, body, images[] }   reply to a post (or to an answer)
//   PATCH  ?id=     { body, images[] }                        edit (the author, or a moderator/admin)
//   DELETE ?id=                                                remove (the author, or a moderator/admin)

const config = require("../config");
const db = require("../lib/db");
const { handler, HttpError, noStore } = require("../lib/http");
const { viewer, requireActive } = require("../lib/auth");
const F = require("../lib/forum");
const notify = require("../lib/notify");

module.exports = handler(async (req, res) => {
  noStore(res);
  switch (req.method) {
    case "POST": return create(req);
    case "PATCH": return edit(req);
    case "DELETE": return remove(req);
    default: throw new HttpError(405, "Method not allowed");
  }
});

async function create(req) {
  const v = await viewer(req);
  requireActive(v);
  const b = req.body;
  const threadId = F.intId(b.threadId, "post id");
  const t = await db.one(
    `SELECT t.*, f.archived AS f_archived FROM threads t JOIN forums f ON f.id = t.forum_id WHERE t.id = $1`,
    [threadId]
  );
  if (!t || t.deleted_at) throw new HttpError(404, "This post was removed or doesn't exist.");
  if ((t.locked || t.f_archived) && !v.isMod) throw new HttpError(403, "This post is locked, so new replies are turned off.");

  let parent = null;
  if (b.parentId) {
    parent = await db.one(`SELECT * FROM replies WHERE id = $1 AND thread_id = $2`, [F.intId(b.parentId, "reply id"), threadId]);
    if (!parent) throw new HttpError(404, "The reply you're answering was removed.");
    // Keep it two levels deep: replying to a nested reply attaches to its top-level answer.
    if (parent.parent_id) parent = await db.one(`SELECT * FROM replies WHERE id = $1`, [parent.parent_id]);
  }

  const body = F.text(b.body, config.REPLY_MAX_CHARS, "Reply", { multiline: true });
  const images = F.images(b.images, config.IMAGES_PER_REPLY);
  if (!body && !images.length) throw new HttpError(400, "Write something or add a photo.");
  await F.rateLimit(v, "replies", "author_id", config.REPLIES_PER_HOUR, "replies");

  const row = await db.one(
    `WITH r AS (
       INSERT INTO replies (thread_id, parent_id, author_id, body, images)
       VALUES ($1,$2,$3,$4,$5::jsonb) RETURNING *
     ), u AS (
       UPDATE threads SET reply_count = reply_count + 1, last_activity_at = now() WHERE id = $1
     )
     SELECT * FROM r`,
    [threadId, parent ? parent.id : null, v.id, body, db.json(images)]
  );
  await notify.onReply({ v, thread: t, reply: row, parent });
  return { id: Number(row.id) };
}

async function editable(req) {
  const v = await viewer(req);
  requireActive(v);
  const id = F.intId(req.query.id, "reply id");
  const r = await db.one(`SELECT * FROM replies WHERE id = $1`, [id]);
  if (!r || (r.deleted_at && !v.isMod)) throw new HttpError(404, "That reply was removed or doesn't exist.");
  const mine = r.author_id === v.id;
  if (!mine && !v.isMod) throw new HttpError(403, "You can only change your own replies.");
  return { v, r, mine };
}

async function edit(req) {
  const { v, r, mine } = await editable(req);
  const body = F.text(req.body.body, config.REPLY_MAX_CHARS, "Reply", { multiline: true });
  const images = F.images(req.body.images, config.IMAGES_PER_REPLY);
  if (!body && !images.length) throw new HttpError(400, "Write something or add a photo.");
  await db.q(`UPDATE replies SET body = $2, images = $3::jsonb, edited_at = now() WHERE id = $1`, [r.id, body, db.json(images)]);
  if (!mine) await F.log(v, "reply.edit", { kind: "r", targetId: r.id, threadId: r.thread_id });
  return { ok: true };
}

async function remove(req) {
  const { v, r, mine } = await editable(req);
  if (r.deleted_at) return { ok: true };
  // Replies nested under a removed answer stay visible (under a "removed" placeholder).
  await db.q(
    `WITH d AS (
       UPDATE replies SET deleted_at = now(), deleted_by = $2 WHERE id = $1 AND deleted_at IS NULL RETURNING thread_id
     )
     UPDATE threads SET
       reply_count = greatest(0, reply_count - 1),
       solution_id = CASE WHEN solution_id = $1 THEN NULL ELSE solution_id END
      WHERE id = (SELECT thread_id FROM d)`,
    [r.id, v.id]
  );
  if (!mine) await F.log(v, "reply.remove", { kind: "r", targetId: r.id, threadId: r.thread_id, detail: F.plain(r.body, 120) });
  await db.q(
    `UPDATE reports SET resolved_at = now(), resolved_by = $2, resolution = 'removed'
      WHERE kind = 'r' AND target_id = $1 AND resolved_at IS NULL`,
    [r.id, v.id]
  );
  return { ok: true };
}
