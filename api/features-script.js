// GET /azora-features.js (rewritten here by vercel.json)
// The site-wide script with the current feature switches baked in, so pages
// can hide dev-mode features before they ever appear on screen.
// Cached at Vercel's edge for 15 seconds, so a switch takes effect within ~15s.

const config = require("../config");
const FT = require("../lib/features");
const client = require("../lib/featuresClient");

module.exports = async (req, res) => {
  let features = [];
  let ok = true;
  try {
    features = (await FT.list()).map((f) => ({ key: f.key, name: f.name, mode: f.mode, message: f.message, paths: f.paths, selectors: f.selectors }));
  } catch (e) {
    ok = false; // database unreachable: everything stays visible (fail open)
    console.error("[features] couldn't load switches", e);
  }
  const data = {
    features,
    plans: { admin: config.ADMIN_PLAN_ID, developer: config.DEVELOPER_PLAN_ID },
    defaultMessage: FT.DEFAULT_MESSAGE,
    adminPage: config.ADMIN_PAGE,
  };
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", ok ? "public, max-age=0, s-maxage=15, stale-while-revalidate=300" : "no-store");
  res.end(`/* Azora feature switches */\n(${client.toString()})(${JSON.stringify(data).replace(/</g, "\\u003c")});\n`);
};
