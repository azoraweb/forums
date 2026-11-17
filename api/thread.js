// /api/thread?id=<threadId>
//   GET      the post, its forum and all replies (+ what the viewer has voted on)
//   PATCH    { title, body, images[], kind }    edit (the author, or a moderator/admin)
//   DELETE   remove the post (the author, or a moderator/admin)

const config = require("../config");
const db = require("../lib/db");
const { handler, HttpError, noStore } = require("../lib/http");
const { viewer, requireActive } = require("../lib/auth");
const F = require("../lib/forum");

module.exports = handler(async (req, res) => {
  switch (req.method) {
    case "GET": return get(req, res);
    case "PATCH": return edit(req, res);
    case "DELETE": return remove(req, res);
    default: throw new HttpError(405, "Method not allowed");
  }
});

async function loadThread(id) {
  return db.one(
    `SELECT t.*, f.slug AS f_slug, f.name AS f_name, f.icon AS f_icon, f.archived AS f_archived, ${F.AUTHOR_COLS}
       FROM threads t JOIN forums f ON f.id = t.forum_id JOIN members m ON m.id = t.author_id
      WHERE t.id = $1`,
    [id]
  );
}

async function get(req, res) {
  const id = F.intId(req.query.id, "post id");
  const v = req.headers.authorization ? await viewer(req, { required: false }) : null;
  if (v) noStore(res);
  else res.setHeader("Cache-Control", `public, s-maxage=${config.FEED_CACHE_SECONDS}, stale-while-revalidate=60`);

  const t = await loadThread(id);
  if (!t || (t.deleted_at && !v?.isMod)) throw new HttpError(404, "This post was removed or doesn't exist.");

  const rows = await db.q(
    `SELECT r.*, ${F.AUTHOR_COLS} FROM replies r JOIN members m ON m.id = r.author_id
      WHERE r.thread_id = $1 ORDER BY r.created_at, r.id`,
    [id]
  );
  // Keep a removed reply only as a placeholder when it still has visible replies under it.
  const liveChildren = new Set(rows.filter((r) => !r.deleted_at && r.parent_id).map((r) => Number(r.parent_id)));
  const replies = rows
    .filter((r) => !r.deleted_at || v?.isMod || liveChildren.has(Number(r.id)))
    .map((r) => F.reply(r, { showRemoved: !!v?.isMod }));

  let me = null;
  if (v) {
    const votes = await db.q(
      `SELECT kind, target_id FROM votes
        WHERE member_id = $1 AND ((kind = 't' AND target_id = $2)
           OR (kind = 'r' AND target_id IN (SELECT id FROM replies WHERE thread_id = $2)))`,
      [v.id, id]
    );
    me = {
      votedThread: votes.some((x) => x.kind === "t"),
      votedReplies: votes.filter((x) => x.kind === "r").map((x) => Number(x.target_id)),
    };
  }
  const thread = F.threadFull(t);
  if (t.deleted_at && v?.isMod) { thread.body = t.body; thread.images = Array.isArray(t.images) ? t.images : JSON.parse(t.images || "[]"); }
  return {
    thread,
    forumArchived: !!t.f_archived,
    replies,
    me,
    settings: F.settings(),
  };
}

async function editable(req, res) {
  noStore(res);
  const v = await viewer(req);
  requireActive(v);
  const id = F.intId(req.query.id, "post id");
  const t = await db.one(`SELECT * FROM threads WHERE id = $1`, [id]);
  if (!t || (t.deleted_at && !v.isMod)) throw new HttpError(404, "This post was removed or doesn't exist.");
  const mine = t.author_id === v.id;
  if (!mine && !v.isMod) throw new HttpError(403, "You can only change your own posts.");
  return { v, t, mine };
}

async function edit(req, res) {
  const { v, t, mine } = await editable(req, res);
  const b = req.body;
  const title = F.text(b.title, config.TITLE_MAX_CHARS, "Title", { required: true, min: 6 });
  const body = F.text(b.body, config.BODY_MAX_CHARS, "Details", { multiline: true });
  const images = F.images(b.images, config.IMAGES_PER_THREAD);
  const kind = F.kind(b.kind || t.kind);
  await db.q(
    `UPDATE threads SET title = $2, body = $3, images = $4::jsonb, kind = $5, edited_at = now(),
            solution_id = CASE WHEN $5 = 'question' THEN solution_id ELSE NULL END
      WHERE id = $1`,
    [t.id, title, body, db.json(images), kind]
  );
  if (!mine) await F.log(v, "thread.edit", { kind: "t", targetId: t.id, threadId: t.id, detail: title });
  return { ok: true };
}

async function remove(req, res) {
  const { v, t, mine } = await editable(req, res);
  if (t.deleted_at) return { ok: true };
  await db.q(`UPDATE threads SET deleted_at = now(), deleted_by = $2, pinned = false WHERE id = $1`, [t.id, v.id]);
  if (!mine) await F.log(v, "thread.remove", { kind: "t", targetId: t.id, threadId: t.id, detail: t.title });
  // Removing a post also settles any open reports on it.
  await db.q(
    `UPDATE reports SET resolved_at = now(), resolved_by = $2, resolution = 'removed'
      WHERE thread_id = $1 AND kind = 't' AND resolved_at IS NULL`,
    [t.id, v.id]
  );
  return { ok: true };
}
