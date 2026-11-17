// GET /api/mod   (moderators & admins)
//   Open reports (grouped per item), banned members, recently removed posts and the activity log.

const db = require("../lib/db");
const { gate } = require("../lib/features");
const { handler, HttpError, noStore } = require("../lib/http");
const { viewer, requireMod } = require("../lib/auth");
const F = require("../lib/forum");

const iso = (d) => (d ? new Date(d).toISOString() : null);

module.exports = handler(async (req, res) => {
  await gate(req, "forums");
  if (req.method !== "GET") throw new HttpError(405, "Method not allowed");
  noStore(res);
  const v = await viewer(req);
  requireMod(v);

  const [reports, banned, removed, log] = await Promise.all([
    db.q(
      `SELECT rp.kind, rp.target_id, rp.thread_id, min(rp.id) AS report_id, count(*)::int AS n,
              max(rp.created_at) AS last_at,
              json_agg(json_build_object('reason', rp.reason, 'by', coalesce(rm.name, ''), 'at', rp.created_at)
                       ORDER BY rp.created_at DESC) AS items,
              t.title, t.deleted_at AS t_deleted,
              coalesce(rr.body, t.body) AS body, coalesce(rr.author_id, t.author_id) AS author_id,
              am.name AS author_name, rr.deleted_at AS r_deleted
         FROM reports rp
         JOIN threads t ON t.id = rp.thread_id
         LEFT JOIN replies rr ON rp.kind = 'r' AND rr.id = rp.target_id
         LEFT JOIN members rm ON rm.id = rp.reporter_id
         LEFT JOIN members am ON am.id = coalesce(rr.author_id, t.author_id)
        WHERE rp.resolved_at IS NULL
        GROUP BY rp.kind, rp.target_id, rp.thread_id, t.title, t.deleted_at, rr.body, t.body, rr.author_id, t.author_id, am.name, rr.deleted_at
        ORDER BY count(*) DESC, max(rp.created_at) DESC
        LIMIT 100`
    ),
    db.q(
      `SELECT m.id, m.name, m.avatar, m.ban_reason, m.banned_at, b.name AS banned_by_name
         FROM members m LEFT JOIN members b ON b.id = m.banned_by
        WHERE m.banned_at IS NOT NULL ORDER BY m.banned_at DESC LIMIT 200`
    ),
    db.q(
      `(SELECT 't' AS kind, t.id, t.id AS thread_id, t.title, t.body, t.deleted_at, m.name AS author_name, d.name AS removed_by
          FROM threads t JOIN members m ON m.id = t.author_id LEFT JOIN members d ON d.id = t.deleted_by
         WHERE t.deleted_at IS NOT NULL ORDER BY t.deleted_at DESC LIMIT 30)
       UNION ALL
       (SELECT 'r', r.id, r.thread_id, t.title, r.body, r.deleted_at, m.name, d.name
          FROM replies r JOIN threads t ON t.id = r.thread_id JOIN members m ON m.id = r.author_id
          LEFT JOIN members d ON d.id = r.deleted_by
         WHERE r.deleted_at IS NOT NULL ORDER BY r.deleted_at DESC LIMIT 30)
       ORDER BY deleted_at DESC LIMIT 40`
    ),
    db.q(`SELECT * FROM mod_log ORDER BY created_at DESC LIMIT 60`),
  ]);

  return {
    reports: reports.map((r) => ({
      reportId: Number(r.report_id),
      kind: r.kind,
      targetId: Number(r.target_id),
      threadId: Number(r.thread_id),
      title: r.title,
      excerpt: F.plain(r.body, 240),
      authorId: r.author_id,
      authorName: r.author_name || "",
      count: Number(r.n),
      lastAt: iso(r.last_at),
      removed: !!(r.kind === "t" ? r.t_deleted : r.r_deleted),
      items: (typeof r.items === "string" ? JSON.parse(r.items) : r.items || []).slice(0, 10)
        .map((i) => ({ reason: i.reason, by: i.by, at: iso(i.at) })),
    })),
    banned: banned.map((m) => ({
      id: m.id, name: m.name, avatar: m.avatar, reason: m.ban_reason || "",
      bannedAt: iso(m.banned_at), bannedBy: m.banned_by_name || "",
    })),
    removed: removed.map((r) => ({
      kind: r.kind, id: Number(r.id), threadId: Number(r.thread_id), title: r.title,
      excerpt: F.plain(r.body, 160), authorName: r.author_name, removedBy: r.removed_by || "", removedAt: iso(r.deleted_at),
    })),
    log: log.map((l) => ({
      action: l.action, actor: l.actor_name, detail: l.detail,
      threadId: l.thread_id ? Number(l.thread_id) : null, at: iso(l.created_at),
    })),
  };
});
