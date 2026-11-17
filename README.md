# Azora Forums — azoraapp.com/forums

This is its own Vercel project. It doesn't share code with the accounts, business posts, changelog or calendar projects.

A place where members and businesses ask questions, share fixes and learn from each other — like a Facebook group or subreddit, built into Azora.

- **Everyone** can browse and search (search looks through posts *and* every reply).
- **Logged-in members** can post questions, tips, discussions and showcases with up to 4 photos, reply (with photos), reply to an answer, mark posts **Helpful**, report things, and edit/delete their own posts. Whoever asked a question can mark the reply that **solved it**.
- While someone types a new question's title, the form shows existing posts that might already answer it.
- Members can turn on **email me when someone replies** (bell switch in the sidebar).
- **Moderators** (`pln_moderator-zh8z0cl8`) and **admins** (`pln_administrator-jz1ge0dzd`) can pin, lock, move, edit and remove any post or reply. They can also restore removed posts, ban and unban members, handle reports, and add, rename, reorder or archive forums. All of this lives in the **Moderation** panel (`/forums#/mod`) and in the ⋯ menu on every post. The server checks permissions on every request, so hiding the buttons isn't the only protection.

## Why not Webflow CMS?

Every post *and every reply* would be a CMS item, so the 10,000-item limit would fill up quickly. Webflow's API also can't search text or sort fast at that size. Posts are stored in a **free Neon Postgres database** that you connect from inside Vercel instead. The free plan includes 1 GB per project. Forum text is small, so that holds hundreds of thousands of posts. Photos still go to your **Webflow Assets** (in a "Forum uploads" folder), the same place business posts and changelog images are stored.

Memberstack Data Tables were the other option. They limit new records to about 10 per minute, shared across everyone, so they're too slow for a busy forum.

---

## 1. Vercel: connect the database (about 2 minutes)

1. Open the **forums** project in Vercel → **Storage** tab → **Create Database** → choose **Neon** (Serverless Postgres) → pick the **Free** plan → Create.
2. When it asks which projects to connect, choose **forums**. This adds `DATABASE_URL` to the project automatically.

The tables and the starter forums are created automatically the first time the page loads. You don't need to run any SQL.

## 2. Vercel: environment variables

In **forums → Settings → Environment Variables**, add the same values you used for business posts and the changelog:

| Name | Value |
|---|---|
| `MEMBERSTACK_SECRET_KEY` | Memberstack secret key (`sk_…`) |
| `WEBFLOW_API_TOKEN` | Webflow site API token with **Assets: read & write** and **Sites: read** |
| `WEBFLOW_SITE_ID` | Your Webflow site ID |

Optional:

| Name | What it turns on |
|---|---|
| `RESEND_API_KEY` | Emails members when someone replies to their post or answer. They're sent from `updates@contact.azoraapp.com`. |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` | A message in your Telegram alerts group whenever something is reported (same values as the accounts project). |

Then **Redeploy**. You don't need any framework or build settings.

## 3. Webflow: the /forums page

1. Create a new **static page** with the slug `forums`.
2. Give it a black background, plus your nav and footer.
3. Add an **Embed** element with this code (swap in your Vercel URL):

```html
<div data-azora-forums data-login-url="/login" data-signup-url="/signup"></div>
<script src="https://YOUR-PROJECT.vercel.app/azora-forums.js" defer></script>
```

Memberstack must be loaded on the page. It already is if it's in your site-wide head code.

Links work like this: `azoraapp.com/forums#/f/trades-field-services` (a forum), `azoraapp.com/forums#/t/42` (a post), `azoraapp.com/forums#/t/42?r=108` (a specific reply), `azoraapp.com/forums#/mod` (moderation).

---

## Starter forums

The first run creates **General**, **Trades & Field Services**, **Business Growth**, **Tech & Tools** and **Introductions**. You can rename, reorder, archive or add forums from **Moderation → Forums**. Turn on **"Only the Azora team can start posts"** for announcement-style forums.

## Changing settings

Everything is in `config.js`: plan IDs, post types, character limits, photos per post, posting limits per hour, which plans get the Business badge, and whether moderators (not just admins) can manage the forum list. Commit, and Vercel redeploys.

## How it works

| Endpoint | Who | What |
|---|---|---|
| `GET /api/forums` | anyone | Forum list, counts, settings |
| `POST/PATCH/DELETE /api/forums` | mods & admins | Manage forums (deleting a forum with posts archives it) |
| `GET /api/threads` | anyone | Feed: `forum`, `sort` (active, new, top, unanswered, solved), `q` (search), `page` |
| `GET /api/threads?similar=` | anyone | "Might already answer it" suggestions |
| `POST /api/threads` | members | New post |
| `GET/PATCH/DELETE /api/thread?id=` | anyone / author or mods | Read, edit or remove a post |
| `POST/PATCH/DELETE /api/replies` | members / author or mods | Reply, edit or remove |
| `POST /api/act` | members / mods | Helpful, solve, report, email setting, pin, lock, move, restore, ban, unban, dismiss report |
| `GET /api/mod` | mods & admins | Reports, removed posts, banned members, activity log |
| `GET /api/me` | members | Role, ban status, email setting |
| `POST /api/upload` | members | One photo, stored in Webflow Assets |
| `GET /api/features` · `POST/PATCH/DELETE` | anyone · admins | Feature switches |
| `GET /azora-features.js` | anyone | Site-wide switch script with the current switches built in |

Removing a post or reply only hides it, so moderators can restore it. Every moderator action is recorded in the activity log.

