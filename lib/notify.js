// Optional notifications. Nothing here ever blocks a post from saving.
//   • Email the thread author (and the person being replied to) via Resend
//     — needs RESEND_API_KEY. Members can switch this off in the forums.
//   • Telegram message to the Azora team when something is reported
//     — needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (same as the accounts project).

const config = require("../config");
const db = require("./db");
const { fetchMember } = require("./auth");

const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function withTimeout(p, ms = 4000) {
  return Promise.race([p, new Promise((res) => setTimeout(res, ms))]).catch((e) => console.error("[forums] notify failed", e));
}

async function sendEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: config.EMAIL_FROM, to: [to], subject, html }),
  });
  if (!r.ok) console.error("[forums] Resend error", r.status, await r.text().catch(() => ""));
}

function emailHtml({ heading, who, snippet, link, threadTitle }) {
  return `<!doctype html><html><body style="margin:0;background:#000;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#0b0b12;border:1px solid #1f1f2e;border-radius:16px;overflow:hidden">
    <div style="height:4px;background:linear-gradient(90deg,#7c4dff,#4f6bff,#2f8cff)"></div>
    <div style="padding:28px">
      <div style="color:#8b93a7;font-size:12px;letter-spacing:.08em;text-transform:uppercase">Azora Forums</div>
      <h1 style="color:#fff;font-size:20px;margin:10px 0 6px">${esc(heading)}</h1>
      <p style="color:#c7cad6;font-size:14px;margin:0 0 18px">${esc(who)} replied in <strong style="color:#fff">${esc(threadTitle)}</strong></p>
      <div style="color:#dfe2ea;font-size:14px;line-height:1.6;border-left:3px solid #6b5cff;padding:4px 0 4px 14px;margin:0 0 24px;white-space:pre-wrap">${esc(snippet)}</div>
      <a href="${esc(link)}" style="display:inline-block;background:linear-gradient(135deg,#7c4dff,#3d7bff);color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px">View the reply</a>
      <p style="color:#5f6577;font-size:12px;margin:26px 0 0">You can turn these emails off any time from the bell icon on the forums page.</p>
    </div>
  </div></body></html>`;
}

/** After a reply is saved: email the thread author and, for nested replies, the parent author. */
function onReply({ v, thread, reply, parent }) {
  if (!process.env.RESEND_API_KEY) return Promise.resolve();
  return withTimeout((async () => {
    const targets = new Map();
    if (thread.author_id !== v.id) targets.set(thread.author_id, "New reply to your post");
    if (parent && parent.author_id !== v.id) targets.set(parent.author_id, "Someone replied to your answer");
    if (!targets.size) return;
    const ids = [...targets.keys()];
    const rows = await db.q(
      `SELECT id FROM members WHERE id IN (SELECT jsonb_array_elements_text($1::jsonb)) AND notify AND banned_at IS NULL`,
      [db.json(ids)]
    );
    const link = `${config.FORUMS_URL}#/t/${thread.id}?r=${reply.id}`;
    const snippet = String(reply.body || "").slice(0, 400) + (String(reply.body || "").length > 400 ? "…" : "");
    await Promise.all(rows.map(async ({ id }) => {
      const m = await fetchMember(id);
      const email = m?.auth?.email;
      if (!email) return;
      const heading = targets.get(id);
      await sendEmail(email, `${heading}: ${thread.title}`.slice(0, 140),
        emailHtml({ heading, who: v.businessName || v.name, snippet, link, threadTitle: thread.title }));
    }));
  })(), 6000);
}

/** When something is reported, ping the Azora team on Telegram (if set up). */
function onReport({ v, kind, threadId, replyId, reason, title }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = String(process.env.TELEGRAM_CHAT_ID || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!token || !chatIds.length) return Promise.resolve();
  const link = `${config.FORUMS_URL}#/t/${threadId}${replyId ? `?r=${replyId}` : ""}`;
  const text = `🚩 Forum report (${kind === "t" ? "post" : "reply"})\n“${title}”\nReason: ${reason || "—"}\nBy: ${v.name}\n${link}\nReview: ${config.FORUMS_URL}#/mod`;
  return withTimeout(Promise.all(chatIds.map((chat_id) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text, disable_web_page_preview: true }),
    })
  )));
}

module.exports = { onReply, onReport };
