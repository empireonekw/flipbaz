import "server-only";
import { connection } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Category, Plan, Product } from "@/lib/models";
import { serialize } from "@/lib/serialize";
import { estimateProfit } from "@/lib/pricing";

/**
 * Member-aware catalog queries.
 *
 * SECURITY: non-members must never receive prices. Instead of fetching full
 * documents and hiding fields in the UI, the MongoDB projection itself leaves
 * out `costPrice` and `suggestedRetailPrice` unless `isMember` is true, so the
 * data never leaves the database for a guest.
 *
 * Each loader calls `connection()` first so it always runs at request time
 * (never during `next build`), which keeps builds independent of the database.
 */

const PUBLIC_FIELDS = "title slug description category images sku sizes colors processingDays createdAt";
const MEMBER_FIELDS = `${PUBLIC_FIELDS} costPrice suggestedRetailPrice`;

export const PAGE_SIZE = 12;

/** Sort options. Price sorts are only honoured for members. */
export const SORTS = {
  newest: { label: "Newest", sort: { createdAt: -1 }, memberOnly: false },
  name: { label: "Name (A–Z)", sort: { title: 1 }, memberOnly: false },
  "price-asc": { label: "Price: low to high", sort: { costPrice: 1 }, memberOnly: true },
  "price-desc": { label: "Price: high to low", sort: { costPrice: -1 }, memberOnly: true },
  profit: { label: "Highest profit", sort: null, memberOnly: true },
};

/**
 * Shape a lean product for the client, adding profit for members only.
 * @param {Object} p lean product
 * @param {boolean} isMember
 */
function shapeProduct(p, isMember) {
  const out = serialize(p);
  if (isMember) {
    out.profit = estimateProfit(p);
  } else {
    // Belt and braces: strip even if a caller passed a wider projection.
    delete out.costPrice;
    delete out.suggestedRetailPrice;
  }
  return out;
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * All categories, in display order.
 * @returns {Promise<Object[]>}
 */
export async function listCategories() {
  await connection();
  await connectDB();
  const cats = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  return serialize(cats);
}

/**
 * Paginated, filtered catalog listing.
 * @param {Object} params
 * @param {string} [params.category] category slug
 * @param {string} [params.q]        search text
 * @param {string} [params.sort]     key of SORTS
 * @param {number} [params.page]     1-based
 * @param {{ isMember: boolean }} access
 * @returns {Promise<{ items: Object[], total: number, page: number, pages: number, sort: string }>}
 */
export async function listProducts({ category, q, sort, page = 1 } = {}, { isMember }) {
  await connection();
  await connectDB();

  const filter = { active: true };
  if (category) {
    const cat = await Category.findOne({ slug: category }).select("_id").lean();
    if (!cat) return { items: [], total: 0, page: 1, pages: 0, sort: "newest" };
    filter.category = cat._id;
  }

  const sortKey = SORTS[sort] && (!SORTS[sort].memberOnly || isMember) ? sort : "newest";
  const fields = isMember ? MEMBER_FIELDS : PUBLIC_FIELDS;
  const search = (q ?? "").trim().slice(0, 80);
  const pageNum = Math.max(1, Math.floor(Number(page)) || 1);

  // Full-text search first; fall back to a prefix/substring title match so
  // partial words like "glov" still find something.
  let textFilter = null;
  if (search) {
    const textCount = await Product.countDocuments({ ...filter, $text: { $search: search } });
    textFilter = textCount > 0
      ? { $text: { $search: search } }
      : { title: { $regex: escapeRegex(search), $options: "i" } };
  }
  const where = { ...filter, ...(textFilter ?? {}) };
  const total = await Product.countDocuments(where);
  const pages = Math.ceil(total / PAGE_SIZE);
  const skip = (Math.min(pageNum, Math.max(pages, 1)) - 1) * PAGE_SIZE;

  let items;
  if (sortKey === "profit") {
    items = await Product.aggregate([
      { $match: where },
      { $addFields: { _profit: { $subtract: ["$suggestedRetailPrice", "$costPrice"] } } },
      { $sort: { _profit: -1, _id: 1 } },
      { $skip: skip },
      { $limit: PAGE_SIZE },
      { $project: Object.fromEntries(fields.split(" ").map((f) => [f, 1])) },
    ]);
  } else {
    const sortSpec = where.$text && sortKey === "newest"
      ? { score: { $meta: "textScore" }, createdAt: -1 }
      : { ...SORTS[sortKey].sort, _id: 1 };
    items = await Product.find(where).select(fields).sort(sortSpec).skip(skip).limit(PAGE_SIZE).lean();
  }

  return {
    items: items.map((p) => shapeProduct(p, isMember)),
    total,
    page: Math.min(pageNum, Math.max(pages, 1)),
    pages,
    sort: sortKey,
  };
}

/**
 * One active product with its category.
 * @param {string} slug
 * @param {{ isMember: boolean }} access
 * @returns {Promise<Object|null>}
 */
export async function getProductBySlug(slug, { isMember }) {
  await connection();
  await connectDB();
  if (typeof slug !== "string" || slug.length > 120) return null;
  const p = await Product.findOne({ slug, active: true })
    .select(isMember ? MEMBER_FIELDS : PUBLIC_FIELDS)
    .populate("category", "name slug")
    .lean();
  return p ? shapeProduct(p, isMember) : null;
}

/**
 * Products from the same category ("more like this"), member-aware.
 * @param {string} categoryId
 * @param {string} excludeId
 * @param {{ isMember: boolean }} access
 * @param {number} [limit]
 */
export async function getRelatedProducts(categoryId, excludeId, { isMember }, limit = 4) {
  await connection();
  await connectDB();
  if (!mongoose.isValidObjectId(categoryId)) return [];
  const items = await Product.find({ active: true, category: categoryId, _id: { $ne: excludeId } })
    .select(isMember ? MEMBER_FIELDS : PUBLIC_FIELDS)
    .limit(limit)
    .lean();
  return items.map((p) => shapeProduct(p, isMember));
}

/**
 * A spread of products for the landing page preview: never includes prices.
 * @param {number} [limit]
 */
export async function getPreviewProducts(limit = 8) {
  await connection();
  await connectDB();
  const items = await Product.find({ active: true })
    .select(PUBLIC_FIELDS)
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return serialize(items);
}

/**
 * Active membership plans, shortest first. Plan prices are public.
 * @returns {Promise<Object[]>}
 */
export async function getActivePlans() {
  await connection();
  await connectDB();
  const plans = await Plan.find({ active: true }).sort({ months: 1 }).lean();
  return serialize(plans);
}
