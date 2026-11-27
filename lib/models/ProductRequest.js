import mongoose from "mongoose";
import { defineModel } from "./define.js";
import { PRODUCT_REQUEST_STATUSES, REQUEST_SHIPPING_MODES, SHIP_TO_COUNTRIES } from "./constants.js";

const { Schema } = mongoose;

/**
 * A seller asking us to make or source an item that isn't in the catalog
 * yet ("Custom requests"). An admin reviews it, replies with a quote, and can
 * link the catalog product once it's added.
 *
 * @typedef {Object} ProductRequest
 * @property {import("mongoose").Types.ObjectId} seller
 * @property {string[]} images           /uploads/requests/… (private: owner + admins), 1–5
 * @property {string} title              what they want
 * @property {string} [details]          material, colour, lining, stitching…
 * @property {import("mongoose").Types.ObjectId} [category]  null = "not sure"
 * @property {string} [variants]         sizes / colours needed
 * @property {"FLIPBAZ"|"SELF"} shipping who ships to the buyer
 * @property {string} shipTo             buyer country
 * @property {string} [referenceUrl]     link to a similar listing
 * @property {string} [notes]            quantity, deadline…
 * @property {"OPEN"|"REVIEWING"|"ADDED"|"DECLINED"} status
 * @property {string} [adminReply]
 * @property {import("mongoose").Types.ObjectId} [product]  catalog product, when ADDED
 * @property {Date} [repliedAt]
 */
const ProductRequestSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    images: { type: [{ type: String, trim: true, maxlength: 200 }], default: [] },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    details: { type: String, trim: true, maxlength: 1000 },
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    variants: { type: String, trim: true, maxlength: 200 },
    shipping: { type: String, enum: REQUEST_SHIPPING_MODES, default: "FLIPBAZ" },
    shipTo: { type: String, enum: SHIP_TO_COUNTRIES },
    referenceUrl: { type: String, trim: true, maxlength: 500 },
    notes: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: PRODUCT_REQUEST_STATUSES, default: "OPEN", index: true },
    adminReply: { type: String, trim: true, maxlength: 500 },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    repliedAt: Date,
  },
  { timestamps: true }
);

ProductRequestSchema.index({ seller: 1, createdAt: -1 });
ProductRequestSchema.index({ status: 1, createdAt: -1 });
ProductRequestSchema.index({ images: 1 });

/** Most open (not yet answered) requests a seller can have at once. */
export const MAX_OPEN_REQUESTS = 10;

export const ProductRequest = defineModel("ProductRequest", ProductRequestSchema);
export default ProductRequest;
