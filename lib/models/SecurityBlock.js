import mongoose from "mongoose";
import { defineModel } from "./define.js";

/**
 * A blocked IP (or IPv6 /64), persisted so blocks survive restarts. MongoDB
 * deletes the document automatically when `until` passes (TTL index).
 *
 * @typedef {Object} SecurityBlock
 * @property {string} ip        IPv4 address or "xxxx:xxxx:xxxx:xxxx::/64"
 * @property {string} reason
 * @property {number} accounts  distinct accounts seen when blocked
 * @property {Date} until
 */
const SecurityBlockSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true, unique: true, trim: true, maxlength: 64 },
    reason: { type: String, trim: true, maxlength: 200 },
    accounts: { type: Number, default: 0 },
    until: { type: Date, required: true },
  },
  { timestamps: true }
);

SecurityBlockSchema.index({ until: 1 }, { expireAfterSeconds: 0 });

export const SecurityBlock = defineModel("SecurityBlock", SecurityBlockSchema);
export default SecurityBlock;
