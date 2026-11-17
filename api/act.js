// POST /api/act  { action, ... }   — every small one-click action lives here.
//
// Members:
//   vote     { kind: "t"|"r", id }               toggle "helpful" on a post or reply
//   solve    { threadId, replyId|null }          mark/unmark the answer that solved a question
//                                                (the question's author, or a moderator)
//   report   { kind: "t"|"r", id, reason }       flag something for the moderators
//   notify   { on: true|false }                  email me when someone replies
// Moderators & admins:
//   pin      { threadId, on }        lock { threadId, on }        move { threadId, forum: slug }
//   restore  { kind: "t"|"r", id }   ban { memberId, reason }      unban { memberId }
//   resolve  { reportId }            (dismiss a report without removing anything)

const config = require("../config");
const db = require("../lib/db");
const { gate } = require("../lib/features");
const { handler, HttpError, noStore } = require("../lib/http");
const { viewer, requireActive, requireMod } = require("../lib/auth");
const F = require("../lib/forum");
const notify = require("../lib/notify");

const KIND = (k) => {
  if (k !== "t" && k !== "r") throw new HttpError(400, "Unknown item.");
  return k;
};

module.exports = handler(async (req, res) => {
  await gate(req, "forums");
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
  noStore(res);
  const v = await viewer(req);
  const b = req.body;
  const fn = ACTIONS[String(b.action || "")];
  if (!fn) throw new HttpError(400, "Unknown action.");
  return fn(v, b);
});

