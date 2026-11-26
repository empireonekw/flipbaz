import mongoose from "mongoose";
import { defineModel } from "./define.js";
import { PAYMENT_METHODS, PAYMENT_PURPOSES, PAYMENT_STATUSES } from "./constants.js";

const { Schema } = mongoose;

/**
 * A payment submitted by a seller, either for a membership or for an order.
 *
 * Today payments are manual: the seller sends money by JazzCash, EasyPaisa or
 * bank transfer, then submits the transaction ID and a screenshot. An admin
 * approves or rejects it. Gateway integrations will create these records with
 * `provider` set and `providerRef` filled in.
 *
 * @typedef {Object} Payment
 * @property {import("mongoose").Types.ObjectId} user
 * @property {"MEMBERSHIP"|"ORDER"} purpose
 * @property {number} amount                 PKR
 * @property {"JAZZCASH"|"EASYPAISA"|"BANK_TRANSFER"} method
 * @property {string} transactionId          reference the seller got from their wallet/bank
 * @property {string} [screenshotUrl]        proof image (storage helper URL)
 * @property {"PENDING"|"APPROVED"|"REJECTED"} status
 * @property {string} [adminNote]
 * @property {import("mongoose").Types.ObjectId} [membership] set when purpose = MEMBERSHIP
 * @property {import("mongoose").Types.ObjectId} [order]      set when purpose = ORDER
 * @property {string} provider               "manual" now; gateway id later
 * @property {import("mongoose").Types.ObjectId} [reviewedBy]
 * @property {Date} [reviewedAt]
 */
const PaymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    purpose: { type: String, enum: PAYMENT_PURPOSES, required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    transactionId: { type: String, required: true, trim: true, maxlength: 60 },
    screenshotUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "PENDING",
      index: true,
    },
    adminNote: { type: String, trim: true, maxlength: 500 },
    membership: { type: Schema.Types.ObjectId, ref: "Membership" },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    provider: { type: String, default: "manual" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true }
);

PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ method: 1, transactionId: 1 });

export const Payment = defineModel("Payment", PaymentSchema);
export default Payment;