---

# Admin panel: feature switches

This project also runs the **feature switches** for the whole Azora site. Admins can put any feature into **Dev mode**:

- **Admins** (`pln_administrator-jz1ge0dzd`) and **developers** (`pln_developer-qk9e0ch7`) still see the feature, with a yellow **🚧 DEV** badge and a banner at the bottom of the page.
- **Everyone else** sees **"Under construction. Back soon."** (or your own message). Whole pages get a full-screen notice, and sections of a page get a small card in their place.
- Only **admins** can open the panel and flip switches. Changes reach the live site within about 15 seconds.
- **Preview as member** (in the panel or the DEV banner) shows you the site the way members see it, in your browser only.

## Setup

**1. Site-wide script.** In Webflow, go to **Site settings → Custom code → Head code**. Paste this *after* the Memberstack script. It must **not** have `defer` or `async`, so it can hide dev-mode features before they appear on screen:

```html
<script src="https://forums-orpin.vercel.app/azora-features.js"></script>
```

**2. Admin page.** Create a static page with the slug `admin` and add an Embed:

```html
<div data-azora-admin></div>
<script src="https://forums-orpin.vercel.app/azora-admin.js" defer></script>
```

If you use a different slug, change `ADMIN_PAGE` in `config.js` so the "Manage" link in the DEV banner goes to the right page.

Then publish.

## What a switch can cover

Each feature has a **key** (like `businesses`) and can cover any of these:

| | How |
|---|---|
| **Whole pages** | List paths in the panel: `/forums`, or `/business/*` for every page under `/business/`. |
| **Page sections** | In Webflow, select the element → **Settings → Custom attributes** → name `data-azora-feature`, value = the key. You can also list CSS selectors in the panel. |
| **Built into the widgets** | `businesses`: the directory tab, business pages, the dashboard business card, the Register / Edit / Activate buttons and business posts. `business-posts`: the business page feed and the dashboard "Your posts". `groups`, `churches` and `audios`: their tabs and pages. `lkbi`: the tab and the dashboard LKBI card. These follow their switch on their own, with no Webflow attribute needed. |
| **Forums API** | When `forums` is in dev mode, the forums API itself only answers admins and developers. Moderators are blocked too. |

The panel starts with Forums, Changelog, Businesses, Business posts, Groups, Audios, Churches, LKBI, AzoraEvents and Dashboard (`/app/dash`). You can add, edit or delete any of them. Every change is recorded in the forums activity log.

Other scripts can check a switch with `window.AzoraFeatures` (`mode(key)`, `await ready`, `blocked(key)`, `placeholder(key)`, `badge(key)`).

If the database can't be reached, everything stays visible, so the site never goes dark because of a switch.

---

# Meet the team page

**Setup:** create a static page with the slug `team`, then add an Embed:

```html
<div data-azora-team></div>
<script src="https://forums-orpin.vercel.app/azora-team.js" defer></script>
```

Optional: `data-title="..."` and `data-subtitle="..."` on the `<div>` change the heading. Point your footer's "The Dream Team" link to `/team`.

**Editing:** log in as an admin and open the page. You'll see **+ Add team member**, and every card gets ← → (reorder), ✎ (edit) and ◌ (hide/show) buttons.
- **Add:** search any Azora member by name, email or business, then set their **role** and **quote**.
- **Optional extras:** a different photo (otherwise their Memberstack profile photo is used), a different display name, and a link.
- **Profile updates:** names and photos stay in step with members' profiles each time an admin opens the page.

Only admins can make changes. The server checks the admin plan on every change. The page also has its own **Meet the team** switch in the admin panel.

---

# Inbox

A button next to **DASH** in the navbar opens a half-page drawer, like Webflow's cart.

**Members** get updates here:
- their business registration was received, approved (paid plan or scholarship) or declined, with your note
- their child's LKBi registration was received, approved, enrolled or canceled
- they were added to or removed from a group

**Admins** also get a **Needs review** tab:
- **New business registrations**, with contact details: **Approve** (they pick monthly/yearly to activate), **Scholarship** (free listing) or **Decline…** with an optional note. The Memberstack plans change for you (pending → approved/scholarship), and the member is told in their inbox.
- **New LKBi registrations**: **Approve** or **Decline**. This sets the Status on the registration, exactly like the LKBi review screen, and the parent is told.
- **Already handled** closes an item without changing anything, for example if you approved someone directly in Memberstack.

The red badge counts unread updates plus anything waiting for review. It refreshes every minute. Any link ending in `#inbox` opens the drawer. The inbox has its own switch in the admin panel.

## Setup

1. **Shared secret:** make up a long random string, like `azora-inbox-` followed by 30 random letters and numbers. In Vercel, add it as `INBOX_SECRET` in **both** the **forums** project and the **accounts** project, then redeploy both. This is how the accounts project tells the inbox about new registrations and group changes.
2. **Script:** in Webflow **Site settings → Custom code → Footer code**, add:
   ```html
   <script src="https://forums-orpin.vercel.app/azora-inbox.js" defer></script>
   ```
3. **Button:** in the navbar, drop an **Embed** right next to the DASH button:
   ```html
   <div data-azora-inbox></div>
   ```
   Add `data-label="Inbox"` to show text beside the icon. On phones, put a second copy next to the hamburger icon (outside the collapsing menu) so it's always visible. Both stay in sync.
4. Publish. The button only shows for logged-in members.

Approvals made directly in Memberstack (instead of in the inbox) don't send the member an update. Use **Already handled** to clear those.

