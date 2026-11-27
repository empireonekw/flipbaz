import "server-only";
import { connectDB } from "@/lib/db";
import { ContactMessage, Membership, Order, Payment, ProductRequest, ServiceRequest, User } from "@/lib/models";
import { ORDER_STATUSES } from "@/lib/models/constants";
import { serialize } from "@/lib/serialize";
import { startOfMonthPKT } from "./common";

const TZ = "Asia/Karachi";
const DAY_MS = 86_400_000;
/** "YYYY-MM-DD" of a date in Pakistan time. */
const pkDay = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
/** Midnight (Pakistan time, UTC+5, no DST) of the PKT day `daysAgo` days before `now`, as a UTC Date. */
const pkMidnight = (now, daysAgo = 0) => new Date(`${pkDay(new Date(now.getTime() - daysAgo * DAY_MS))}T00:00:00+05:00`);

/** Days shown in the revenue chart. */
export const REVENUE_DAYS = 14;

/**
 * Numbers for the admin overview, computed with aggregation pipelines.
 *
 * - activeMembers: sellers with an ACTIVE membership whose endsAt is in the future
 * - pendingPayments: payments waiting for review (split by purpose)
 * - ordersByStatus: count per order status
 * - revenueThisMonth / revenueLastMonth: APPROVED payments by review date (PKT months)
 * - dailyRevenue: APPROVED payments per PKT day for the last REVENUE_DAYS days
 * - fulfilment: of this month's (non-cancelled) orders, how many have shipped or been delivered
 * - recentPayments: the latest payments of any status
 *
 * @returns {Promise<Object>}
 */
export async function getDashboardStats() {
  await connectDB();
  const now = new Date();
  const monthStart = startOfMonthPKT(now);
  const lastMonthStart = startOfMonthPKT(new Date(monthStart.getTime() - DAY_MS));
  const seriesStart = pkMidnight(now, REVENUE_DAYS - 1);
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);

  const [activeAgg, pendingAgg, ordersAgg, revenueAgg, lastMonthAgg, dailyAgg, monthOrdersAgg, newSellers, unread, ordersThisWeek, recentPayments, recentPending, recentOrders, openRequests, newApplications] =
    await Promise.all([
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
      Payment.aggregate([
        { $match: { status: "APPROVED", reviewedAt: { $gte: lastMonthStart, $lt: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.aggregate([
        { $match: { status: "APPROVED", reviewedAt: { $gte: seriesStart } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$reviewedAt", timezone: TZ } }, total: { $sum: "$amount" }, n: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: monthStart }, status: { $ne: "CANCELLED" } } },
        { $group: { _id: { $in: ["$status", ["SHIPPED", "DELIVERED"]] }, n: { $sum: 1 } } },
      ]),
      User.countDocuments({ role: "SELLER", createdAt: { $gte: monthStart } }),
      ContactMessage.countDocuments({ read: false }),
      Order.countDocuments({ createdAt: { $gte: weekAgo } }),
      Payment.find().sort({ createdAt: -1 }).limit(6).populate("user", "name").select("purpose amount method status createdAt user").lean(),
      Payment.find({ status: "PENDING" }).sort({ createdAt: 1 }).limit(5).populate("user", "name").select("purpose amount method createdAt user").lean(),
      Order.find({ status: { $in: ["CONFIRMED", "IN_PRODUCTION", "QC_PASSED"] } })
        .sort({ createdAt: 1 })
        .limit(6)
        .populate("seller", "name")
        .select("orderNumber status total city createdAt seller")
        .lean(),
      ProductRequest.countDocuments({ status: { $in: ["OPEN", "REVIEWING"] } }),
      ServiceRequest.countDocuments({ status: "SUBMITTED" }),
    ]);

  const byPurpose = (agg, key) => Object.fromEntries(agg.map((a) => [a._id, a[key]]));
  const pendingN = byPurpose(pendingAgg, "n");
  const pendingAmount = pendingAgg.reduce((sum, a) => sum + a.amount, 0);
  const revenue = byPurpose(revenueAgg, "total");
  const paymentsThisMonth = revenueAgg.reduce((sum, a) => sum + a.n, 0);
  const ordersCount = byPurpose(ordersAgg, "n");
  const revenueTotal = (revenue.MEMBERSHIP ?? 0) + (revenue.ORDER ?? 0);
  const revenueLastMonth = lastMonthAgg[0]?.total ?? 0;

  const daily = new Map(dailyAgg.map((d) => [d._id, d]));
  const dailyRevenue = Array.from({ length: REVENUE_DAYS }, (_, i) => {
    const day = pkDay(new Date(seriesStart.getTime() + i * DAY_MS + 6 * 3600e3));
    return { day, total: daily.get(day)?.total ?? 0, payments: daily.get(day)?.n ?? 0 };
  });

  const shipped = monthOrdersAgg.find((a) => a._id === true)?.n ?? 0;
  const notShipped = monthOrdersAgg.find((a) => a._id === false)?.n ?? 0;

  return {
    activeMembers: activeAgg[0]?.n ?? 0,
    pendingPayments: {
      total: (pendingN.MEMBERSHIP ?? 0) + (pendingN.ORDER ?? 0),
      membership: pendingN.MEMBERSHIP ?? 0,
      order: pendingN.ORDER ?? 0,
      amount: pendingAmount,
    },
    ordersByStatus: Object.fromEntries(ORDER_STATUSES.map((s) => [s, ordersCount[s] ?? 0])),
    revenueThisMonth: {
      total: revenueTotal,
      membership: revenue.MEMBERSHIP ?? 0,
      order: revenue.ORDER ?? 0,
      payments: paymentsThisMonth,
    },
    revenueLastMonth,
    /** % change vs last month, or null when last month had nothing to compare with. */
    revenueChange: revenueLastMonth > 0 ? Math.round(((revenueTotal - revenueLastMonth) / revenueLastMonth) * 100) : null,
    dailyRevenue,
    fulfilment: { shipped, total: shipped + notShipped },
    ordersThisWeek,
    newSellersThisMonth: newSellers,
    unreadMessages: unread,
    openRequests,
    newApplications,
    monthStart: monthStart.toISOString(),
    recentPayments: serialize(recentPayments),
    recentPending: serialize(recentPending),
    workQueue: serialize(recentOrders),
  };
}
