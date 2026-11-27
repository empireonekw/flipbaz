import "server-only";
import { connectDB } from "@/lib/db";
import { Product, ProductRequest } from "@/lib/models";
import { PRODUCT_REQUEST_STATUSES, PRODUCT_REQUEST_STATUS_LABELS } from "@/lib/models/constants";
import { notify } from "@/lib/notifications";
import { serialize } from "@/lib/serialize";
import { ADMIN_PAGE_SIZE, AdminError, assertId, pageNum } from "./common";

/**
 * Admin side of sellers' custom product requests.
 */

/**
 * Requests for the admin queue, oldest open first within a status filter.
 * @param {{ status?: string, page?: number }} opts
 */
export async function listProductRequests({ status, page } = {}) {
  await connectDB();
  const where = PRODUCT_REQUEST_STATUSES.includes(status) ? { status } : {};
  const p = pageNum(page);
  const [items, total, countsAgg] = await Promise.all([
    ProductRequest.find(where)
      .sort({ createdAt: status === "OPEN" || status === "REVIEWING" ? 1 : -1 })
      .skip((p - 1) * ADMIN_PAGE_SIZE)
      .limit(ADMIN_PAGE_SIZE)
      .populate("seller", "name email phone storeName")
      .populate("category", "name")
      .populate("product", "title slug")
      .lean(),
    ProductRequest.countDocuments(where),
    ProductRequest.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  const counts = Object.fromEntries(countsAgg.map((c) => [c._id, c.n]));
  return { items: serialize(items), counts, page: p, pages: Math.ceil(total / ADMIN_PAGE_SIZE) };
}

/** Open + in-review requests (for the admin overview / nav). */
export async function openProductRequestCount() {
  await connectDB();
  return ProductRequest.countDocuments({ status: { $in: ["OPEN", "REVIEWING"] } });
}

/**
 * Set a request's status and reply, optionally linking a catalog product,
 * then tell the seller.
 * @param {{ id: string, status: string, adminReply?: string, productSlug?: string }} input  validated
 * @throws {AdminError}
 */
export async function replyToProductRequest({ id, status, adminReply, productSlug }) {
  assertId(id, "Request");
  await connectDB();
  let productId;
  if (productSlug) {
    const p = await Product.findOne({ slug: productSlug.toLowerCase() }).select("_id").lean();
    if (!p) throw new AdminError(`No product with the slug "${productSlug}".`);
    productId = p._id;
  }
  if (status === "ADDED" && !productId) throw new AdminError("Add the catalog product's slug so the seller can open it.");

  const reqDoc = await ProductRequest.findByIdAndUpdate(
    id,
    {
      $set: { status, adminReply: adminReply || undefined, repliedAt: new Date(), ...(productId ? { product: productId } : {}) },
      ...(productId ? {} : { $unset: { product: 1 } }),
    },
    { returnDocument: "after" }
  )
    .select("seller title status")
    .lean();
  if (!reqDoc) throw new AdminError("Request not found.");

  await notify(String(reqDoc.seller), {
    type: "PRODUCT_REQUEST",
    title: `Request update: ${PRODUCT_REQUEST_STATUS_LABELS[status]}`,
    body: adminReply ? `${reqDoc.title}: ${adminReply}` : reqDoc.title,
    href: "/dashboard/catalog/requests",
  });
}
