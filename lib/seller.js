import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { LiveSession, Order, Payment, User } from "@/lib/models";
import { listNotifications, unreadNotificationCount } from "@/lib/notifications";
import { serialize } from "@/lib/serialize";
import { paymentState } from "@/lib/orders";
import { getLedgerBalance } from "@/lib/ledger";

/**
 * Data for the seller Home page. Every function is scoped to one seller id.
 */

/** Steps on the seller's launch checklist, in order. */
export const LAUNCH_STEPS = [
  { id: "account", title: "Create your Flip Baz account", body: "You're in. Welcome aboard." },
  { id: "membership", title: "Activate your membership", body: "Unlock wholesale prices, listing photos and ordering.", href: "/dashboard/membership", cta: "Choose a plan" },
  { id: "store", title: "Add your store details", body: "Tell us your store name and where you sell.", href: "/dashboard/profile", cta: "Add details" },
  { id: "sellingAccount", title: "Open your selling account", body: "Daraz, Shopify, Instagram, eBay, Etsy or your own website.", manual: true },
  { id: "firstListing", title: "List your first Flip Baz product", body: "Copy the listing text and photos from the catalog.", href: "/dashboard/catalog", cta: "Browse catalog", manual: true },
  { id: "firstOrder", title: "Send us your first order", body: "When a buyer orders from you, place it here.", href: "/dashboard/orders/new", cta: "Place an order" },
  { id: "firstDelivery", title: "Get your first order delivered", body: "We make, check and ship it to your buyer." },
];

/** Steps the seller ticks themselves (we can't see their store). */
export const MANUAL_STEPS = LAUNCH_STEPS.filter((s) => s.manual).map((s) => s.id);

/**
 * Launch checklist with each step's done state.
 * @param {Object} user        lean user (storeName, sellingPlatforms, onboarding)
 * @param {{ hadMembership: boolean, orderCount: number, deliveredCount: number }} facts
 */
function buildChecklist(user, facts) {
  const done = {
    account: true,
    membership: facts.hadMembership,
    store: Boolean(user.storeName && user.sellingPlatforms?.length),
    sellingAccount: Boolean(user.onboarding?.sellingAccountAt),
    firstListing: Boolean(user.onboarding?.firstListingAt),
    firstOrder: facts.orderCount > 0,
    firstDelivery: facts.deliveredCount > 0,
  };
  const steps = LAUNCH_STEPS.map((s) => ({ ...s, done: done[s.id] }));
  const completed = steps.filter((s) => s.done).length;
  return { steps, completed, total: steps.length, current: steps.find((s) => !s.done) ?? null };
}

/** The seller's next step for an order. */
function nextStep(order, pay) {
  switch (order.status) {
    case "PENDING_PAYMENT":
      return pay === "IN_REVIEW" ? "We're verifying your payment." : pay === "REJECTED" ? "Payment rejected: upload new proof." : "Upload payment proof.";
    case "CONFIRMED":
    case "IN_PRODUCTION":
    case "QC_PASSED":
      return "We're making it. Nothing to do yet.";
    case "SHIPPED":
      return "Share the tracking number with your buyer.";
    case "DELIVERED":
      return "All done.";
    default:
      return "No action needed.";
  }
}

/**
 * Everything the Home page needs, in parallel.
 * @param {string} sellerId
 * @param {{ state: string }} access  from getMemberAccess()
 */
export async function getSellerHome(sellerId, access) {
  await connectDB();
  const sid = new mongoose.Types.ObjectId(sellerId);
  const now = new Date();

  const [user, statusAgg, pendingOrders, recent, notifications, unread, session, balance] = await Promise.all([
    User.findById(sid).select("name storeName sellingPlatforms onboarding").lean(),
    Order.aggregate([{ $match: { seller: sid } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
    Order.find({ seller: sid, status: "PENDING_PAYMENT" }).select("payment").lean(),
    Order.find({ seller: sid }).sort({ createdAt: -1 }).limit(6).select("orderNumber items.title createdAt status total payment").lean(),
    listNotifications(sellerId, 4),
    unreadNotificationCount(sellerId),
    LiveSession.findOne({ active: true, $expr: { $gt: [{ $add: ["$startsAt", { $multiply: ["$durationMinutes", 60000] }] }, now] } })
      .sort({ startsAt: 1 })
      .select("title host startsAt durationMinutes description")
      .lean(),
    getLedgerBalance(sellerId),
  ]);

  const byStatus = Object.fromEntries(statusAgg.map((s) => [s._id, s.n]));
  const paymentIds = [...pendingOrders, ...recent].map((o) => o.payment).filter(Boolean);
  const payments = paymentIds.length ? await Payment.find({ _id: { $in: paymentIds } }).select("status").lean() : [];
  const payById = new Map(payments.map((p) => [String(p._id), p]));

  const inReview = pendingOrders.filter((o) => payById.get(String(o.payment))?.status === "PENDING").length;
  const flow = {
    awaitingPayment: (byStatus.PENDING_PAYMENT ?? 0) - inReview,
    paymentReview: inReview,
    inProduction: (byStatus.CONFIRMED ?? 0) + (byStatus.IN_PRODUCTION ?? 0) + (byStatus.QC_PASSED ?? 0),
    shipped: byStatus.SHIPPED ?? 0,
    total: statusAgg.reduce((s, x) => s + x.n, 0),
  };

  const recentOrders = recent.map((o) => {
    const pay = paymentState(o, o.payment ? payById.get(String(o.payment)) : null);
    return {
      _id: String(o._id),
      orderNumber: o.orderNumber,
      product: o.items?.[0]?.title ?? "",
      more: Math.max(0, (o.items?.length ?? 1) - 1),
      createdAt: o.createdAt,
      status: o.status,
      payment: pay,
      next: nextStep(o, pay),
      total: o.total,
    };
  });

  const checklist = buildChecklist(user ?? {}, {
    hadMembership: access.state === "ACTIVE" || access.state === "EXPIRED",
    orderCount: flow.total - (byStatus.CANCELLED ?? 0),
    deliveredCount: byStatus.DELIVERED ?? 0,
  });

  return serialize({
    flow,
    recentOrders,
    notifications,
    unread,
    session,
    checklist,
    balance, // from the ledger (lib/ledger.js): > 0 = seller owes, < 0 = in credit
  });
}

/**
 * Tick (or untick) a self-reported launch step.
 * @param {string} sellerId
 * @param {string} step   one of MANUAL_STEPS
 * @param {boolean} done
 */
export async function setLaunchStep(sellerId, step, done) {
  if (!MANUAL_STEPS.includes(step)) throw new Error("Unknown step");
  await connectDB();
  const field = `onboarding.${step}At`;
  await User.updateOne({ _id: sellerId }, done ? { $set: { [field]: new Date() } } : { $unset: { [field]: 1 } });
}
