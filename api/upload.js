// POST /api/upload  { data: "<base64>", contentType: "image/jpeg" }
// Any logged-in member who isn't banned. Stores one photo in Webflow Assets
// and returns its URL. The widget shrinks photos in the browser first.

const config = require("../config");
const db = require("../lib/db");
const { handler, HttpError, noStore } = require("../lib/http");
const { viewer, requireActive } = require("../lib/auth");
const F = require("../lib/forum");
const wf = require("../lib/webflow");

const MAX_BYTES = 3.5 * 1024 * 1024;
const TYPES = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 },
  "image/png": { ext: "png", magic: (b) => b[0] === 0x89 && b[1] === 0x50 },
  "image/webp": { ext: "webp", magic: (b) => b.slice(8, 12).toString() === "WEBP" },
};

module.exports = handler(async (req, res) => {
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
  noStore(res);
  const v = await viewer(req);
  requireActive(v);
  await F.rateLimit(v, "uploads", "member_id", config.UPLOADS_PER_HOUR, "photo uploads");

  const type = TYPES[req.body.contentType];
  if (!type) throw new HttpError(400, "Photos must be JPG, PNG or WebP.");
  const buf = Buffer.from(String(req.body.data || ""), "base64");
  if (!buf.length) throw new HttpError(400, "Empty photo.");
  if (buf.length > MAX_BYTES) throw new HttpError(413, "That photo is too large.");
  if (!type.magic(buf)) throw new HttpError(400, "That file doesn't look like a photo.");

  const fileName = `forum-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.${type.ext}`;
  const url = await wf.uploadAsset(buf, fileName, req.body.contentType);
  await db.q(`INSERT INTO uploads (member_id, url) VALUES ($1, $2)`, [v.id, url]);
  return { url };
});
