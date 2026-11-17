// Feature switches. Each feature is "live" (everyone sees it) or "dev"
// (only admins + developers see it, with a DEV badge; everyone else sees
// "Under construction. Back soon.").

const db = require("./db");
const { HttpError } = require("./http");
const { viewer } = require("./auth");

const MODES = ["live", "dev"];
const DEFAULT_MESSAGE = "Under construction. Back soon.";

function serialize(row) {
  const arr = (v) => (Array.isArray(v) ? v : typeof v === "string" ? JSON.parse(v || "[]") : []);
  return {
    key: row.key,
    name: row.name,
    description: row.description || "",
    mode: MODES.includes(row.mode) ? row.mode : "live",
    message: row.message || "",
    paths: arr(row.paths),
    selectors: arr(row.selectors),
    sortOrder: Number(row.sort_order || 0),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    updatedBy: row.updated_by || "",
  };
}

async function list() {
  const rows = await db.q(`SELECT * FROM features ORDER BY sort_order, name`);
  return rows.map(serialize);
}

// Small per-instance cache for the server-side check below.
let cache = { at: 0, map: null };
function bust() { cache = { at: 0, map: null }; }
async function modes() {
  if (cache.map && Date.now() - cache.at < 10000) return cache.map;
  const rows = await db.q(`SELECT key, mode, name, message FROM features`);
  const map = {};
  for (const r of rows) map[r.key] = r;
  cache = { at: Date.now(), map };
  return map;
}

/**
 * Block an API for non-staff while its feature is in dev mode.
 * Logged-out visitors and regular members get a 503 "under construction".
 */
async function gate(req, key) {
  const f = (await modes())[key];
  if (!f || f.mode !== "dev") return;
  const v = req.headers.authorization ? await viewer(req, { required: false }).catch(() => null) : null;
  if (v && v.isStaff) return;
  throw new HttpError(503, f.message || `${f.name}: ${DEFAULT_MESSAGE}`, { underConstruction: true, feature: key });
}

module.exports = { MODES, DEFAULT_MESSAGE, serialize, list, modes, gate, bust };
