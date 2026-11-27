import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { MAX_SAVED_PRODUCTS, Product, SavedProduct } from "@/lib/models";
import { getProductsByIds } from "@/lib/catalog";

/**
 * "My listings": the catalog products a seller has saved to sell on their
 * own store. Every function is scoped to one seller id.
 */

/** Error whose message is safe to show the seller. */
export class ListingError extends Error {}

/**
 * Ids of every product the seller has saved (for the heart/bookmark state).
 * @param {string} sellerId
 * @returns {Promise<Set<string>>}
 */
export async function getSavedProductIds(sellerId) {
  await connectDB();
  const ids = await SavedProduct.find({ seller: sellerId }).distinct("product");
  return new Set(ids.map(String));
}

/**
 * Save or unsave one product.
 * @param {string} sellerId
 * @param {string} productId
 * @param {boolean} save
 * @throws {ListingError}
 */
export async function setProductSaved(sellerId, productId, save) {
  if (!mongoose.isValidObjectId(productId)) throw new ListingError("That product doesn't exist.");
  await connectDB();
  if (!save) {
    await SavedProduct.deleteOne({ seller: sellerId, product: productId });
    return;
  }
  const [exists, count] = await Promise.all([
    Product.exists({ _id: productId, active: true }),
    SavedProduct.countDocuments({ seller: sellerId }),
  ]);
  if (!exists) throw new ListingError("That product is no longer available.");
  if (count >= MAX_SAVED_PRODUCTS) throw new ListingError(`You can save up to ${MAX_SAVED_PRODUCTS} products. Remove some first.`);
  await SavedProduct.updateOne({ seller: sellerId, product: productId }, { $setOnInsert: { seller: sellerId, product: productId } }, { upsert: true });
}

/**
 * The seller's saved products, newest first, member-aware (prices only for
 * members). Products that were deactivated since are left out.
 * @param {string} sellerId
 * @param {{ isMember: boolean }} access
 * @returns {Promise<Object[]>} products, each with `savedAt`
 */
export async function getSavedProducts(sellerId, access) {
  await connectDB();
  const saved = await SavedProduct.find({ seller: sellerId }).sort({ createdAt: -1 }).limit(MAX_SAVED_PRODUCTS).select("product createdAt").lean();
  const products = await getProductsByIds(saved.map((s) => String(s.product)), access);
  const savedAt = new Map(saved.map((s) => [String(s.product), s.createdAt.toISOString()]));
  return products.map((p) => ({ ...p, savedAt: savedAt.get(p._id) }));
}
