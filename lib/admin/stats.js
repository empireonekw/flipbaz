import "server-only";
import { connectDB } from "@/lib/db";
import { ContactMessage, Membership, Order, Payment, User } from "@/lib/models";
import { ORDER_STATUSES } from "@/lib/models/constants";
import { serialize } from "@/lib/serialize";
import { startOfMonthPKT } from "./common";

/**
 * Numbers for the admin overview, computed with aggregation pipelines.
 *
 * - activeMembers: sellers with an ACTIVE membership whose endsAt is in the future
 * - pendingPayments: payments waiting for review (split by purpose)
 * - ordersByStatus: count per order status
 * - revenueThisMonth: APPROVED payments reviewed since the 1st (PKT), split by purpose
 *
 * @returns {Promise<Object>}
 */
export async function getDashboardStats() {
  await connectDB();
  const now = new Date();
  const monthStart = startOfMonthPKT(now);

  const [activeAgg, pendingAgg, ordersAgg, revenueAgg, newSellers, unread, recentPending, recentOrders] = await Promise.all([
    Membership.aggregate([
      { $match: { status: "ACTIVE", endsAt: { $gt: now } } },
      { $group: { _id: "$user" } },
      { $count: "n" },
    ]),
    Payment.aggregate([
      { $match: { status: "PENDING" } },
      { $group: { _id: "$purpose", n: { $sum: 1 }, amount: { $sum: "$amount" } } },
    ]),
    Order.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { status: "APPROVED", reviewedAt: { $gte: monthStart } } },
      { $group: { _id: "$purpose", total: { $sum: "$amount" }, n: { $sum: 1 } } },
    ]),
    User.countDocuments({ role: "SELLER", createdAt: { $gte: monthStart } }),
    ContactMessage.countDocuments({ read: false }),
    Payment.find({ status: "PENDING" }).sort({ createdAt: 1 }).limit(5).populate("user", "name").select("purpose amount method createdAt user").lean(),
    Order.find({ status: { $in: ["CONFIRMED", "IN_PRODUCTION", "QC_PASSED"] } })
      .sort({ createdAt: 1 })
      .limit(6)
      .populate("seller", "name")
      .select("orderNumber status total city createdAt seller")
      .lean(),
  ]);

  const byPurpose = (agg, key) => Object.fromEntries(agg.map((a) => [a._id, a[key]]));
  const pendingN = byPurpose(pendingAgg, "n");
  const revenue = byPurpose(revenueAgg, "total");
  const ordersCount = byPurpose(ordersAgg, "n");

  return {
    activeMembers: activeAgg[0]?.n ?? 0,
    pendingPayments: {
      total: (pendingN.MEMBERSHIP ?? 0) + (pendingN.ORDER ?? 0),
      membership: pendingN.MEMBERSHIP ?? 0,
      order: pendingN.ORDER ?? 0,
    },
    ordersByStatus: Object.fromEntries(ORDER_STATUSES.map((s) => [s, ordersCount[s] ?? 0])),
    revenueThisMonth: {
      total: (revenue.MEMBERSHIP ?? 0) + (revenue.ORDER ?? 0),
      membership: revenue.MEMBERSHIP ?? 0,
      order: revenue.ORDER ?? 0,
    },
    newSellersThisMonth: newSellers,
    unreadMessages: unread,
    monthStart: monthStart.toISOString(),
    recentPending: serialize(recentPending),
    workQueue: serialize(recentOrders),
  };
}
