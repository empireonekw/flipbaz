import mongoose from "mongoose";
import { defineModel } from "./define.js";
import {
  MANAGED_PLATFORMS,
  PLATFORM_ACCOUNT_STATES,
  SERVICE_BUDGETS,
  SERVICE_CONTACT_METHODS,
  SERVICE_EXPERIENCE,
  SERVICE_SELLER_TYPES,
  SERVICE_STATUSES,
} from "./constants.js";

const { Schema } = mongoose;

/** One marketplace the seller wants us to run. */
const PlatformSchema = new Schema(
  {
    platform: { type: String, enum: MANAGED_PLATFORMS, required: true },
    account: { type: String, enum: PLATFORM_ACCOUNT_STATES, required: true },
    handle: { type: String, trim: true, maxlength: 200 }, // store link or @username
  },
  { _id: false }
);

/** One entry in the application's audit trail. */
const HistorySchema = new Schema(
  {
    status: { type: String, enum: SERVICE_STATUSES, required: true },
    note: { type: String, trim: true, maxlength: 500 },
    by: { type: Schema.Types.ObjectId, ref: "User" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * A seller's application for store management ("Services"): we run their
 * Etsy / eBay / Walmart / TikTok Shop / Instagram stores for a monthly fee.
 *
 * Flow: SUBMITTED → MEETING_SCHEDULED (Google Meet call) → QUOTE_READY →
 * ACTIVE, or DECLINED (by us) / WITHDRAWN (by the seller) while open.
 *
 * @typedef {Object} ServiceRequest
 * @property {import("mongoose").Types.ObjectId} seller
 * @property {{ firstName: string, lastName: string, email: string, phone: string, country: string, method: string }} contact
 * @property {string} experience
 * @property {string} sellerType
 * @property {string} budget          monthly budget band
 * @property {{ platform: string, account: string, handle?: string }[]} platforms
 * @property {string} [goals]
 * @property {string} status
 * @property {{ at?: Date, url?: string, note?: string }} meeting   Google Meet call
 * @property {{ amount?: number, details?: string }} quote          PKR per month
 * @property {string} [adminNote]     latest message to the seller
 * @property {Object[]} history
 */
const ServiceRequestSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contact: {
      firstName: { type: String, required: true, trim: true, maxlength: 40 },
      lastName: { type: String, required: true, trim: true, maxlength: 40 },
      email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
      phone: { type: String, required: true, trim: true, maxlength: 20 },
      country: { type: String, required: true, trim: true, maxlength: 60 },
      method: { type: String, enum: SERVICE_CONTACT_METHODS, default: "WhatsApp" },
    },
    experience: { type: String, enum: SERVICE_EXPERIENCE, required: true },
    sellerType: { type: String, enum: SERVICE_SELLER_TYPES, required: true },
    budget: { type: String, enum: SERVICE_BUDGETS, required: true },
    platforms: {
      type: [PlatformSchema],
      validate: [(v) => Array.isArray(v) && v.length > 0, "Choose at least one platform"],
    },
    goals: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: SERVICE_STATUSES, default: "SUBMITTED", index: true },
    meeting: {
      at: Date,
      url: { type: String, trim: true, maxlength: 200 },
      note: { type: String, trim: true, maxlength: 300 },
    },
    quote: {
      amount: { type: Number, min: 0, max: 100000000 },
      details: { type: String, trim: true, maxlength: 1000 },
    },
    adminNote: { type: String, trim: true, maxlength: 500 },
    history: { type: [HistorySchema], default: [] },
  },
  { timestamps: true }
);

ServiceRequestSchema.index({ seller: 1, createdAt: -1 });
ServiceRequestSchema.index({ status: 1, createdAt: -1 });

export const ServiceRequest = defineModel("ServiceRequest", ServiceRequestSchema);
export default ServiceRequest;
