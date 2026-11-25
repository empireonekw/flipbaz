import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * A Sialkot-made product sellers can list on their own stores.
 *
 * MEMBER-ONLY FIELDS: `costPrice` (and anything derived from it, like profit)
 * must never reach non-members. Use the helpers in `lib/catalog.js`, which
 * strip these fields server-side, rather than querying this model directly in
 * public pages.
 *
 * @typedef {Object} Product
 * @property {string} title
 * @property {string} slug                 unique
 * @property {string} description
 * @property {import("mongoose").Types.ObjectId} category
 * @property {string[]} images             storage URLs, first one is the cover
 * @property {string} sku                  unique
 * @property {number} costPrice            PKR the seller pays Flip Baz (MEMBER-ONLY)
 * @property {number} suggestedRetailPrice PKR we suggest the seller lists it at
 * @property {string[]} sizes
 * @property {string[]} colors
 * @property {number} processingDays       days to make + QC before dispatch
 * @property {boolean} active              hidden from the catalog when false
 */
const ProductSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    images: { type: [String], default: [] },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    costPrice: { type: Number, required: true, min: 0 },
    suggestedRetailPrice: { type: Number, required: true, min: 0 },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    processingDays: { type: Number, default: 3, min: 0, max: 60 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ProductSchema.index(
  { title: "text", description: "text" },
  { weights: { title: 5, description: 1 }, name: "product_text" }
);
ProductSchema.index({ active: 1, category: 1, createdAt: -1 });

/** Fields that only active members (and admins) may see. */
export const MEMBER_ONLY_PRODUCT_FIELDS = Object.freeze(["costPrice"]);

export const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export default Product;