const ACTIONS = {
  async vote(v, b) {
    requireActive(v);
    const kind = KIND(b.kind);
    const id = F.intId(b.id);
    const table = kind === "t" ? "threads" : "replies";
    const target = await db.one(`SELECT author_id, deleted_at FROM ${table} WHERE id = $1`, [id]);
    if (!target || target.deleted_at) throw new HttpError(404, "That was removed.");
    if (target.author_id === v.id) throw new HttpError(400, "You can't mark your own post as helpful.");
    const row = await db.one(
      `WITH del AS (
         DELETE FROM votes WHERE kind = $1 AND target_id = $2 AND member_id = $3 RETURNING 1
       ), ins AS (
         INSERT INTO votes (kind, target_id, member_id)
         SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT 1 FROM del)
         ON CONFLICT DO NOTHING RETURNING 1
       )
       UPDATE ${table} SET score = greatest(0, score + (SELECT count(*) FROM ins) - (SELECT count(*) FROM del))
        WHERE id = $2
       RETURNING score, (SELECT count(*) FROM ins)::int AS voted`,
      [kind, id, v.id]
    );
    return { score: Number(row.score), voted: Number(row.voted) > 0 };
  },

  async solve(v, b) {
    requireActive(v);
    const threadId = F.intId(b.threadId, "post id");
    const t = await db.one(`SELECT * FROM threads WHERE id = $1 AND deleted_at IS NULL`, [threadId]);
    if (!t) throw new HttpError(404, "This post was removed.");
    if (t.author_id !== v.id && !v.isMod) throw new HttpError(403, "Only the person who asked can mark the solution.");
    if (t.kind !== "question") throw new HttpError(400, "Only questions can be marked solved.");
    let replyId = null;
    if (b.replyId) {
      replyId = F.intId(b.replyId, "reply id");
      const r = await db.one(`SELECT id FROM replies WHERE id = $1 AND thread_id = $2 AND deleted_at IS NULL`, [replyId, threadId]);
      if (!r) throw new HttpError(404, "That reply was removed.");
    }
    await db.q(`UPDATE threads SET solution_id = $2 WHERE id = $1`, [threadId, replyId]);
    if (t.author_id !== v.id) await F.log(v, replyId ? "thread.solve" : "thread.unsolve", { kind: "t", targetId: threadId, threadId });
    return { solutionId: replyId };
  },

  async report(v, b) {
    requireActive(v);
    const kind = KIND(b.kind);
    const id = F.intId(b.id);
    const reason = F.text(b.reason, 500, "Reason", { multiline: true });
    const target = kind === "t"
      ? await db.one(`SELECT id AS thread_id, title FROM threads WHERE id = $1 AND deleted_at IS NULL`, [id])
      : await db.one(`SELECT r.thread_id, t.title FROM replies r JOIN threads t ON t.id = r.thread_id
                       WHERE r.id = $1 AND r.deleted_at IS NULL`, [id]);
    if (!target) throw new HttpError(404, "That was already removed.");
    await F.rateLimit(v, "reports", "reporter_id", config.REPORTS_PER_HOUR, "reports");
    const row = await db.one(
      `INSERT INTO reports (kind, target_id, thread_id, reporter_id, reason) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT DO NOTHING RETURNING id`,
      [kind, id, target.thread_id, v.id, reason]
    );
    if (row) {
      await notify.onReport({ v, kind, threadId: target.thread_id, replyId: kind === "r" ? id : null, reason, title: target.title });
    }
    return { ok: true };
  },

  async notify(v, b) {
    await db.q(`UPDATE members SET notify = $2 WHERE id = $1`, [v.id, !!b.on]);
    return { notify: !!b.on };
  },

  /* ---------------- moderators & admins ---------------- */

  async pin(v, b) {
    requireMod(v);
    const id = F.intId(b.threadId, "post id");
    const row = await db.one(`UPDATE threads SET pinned = $2 WHERE id = $1 RETURNING title`, [id, !!b.on]);
    if (!row) throw new HttpError(404, "That post no longer exists.");
    await F.log(v, b.on ? "thread.pin" : "thread.unpin", { kind: "t", targetId: id, threadId: id, detail: row.title });
    return { pinned: !!b.on };
  },

  async lock(v, b) {
    requireMod(v);
    const id = F.intId(b.threadId, "post id");
    const row = await db.one(`UPDATE threads SET locked = $2 WHERE id = $1 RETURNING title`, [id, !!b.on]);
    if (!row) throw new HttpError(404, "That post no longer exists.");
    await F.log(v, b.on ? "thread.lock" : "thread.unlock", { kind: "t", targetId: id, threadId: id, detail: row.title });
    return { locked: !!b.on };
  },

  async move(v, b) {
    requireMod(v);
    const id = F.intId(b.threadId, "post id");
    const forum = await db.one(`SELECT * FROM forums WHERE slug = $1`, [String(b.forum || "")]);
    if (!forum) throw new HttpError(404, "That forum doesn't exist.");
    const row = await db.one(`UPDATE threads SET forum_id = $2 WHERE id = $1 RETURNING title`, [id, forum.id]);
    if (!row) throw new HttpError(404, "That post no longer exists.");
    await F.log(v, "thread.move", { kind: "t", targetId: id, threadId: id, detail: `${row.title} → ${forum.name}` });
    return { forum: { slug: forum.slug, name: forum.name, icon: forum.icon } };
  },

  async restore(v, b) {
    requireMod(v);
    const kind = KIND(b.kind);
    const id = F.intId(b.id);
    if (kind === "t") {
      const row = await db.one(`UPDATE threads SET deleted_at = NULL, deleted_by = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING title`, [id]);
      if (row) await F.log(v, "thread.restore", { kind, targetId: id, threadId: id, detail: row.title });
    } else {
      const row = await db.one(
        `WITH r AS (UPDATE replies SET deleted_at = NULL, deleted_by = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING thread_id)
         UPDATE threads SET reply_count = reply_count + 1 WHERE id = (SELECT thread_id FROM r) RETURNING id`,
        [id]
      );
      if (row) await F.log(v, "reply.restore", { kind, targetId: id, threadId: Number(row.id) });
    }
    return { ok: true };
  },

  async ban(v, b) {
    requireMod(v);
    const memberId = String(b.memberId || "").slice(0, 80);
    if (!memberId) throw new HttpError(400, "Missing member.");
    if (memberId === v.id) throw new HttpError(400, "You can't ban yourself.");
    const target = await db.one(`SELECT name, role FROM members WHERE id = $1`, [memberId]);
    if (!target) throw new HttpError(404, "That member hasn't used the forums.");
    if (target.role !== "member") throw new HttpError(400, "Moderators and admins can't be banned here. Remove their plan in Memberstack first.");
    const reason = F.text(b.reason, 300, "Reason");
    await db.q(`UPDATE members SET banned_at = now(), ban_reason = $2, banned_by = $3 WHERE id = $1`, [memberId, reason, v.id]);
    await F.log(v, "member.ban", { detail: `${target.name}${reason ? ` — ${reason}` : ""}` });
    return { banned: true };
  },

  async unban(v, b) {
    requireMod(v);
    const memberId = String(b.memberId || "").slice(0, 80);
    const row = await db.one(`UPDATE members SET banned_at = NULL, ban_reason = NULL, banned_by = NULL WHERE id = $1 RETURNING name`, [memberId]);
    if (!row) throw new HttpError(404, "Member not found.");
    await F.log(v, "member.unban", { detail: row.name });
    return { banned: false };
  },

  async resolve(v, b) {
    requireMod(v);
    const id = F.intId(b.reportId, "report id");
    const r = await db.one(`SELECT * FROM reports WHERE id = $1`, [id]);
    if (!r) throw new HttpError(404, "Report not found.");
    // Dismiss every open report on the same item at once.
    await db.q(
      `UPDATE reports SET resolved_at = now(), resolved_by = $3, resolution = 'dismissed'
        WHERE kind = $1 AND target_id = $2 AND resolved_at IS NULL`,
      [r.kind, r.target_id, v.id]
    );
    await F.log(v, "report.dismiss", { kind: r.kind, targetId: r.target_id, threadId: r.thread_id });
    return { ok: true };
  },
};
