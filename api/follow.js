// /api/follow — members following businesses.
//   GET                       businesses the viewer follows (empty when logged out)
//   GET  ?business=<itemId>   follower count for one business (+ whether the viewer follows it)
//   GET  ?mine=1              business owners: who follows their business
//   POST { businessId, follow: true|false }
//
// Follows live in the database. Copies are kept in step for Webflow/Memberstack:
// the Business item's "Followers" number, the owner's "followers" custom field,
// and the follower's "following" custom field (comma-separated Business item IDs).
// A new follower sends the owner an inbox notification.

const config = require("../config");
const db = require("../lib/db");
const { handler, HttpError, noStore } = require("../lib/http");
const { viewer, updateCustomFields } = require("../lib/auth");
const { gate } = require("../lib/features");
const B = require("../lib/business");
const IB = require("../lib/inbox");
const F = require("../lib/forum");

const iso = (d) => (d ? new Date(d).toISOString() : null);
const isItemId = (s) => /^[a-f0-9]{24}$/i.test(String(s || ""));
const pageUrl = (slug) => (slug ? config.BUSINESS_PAGE_PREFIX + slug : "");

module.exports = handler(async (req, res) => {
  await gate(req, "businesses");
  if (req.method === "GET") {
    if (req.query.business) return one(req, res);
    if (req.query.mine) return mine(req, res);
    return following(req, res);
  }
  if (req.method === "POST") return toggle(req, res);
  throw new HttpError(405, "Method not allowed");
});

async function countFor(businessId) {
  const r = await db.one(`SELECT count(*)::int AS n FROM follows WHERE business_id = $1`, [businessId]);
  return Number(r.n);
}

async function one(req, res) {
  const id = String(req.query.business);
  if (!isItemId(id)) throw new HttpError(400, "Missing business.");
  const v = req.headers.authorization ? await viewer(req, { required: false }) : null;
  if (v) noStore(res);
  else res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=60");
  const [count, row] = await Promise.all([
    countFor(id),
    v ? db.one(`SELECT 1 AS x FROM follows WHERE member_id = $1 AND business_id = $2`, [v.id, id]) : null,
  ]);
  return { businessId: id, count, following: !!row, isOwner: !!(v && v.ownBusinessId === id) };
}

async function following(req, res) {
  noStore(res);
  const v = await viewer(req, { required: false });
  if (!v) return { following: [] };
  const rows = await db.q(`SELECT * FROM follows WHERE member_id = $1 ORDER BY created_at DESC LIMIT 500`, [v.id]);
  return {
    following: rows.map((r) => ({
      businessId: r.business_id, name: r.business_name, slug: r.business_slug, logo: r.business_logo,
      url: pageUrl(r.business_slug), since: iso(r.created_at),
    })),
  };
}

async function mine(req, res) {
  noStore(res);
  const v = await viewer(req);
  const id = v.ownBusinessId;
  if (!isItemId(id)) return { business: null, count: 0, followers: [] };
  const rows = await db.q(`SELECT * FROM follows WHERE business_id = $1 ORDER BY created_at DESC LIMIT 500`, [id]);
  return {
    business: { id },
    count: rows.length,
    followers: rows.map((r) => ({ name: r.member_name || "Azora member", avatar: r.member_avatar, since: iso(r.created_at) })),
  };
}

function withTimeout(p, ms = 6000) {
  return Promise.race([p, new Promise((r) => setTimeout(r, ms))]).catch((e) => console.warn("[follows]", e.message));
}

async function toggle(req, res) {
  noStore(res);
  const v = await viewer(req);
  const id = String(req.body.businessId || "");
  if (!isItemId(id)) throw new HttpError(400, "Missing business.");
  const follow = req.body.follow !== false;
  if (follow && v.ownBusinessId === id) throw new HttpError(400, "That's your own business.");

  const biz = await B.getBusiness(id);
  if (!biz || biz.archived) throw new HttpError(404, "That business isn't on Azora anymore.");
  if (follow && biz.ownerId && biz.ownerId === v.id) throw new HttpError(400, "That's your own business.");

  let changed;
  if (follow) {
    await F.rateLimit(v, "follows", "member_id", config.FOLLOWS_PER_HOUR, "follows");
    changed = !!(await db.one(
      `INSERT INTO follows (member_id, business_id, member_name, member_avatar, business_name, business_slug, business_logo, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (member_id, business_id) DO UPDATE SET business_name = EXCLUDED.business_name, business_slug = EXCLUDED.business_slug,
         business_logo = EXCLUDED.business_logo, owner_id = EXCLUDED.owner_id
       RETURNING (xmax = 0) AS inserted`,
      [v.id, id, v.isBusiness && v.businessName ? `${v.name} · ${v.businessName}` : v.name, v.avatar, biz.name, biz.slug, biz.logo, biz.ownerId]
    ))?.inserted;
  } else {
    changed = !!(await db.one(`DELETE FROM follows WHERE member_id = $1 AND business_id = $2 RETURNING 1 AS x`, [v.id, id]));
  }
  const count = await countFor(id);

  if (changed) {
    const mineIds = (await db.q(`SELECT business_id FROM follows WHERE member_id = $1 ORDER BY created_at`, [v.id])).map((r) => r.business_id);
    const jobs = [
      B.setFollowerCount(biz, count),
      updateCustomFields(v.id, { [config.MS_FOLLOWING_FIELD]: mineIds.join(",") }),
    ];
    if (biz.ownerId) jobs.push(updateCustomFields(biz.ownerId, { [config.MS_FOLLOWERS_FIELD]: String(count) }));
    // Tell the owner about a new follower (only the first time this person follows).
    if (follow && biz.ownerId) {
      const ref = `follow:${id}:${v.id}`;
      jobs.push((async () => {
        const seen = await db.one(`SELECT 1 AS x FROM inbox WHERE ref = $1 LIMIT 1`, [ref]);
        if (seen) return;
        const who = v.isBusiness && v.businessName ? v.businessName : v.name;
        await IB.add({
          to: biz.ownerId, kind: "business.follower", ref, link: config.DASHBOARD_URL,
          title: `${who} is now following ${biz.name || "your business"}`,
          body: `${biz.name || "Your business"} has ${count} follower${count === 1 ? "" : "s"}. Share a post from your dashboard to keep them in the loop. Your followers get it in their inbox.`,
        });
      })());
    }
    await withTimeout(Promise.allSettled(jobs));
  }
  return { businessId: id, following: follow, count };
}
