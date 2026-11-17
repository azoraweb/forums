// GET /api/me — who the logged-in viewer is to the forums (role, ban status, email setting).
// Also makes sure they exist in the forums database.

const { handler, HttpError, noStore } = require("../lib/http");
const { viewer } = require("../lib/auth");

module.exports = handler(async (req, res) => {
  if (req.method !== "GET") throw new HttpError(405, "Method not allowed");
  noStore(res);
  const v = await viewer(req, { required: false });
  if (!v) return { member: null };
  return {
    member: {
      id: v.id,
      name: v.name,
      avatar: v.avatar,
      business: v.businessName,
      isBusiness: v.isBusiness,
      role: v.role,
      isMod: v.isMod,
      canManageForums: v.canManageForums,
      notify: v.notify,
      banned: v.banned,
      banReason: v.banReason,
    },
  };
});
