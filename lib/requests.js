import "server-only";
import { connectDB } from "@/lib/db";
import { MAX_OPEN_REQUESTS, ProductRequest } from "@/lib/models";
import { deleteStoredFile, saveImage } from "@/lib/storage";
import { serialize } from "@/lib/serialize";

/**
 * Seller side of "Custom requests": asking us for an item that isn't in the
 * catalog yet. Admin handling lives in lib/admin/requests.js.
 */

/** Error whose message is safe to show the seller. */
export class RequestError extends Error {}

/**
 * Create a request. The optional photo is saved to the private
 * `requests` upload folder (owner + admins only).
 * @param {string} sellerId
 * @param {{ title: string, details?: string, referenceUrl?: string, quantity?: number, targetPrice?: number }} data  validated
 * @param {File|null} photo
 * @returns {Promise<string>} new request id
 * @throws {RequestError|import("@/lib/storage").UploadError}
 */
export async function createProductRequest(sellerId, data, photo) {
  await connectDB();
  const open = await ProductRequest.countDocuments({ seller: sellerId, status: { $in: ["OPEN", "REVIEWING"] } });
  if (open >= MAX_OPEN_REQUESTS) {
    throw new RequestError(`You have ${open} requests waiting for a reply. We'll answer those first.`);
  }
  const image = photo && photo.size > 0 ? await saveImage(photo, { folder: "requests" }) : undefined;
  try {
    const doc = await ProductRequest.create({
      seller: sellerId,
      title: data.title,
      details: data.details || undefined,
      referenceUrl: data.referenceUrl || undefined,
      quantity: data.quantity,
      targetPrice: data.targetPrice,
      image,
    });
    return String(doc._id);
  } catch (err) {
    if (image) await deleteStoredFile(image);
    throw err;
  }
}

/**
 * The seller's requests, newest first, with the linked product (if added).
 * @param {string} sellerId
 * @returns {Promise<Object[]>}
 */
export async function listSellerRequests(sellerId) {
  await connectDB();
  const items = await ProductRequest.find({ seller: sellerId })
    .sort({ createdAt: -1 })
    .limit(100)
    .select("-seller -__v")
    .populate("product", "title slug active")
    .lean();
  return serialize(items);
}
