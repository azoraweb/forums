// Photo uploads go into your Webflow Assets (inside a "Forum uploads" folder),
// the same place business posts and changelog images live.

const crypto = require("crypto");
const config = require("../config");
const db = require("./db");

const WF_API = "https://api.webflow.com/v2";

async function wf(path, opts = {}, attempt = 0) {
  const token = process.env.WEBFLOW_API_TOKEN;
  if (!token) throw new Error("WEBFLOW_API_TOKEN is not set");
  const r = await fetch(WF_API + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      accept: "application/json",
      ...(opts.headers || {}),
    },
  });
  if (r.status === 429 && attempt < 2) {
    const wait = Math.min(Number(r.headers.get("retry-after") || 2), 5) * 1000;
    await new Promise((res) => setTimeout(res, wait));
    return wf(path, opts, attempt + 1);
  }
  if (r.status === 204) return {};
  const body = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(`Webflow ${opts.method || "GET"} ${path} -> ${r.status}: ${JSON.stringify(body)}`);
    err.wfStatus = r.status;
    throw err;
  }
  return body;
}

let folderPromise = null;
/** Find (or create) the uploads folder. Returns its id, or null if folders aren't available. */
function uploadFolder(siteId) {
  if (!config.UPLOAD_FOLDER_NAME) return Promise.resolve(null);
  if (!folderPromise) {
    folderPromise = (async () => {
      const saved = await db.one(`SELECT value FROM azf_meta WHERE key = 'wf_upload_folder'`);
      if (saved) return saved.value;
      const list = await wf(`/sites/${siteId}/asset_folders`);
      let folder = (list.assetFolders || []).find((f) => f.displayName === config.UPLOAD_FOLDER_NAME);
      if (!folder) {
        folder = await wf(`/sites/${siteId}/asset_folders`, {
          method: "POST",
          body: JSON.stringify({ displayName: config.UPLOAD_FOLDER_NAME }),
        });
      }
      if (folder?.id) {
        await db.q(
          `INSERT INTO azf_meta (key, value) VALUES ('wf_upload_folder', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [folder.id]
        );
      }
      return folder?.id || null;
    })().catch((e) => {
      console.warn("[forums] couldn't use an asset folder, uploading to the root instead:", e.message);
      folderPromise = null;
      return null;
    });
  }
  return folderPromise;
}

/** Upload a file into Webflow Assets; returns its public CDN URL. */
async function uploadAsset(buffer, fileName, contentType) {
  const siteId = process.env.WEBFLOW_SITE_ID;
  if (!siteId) throw new Error("WEBFLOW_SITE_ID is not set");
  const fileHash = crypto.createHash("md5").update(buffer).digest("hex");
  const parentFolder = await uploadFolder(siteId);
  const meta = await wf(`/sites/${siteId}/assets`, {
    method: "POST",
    body: JSON.stringify(parentFolder ? { fileName, fileHash, parentFolder } : { fileName, fileHash }),
  });
  const form = new FormData();
  for (const [k, v] of Object.entries(meta.uploadDetails || {})) form.append(k, v);
  form.append("file", new Blob([buffer], { type: contentType }), fileName);
  const up = await fetch(meta.uploadUrl, { method: "POST", body: form });
  if (!up.ok && up.status !== 201) {
    throw new Error(`Asset upload failed: ${up.status} ${await up.text().catch(() => "")}`);
  }
  return meta.hostedUrl || meta.assetUrl;
}

module.exports = { uploadAsset };
