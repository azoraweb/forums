// /api/inbox
//   GET  ?count=1                     how many things need the viewer's attention (navbar badge)
//   GET                               the viewer's inbox (+ the review queue for admins)
//   POST { action: "read", ids? }     mark some (or all) as read
//   POST { action: "dismiss", id }    clear one item from your inbox
//   POST { action: "decide", id, decision, note? }   admins: business registrations
//        decision: approve | scholarship | decline | handled (just close it)
//   POST { event: {...} }  + header  x-azora-secret: INBOX_SECRET   (accounts project only)

const crypto = require("crypto");
const config = require("../config");
const db = require("../lib/db");
const { handler, HttpError, noStore } = require("../lib/http");
const { viewer, addPlan, removePlan } = require("../lib/auth");
const { gate } = require("../lib/features");
const IB = require("../lib/inbox");
const F = require("../lib/forum");

const iso = (d) => (d ? new Date(d).toISOString() : null);

function secretOk(req) {
  const want = process.env.INBOX_SECRET || "";
  const got = String(req.headers["x-azora-secret"] || "");
  if (!want || got.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

module.exports = handler(async (req, res) => {
  noStore(res);
  // Server-to-server events from the accounts project.
  if (req.method === "POST" && req.headers["x-azora-secret"] !== undefined) {
    if (!secretOk(req)) throw new HttpError(401, "Bad inbox secret.");
    const events = Array.isArray(req.body.events) ? req.body.events : [req.body.event];
    const out = [];
    for (const e of events.filter(Boolean).slice(0, 20)) out.push(await IB.handleEvent(e));
    return { results: out };
  }

  await gate(req, "inbox");
  const v = await viewer(req);
  if (req.method === "GET") return req.query.count ? count(v) : list(v);
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
  const b = req.body;
  if (b.action === "read") return markRead(v, b);
  if (b.action === "dismiss") return dismiss(v, b);
  if (b.action === "decide") return decide(v, b);
  throw new HttpError(400, "Unknown action.");
});

function serialize(r) {
  return {
    id: Number(r.id),
    kind: r.kind,
    title: r.title,
    body: r.body,
    link: r.link,
    review: r.recipient === IB.ADMINS,
    status: r.status,
    resolution: r.resolution,
    resolvedBy: r.resolved_by,
    resolvedAt: iso(r.resolved_at),
    read: r.recipient === IB.ADMINS ? r.status !== "open" : !!r.read_at,
    data: r.recipient === IB.ADMINS ? (typeof r.data === "string" ? JSON.parse(r.data) : r.data || {}) : undefined,
    createdAt: iso(r.created_at),
  };
}

async function count(v) {
  const r = await db.one(
    `SELECT (SELECT count(*)::int FROM inbox WHERE recipient = $1 AND read_at IS NULL AND dismissed_at IS NULL)
          + CASE WHEN $2 THEN (SELECT count(*)::int FROM inbox WHERE recipient = '@admins' AND status = 'open') ELSE 0 END AS n`,
    [v.id, v.isAdmin]
  );
  return { count: Number(r.n) };
}

async function list(v) {
  const mine = await db.q(
    `SELECT * FROM inbox WHERE recipient = $1 AND dismissed_at IS NULL ORDER BY created_at DESC LIMIT 60`,
    [v.id]
  );
  let review = [];
  if (v.isAdmin) {
    review = await db.q(
      `(SELECT * FROM inbox WHERE recipient = '@admins' AND status = 'open' ORDER BY created_at DESC LIMIT 100)
       UNION ALL
       (SELECT * FROM inbox WHERE recipient = '@admins' AND status = 'done' AND resolved_at > now() - interval '30 days'
         ORDER BY resolved_at DESC LIMIT 30)`
    );
  }
  return { items: mine.map(serialize), review: review.map(serialize), isAdmin: v.isAdmin };
}

async function markRead(v, b) {
  if (Array.isArray(b.ids) && b.ids.length) {
    const ids = b.ids.map((x) => F.intId(x)).slice(0, 200);
    await db.q(
      `UPDATE inbox SET read_at = now() WHERE recipient = $1 AND read_at IS NULL
         AND id IN (SELECT jsonb_array_elements_text($2::jsonb)::int)`,
      [v.id, db.json(ids.map(String))]
    );
  } else {
    await db.q(`UPDATE inbox SET read_at = now() WHERE recipient = $1 AND read_at IS NULL`, [v.id]);
  }
  return count(v);
}

async function dismiss(v, b) {
  const id = F.intId(b.id);
  await db.q(`UPDATE inbox SET dismissed_at = now(), read_at = coalesce(read_at, now()) WHERE id = $1 AND recipient = $2`, [id, v.id]);
  return count(v);
}

async function decide(v, b) {
  if (!v.isAdmin) throw new HttpError(403, "Only Azora admins can review registrations.");
  const id = F.intId(b.id);
  const item = await db.one(`SELECT * FROM inbox WHERE id = $1 AND recipient = '@admins'`, [id]);
  if (!item) throw new HttpError(404, "That item no longer exists.");
  if (item.status !== "open") throw new HttpError(409, `Already handled${item.resolved_by ? ` by ${item.resolved_by}` : ""}.`);
  if (item.kind !== "business.review" && b.decision !== "handled") throw new HttpError(400, "Review this one from the LKBi registrations.");

  const d = typeof item.data === "string" ? JSON.parse(item.data) : item.data || {};
  const decision = String(b.decision || "");
  const note = F.text(b.note, 500, "Note", { multiline: true });
  const P = config.BUSINESS_PLANS;
  const name = d.businessName || "Your business";
  const dash = config.DASHBOARD_URL;

  if (decision === "approve") {
    await addPlan(d.memberId, P.approved);
    await removePlan(d.memberId, P.pending);
    await IB.add({ to: d.memberId, kind: "business.approved", link: dash,
      title: `${name} was approved 🎉`,
      body: "Welcome to Azora! Choose a monthly or yearly plan on your dashboard to activate your listing." + (note ? `\n\n${note}` : "") });
  } else if (decision === "scholarship") {
    await addPlan(d.memberId, P.scholarship);
    await removePlan(d.memberId, P.pending);
    await IB.add({ to: d.memberId, kind: "business.approved", link: dash,
      title: `${name} was approved for an Azora scholarship 🎉`,
      body: "Your listing is free, forever. Open your dashboard and tap Activate my business to go live." + (note ? `\n\n${note}` : "") });
  } else if (decision === "decline") {
    await removePlan(d.memberId, P.pending);
    await IB.add({ to: d.memberId, kind: "business.declined", link: dash,
      title: `${name} wasn't approved yet`,
      body: (note || "Our team couldn't approve this registration right now.") + "\n\nYou can update your details and register again from your dashboard." });
  } else if (decision === "handled") {
    // Already taken care of somewhere else (e.g. in Memberstack): just close it.
  } else {
    throw new HttpError(400, "Choose approve, scholarship or decline.");
  }
  // "handled" can carry what happened elsewhere, e.g. { decision: "handled", label: "approved" }
  const resolution = decision === "handled" ? (String(b.label || "").replace(/[^a-z ]/gi, "").slice(0, 30) || "handled") : decision;
  await db.q(
    `UPDATE inbox SET status = 'done', resolution = $2, resolved_by = $3, resolved_at = now(),
            data = data || jsonb_build_object('note', $4::text) WHERE id = $1`,
    [id, resolution, v.name, note]
  );
  await F.log(v, `${item.kind.split(".")[0]}.${resolution}`, { detail: name === "Your business" ? item.title : name });
  return { ok: true, decision };
}
