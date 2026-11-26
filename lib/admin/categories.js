import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Category, Product } from "@/lib/models";
import { serialize } from "@/lib/serialize";
import { slugify } from "@/lib/format";
import { deleteStoredFile, saveImage } from "@/lib/storage";
import { AdminError } from "./common";

/** All categories with how many products each has. */
export async function listCategoriesWithCounts() {
  await connectDB();
  const [cats, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, name: 1 }).lean(),
    Product.aggregate([{ $group: { _id: "$category", total: { $sum: 1 }, active: { $sum: { $cond: ["$active", 1, 0] } } } }]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c]));
  return serialize(cats.map((c) => ({ ...c, productCount: byId.get(String(c._id))?.total ?? 0, activeCount: byId.get(String(c._id))?.active ?? 0 })));
}

/** @param {string} id */
export async function getCategory(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  return serialize(await Category.findById(id).lean());
}

/**
 * Create or update a category.
 * @param {{ id?: string, data: Object, imageFile?: File, removeImage?: boolean }} input
 * @returns {Promise<string>}
 */
export async function saveCategory({ id, data, imageFile, removeImage = false }) {
  await connectDB();
  const existing = id ? await Category.findById(id) : null;
  if (id && !existing) throw new AdminError("Category not found.");
  const slug = data.slug || slugify(data.name);
  if (!slug) throw new AdminError("Enter a slug or a name with letters or numbers.");
  if (await Category.exists({ slug, _id: { $ne: existing?._id } })) throw new AdminError(`Another category already uses the slug "${slug}".`);

  const hasFile = imageFile && typeof imageFile.arrayBuffer === "function" && imageFile.size > 0;
  const uploaded = hasFile ? await saveImage(imageFile, { folder: "categories" }) : null;
  const oldImage = existing?.image;

  const doc = existing ?? new Category();
  doc.set({ ...data, slug, image: uploaded ?? (removeImage ? undefined : oldImage) });
  try {
    await doc.save();
  } catch (err) {
    if (uploaded) await deleteStoredFile(uploaded);
    if (err?.code === 11000) throw new AdminError("That slug is already in use.");
    throw err;
  }
  if (oldImage && (uploaded || removeImage)) await deleteStoredFile(oldImage);
  return String(doc._id);
}

/**
 * Delete an empty category.
 * @param {string} id
 */
export async function deleteCategory(id) {
  await connectDB();
  const cat = await Category.findById(id).lean();
  if (!cat) throw new AdminError("Category not found.");
  const n = await Product.countDocuments({ category: cat._id });
  if (n) throw new AdminError(`Move or delete its ${n} product${n === 1 ? "" : "s"} first.`);
  await Category.deleteOne({ _id: cat._id });
  if (cat.image) await deleteStoredFile(cat.image);
}
