// Reading Business items from Webflow and keeping their "Followers" count up to date.

const config = require("../config");

const WF_API = "https://api.webflow.com/v2";
const C = () => config.BUSINESS_COLLECTION_ID;

async function wf(path, opts = {}) {
  const token = process.env.WEBFLOW_API_TOKEN;
  if (!token) throw new Error("WEBFLOW_API_TOKEN is not set");
  const r = await fetch(WF_API + path, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", accept: "application/json", ...(opts.headers || {}) },
  });
  const body = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(`Webflow ${opts.method || "GET"} ${path} -> ${r.status}: ${JSON.stringify(body).slice(0, 300)}`);
    e.wfStatus = r.status;
    throw e;
  }
  return body;
}

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

let schema = null;
async function fields() {
  if (schema && Date.now() - schema.at < 600000) return schema.map;
  const c = await wf(`/collections/${C()}`);
  const map = {};
  for (const f of c.fields || []) { map[f.slug] = f; map["~" + norm(f.displayName)] = f; }
  schema = { at: Date.now(), map };
  return map;
}
async function slugFor(...names) {
  const map = await fields();
  for (const n of names) {
    const f = map[n] || map["~" + norm(n)];
    if (f) return f.slug;
  }
  return null;
}

/** { id, name, slug, logo, ownerId, live } or null */
async function getBusiness(id) {
  if (!/^[a-f0-9]{24}$/i.test(String(id || ""))) return null;
  let item;
  try { item = await wf(`/collections/${C()}/items/${id}`); } catch (e) { if (e.wfStatus === 404) return null; throw e; }
  const fd = item.fieldData || {};
  const [bizName, logo, owner] = await Promise.all([
    slugFor("business-name", "Business Name"), slugFor("client-logo", "Logo"), slugFor("member-id", "Member ID"),
  ]);
  return {
    id: item.id,
    name: String((bizName && fd[bizName]) || fd.name || "").trim(),
    slug: fd.slug || "",
    logo: (logo && fd[logo] && fd[logo].url) || "",
    ownerId: String((owner && fd[owner]) || "").trim(),
    live: !item.isDraft && !!item.lastPublished,
    archived: !!item.isArchived,
  };
}

/** Write the follower count onto the Business item (live if published). Never throws. */
async function setFollowerCount(biz, count) {
  try {
    const slug = await slugFor(config.FOLLOWERS_FIELD_NAME, "followers");
    if (!slug) return;
    const body = JSON.stringify({ fieldData: { [slug]: count } });
    if (biz.live) {
      try { await wf(`/collections/${C()}/items/${biz.id}/live`, { method: "PATCH", body }); return; }
      catch (e) { if (e.wfStatus !== 404 && e.wfStatus !== 409) throw e; }
    }
    await wf(`/collections/${C()}/items/${biz.id}`, { method: "PATCH", body });
  } catch (e) {
    console.warn("[follows] couldn't update the Followers field:", e.message);
  }
}

module.exports = { getBusiness, setFollowerCount };
