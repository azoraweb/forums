// Inbox items and the events that create them.
//
// Events come from the accounts project (POST /api/inbox with the shared
// INBOX_SECRET) or from decisions made right in the inbox.

const config = require("../config");
const db = require("./db");

const ADMINS = "@admins";

async function add({ to, kind, title, body = "", link = "", ref = "", data = {}, status = "info" }) {
  if (!to) return null;
  return db.one(
    `INSERT INTO inbox (recipient, kind, title, body, link, ref, data, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8) RETURNING *`,
    [to, kind, String(title).slice(0, 200), String(body).slice(0, 1000), link, ref, db.json(data), status]
  );
}

/** Close every open review item for this ref (e.g. a registration someone already decided on). */
async function resolve(ref, resolution, by) {
  return db.q(
    `UPDATE inbox SET status = 'done', resolution = $2, resolved_by = $3, resolved_at = now()
      WHERE ref = $1 AND status = 'open' RETURNING id`,
    [ref, resolution, by || ""]
  );
}

const s = (v, n = 200) => String(v ?? "").trim().slice(0, n);
const first = (name) => s(name).split(/\s+/)[0] || "your child";

/** One event from the accounts project. Returns what was created. */
async function handleEvent(e) {
  const dash = config.DASHBOARD_URL;
  switch (e.type) {
    case "business.registered": {
      const name = s(e.businessName) || "A business";
      const ref = `business:${s(e.memberId, 80)}`;
      // Re-submitting replaces the earlier open review instead of stacking up.
      await db.q(`DELETE FROM inbox WHERE ref = $1 AND status = 'open'`, [ref]);
      await add({
        to: ADMINS, kind: "business.review", status: "open", ref, link: dash,
        title: `New business registration: ${name}`,
        body: [s(e.location), s(e.contactName) && `Contact: ${s(e.contactName)}`].filter(Boolean).join(" · "),
        data: {
          memberId: s(e.memberId, 80), businessName: name, location: s(e.location), contactName: s(e.contactName),
          email: s(e.email), phone: s(e.phone, 40), website: s(e.website, 300), tags: s(e.tags, 300), businessId: s(e.businessId, 40),
        },
      });
      await add({
        to: s(e.memberId, 80), kind: "business.received", link: dash,
        title: "We got your business registration",
        body: `Thanks for registering ${name}! Our team will review it and reach out soon. You won't be charged anything unless you're approved and choose to activate.`,
      });
      return { ok: true };
    }

    case "lkbi.registered": {
      const ref = `lkbi:${s(e.regId, 40)}`;
      await add({
        to: ADMINS, kind: "lkbi.review", status: "open", ref, link: "/lkbi",
        title: `New LKBi registration: ${s(e.child, 80) || "a student"}${e.age ? `, age ${s(e.age, 4)}` : ""}`,
        body: [s(e.groupName) && `Group: ${s(e.groupName)}`, s(e.parentName) && `Parent: ${s(e.parentName)}`].filter(Boolean).join(" · "),
        data: {
          regId: s(e.regId, 40), memberId: s(e.memberId, 80), child: s(e.child, 80), age: s(e.age, 4), grade: s(e.grade, 30),
          groupName: s(e.groupName), parentName: s(e.parentName), parentEmail: s(e.parentEmail), parentPhone: s(e.parentPhone, 40), notes: s(e.notes, 600),
        },
      });
      await add({
        to: s(e.memberId, 80), kind: "lkbi.received", link: dash,
        title: `We got ${first(e.child)}'s LKBi registration`,
        body: "Thanks! The group's host will review it. We'll let you know here as soon as it's approved.",
      });
      return { ok: true };
    }

    case "lkbi.status": {
      const ref = `lkbi:${s(e.regId, 40)}`;
      const stage = s(e.stage, 20);
      await resolve(ref, stage || s(e.status, 40), s(e.by, 80));
      const who = first(e.child);
      const msg = {
        approved: [`${who}'s LKBi registration was approved 🎉`, "Finish enrolling from your dashboard: tap Activate & pay on the LKBi card."],
        active: [`${who} is enrolled in LKBi`, "Payment confirmed. Welcome to Little Kids, BIG Ideas!"],
        canceled: [`${who}'s LKBi registration was canceled`, "If this doesn't look right, reach out to the group's host or the Azora team."],
      }[stage];
      if (msg && e.memberId) await add({ to: s(e.memberId, 80), kind: `lkbi.${stage}`, title: msg[0], body: msg[1], link: dash, ref });
      return { ok: true };
    }

    case "group.member": {
      const group = s(e.groupName) || "a group";
      if (!e.memberId) return { ok: true };
      await add(e.joined
        ? { to: s(e.memberId, 80), kind: "group.added", link: dash, title: `You were added to ${group}`, body: s(e.by) ? `${s(e.by)} added you. You'll see its meetings on your dashboard.` : "You'll see its meetings on your dashboard." }
        : { to: s(e.memberId, 80), kind: "group.removed", link: dash, title: `You were removed from ${group}`, body: "If you think this was a mistake, reach out to the group's host." });
      return { ok: true };
    }

    default:
      return { ok: false, ignored: e.type };
  }
}

module.exports = { ADMINS, add, resolve, handleEvent };
