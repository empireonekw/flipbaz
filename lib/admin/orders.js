import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Order, Payment, User } from "@/lib/models";
import { ORDER_STATUSES } from "@/lib/models/constants";
import { serialize } from "@/lib/serialize";
import { ADMIN_PAGE_SIZE, AdminError, assertId, escapeRegex, pageNum } from "./common";
import { notify } from "@/lib/notifications";
import { ORDER_STATUS_LABELS } from "@/lib/models/constants";

/** What the seller should do next, per status (shown in their Updates feed). */
const SELLER_NEXT = {
  CONFIRMED: "We've confirmed it and will start making it shortly.",
  IN_PRODUCTION: "It's being made in our workshop now.",
  QC_PASSED: "It passed quality check and is being packed.",
  SHIPPED: "Share the tracking number with your buyer.",
  DELIVERED: "Delivered to your buyer.",
  CANCELLED: "This order was cancelled.",
};

/** The normal fulfilment path. */
const FLOW = ["PENDING_PAYMENT", "CONFIRMED", "IN_PRODUCTION", "QC_PASSED", "SHIPPED", "DELIVERED"];

/** Couriers offered as suggestions in the admin form (free text is allowed). */
export const COURIERS = ["TCS", "Leopards", "M&P", "PostEx", "Trax", "Call Courier", "BlueEx", "Pakistan Post"];

/**
 * Statuses an admin may move an order to from `status`: any later step in the
 * flow, or CANCELLED before it ships. Delivered and cancelled orders are final.
 * @param {string} status
 * @returns {string[]}
 */
export function allowedNextStatuses(status) {
  if (status === "DELIVERED" || status === "CANCELLED") return [];
  const i = FLOW.indexOf(status);
  const forward = FLOW.slice(i + 1);
  const canCancel = FLOW.indexOf(status) < FLOW.indexOf("SHIPPED");
  return canCancel ? [...forward, "CANCELLED"] : forward;
}

/**
 * Paginated order list for admins.
 * @param {{ status?: string, q?: string, page?: number }} filters
 */
export async function listOrders({ status, q, page } = {}) {
  await connectDB();
  const where = {};
  if (ORDER_STATUSES.includes(status)) where.status = status;
  const search = (q ?? "").trim().slice(0, 60);
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    const sellers = await User.find({ $or: [{ name: rx }, { email: rx }] }).select("_id").limit(50).lean();
    where.$or = [
      { orderNumber: rx },
      { customerName: rx },
      { customerPhone: rx },
      { trackingNumber: rx },
      { city: rx },
      { "items.title": rx },
      { seller: { $in: sellers.map((s) => s._id) } },
    ];
  }
  const p = pageNum(page);
  const [items, total, countsAgg] = await Promise.all([
    Order.find(where)
      .sort({ createdAt: -1 })
      .skip((p - 1) * ADMIN_PAGE_SIZE)
      .limit(ADMIN_PAGE_SIZE)
      .populate("seller", "name email storeName")
      .populate("payment", "status")
      .select("orderNumber seller customerName city total status courier trackingNumber createdAt items.title items.qty items.image payment")
      .lean(),
    Order.countDocuments(where),
    Order.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  const counts = Object.fromEntries(countsAgg.map((c) => [c._id, c.n]));
  counts.ALL = countsAgg.reduce((s, c) => s + c.n, 0);
  return { items: serialize(items), total, page: p, pages: Math.ceil(total / ADMIN_PAGE_SIZE), counts };
}

/**
 * One order with seller, payment and who changed each status.
 * @param {string} id
 */
export async function getOrder(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  const order = await Order.findById(id)
    .populate("seller", "name email phone whatsapp city")
    .populate("statusHistory.changedBy", "name role")
    .lean();
  if (!order) return null;
  const payments = await Payment.find({ order: order._id }).sort({ createdAt: -1 }).lean();
  return serialize({ order, payments });
}

/**
 * Change an order's status and/or courier details. Every status change is
 * appended to statusHistory with the admin and an optional note.
 *
 * @param {Object} input
 * @param {string} input.orderId
 * @param {string} input.status       new status (or the current one to only edit courier/tracking)
 * @param {string} [input.note]
 * @param {string} [input.courier]
 * @param {string} [input.trackingNumber]
 * @param {string} input.adminId
 * @throws {AdminError}
 */
export async function updateOrder({ orderId, status, note, courier, trackingNumber, adminId }) {
  assertId(orderId, "Order");
  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) throw new AdminError("Order not found.");

  const changing = status !== order.status;
  if (changing && !allowedNextStatuses(order.status).includes(status)) {
    throw new AdminError(`An order that is ${order.status.replace("_", " ").toLowerCase()} can't move to ${status.replace("_", " ").toLowerCase()}.`);
  }
  if (changing && status === "CONFIRMED" && order.status === "PENDING_PAYMENT" && !note) {
    throw new AdminError("Confirming without an approved payment needs a note (e.g. how it was paid).");
  }

  const nextCourier = courier || order.courier;
  const nextTracking = trackingNumber || order.trackingNumber;
  if ((status === "SHIPPED" || status === "DELIVERED") && (!nextCourier || !nextTracking)) {
    throw new AdminError("Add the courier and tracking number before marking it shipped.");
  }

  order.courier = nextCourier || undefined;
  order.trackingNumber = nextTracking || undefined;
  if (changing) {
    order.status = status;
    order.statusHistory.push({ status, note: note || undefined, changedBy: adminId, at: new Date() });
    await order.save();
    const tracking = status === "SHIPPED" && order.trackingNumber ? ` ${order.courier} ${order.trackingNumber}.` : "";
    await notify(String(order.seller), {
      type: "ORDER_STATUS",
      title: `Order ${ORDER_STATUS_LABELS[status].toLowerCase()}`,
      body: `${order.orderNumber}: ${SELLER_NEXT[status] ?? ""}${tracking}${note ? ` Note: ${note}` : ""}`,
      href: `/dashboard/orders/${order._id}`,
    });
    return;
  } else if (note) {
    // Same status, but a note worth keeping (e.g. "Courier changed").
    order.statusHistory.push({ status, note, changedBy: adminId, at: new Date() });
  }
  await order.save();
}
