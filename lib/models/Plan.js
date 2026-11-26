import mongoose from "mongoose";
import { defineModel } from "./define.js";
import { PLAN_MONTHS } from "./constants.js";

/**
 * A membership plan a seller can buy. Longer plans have a lower monthly price.
 *
 * @typedef {Object} Plan
 * @property {string} name            e.g. "Quarterly"
 * @property {1|3|6|12} months
 * @property {number} pricePerMonth   PKR
 * @property {number} totalPrice      PKR charged up front (normally months × pricePerMonth)
 * @property {boolean} isRecommended  highlighted on the pricing table
 * @property {boolean} active         hidden from sellers when false
 * @property {string[]} features      bullet points shown on the pricing card
 */
const PlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    months: { type: Number, required: true, enum: PLAN_MONTHS },
    pricePerMonth: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    isRecommended: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    features: { type: [String], default: [] },
  },
  { timestamps: true }
);

PlanSchema.index({ active: 1, months: 1 });

export const Plan = defineModel("Plan", PlanSchema);
export default Plan;
