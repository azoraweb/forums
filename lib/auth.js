// Who is asking? Verifies the Memberstack token from the browser, works out
// their role, and keeps their display name/photo current in the members table.

const config = require("../config");
const db = require("./db");
const { HttpError } = require("./http");

const MS_API = "https://admin.memberstack.com";

async function msFetch(path, opts = {}) {
  const key = process.env.MEMBERSTACK_SECRET_KEY;
  if (!key) throw new Error("MEMBERSTACK_SECRET_KEY is not set");
  const r = await fetch(MS_API + path, {
    ...opts,
    headers: { "X-API-KEY": key, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

async function fetchMember(id) {
  const m = await msFetch(`/members/${encodeURIComponent(id)}`);
  return m.ok ? m.body?.data || null : null;
}

const LIVE = ["ACTIVE", "TRIALING", "PAST_DUE"];
function onPlan(member, planId) {
  return !!(member?.planConnections || []).some(
    (p) => (p.planId === planId || p.plan?.id === planId) && LIVE.includes(String(p.status || "ACTIVE").toUpperCase())
  );
}

function roleOf(member) {
  if (onPlan(member, config.ADMIN_PLAN_ID)) return "admin";
  if (onPlan(member, config.MODERATOR_PLAN_ID)) return "moderator";
  return "member";
}

function profileOf(member) {
  const cf = member.customFields || {};
  const isBusiness = config.BUSINESS_PLAN_IDS.some((p) => onPlan(member, p));
  let name = "";
  for (const k of config.NAME_FIELDS) if (!name && cf[k]) name = String(cf[k]).trim();
  if (!name && (cf["first-name"] || cf["last-name"])) name = `${cf["first-name"] || ""} ${cf["last-name"] || ""}`.trim();
  return {
    name: (name || "Azora member").slice(0, 80),
    avatar: String(member.profileImage || "").slice(0, 600),
    businessName: isBusiness ? String(cf[config.BUSINESS_NAME_FIELD] || "").trim().slice(0, 100) : "",
    isBusiness,
  };
}

// Small per-instance cache so browsing doesn't hit Memberstack on every click.
const cache = new Map();
const TTL = 60000;

async function resolveToken(token) {
  const hit = cache.get(token);
  if (hit && hit.exp > Date.now()) return hit.value;
  const v = await msFetch("/members/verify-token", { method: "POST", body: JSON.stringify({ token }) });
  const id = v.body?.data?.id;
  if (!v.ok || !id) return null;
  const member = await fetchMember(id);
  if (!member) return null;
  const value = { id, role: roleOf(member), isDeveloper: onPlan(member, config.DEVELOPER_PLAN_ID), email: member.auth?.email || "", ...profileOf(member) };
  if (cache.size > 500) cache.clear();
  cache.set(token, { exp: Date.now() + TTL, value });
  return value;
}

/**
 * Returns the viewer, or null when logged out (unless required).
 * Also syncs their name/photo/role into the members table and loads ban + email settings.
 */
async function viewer(req, { required = true } = {}) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    if (required) throw new HttpError(401, "Please log in first.");
    return null;
  }
  const v = await resolveToken(token);
  if (!v) {
    if (required) throw new HttpError(401, "Your session has expired. Please log in again.");
    return null;
  }
  const row = await db.one(
    `INSERT INTO members (id, name, avatar, business_name, is_business, role)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name, avatar = EXCLUDED.avatar, business_name = EXCLUDED.business_name,
       is_business = EXCLUDED.is_business, role = EXCLUDED.role, updated_at = now()
     WHERE (members.name, members.avatar, members.business_name, members.is_business, members.role)
       IS DISTINCT FROM (EXCLUDED.name, EXCLUDED.avatar, EXCLUDED.business_name, EXCLUDED.is_business, EXCLUDED.role)
     RETURNING notify, banned_at, ban_reason`,
    [v.id, v.name, v.avatar, v.businessName, v.isBusiness, v.role]
  ) || await db.one(`SELECT notify, banned_at, ban_reason FROM members WHERE id = $1`, [v.id]);

  const isMod = v.role === "admin" || v.role === "moderator";
  return {
    ...v,
    isMod,
    isAdmin: v.role === "admin",
    // admins and developers can see features that are in dev mode
    isStaff: v.role === "admin" || v.isDeveloper,
    canManageForums: v.role === "admin" || (v.role === "moderator" && config.MODERATORS_CAN_MANAGE_FORUMS),
    notify: row ? row.notify !== false : true,
    banned: !!(row && row.banned_at) && !isMod,
    banReason: (row && row.ban_reason) || "",
  };
}

function requireActive(v) {
  if (v.banned) {
    throw new HttpError(403, "Your account can't post in the forums right now." + (v.banReason ? ` Reason: ${v.banReason}` : ""));
  }
}
function requireMod(v) {
  if (!v?.isMod) throw new HttpError(403, "Only Azora moderators and admins can do that.");
}

// Every Memberstack member (paged), cached briefly — used to pick team members.
let allCache = { at: 0, list: null };
async function listAllMembers() {
  if (allCache.list && Date.now() - allCache.at < 60000) return allCache.list;
  const out = [];
  let after = "";
  for (let page = 0; page < 50; page++) {
    const r = await msFetch(`/members?limit=100${after ? `&after=${encodeURIComponent(after)}` : ""}`);
    if (!r.ok) throw new Error(`Memberstack list members -> ${r.status}`);
    const rows = r.body?.data || [];
    out.push(...rows);
    if (!r.body?.hasNextPage || !rows.length) break;
    after = r.body.endCursor || rows[rows.length - 1].id;
  }
  allCache = { at: Date.now(), list: out };
  return out;
}

// Free-plan changes (used by inbox decisions on business registrations).
async function addPlan(memberId, planId) {
  const r = await msFetch(`/members/${encodeURIComponent(memberId)}/add-plan`, { method: "POST", body: JSON.stringify({ planId }) });
  if (!r.ok && r.status !== 409) throw new Error(`Memberstack add-plan ${planId} -> ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
}
async function removePlan(memberId, planId) {
  const r = await msFetch(`/members/${encodeURIComponent(memberId)}/remove-plan`, { method: "POST", body: JSON.stringify({ planId }) });
  if (!r.ok && r.status !== 404) console.warn(`[inbox] remove-plan ${planId} -> ${r.status}`);
}

module.exports = { viewer, requireActive, requireMod, fetchMember, listAllMembers, profileOf, addPlan, removePlan, onPlan };
