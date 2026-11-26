import mongoose from "mongoose";
import { defineModel } from "./define.js";
import { MEMBERSHIP_STATUSES } from "./constants.js";

const { Schema } = mongoose;

/**
 * One membership period for a seller.
 *
 * Lifecycle: created as PENDING when the seller submits a payment → set to
 * ACTIVE (with startsAt/endsAt) when an admin approves that payment → treated
 * as EXPIRED once `endsAt` has passed.
 *
 * A seller may have several memberships over time (renewals). The "current"
 * one is the ACTIVE membership whose endsAt is in the future.
 *
 * @typedef {Object} Membership
 * @property {import("mongoose").Types.ObjectId} user
 * @property {import("mongoose").Types.ObjectId} plan
 * @property {{name: string, months: number, totalPrice: number}} planSnapshot plan as bought
 * @property {Date} [startsAt]
 * @property {Date} [endsAt]
 * @property {"PENDING"|"ACTIVE"|"EXPIRED"} status
 * @property {import("mongoose").Types.ObjectId} [payment]
 * @property {string} [adminNote]   manual changes by admins (extensions, early end)
 * @property {import("mongoose").Types.ObjectId} [grantedBy] admin who created it manually
 */
const MembershipSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    planSnapshot: {
      name: String,
      months: Number,
      totalPrice: Number,
    },
    startsAt: Date,
    endsAt: Date,
    status: {
      type: String,
      enum: MEMBERSHIP_STATUSES,
      default: "PENDING",
      index: true,
    },
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },
    adminNote: { type: String, trim: true, maxlength: 1000 },
    grantedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

MembershipSchema.index({ user: 1, status: 1, endsAt: -1 });

/**
 * True when this membership currently grants member access.
 * @param {{status: string, endsAt?: Date|string}} m
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isMembershipLive(m, now = new Date()) {
  return Boolean(m && m.status === "ACTIVE" && m.endsAt && new Date(m.endsAt) > now);
}

/**
 * Add whole calendar months to a date (clamping to month end, so 31 Jan + 1
 * month = 28/29 Feb).
 * @param {Date} date
 * @param {number} months
 * @returns {Date}
 */
export function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

export const Membership =
  defineModel("Membership", MembershipSchema);
export default Membership;
