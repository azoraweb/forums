// Postgres (Neon, connected through Vercel → Storage). Every query in the
// app goes through q(). Tables are created automatically the first time the
// API runs, so there's nothing to set up by hand in the database.

const config = require("../config");

const SCHEMA_VERSION = "3";

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS azf_meta (key text PRIMARY KEY, value text NOT NULL)`,

  `CREATE TABLE IF NOT EXISTS forums (
    id serial PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    icon text NOT NULL DEFAULT '💬',
    sort_order int NOT NULL DEFAULT 0,
    mods_only boolean NOT NULL DEFAULT false,
    archived boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS members (
    id text PRIMARY KEY,
    name text NOT NULL DEFAULT '',
    avatar text NOT NULL DEFAULT '',
    business_name text NOT NULL DEFAULT '',
    is_business boolean NOT NULL DEFAULT false,
    role text NOT NULL DEFAULT 'member',
    notify boolean NOT NULL DEFAULT true,
    banned_at timestamptz,
    ban_reason text,
    banned_by text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS threads (
    id serial PRIMARY KEY,
    forum_id int NOT NULL REFERENCES forums(id),
    author_id text NOT NULL REFERENCES members(id),
    kind text NOT NULL DEFAULT 'question',
    title text NOT NULL,
    body text NOT NULL DEFAULT '',
    images jsonb NOT NULL DEFAULT '[]'::jsonb,
    score int NOT NULL DEFAULT 0,
    reply_count int NOT NULL DEFAULT 0,
    solution_id int,
    pinned boolean NOT NULL DEFAULT false,
    locked boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    edited_at timestamptz,
    last_activity_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    deleted_by text,
    search_vec tsvector GENERATED ALWAYS AS (
      setweight(to_tsvector('english', title), 'A') || setweight(to_tsvector('english', body), 'B')
    ) STORED
  )`,
  `CREATE INDEX IF NOT EXISTS threads_forum_activity ON threads (forum_id, last_activity_at DESC) WHERE deleted_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS threads_activity ON threads (last_activity_at DESC) WHERE deleted_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS threads_author ON threads (author_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS threads_search ON threads USING gin (search_vec)`,

  `CREATE TABLE IF NOT EXISTS replies (
    id serial PRIMARY KEY,
    thread_id int NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    parent_id int REFERENCES replies(id) ON DELETE CASCADE,
    author_id text NOT NULL REFERENCES members(id),
    body text NOT NULL,
    images jsonb NOT NULL DEFAULT '[]'::jsonb,
    score int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    edited_at timestamptz,
    deleted_at timestamptz,
    deleted_by text,
    search_vec tsvector GENERATED ALWAYS AS (to_tsvector('english', body)) STORED
  )`,
  `CREATE INDEX IF NOT EXISTS replies_thread ON replies (thread_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS replies_author ON replies (author_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS replies_search ON replies USING gin (search_vec)`,

  // kind: 't' = thread, 'r' = reply
  `CREATE TABLE IF NOT EXISTS votes (
    kind char(1) NOT NULL,
    target_id int NOT NULL,
    member_id text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (kind, target_id, member_id)
  )`,
  `CREATE INDEX IF NOT EXISTS votes_member ON votes (member_id, kind)`,

  `CREATE TABLE IF NOT EXISTS reports (
    id serial PRIMARY KEY,
    kind char(1) NOT NULL,
    target_id int NOT NULL,
    thread_id int NOT NULL,
    reporter_id text NOT NULL,
    reason text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz,
    resolved_by text,
    resolution text
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS reports_open_once ON reports (kind, target_id, reporter_id) WHERE resolved_at IS NULL`,

  `CREATE TABLE IF NOT EXISTS uploads (
    id serial PRIMARY KEY,
    member_id text NOT NULL,
    url text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS uploads_member ON uploads (member_id, created_at DESC)`,

  `CREATE TABLE IF NOT EXISTS mod_log (
    id serial PRIMARY KEY,
    actor_id text NOT NULL,
    actor_name text NOT NULL DEFAULT '',
    action text NOT NULL,
    kind char(1),
    target_id int,
    thread_id int,
    detail text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  // v2: feature switches for the admin panel
  `CREATE TABLE IF NOT EXISTS features (
    key text PRIMARY KEY,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    mode text NOT NULL DEFAULT 'live',
    message text NOT NULL DEFAULT '',
    paths jsonb NOT NULL DEFAULT '[]'::jsonb,
    selectors jsonb NOT NULL DEFAULT '[]'::jsonb,
    sort_order int NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by text NOT NULL DEFAULT ''
  )`,
];

/* ------------------------------------------------------------- driver */

let _run = null;
async function driver() {
  if (globalThis.__AZF_TEST_QUERY) return globalThis.__AZF_TEST_QUERY; // local tests only
  if (_run) return _run;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!url) {
    const e = new Error("DATABASE_URL is not set");
    e.public = "The forums database isn't connected yet. In Vercel, open the forums project → Storage and connect a Neon database, then redeploy.";
    throw e;
  }
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  _run = (text, params) => sql.query(text, params);
  return _run;
}

/* ---------------------------------------------------------- migrations */

let _ready = null;
function ready() {
  if (!_ready) _ready = migrate().catch((e) => { _ready = null; throw e; });
  return _ready;
}

async function migrate() {
  const run = await driver();
  let prevVersion = 0;
  try {
    const rows = await run(`SELECT value FROM azf_meta WHERE key = 'schema'`, []);
    if (rows[0] && rows[0].value === SCHEMA_VERSION) return;
    prevVersion = rows[0] ? rows[0].value : 0;
  } catch (e) {
    // table doesn't exist yet — first run
  }
  for (const stmt of MIGRATIONS) await run(stmt, []);
  const n = await run(`SELECT count(*)::int AS n FROM forums`, []);
  if (!Number(n[0].n)) {
    let i = 0;
    for (const f of config.STARTER_FORUMS) {
      await run(
        `INSERT INTO forums (slug, name, description, icon, sort_order) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (slug) DO NOTHING`,
        [f.slug, f.name, f.description || "", f.icon || "💬", (i += 10)]
      );
    }
  }
  const seeded = await run(`SELECT 1 FROM azf_meta WHERE key = 'features_seeded'`, []);
  if (!seeded.length) {
    let i = 0;
    for (const f of config.STARTER_FEATURES || []) {
      await run(
        `INSERT INTO features (key, name, description, paths, selectors, sort_order)
         VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6) ON CONFLICT (key) DO NOTHING`,
        [f.key, f.name, f.description || "", JSON.stringify(f.paths || []), JSON.stringify(f.selectors || []), (i += 10)]
      );
    }
    await run(`INSERT INTO azf_meta (key, value) VALUES ('features_seeded', '1') ON CONFLICT (key) DO NOTHING`, []);
  }
  // Switches added in later versions: create each one once, on the upgrade
  // that introduced it (so deleting it in the admin panel sticks).
  const prev = Number(prevVersion) || 0;
  for (const f of (config.STARTER_FEATURES || []).filter((x) => x.since && x.since > prev && seeded.length)) {
    const max = await run(`SELECT coalesce(max(sort_order), 0) + 10 AS n FROM features`, []);
    await run(
      `INSERT INTO features (key, name, description, paths, selectors, sort_order)
       VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6) ON CONFLICT (key) DO NOTHING`,
      [f.key, f.name, f.description || "", JSON.stringify(f.paths || []), JSON.stringify(f.selectors || []), Number(max[0].n)]
    );
  }
  await run(
    `INSERT INTO azf_meta (key, value) VALUES ('schema', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [SCHEMA_VERSION]
  );
}

/** Run one SQL statement; returns an array of rows. */
async function q(text, params = []) {
  await ready();
  const run = await driver();
  return run(text, params);
}

async function one(text, params) {
  const rows = await q(text, params);
  return rows[0] || null;
}

/** JSON-encode a value for a ::jsonb parameter. */
const json = (v) => JSON.stringify(v ?? null);

module.exports = { q, one, json, ready };
