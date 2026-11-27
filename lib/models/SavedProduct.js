import mongoose from "mongoose";
import { defineModel } from "./define.js";

const { Schema } = mongoose;

/**
 * A catalog product a seller has saved to "My listings": the shortlist of
 * items they list (or plan to list) on their own store.
 *
 * @typedef {Object} SavedProduct
 * @property {import("mongoose").Types.ObjectId} seller
 * @property {import("mongoose").Types.ObjectId} product
 */
const SavedProductSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true }
);

SavedProductSchema.index({ seller: 1, product: 1 }, { unique: true });
SavedProductSchema.index({ seller: 1, createdAt: -1 });

/** Most products one seller can keep in My listings. */
export const MAX_SAVED_PRODUCTS = 500;

export const SavedProduct = defineModel("SavedProduct", SavedProductSchema);
export default SavedProduct;
