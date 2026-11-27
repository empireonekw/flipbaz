import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Order, Payment, Product, generateOrderNumber } from "@/lib/models";
import { computeOrderTotals, DEFAULT_SHIPPING_FEE } from "@/lib/pricing";
import { serialize } from "@/lib/serialize";
import { PaymentError, assertUnusedTransaction, submitOrderPayment } from "@/lib/payments";

/**
 * Seller-side order logic. Every function takes the seller's id and only
 * ever touches that seller's orders.
 *
 * Prices are NEVER taken from the browser: each line is rebuilt from the
 * product in the database (current costPrice), and options are checked
 * against the product's sizes/colours.
 */

/** Error whose message is safe to show the seller. */
export class OrderError extends Error {}

/** Statuses a seller may cancel from (before any money is approved). */
const SELLER_CANCELLABLE = ["PENDING_PAYMENT"];

/**
 * Turn requested lines into priced order items.
 * @param {{ productId: string, qty: number, size?: string, color?: string }[]} lines
 * @returns {Promise<Object[]>}
 * @throws {OrderError}
 */
async function buildItems(lines) {
  const ids = [...new Set(lines.map((l) => l.productId))];
  if (!ids.every((id) => mongoose.isValidObjectId(id))) throw new OrderError("One of the products is invalid.");
  const products = await Product.find({ _id: { $in: ids }, active: true })
    .select("title sku images costPrice sizes colors")
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  return lines.map((line, i) => {
    const p = byId.get(line.productId);
    if (!p) throw new OrderError(`Item ${i + 1} is no longer available. Please remove it.`);
    if (p.sizes?.length && !p.sizes.includes(line.size)) {
      throw new OrderError(`Choose a valid size for "${p.title}".`);
    }
    if (p.colors?.length && !p.colors.includes(line.color)) {
      throw new OrderError(`Choose a valid colour for "${p.title}".`);
    }
    return {
      product: p._id,
      title: p.title,
      sku: p.sku,
      image: p.images?.[0],
      qty: line.qty,
      variant: { size: p.sizes?.length ? line.size : undefined, color: p.colors?.length ? line.color : undefined },
      unitPrice: p.costPrice,
    };
  });
}

/**
 * Create an order for an end customer and submit its payment proof in one go.
 * If saving the payment fails, the order is removed again so the seller never
 * ends up with a half-created order.
 *
 * @param {Object} input
 * @param {string} input.sellerId
 * @param {{ productId: string, qty: number, size?: string, color?: string }[]} input.lines
 * @param {{ customerName: string, customerPhone: string, address: string, city: string, marketplace: string, marketplaceOrderRef?: string, notes?: string }} input.customer
 * @param {{ method: string, transactionId: string, screenshot: File }} input.payment
 * @returns {Promise<{ orderId: string, orderNumber: string }>}
 * @throws {OrderError|PaymentError}
 */
export async function createOrderWithPayment({ sellerId, lines, customer, payment }) {
  await connectDB();
  const items = await buildItems(lines);
  // Check the receipt before creating anything, so a duplicate doesn't leave an empty order.
  await assertUnusedTransaction(payment.method, payment.transactionId);

  const totals = computeOrderTotals(items, DEFAULT_SHIPPING_FEE);
  let order;
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    try {
      order = await Order.create({
        orderNumber: generateOrderNumber(),
        seller: sellerId,
        items,
        ...customer,
        ...totals,
        status: "PENDING_PAYMENT",
        statusHistory: [{ status: "PENDING_PAYMENT", note: "Order placed", changedBy: sellerId }],
      });
    } catch (err) {
      if (err?.code !== 11000 || !err?.keyPattern?.orderNumber) throw err; // retry only on a number clash
    }
  }
  if (!order) throw new OrderError("Couldn't create the order. Please try again.");

  try {
    await submitOrderPayment({ userId: sellerId, orderId: String(order._id), ...payment });
  } catch (err) {
    await Order.deleteOne({ _id: order._id });
    throw err;
  }
  return { orderId: String(order._id), orderNumber: order.orderNumber };
}

/**
 * Payment state shown next to an order.
 * @param {{ status: string }} order
 * @param {{ status: string } | null | undefined} payment
 * @returns {"PAID"|"UNPAID"|"IN_REVIEW"|"REJECTED"}
 */
export function paymentState(order, payment) {
  if (order.status === "CANCELLED") return payment?.status === "APPROVED" ? "PAID" : "UNPAID";
  if (!payment) return "UNPAID";
  if (payment.status === "APPROVED") return "PAID";
  if (payment.status === "PENDING") return "IN_REVIEW";
  return "REJECTED";
}

/**
 * Tabs on the seller's Orders page. "action" = awaiting payment proof (none
 * sent yet or the last one was rejected); "review" = proof sent, we're checking.
 */
