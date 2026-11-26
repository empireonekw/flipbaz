import { zipSync } from "fflate";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models";
import { getMemberAccess } from "@/lib/membership";
import { LIMITS } from "@/lib/security/config";
import { hit } from "@/lib/security/limiter";

/** Max total zip size we'll build in memory (25 MB). */
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;

/**
 * Fetch one image by URL. Relative URLs resolve against this site, so this
 * works the same for /public files, local uploads and (later) CDN URLs, and on
 * hosts where /public isn't on the server's disk (e.g. Vercel).
 * @param {string} url
 * @param {string} origin
 * @returns {Promise<{ bytes: Uint8Array, ext: string } | null>}
 */
async function fetchImage(url, origin) {
  if (typeof url !== "string" || !(url.startsWith("/") || url.startsWith("https://"))) return null;
  try {
    const target = new URL(url, origin);
    const res = await fetch(target, { cache: "no-store" });
    if (!res.ok) return null;
    const ext = (target.pathname.match(/\.(svg|jpe?g|png|webp|gif)$/i)?.[0] ?? ".jpg").toLowerCase();
    return { bytes: new Uint8Array(await res.arrayBuffer()), ext };
  } catch {
    return null;
  }
}

/**
 * GET /api/listing-images/[slug]
 * Zip of a product's listing photos. Active members and admins only.
 */
export async function GET(request, { params }) {
  const { slug } = await params;
  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
    return Response.json({ error: "Product not found." }, { status: 404 });
  }
  const access = await getMemberAccess();
  if (!access.user) {
    return Response.json({ error: "Please log in." }, { status: 401 });
  }
  if (!access.isMember) {
    return Response.json({ error: "An active membership is required to download listing images." }, { status: 403 });
  }

  const limit = hit(`zip:${access.user.id}`, LIMITS.listingDownload);
  if (!limit.ok) {
    return Response.json(
      { error: "Too many downloads. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  await connectDB();
  const product = await Product.findOne({ slug, active: true }).select("slug images").lean();
  if (!product) return Response.json({ error: "Product not found." }, { status: 404 });

  const origin = new URL(request.url).origin;
  const images = await Promise.all((product.images ?? []).map((url) => fetchImage(url, origin)));

  const files = {};
  let total = 0;
  images.forEach((img, i) => {
    if (!img || total + img.bytes.length > MAX_TOTAL_BYTES) return;
    total += img.bytes.length;
    files[`${product.slug}-${i + 1}${img.ext}`] = img.bytes;
  });
  if (!Object.keys(files).length) {
    return Response.json({ error: "This product has no images yet." }, { status: 404 });
  }

  // Photos are already compressed, so store them without re-compressing.
  const zip = zipSync(files, { level: 0 });
  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${product.slug}-images.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
