import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Membership, Order, Payment, Plan, User, addMonths } from "@/lib/models";
import { serialize } from "@/lib/serialize";
import { ADMIN_PAGE_SIZE, AdminError, escapeRegex, pageNum } from "./common";

export const MEMBER_STATES = ["ACTIVE", "PENDING", "EXPIRED", "NONE"];

/**
 * Sellers with their membership state, computed in one aggregation so the
 * state filter and pagination agree.
 *   ACTIVE  = has an ACTIVE membership ending in the future
 *   PENDING = no live membership, but one awaiting payment review
 *   EXPIRED = had memberships, none live
 *   NONE    = never bought a plan
 * @param {{ q?: string, state?: string, page?: number }} filters
 */
export async function listSellers({ q, state, page } = {}) {
  await connectDB();
  const match = { role: "SELLER" };
  const search = (q ?? "").trim().slice(0, 60);
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    match.$or = [{ name: rx }, { email: rx }, { phone: rx }, { whatsapp: rx }, { city: rx }];
  }
  const p = pageNum(page);

  const [res] = await User.aggregate([
    { $match: match },
    {
      $lookup: {
        from: Membership.collection.collectionName,
        localField: "_id",
        foreignField: "user",
        as: "ms",
        pipeline: [{ $project: { status: 1, endsAt: 1, planSnapshot: 1 } }],
      },
    },
    {
      $addFields: {
        live: {
          $filter: { input: "$ms", as: "m", cond: { $and: [{ $eq: ["$$m.status", "ACTIVE"] }, { $gt: ["$$m.endsAt", "$$NOW"] }] } },
        },
      },
    },
    {
      $addFields: {
        state: {
          $switch: {
            branches: [
              { case: { $gt: [{ $size: "$live" }, 0] }, then: "ACTIVE" },
              { case: { $in: ["PENDING", "$ms.status"] }, then: "PENDING" },
              { case: { $gt: [{ $size: "$ms" }, 0] }, then: "EXPIRED" },
            ],
            default: "NONE",
          },
        },
        endsAt: { $max: "$live.endsAt" },
      },
    },
    ...(MEMBER_STATES.includes(state) ? [{ $match: { state } }] : []),
    {
      $facet: {
        items: [
          { $sort: { createdAt: -1 } },
          { $skip: (p - 1) * ADMIN_PAGE_SIZE },
          { $limit: ADMIN_PAGE_SIZE },
          {
            $lookup: {
              from: Order.collection.collectionName,
              localField: "_id",
              foreignField: "seller",
              as: "orders",
              pipeline: [{ $project: { _id: 1 } }],
            },
          },
          {
            $project: {
              name: 1, email: 1, phone: 1, city: 1, isActive: 1, createdAt: 1, state: 1, endsAt: 1,
              orderCount: { $size: "$orders" },
            },
          },
        ],
        total: [{ $count: "n" }],
      },
    },
  ]);

  const total = res?.total?.[0]?.n ?? 0;
  return { items: serialize(res?.items ?? []), total, page: p, pages: Math.ceil(total / ADMIN_PAGE_SIZE) };
}

/**
 * Everything about one seller for the admin detail page.
 * @param {string} id
 */
export async function getSellerDetail(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  const user = await User.findOne({ _id: id, role: "SELLER" }).select("-passwordHash").lean();
  if (!user) return null;
  const [memberships, payments, orders, orderCount] = await Promise.all([
    Membership.find({ user: id }).sort({ createdAt: -1 }).limit(20).lean(),
    Payment.find({ user: id }).sort({ createdAt: -1 }).limit(20).populate("order", "orderNumber").lean(),
    Order.find({ seller: id }).sort({ createdAt: -1 }).limit(20).select("orderNumber status total customerName city createdAt").lean(),
    Order.countDocuments({ seller: id }),
  ]);
  const now = new Date();
  const live = memberships
    .filter((m) => m.status === "ACTIVE" && m.endsAt && new Date(m.endsAt) > now)
    .sort((a, b) => new Date(b.endsAt) - new Date(a.endsAt))[0];
  return serialize({ user, memberships, payments, orders, orderCount, live: live ?? null });
}

/**
 * Add time to a seller's membership. Extends the live membership that ends
 * last; if there is none, starts a new ACTIVE membership from today.
 * @param {{ userId: string, amount: number, unit: "days"|"months", note?: string, adminId: string }} input
 * @returns {Promise<string>} new end date (ISO)
 */
export async function extendMembership({ userId, amount, unit, note, adminId }) {
  await connectDB();
  const user = await User.findOne({ _id: userId, role: "SELLER" }).select("_id").lean();
  if (!user) throw new AdminError("Seller not found.");
  const now = new Date();
  const add = (d) => (unit === "months" ? addMonths(d, amount) : new Date(new Date(d).getTime() + amount * 86400e3));
  const unitLabel = amount === 1 ? unit.slice(0, -1) : unit;
  const stamp = `Extended by ${amount} ${unitLabel} by admin${note ? `: ${note}` : ""}`;

  const live = await Membership.findOne({ user: userId, status: "ACTIVE", endsAt: { $gt: now } }).sort({ endsAt: -1 });
  if (live) {
    live.endsAt = add(live.endsAt);
    live.adminNote = [live.adminNote, stamp].filter(Boolean).join(" · ");
    await live.save();
    return live.endsAt.toISOString();
  }

  const last = await Membership.findOne({ user: userId }).sort({ createdAt: -1 }).select("plan").lean();
  const plan = last?.plan ?? (await Plan.findOne().sort({ months: 1 }).select("_id").lean())?._id;
  if (!plan) throw new AdminError("Create a plan first.");
  const m = await Membership.create({
    user: userId,
    plan,
    planSnapshot: { name: "Manual extension", months: unit === "months" ? amount : 0, totalPrice: 0 },
    startsAt: now,
    endsAt: add(now),
    status: "ACTIVE",
    adminNote: stamp,
    grantedBy: adminId,
  });
  return m.endsAt.toISOString();
}

/**
 * End a seller's live membership(s) now. They keep their order history.
 * @param {{ userId: string }} input
 * @returns {Promise<number>} memberships ended
 */
export async function endMembership({ userId }) {
  await connectDB();
  const now = new Date();
  const res = await Membership.updateMany(
    { user: userId, status: "ACTIVE", endsAt: { $gt: now } },
    { $set: { status: "EXPIRED", endsAt: now, adminNote: "Ended early by admin" } }
  );
  if (!res.modifiedCount) throw new AdminError("This seller has no active membership.");
  return res.modifiedCount;
}

/**
 * Enable or disable a seller's account. Disabled accounts are signed out on
 * their next request (see getCurrentUser) and can't log in.
 * @param {{ userId: string, active: boolean }} input
 */
export async function setAccountActive({ userId, active }) {
  await connectDB();
  const res = await User.updateOne({ _id: userId, role: "SELLER" }, { $set: { isActive: active } });
  if (!res.matchedCount) throw new AdminError("Seller not found.");
}
