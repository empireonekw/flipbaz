import mongoose from "mongoose";
import { defineModel } from "./define.js";
import { PRODUCT_REQUEST_STATUSES } from "./constants.js";

const { Schema } = mongoose;

/**
 * A seller asking us to make or source an item that isn't in the catalog
 * yet ("Custom requests"). An admin reviews it, replies, and can link the
 * catalog product once it's added.
 *
 * @typedef {Object} ProductRequest
 * @property {import("mongoose").Types.ObjectId} seller
 * @property {string} title              what they want
 * @property {string} [details]          material, size, colour, branding…
 * @property {string} [referenceUrl]     link to a similar product
 * @property {string} [image]            /uploads/requests/… (private: owner + admins)
 * @property {number} [quantity]         expected units per month
 * @property {number} [targetPrice]      PKR they'd like to pay per unit
 * @property {"OPEN"|"REVIEWING"|"ADDED"|"DECLINED"} status
 * @property {string} [adminReply]
 * @property {import("mongoose").Types.ObjectId} [product]  catalog product, when ADDED
 * @property {Date} [repliedAt]
 */
const ProductRequestSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    details: { type: String, trim: true, maxlength: 1000 },
    referenceUrl: { type: String, trim: true, maxlength: 500 },
    image: { type: String, trim: true, maxlength: 200 },
    quantity: { type: Number, min: 1, max: 100000 },
    targetPrice: { type: Number, min: 0, max: 10000000 },
    status: { type: String, enum: PRODUCT_REQUEST_STATUSES, default: "OPEN", index: true },
    adminReply: { type: String, trim: true, maxlength: 500 },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    repliedAt: Date,
  },
  { timestamps: true }
);

ProductRequestSchema.index({ seller: 1, createdAt: -1 });
ProductRequestSchema.index({ status: 1, createdAt: -1 });

/** Most open (not yet answered) requests a seller can have at once. */
export const MAX_OPEN_REQUESTS = 10;

export const ProductRequest = defineModel("ProductRequest", ProductRequestSchema);
export default ProductRequest;
