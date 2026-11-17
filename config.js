/* ==========================================================================
   AZORA FORUMS — SETTINGS
   This is the one file you edit to change how the forums work.
   After editing, commit and Vercel redeploys on its own.
   ========================================================================== */

module.exports = {
  // ---- WHO CAN MANAGE ------------------------------------------------------

  // Memberstack plans. Admins and moderators can pin, lock, move, edit and
  // remove any post, handle reports, ban members and manage the forum list.
  ADMIN_PLAN_ID: "pln_administrator-jz1ge0dzd",
  MODERATOR_PLAN_ID: "pln_moderator-zh8z0cl8",

  // Developers (and admins) can still see features that are switched to
  // "dev mode" — with a DEV badge. Everyone else sees "Under construction".
  DEVELOPER_PLAN_ID: "pln_developer-qk9e0ch7",

  // Set to false if only admins (not moderators) should create, rename or
  // archive forums. Moderators keep every other power either way.
  MODERATORS_CAN_MANAGE_FORUMS: true,

  // Members on these plans get a "Business" badge and show their business name.
  BUSINESS_PLAN_IDS: ["pln_business-5i1py0esb"],

  // Memberstack custom fields used for the name shown on posts.
  NAME_FIELDS: ["name", "first-name"],
  BUSINESS_NAME_FIELD: "business-name",

  // ---- POST TYPES ----------------------------------------------------------
  // The key is what's saved. "question" posts can be marked solved.
  KINDS: {
    question: "Question",
    tip: "Tip / How-to",
    discussion: "Discussion",
    showcase: "Showcase",
  },

  // ---- LIMITS --------------------------------------------------------------
  TITLE_MAX_CHARS: 150,
  BODY_MAX_CHARS: 10000,
  REPLY_MAX_CHARS: 5000,
  IMAGES_PER_THREAD: 4,
  IMAGES_PER_REPLY: 3,

  // Per member, per rolling hour (moderators and admins are exempt).
  THREADS_PER_HOUR: 5,
  REPLIES_PER_HOUR: 40,
  UPLOADS_PER_HOUR: 40,
  REPORTS_PER_HOUR: 20,

  PAGE_SIZE: 20,

  // ---- LINKS ---------------------------------------------------------------
  FORUMS_URL: process.env.FORUMS_URL || "https://www.azoraapp.com/forums",

  // ---- EMAIL WHEN SOMEONE REPLIES (optional) -------------------------------
  // Needs RESEND_API_KEY in Vercel. Members can turn these off from the forums.
  EMAIL_FROM: process.env.FORUMS_EMAIL_FROM || "Azora Forums <updates@contact.azoraapp.com>",

  // ---- SECURITY ------------------------------------------------------------
  ALLOWED_ORIGINS: [
    "https://www.azoraapp.com",
    "https://azoraapp.com",
    /\.webflow\.io$/,
  ],

  // Images on posts must live on Webflow's CDN (where our uploads go).
  ALLOWED_IMAGE_HOST_SUFFIXES: ["website-files.com", "webflow.com"],

  // Name of the Webflow Assets folder uploads go into (created if missing).
  UPLOAD_FOLDER_NAME: "Forum uploads",

  // How long public pages may be cached at Vercel's edge (seconds).
  FEED_CACHE_SECONDS: 10,

  // ---- INBOX ---------------------------------------------------------------
  // Business review decisions add/remove these Memberstack plans (same IDs as
  // the accounts project).
  BUSINESS_PLANS: {
    pending: "pln_business-registration-pending-8216101z6",
    approved: "pln_business-approved-m41qi0ern",
    scholarship: "pln_business-scholarship-applied-4016201mr",
  },
  DASHBOARD_URL: "/app/dash",

  // ---- FOLLOWING BUSINESSES -------------------------------------------------
  BUSINESS_COLLECTION_ID: process.env.BUSINESS_COLLECTION_ID || "681fd67661501902f76f308a",
  BUSINESS_PAGE_PREFIX: "/businesses/",        // business pages live at /businesses/<slug>
  // Copies kept in step for use in Webflow designs / Memberstack (optional):
  //   Business item "Followers" (Number)  ·  member custom fields "followers" (count, on the owner)
  //   and "following" (comma-separated Business item IDs, on the follower)
  FOLLOWERS_FIELD_NAME: "Followers",
  MS_FOLLOWERS_FIELD: "followers",
  MS_FOLLOWING_FIELD: "following",
  FOLLOWS_PER_HOUR: 60,

  // ---- FEATURE SWITCHES (admin panel) --------------------------------------
  // Webflow page where the admin panel lives (used for "Manage" links).
  ADMIN_PAGE: "/admin",

  // Features created the first time the switches are set up. Add, edit or
  // remove them from the admin panel afterwards — this list isn't used again.
  //   paths:     pages that show "Under construction" ("/business/*" = every page under /business/)
  //   selectors: page sections to swap for an "Under construction" card
  // Every feature also covers any Webflow element with the custom attribute
  // data-azora-feature="<key>". Directory tabs use the keys businesses,
  // groups, audios, churches and lkbi.
  STARTER_FEATURES: [
    { key: "forums", name: "Forums", description: "Azora Forums at /forums.", paths: ["/forums"], selectors: ["[data-azora-forums]"] },
    { key: "changelog", name: "What's New (changelog)", description: "The updates page.", paths: ["/updates"], selectors: ["[data-azora-changelog]"] },
    { key: "businesses", name: "Businesses", description: "Businesses tab in the directory.", paths: [], selectors: [] },
    { key: "business-posts", name: "Business posts", description: "Posts businesses share on their pages and dashboard.", paths: [], selectors: [] },
    { key: "groups", name: "Groups", description: "Groups tab in the directory.", paths: [], selectors: [] },
    { key: "audios", name: "Audios", description: "Audios tab in the directory.", paths: [], selectors: [] },
    { key: "churches", name: "Churches", description: "Churches tab in the directory.", paths: [], selectors: [] },
    { key: "lkbi", name: "LKBI", description: "Little Kids Big Ideas page and directory tab.", paths: ["/lkbi"], selectors: [] },
    { key: "events", name: "AzoraEvents", description: "The events page.", paths: ["/events-azora"], selectors: [] },
    { key: "dashboard", name: "Dashboard", description: "The member dashboard (profile, business card, LKBI students, business posts).", paths: ["/app/dash", "/app/dash/*"], selectors: [], since: 3 },
    { key: "team", name: "Meet the team", description: "The Meet the team page.", paths: ["/team"], selectors: ["[data-azora-team]"], since: 4 },
    { key: "inbox", name: "Inbox", description: "The inbox button in the navbar (hidden from members while in dev mode).", paths: [], selectors: [], since: 5 },
  ],

  // Forums created the very first time the database is set up.
  // Rename, reorder or archive them from the Moderation panel afterwards.
  STARTER_FORUMS: [
    { slug: "general", name: "General", icon: "💬", description: "Anything that doesn't fit somewhere else." },
    { slug: "trades-field-services", name: "Trades & Field Services", icon: "🛠️", description: "Power washing, detailing, landscaping, construction and other hands-on work. Share fixes, products and lessons learned." },
    { slug: "business-growth", name: "Business Growth", icon: "📈", description: "Marketing, sales, pricing, hiring and running the business side." },
    { slug: "tech-tools", name: "Tech & Tools", icon: "💻", description: "Software, websites, apps and the tools that keep things running." },
    { slug: "introductions", name: "Introductions", icon: "👋", description: "New here? Tell everyone who you are and what you're aiming for." },
  ],
};
