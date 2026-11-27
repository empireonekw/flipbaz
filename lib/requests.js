import "server-only";
import { connectDB } from "@/lib/db";
import { Category, MAX_OPEN_REQUESTS, ProductRequest } from "@/lib/models";
import { MAX_REQUEST_PHOTOS } from "@/lib/models/constants";
import { deleteStoredFile, saveImage } from "@/lib/storage";
import { serialize } from "@/lib/serialize";

/**
 * Seller side of "Custom requests": asking us for an item that isn't in the
 * catalog yet. Admin handling lives in lib/admin/requests.js.
 */

/** Error whose message is safe to show the seller. */
export class RequestError extends Error {}

/**
 * Create a request. Photos are saved to the private `requests` upload
 * folder (owner + admins only); if anything fails, saved photos are removed.
 * @param {string} sellerId
 * @param {import("zod").infer<typeof import("@/lib/validators/request").productRequestSchema>} data  validated
 * @param {File[]} photos  1–MAX_REQUEST_PHOTOS image files
 * @returns {Promise<string>} new request id
 * @throws {RequestError|import("@/lib/storage").UploadError}
 */
export async function createProductRequest(sellerId, data, photos) {
  const files = photos.filter((f) => f && f.size > 0);
  if (!files.length) throw new RequestError("Add at least one photo so our team can see what you mean.");
  if (files.length > MAX_REQUEST_PHOTOS) throw new RequestError(`Add up to ${MAX_REQUEST_PHOTOS} photos.`);

  await connectDB();
  const open = await ProductRequest.countDocuments({ seller: sellerId, status: { $in: ["OPEN", "REVIEWING"] } });
  if (open >= MAX_OPEN_REQUESTS) {
    throw new RequestError(`You have ${open} requests waiting for a reply. We'll answer those first.`);
  }
  if (data.categoryId && !(await Category.exists({ _id: data.categoryId }))) {
    throw new RequestError("That category doesn't exist any more. Please choose another.");
  }

  const images = [];
  try {
    for (const file of files) images.push(await saveImage(file, { folder: "requests" }));
    const doc = await ProductRequest.create({
      seller: sellerId,
      images,
      title: data.title,
      details: data.details || undefined,
      category: data.categoryId || undefined,
      variants: data.variants || undefined,
      shipping: data.shipping,
      shipTo: data.shipTo,
      referenceUrl: data.referenceUrl || undefined,
      notes: data.notes || undefined,
    });
    return String(doc._id);
  } catch (err) {
    await Promise.all(images.map((url) => deleteStoredFile(url)));
    throw err;
  }
}

/**
 * The seller's requests, newest first, with category and linked product.
 * @param {string} sellerId
 * @returns {Promise<Object[]>}
 */
export async function listSellerRequests(sellerId) {
  await connectDB();
  const items = await ProductRequest.find({ seller: sellerId })
    .sort({ createdAt: -1 })
    .limit(100)
    .select("-seller -__v")
    .populate("category", "name")
    .populate("product", "title slug active")
    .lean();
  return serialize(items);
}
