const config = require("../config");

class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

function originAllowed(origin) {
  if (!origin) return false;
  let host;
  try { host = new URL(origin).hostname; } catch { return false; }
  return config.ALLOWED_ORIGINS.some((o) => (o instanceof RegExp ? o.test(host) : o === origin));
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (originAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

/** Wrap a handler: CORS, OPTIONS, JSON body parsing, error -> JSON. */
function handler(fn) {
  return async (req, res) => {
    applyCors(req, res);
    if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
    try {
      if (req.body === undefined && ["POST", "PATCH", "DELETE"].includes(req.method)) {
        req.body = await readJson(req);
      } else if (typeof req.body === "string") {
        req.body = req.body ? JSON.parse(req.body) : {};
      }
      if (!req.body || typeof req.body !== "object") req.body = {};
      if (!req.query) req.query = Object.fromEntries(new URL(req.url, "http://x").searchParams);
      const out = await fn(req, res);
      if (!res.writableEnded) send(res, 200, out ?? { ok: true });
    } catch (err) {
      const status = err.status || 500;
      if (status >= 500) console.error(err);
      send(res, status, {
        error: status >= 500 ? (err.public || "Something went wrong. Please try again.") : err.message,
        ...(err.extra || {}),
      });
    }
  };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 6e6) { reject(new HttpError(413, "That's too large.")); req.destroy(); }
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { reject(new HttpError(400, "Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

const noStore = (res) => res.setHeader("Cache-Control", "no-store");

module.exports = { HttpError, handler, send, noStore };
