import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models";
import { serialize } from "@/lib/serialize";

/**
 * Seller analytics, all from the seller's own orders. Cancelled orders are
 * left out everywhere (they cost nothing). "Spend" means what the seller
 * paid or owes Flip Baz for the order (order total incl. shipping).
 *
 * Profit uses only the orders where the seller entered what their customer
 * paid (`salePrice`), optionally minus marketplace fees:
 *   profit = salePrice − marketplaceFees − order total
 */

const DAY_MS = 86_400_000;
const TZ = "Asia/Karachi";

/** "2026-11" for a date in Pakistan time. */
const monthKey = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(new Date(d)).slice(0, 7);

/**
 * The last `n` calendar months (Pakistan time), oldest first.
 * @returns {{ key: string, label: string, long: string }[]}
 */
function lastMonths(n, now = new Date()) {
  const [y, m] = monthKey(now).split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 15));
    return {
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(d),
      long: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(d),
    };
  });
}

/**
 * @typedef {Object} SellerAnalytics
 * @property {number} totalSpent
 * @property {number} orderCount
 * @property {number} avgOrderValue
 * @property {number|null} reorderDays      average days between orders (needs 2+)
 * @property {{ key: string, label: string, long: string, spend: number, orders: number }[]} monthly  last 6 months
 * @property {{ productId: string, title: string, slug?: string, image?: string, spend: number, units: number, orders: number }[]} topProducts
 * @property {{ tracked: number, untracked: number, revenue: number, fees: number, cost: number, profit: number, margin: number|null,
 *   byMarketplace: { marketplace: string, orders: number, revenue: number, profit: number }[],
 *   recent: { _id: string, orderNumber: string, title: string, revenue: number, fees: number, cost: number, profit: number, createdAt: string }[] }} profit
 */

/**
 * Everything the Analytics page shows, for one seller.
 * @param {string} sellerId
 * @returns {Promise<SellerAnalytics>}
 */
export async function getSellerAnalytics(sellerId) {
  await connectDB();
  const sid = new mongoose.Types.ObjectId(sellerId);
  const live = { seller: sid, status: { $ne: "CANCELLED" } };

  const [orders, top] = await Promise.all([
    Order.find(live).sort({ createdAt: 1 }).limit(5000).select("orderNumber items.title total marketplace salePrice marketplaceFees createdAt").lean(),
    Order.aggregate([
      { $match: live },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          title: { $last: "$items.title" },
          image: { $last: "$items.image" },
          spend: { $sum: { $multiply: ["$items.unitPrice", "$items.qty"] } },
          units: { $sum: "$items.qty" },
          orders: { $addToSet: "$_id" },
        },
      },
      { $project: { title: 1, image: 1, spend: 1, units: 1, orders: { $size: "$orders" } } },
      { $sort: { spend: -1, units: -1 } },
      { $limit: 5 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "p", pipeline: [{ $project: { slug: 1, active: 1, images: { $slice: ["$images", 1] } } }] } },
    ]),
  ]);

  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  const orderCount = orders.length;
  let reorderDays = null;
  if (orderCount >= 2) {
    const span = new Date(orders[orderCount - 1].createdAt) - new Date(orders[0].createdAt);
    reorderDays = Math.max(0, Math.round(span / DAY_MS / (orderCount - 1)));
  }

  const months = lastMonths(6);
  const byMonth = new Map(months.map((m) => [m.key, { ...m, spend: 0, orders: 0 }]));
  for (const o of orders) {
    const row = byMonth.get(monthKey(o.createdAt));
    if (row) {
      row.spend += o.total;
      row.orders += 1;
    }
  }

  const tracked = orders.filter((o) => typeof o.salePrice === "number" && o.salePrice > 0);
  const revenue = tracked.reduce((s, o) => s + o.salePrice, 0);
  const fees = tracked.reduce((s, o) => s + (o.marketplaceFees ?? 0), 0);
  const cost = tracked.reduce((s, o) => s + o.total, 0);
  const profitOf = (o) => o.salePrice - (o.marketplaceFees ?? 0) - o.total;
  const mk = new Map();
  for (const o of tracked) {
    const r = mk.get(o.marketplace) ?? { marketplace: o.marketplace, orders: 0, revenue: 0, profit: 0 };
    r.orders += 1;
    r.revenue += o.salePrice;
    r.profit += profitOf(o);
    mk.set(o.marketplace, r);
  }

  return serialize({
    totalSpent,
    orderCount,
    avgOrderValue: orderCount ? Math.round(totalSpent / orderCount) : 0,
    reorderDays,
    monthly: [...byMonth.values()],
    topProducts: top.map((t) => {
      const p = t.p?.[0];
      return {
        productId: String(t._id),
        title: t.title,
        slug: p?.active ? p.slug : undefined,
        image: p?.images?.[0] ?? t.image,
        spend: t.spend,
        units: t.units,
        orders: t.orders,
      };
    }),
    profit: {
      tracked: tracked.length,
      untracked: orderCount - tracked.length,
      revenue,
      fees,
      cost,
      profit: revenue - fees - cost,
      margin: revenue > 0 ? (revenue - fees - cost) / revenue : null,
      byMarketplace: [...mk.values()].sort((a, b) => b.profit - a.profit),
      recent: tracked
        .slice(-5)
        .reverse()
        .map((o) => ({
          _id: String(o._id),
          orderNumber: o.orderNumber,
          title: o.items?.[0]?.title ?? "",
          revenue: o.salePrice,
          fees: o.marketplaceFees ?? 0,
          cost: o.total,
          profit: profitOf(o),
          createdAt: o.createdAt,
        })),
    },
  });
}