export const ORDER_TABS = Object.freeze([
  { id: "all", label: "All" },
  { id: "action", label: "Action needed" },
  { id: "review", label: "Payment review" },
  { id: "production", label: "In production" },
  { id: "shipping", label: "Shipping" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
]);

const TAB_STATUSES = {
  production: ["CONFIRMED", "IN_PRODUCTION", "QC_PASSED"],
  shipping: ["SHIPPED"],
  delivered: ["DELIVERED"],
  cancelled: ["CANCELLED"],
};

/**
 * Map an old-style `?status=` value to a tab id (links from Home, updates…).
 * @param {string} [status]
 * @returns {string|undefined}
 */
export function tabForStatus(status) {
  if (status === "PENDING_PAYMENT") return "action";
  return Object.entries(TAB_STATUSES).find(([, list]) => list.includes(status))?.[0];
}

/**
 * Paginated orders for a seller, newest first, filtered by tab and search.
 * Each item carries `pay` (see paymentState).
 * @param {string} sellerId
 * @param {{ tab?: string, q?: string, page?: number }} [filters]
 * @returns {Promise<{ items: Object[], total: number, page: number, pages: number, counts: Record<string, number> }>}
 */
export async function listSellerOrders(sellerId, { tab = "all", q, page = 1 } = {}) {
  await connectDB();
  const PAGE = 15;
  const sid = new mongoose.Types.ObjectId(sellerId);
  // Order payments currently waiting for our review: they split
  // PENDING_PAYMENT orders into "action needed" and "payment review".
  const inReviewIds = await Payment.find({ user: sid, purpose: "ORDER", status: "PENDING" }).distinct("_id");

  const where = { seller: sid };
  if (tab === "action") Object.assign(where, { status: "PENDING_PAYMENT", payment: { $nin: inReviewIds } });
  else if (tab === "review") Object.assign(where, { status: "PENDING_PAYMENT", payment: { $in: inReviewIds } });
  else if (TAB_STATUSES[tab]) where.status = { $in: TAB_STATUSES[tab] };

  const search = (q ?? "").trim().slice(0, 60);
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    where.$or = [{ orderNumber: rx }, { customerName: rx }, { customerPhone: rx }, { city: rx }, { trackingNumber: rx }, { marketplaceOrderRef: rx }, { "items.title": rx }];
  }
  const pageNum = Math.max(1, Math.floor(Number(page)) || 1);
  const [items, total, countsAgg, reviewCount] = await Promise.all([
    Order.find(where)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * PAGE)
      .limit(PAGE)
      .select("orderNumber items.title items.qty items.image customerName city total status courier trackingNumber createdAt payment")
      .populate("payment", "status")
      .lean(),
    Order.countDocuments(where),
    Order.aggregate([{ $match: { seller: sid } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
    Order.countDocuments({ seller: sid, status: "PENDING_PAYMENT", payment: { $in: inReviewIds } }),
  ]);

  const by = Object.fromEntries(countsAgg.map((c) => [c._id, c.n]));
  const sum = (list) => list.reduce((s, st) => s + (by[st] ?? 0), 0);
  const counts = {
    all: countsAgg.reduce((s, c) => s + c.n, 0),
    action: (by.PENDING_PAYMENT ?? 0) - reviewCount,
    review: reviewCount,
    ...Object.fromEntries(Object.entries(TAB_STATUSES).map(([id, list]) => [id, sum(list)])),
  };

  const shaped = items.map(({ payment, ...o }) => ({ ...o, pay: paymentState(o, payment) }));
  return { items: serialize(shaped), total, page: pageNum, pages: Math.ceil(total / PAGE), counts };
}

/**
 * One order with its latest payment, only if it belongs to the seller.
 * @param {string} sellerId
 * @param {string} orderId
 * @returns {Promise<{ order: Object, payment: Object|null } | null>}
 */
export async function getSellerOrder(sellerId, orderId) {
  await connectDB();
  if (!mongoose.isValidObjectId(orderId)) return null;
  const order = await Order.findOne({ _id: orderId, seller: sellerId }).lean();
  if (!order) return null;
  const payment = order.payment
    ? await Payment.findById(order.payment).select("status method transactionId amount adminNote createdAt reviewedAt screenshotUrl").lean()
    : null;
  return serialize({ order, payment });
}

/**
 * Whether the seller can cancel this order themselves.
 * @param {{ status: string }} order
 * @param {{ status: string } | null} payment
 */
export function canSellerCancel(order, payment) {
  return SELLER_CANCELLABLE.includes(order.status) && (!payment || payment.status === "REJECTED");
}

/**
 * Seller cancels an order that hasn't been paid for yet.
 * @param {string} sellerId
 * @param {string} orderId
 * @throws {OrderError}
 */
export async function cancelSellerOrder(sellerId, orderId) {
  const found = await getSellerOrder(sellerId, orderId);
  if (!found) throw new OrderError("Order not found.");
  if (!canSellerCancel(found.order, found.payment)) {
    throw new OrderError("This order can't be cancelled here any more. Please contact support.");
  }
  const res = await Order.updateOne(
    { _id: orderId, seller: sellerId, status: { $in: SELLER_CANCELLABLE } },
    {
      $set: { status: "CANCELLED" },
      $push: { statusHistory: { status: "CANCELLED", note: "Cancelled by seller", changedBy: sellerId, at: new Date() } },
    }
  );
  if (!res.modifiedCount) throw new OrderError("This order has changed. Please refresh and try again.");
}

/**
 * Small numbers for the dashboard overview.
 * @param {string} sellerId
 */
export async function getSellerOrderSummary(sellerId) {
  await connectDB();
  const sellerObjId = new mongoose.Types.ObjectId(sellerId);
  const [agg, recent] = await Promise.all([
    Order.aggregate([{ $match: { seller: sellerObjId } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
    Order.find({ seller: sellerObjId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderNumber customerName total status createdAt items.title")
      .lean(),
  ]);
  const by = Object.fromEntries(agg.map((a) => [a._id, a.n]));
  return {
    awaitingPayment: by.PENDING_PAYMENT ?? 0,
    inProgress: (by.CONFIRMED ?? 0) + (by.IN_PRODUCTION ?? 0) + (by.QC_PASSED ?? 0),
    shipped: by.SHIPPED ?? 0,
    delivered: by.DELIVERED ?? 0,
    recent: serialize(recent),
  };
}

export { PaymentError };
