import mongoose from "mongoose";
import { MARKETPLACES, ORDER_STATUSES } from "./constants.js";

const { Schema } = mongoose;

/**
 * One line on an order. Title and unit price are snapshotted at order time so
 * later catalog edits don't change past orders.
 */
const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    sku: String,
    image: String,
    qty: { type: Number, required: true, min: 1, max: 500 },
    variant: {
      size: { type: String, trim: true },
      color: { type: String, trim: true },
    },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

/** One entry in the order's audit trail. */
const StatusHistorySchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, trim: true, maxlength: 500 },
    changedBy: { type: Schema.Types.ObjectId, ref: "User" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * An order a seller places with Flip Baz on behalf of their own customer.
 * Flip Baz makes, quality-checks and ships it directly to that customer.
 *
 * Status flow: PENDING_PAYMENT → CONFIRMED → IN_PRODUCTION → QC_PASSED →
 * SHIPPED → DELIVERED, or CANCELLED. Every change is appended to
 * `statusHistory`.
 *
 * @typedef {Object} Order
 * @property {string} orderNumber          human-friendly id, e.g. "FB-261125-7K2Q"
 * @property {import("mongoose").Types.ObjectId} seller
 * @property {Object[]} items
 * @property {string} customerName
 * @property {string} customerPhone
 * @property {string} address
 * @property {string} city
 * @property {string} marketplace          where the seller made the sale
 * @property {string} [marketplaceOrderRef]
 * @property {number} subtotal             PKR
 * @property {number} shippingFee          PKR
 * @property {number} total                PKR (subtotal + shippingFee)
 * @property {import("mongoose").Types.ObjectId} [payment]
 * @property {string} status
 * @property {string} [courier]
 * @property {string} [trackingNumber]
 * @property {string} [notes]
 * @property {Object[]} statusHistory
 */
const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: {
      type: [OrderItemSchema],
      validate: [(v) => Array.isArray(v) && v.length > 0, "Order needs at least one item"],
    },
    customerName: { type: String, required: true, trim: true, maxlength: 80 },
    customerPhone: { type: String, required: true, trim: true, maxlength: 20 },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    marketplace: { type: String, enum: MARKETPLACES, default: "Other" },
    marketplaceOrderRef: { type: String, trim: true, maxlength: 60 },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "PENDING_PAYMENT",
      index: true,
    },
    courier: { type: String, trim: true, maxlength: 60 },
    trackingNumber: { type: String, trim: true, maxlength: 60 },
    notes: { type: String, trim: true, maxlength: 1000 },
    statusHistory: { type: [StatusHistorySchema], default: [] },
  },
  { timestamps: true }
);

OrderSchema.index({ seller: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

/**
 * Generate a short, readable order number like "FB-261125-7K2Q".
 * Uniqueness is enforced by the index; callers retry on a duplicate key.
 * @param {Date} [date]
 * @returns {string}
 */
export function generateOrderNumber(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `FB-${yy}${mm}${dd}-${suffix}`;
}

export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
export default Order;
