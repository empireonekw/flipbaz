import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Category, Order, Product } from "@/lib/models";
import { serialize } from "@/lib/serialize";
import { slugify } from "@/lib/format";
import { deleteStoredFile, saveImage } from "@/lib/storage";
import { ADMIN_PAGE_SIZE, AdminError, escapeRegex, pageNum } from "./common";

/** Max photos per product. */
export const MAX_PRODUCT_IMAGES = 8;

/**
 * Admin product list (includes inactive products and prices).
 * @param {{ q?: string, category?: string, status?: "active"|"inactive", page?: number }} filters
 */
export async function listProducts({ q, category, status, page } = {}) {
  await connectDB();
  const where = {};
  if (mongoose.isValidObjectId(category)) where.category = category;
  if (status === "active") where.active = true;
  if (status === "inactive") where.active = false;
  const search = (q ?? "").trim().slice(0, 60);
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    where.$or = [{ title: rx }, { sku: rx }, { slug: rx }];
  }
  const p = pageNum(page);
  const [items, total] = await Promise.all([
    Product.find(where)
      .sort({ createdAt: -1 })
      .skip((p - 1) * ADMIN_PAGE_SIZE)
      .limit(ADMIN_PAGE_SIZE)
      .populate("category", "name")
      .select("title slug sku images costPrice suggestedRetailPrice active category updatedAt")
      .lean(),
    Product.countDocuments(where),
  ]);
  return { items: serialize(items), total, page: p, pages: Math.ceil(total / ADMIN_PAGE_SIZE) };
}

/** @param {string} id */
export async function getProduct(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  return serialize(await Product.findById(id).lean());
}

/**
 * Create or update a product, including its photos.
 *
 * Photo handling: `keepImages` (in display order) are the existing photos to
 * keep; `newFiles` are uploaded and appended. Removed photos are deleted from
 * storage only after the database save succeeds.
 *
 * @param {Object} input
 * @param {string} [input.id]          omit to create
 * @param {Object} input.data          validated productSchema output
 * @param {string[]} input.keepImages  existing image URLs to keep, in order
 * @param {File[]} input.newFiles      new uploads
 * @returns {Promise<string>} product id
 * @throws {AdminError}
 */
export async function saveProduct({ id, data, keepImages = [], newFiles = [] }) {
  await connectDB();
  const existing = id ? await Product.findById(id) : null;
  if (id && !existing) throw new AdminError("Product not found.");
  if (!(await Category.exists({ _id: data.category }))) throw new AdminError("Choose a valid category.");

  const slug = data.slug || slugify(data.title);
  if (!slug) throw new AdminError("Enter a slug or a title with letters or numbers.");
  const clash = await Product.findOne({ $or: [{ slug }, { sku: data.sku }], _id: { $ne: existing?._id } }).select("slug sku").lean();
  if (clash) {
    throw new AdminError(clash.slug === slug ? `Another product already uses the slug "${slug}".` : `Another product already uses SKU ${data.sku}.`);
  }

  // Only keep URLs that really belong to this product (ignore anything injected).
  const current = existing?.images ?? [];
  const kept = keepImages.filter((u) => current.includes(u));
  const files = newFiles.filter((f) => f && typeof f.arrayBuffer === "function" && f.size > 0);
  if (kept.length + files.length > MAX_PRODUCT_IMAGES) {
    throw new AdminError(`A product can have up to ${MAX_PRODUCT_IMAGES} photos.`);
  }

  const uploaded = [];
  try {
    for (const f of files) uploaded.push(await saveImage(f, { folder: "products" }));
  } catch (err) {
    await Promise.all(uploaded.map(deleteStoredFile));
    throw err;
  }

  const doc = existing ?? new Product();
  doc.set({ ...data, slug, images: [...kept, ...uploaded] });
  try {
    await doc.save();
  } catch (err) {
    await Promise.all(uploaded.map(deleteStoredFile));
    if (err?.code === 11000) throw new AdminError("That slug or SKU is already in use.");
    throw err;
  }

  const removed = current.filter((u) => !kept.includes(u));
  await Promise.all(removed.map(deleteStoredFile));
  return String(doc._id);
}

/**
 * Flip a product's active flag.
 * @param {string} id
 * @returns {Promise<boolean>} new value
 */
export async function toggleProductActive(id) {
  await connectDB();
  const p = await Product.findById(id).select("active");
  if (!p) throw new AdminError("Product not found.");
  p.active = !p.active;
  await p.save();
  return p.active;
}

/**
 * Delete a product that has never been ordered. Ordered products should be
 * deactivated instead so order history keeps its links.
 * @param {string} id
 */
export async function deleteProduct(id) {
  await connectDB();
  const p = await Product.findById(id).select("images").lean();
  if (!p) throw new AdminError("Product not found.");
  if (await Order.exists({ "items.product": p._id })) {
    throw new AdminError("This product appears in orders. Deactivate it instead of deleting.");
  }
  await Product.deleteOne({ _id: p._id });
  await Promise.all((p.images ?? []).map(deleteStoredFile));
}
