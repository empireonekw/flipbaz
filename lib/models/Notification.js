import mongoose from "mongoose";
import { defineModel } from "./define.js";

const { Schema } = mongoose;

/** Kinds of updates shown in the seller's "Updates" feed. */
export const NOTIFICATION_TYPES = Object.freeze([
  "PAYMENT_APPROVED",
  "PAYMENT_REJECTED",
  "MEMBERSHIP_ACTIVE",
  "ORDER_STATUS",
  "SUPPORT_REPLY",
  "SESSION",
  "GENERAL",
]);

/**
 * One item in a user's Updates feed (payment confirmed, order shipped,
 * support replied…). Created by lib/notifications.js.
 *
 * @typedef {Object} Notification
 * @property {import("mongoose").Types.ObjectId} user
 * @property {string} type     one of NOTIFICATION_TYPES
 * @property {string} title
 * @property {string} [body]
 * @property {string} [href]   where "Open" goes
 * @property {string} [key]    de-duplication key (e.g. one live "support reply" per conversation)
 * @property {Date} [readAt]
 */
const NotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, default: "GENERAL" },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    body: { type: String, trim: true, maxlength: 400 },
    href: { type: String, trim: true, maxlength: 200 },
    key: { type: String, trim: true, maxlength: 120 },
    readAt: Date,
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, readAt: 1 });

export const Notification = defineModel("Notification", NotificationSchema);
export default Notification;
