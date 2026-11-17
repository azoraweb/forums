// Shared helpers: validation, serializing rows for the browser, rate limits, mod log.

const config = require("../config");
const db = require("./db");
const { HttpError } = require("./http");

/* ------------------------------------------------------------ validation */

function text(raw, max, label, { required = false, multiline = false, min = 0 } = {}) {
  let s = String(raw ?? "").replace(/\r\n/g, "\n").replace(/\u0000/g, "");
  s = multiline ? s.replace(/[ \t]+$/gm, "").replace(/\n{4,}/g, "\n\n\n").trim() : s.replace(/\s+/g, " ").trim();
  if (required && !s) throw new HttpError(400, `${label} is required.`);
  if (s && s.length < min) throw new HttpError(400, `${label} needs at least ${min} characters.`);
  if (s.length > max) throw new HttpError(400, `${label} must be ${max.toLocaleString()} characters or fewer.`);
  return s;
}

function images(raw, max) {
  const list = Array.isArray(raw) ? raw.filter(Boolean).map(String) : [];
  if (list.length > max) throw new HttpError(400, `Up to ${max} photos.`);
  for (const u of list) {
    let url;
    try { url = new URL(u); } catch { throw new HttpError(400, "Invalid photo."); }
    const host = url.hostname;
    const okProtocol = url.protocol === "https:" || (process.env.AZF_DEV_ALLOW_HTTP === "1" && url.protocol === "http:");
    if (!okProtocol ||!config.ALLOWED_IMAGE_HOST_SUFFIXES.some((s) => host === s || host.endsWith("." + s))) {
      throw new HttpError(400, "Photos must be uploaded through Azora.");
    }
  }
  return list;
}

function kind(raw) {
  const k = String(raw || "question").trim().toLowerCase();
  if (!config.KINDS[k]) throw new HttpError(400, "Unknown post type.");
  return k;
}

const intId = (raw, label = "id") => {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0 || n > 2147483647) throw new HttpError(400, `Missing ${label}.`);
  return n;
};

function slugify(s, max = 60) {
  return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, max).replace(/-$/, "");
}

/* ------------------------------------------------------------ serializing */

const iso = (d) => (d ? new Date(d).toISOString() : null);
const arr = (v) => (Array.isArray(v) ? v : typeof v === "string" ? safeJson(v, []) : []);
function safeJson(s, fallback) { try { return JSON.parse(s); } catch { return fallback; } }

function plain(md, max) {
  const s = String(md || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]+/g, "")
    .replace(/^\s*[-]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > max ? s.slice(0, max).replace(/\s+\S*$/, "") + "…" : s;
}

function author(row) {
  return {
    id: row.author_id,
    name: row.a_name || "Azora member",
    avatar: row.a_avatar || "",
    business: row.a_business || "",
    isBusiness: !!row.a_is_business,
    role: row.a_role || "member",
  };
}

const AUTHOR_COLS = `m.name AS a_name, m.avatar AS a_avatar, m.business_name AS a_business,
  m.is_business AS a_is_business, m.role AS a_role`;

function forum(row) {
  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    description: row.description || "",
    icon: row.icon || "💬",
    sortOrder: Number(row.sort_order || 0),
    modsOnly: !!row.mods_only,
    archived: !!row.archived,
    threadCount: Number(row.thread_count || 0),
    lastActivityAt: iso(row.last_activity),
  };
}

function threadSummary(row) {
  const imgs = arr(row.images);
  return {
    id: Number(row.id),
    slug: slugify(row.title, 70),
    forum: { slug: row.f_slug, name: row.f_name, icon: row.f_icon },
    kind: row.kind,
    title: row.title,
    excerpt: plain(row.body, 220),
    image: imgs[0] || "",
    imageCount: imgs.length,
    author: author(row),
    score: Number(row.score || 0),
    replyCount: Number(row.reply_count || 0),
    solved: !!row.solution_id,
    pinned: !!row.pinned,
    locked: !!row.locked,
    createdAt: iso(row.created_at),
    lastActivityAt: iso(row.last_activity_at),
  };
}

function threadFull(row) {
  return {
    ...threadSummary(row),
    body: row.deleted_at ? "" : row.body || "",
    images: row.deleted_at ? [] : arr(row.images),
    solutionId: row.solution_id ? Number(row.solution_id) : null,
    editedAt: iso(row.edited_at),
    deleted: !!row.deleted_at,
    forumId: Number(row.forum_id),
  };
}

function reply(row, { showRemoved = false } = {}) {
  const removed = !!row.deleted_at;
  return {
    id: Number(row.id),
    parentId: row.parent_id ? Number(row.parent_id) : null,
    author: removed && !showRemoved ? { id: "", name: "", avatar: "", business: "", isBusiness: false, role: "member" } : author(row),
    body: removed && !showRemoved ? "" : row.body,
    images: removed && !showRemoved ? [] : arr(row.images),
    score: Number(row.score || 0),
    createdAt: iso(row.created_at),
    editedAt: iso(row.edited_at),
    deleted: removed,
    deletedByMod: removed && row.deleted_by && row.deleted_by !== row.author_id,
  };
}

/* ---------------------------------------------------------- rate limits */

async function rateLimit(v, table, column, perHour, label) {
  if (v.isMod || !perHour) return;
  const r = await db.one(
    `SELECT count(*)::int AS n FROM ${table} WHERE ${column} = $1 AND created_at > now() - interval '1 hour'`,
    [v.id]
  );
  if (Number(r.n) >= perHour) {
    throw new HttpError(429, `You've hit the limit of ${perHour} ${label} per hour. Please try again a little later.`);
  }
}

/* ---------------------------------------------------------------- mod log */

async function log(v, action, { kind = null, targetId = null, threadId = null, detail = "" } = {}) {
  try {
    await db.q(
      `INSERT INTO mod_log (actor_id, actor_name, action, kind, target_id, thread_id, detail) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [v.id, v.name, action, kind, targetId, threadId, String(detail || "").slice(0, 300)]
    );
  } catch (e) {
    console.error("[forums] mod log failed", e);
  }
}

function settings(v) {
  return {
    kinds: config.KINDS,
    titleMax: config.TITLE_MAX_CHARS,
    bodyMax: config.BODY_MAX_CHARS,
    replyMax: config.REPLY_MAX_CHARS,
    imagesPerThread: config.IMAGES_PER_THREAD,
    imagesPerReply: config.IMAGES_PER_REPLY,
    pageSize: config.PAGE_SIZE,
  };
}

module.exports = {
  text, images, kind, intId, slugify, plain,
  forum, threadSummary, threadFull, reply, AUTHOR_COLS,
  rateLimit, log, settings,
};
