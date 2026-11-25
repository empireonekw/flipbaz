import "server-only";
import { cache } from "react";
import { connectDB } from "@/lib/db";
import { Membership } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth/dal";
import { serialize } from "@/lib/serialize";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @typedef {"ACTIVE"|"PENDING"|"EXPIRED"|"NONE"} AccessState
 *
 * @typedef {Object} MemberAccess
 * @property {import("@/lib/auth/dal").CurrentUser | null} user
 * @property {boolean} isMember   true for ADMINs and sellers with a live membership
 * @property {boolean} isAdmin
 * @property {AccessState} state  seller's membership state ("NONE" for guests/admins)
 * @property {Object|null} membership  the live (or most recent) membership, serialised
 * @property {number} daysLeft    whole days remaining on a live membership
 */

/**
 * Who is looking, and may they see member-only data (prices, profit,
 * listing downloads, ordering)? This is THE check every gated page and action
 * uses. Memoised per request.
 *
 * Side effect: memberships whose end date has passed are flipped to EXPIRED,
 * so the database stays truthful without a cron job.
 *
 * @returns {Promise<MemberAccess>}
 */
export const getMemberAccess = cache(async () => {
  const user = await getCurrentUser();
  const base = { user, isMember: false, isAdmin: false, state: "NONE", membership: null, daysLeft: 0 };
  if (!user) return base;
  if (user.role === "ADMIN") return { ...base, isMember: true, isAdmin: true };

  await connectDB();
  const now = new Date();

  await Membership.updateMany(
    { user: user.id, status: "ACTIVE", endsAt: { $lte: now } },
    { $set: { status: "EXPIRED" } }
  );

  const live = await Membership.findOne({ user: user.id, status: "ACTIVE", endsAt: { $gt: now } })
    .sort({ endsAt: -1 })
    .lean();
  if (live) {
    return {
      ...base,
      isMember: true,
      state: "ACTIVE",
      membership: serialize(live),
      daysLeft: Math.max(0, Math.ceil((new Date(live.endsAt) - now) / DAY_MS)),
    };
  }

  const latest = await Membership.findOne({ user: user.id }).sort({ createdAt: -1 }).lean();
  if (!latest) return base;
  return {
    ...base,
    state: latest.status === "PENDING" ? "PENDING" : "EXPIRED",
    membership: serialize(latest),
  };
});
