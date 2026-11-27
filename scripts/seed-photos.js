/**
 * Demo product photos for the seed: `npm run seed:photos`
 *
 * Photos live in /public/seed/photos as `<product-slug>-<n>.jpg` (free
 * Unsplash licence, see CREDITS.md there). They are DEMO pictures, not photos
 * of Flip Baz's own products: replace them with real ones before sellers use
 * them in their listings (Admin → Products, or drop new files in that folder).
 *
 * - `npm run seed` uses these photos automatically (SVG placeholders are only
 *   drawn for products that have none).
 * - `npm run seed:photos` swaps the photos onto the EXISTING products and
 *   categories without clearing anything. It only touches items whose images
 *   are still the seeded /seed/ placeholders, so photos you uploaded through
 *   the admin panel are never replaced.
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PHOTO_DIR = path.join(ROOT, "public", "seed", "photos");

/**
 * Photo URLs per product slug, in order (`slug-1.jpg`, `slug-2.jpg`, …).
 * @returns {Promise<Record<string, string[]>>}
 */
export async function loadSeedPhotos() {
  let files = [];
  try {
    files = await readdir(PHOTO_DIR);
  } catch {
    return {};
  }
  const bySlug = {};
  for (const f of files) {
    const m = f.match(/^([a-z0-9-]+)-(\d+)\.(jpe?g|png|webp)$/);
    if (!m) continue;
    (bySlug[m[1]] ??= []).push({ n: Number(m[2]), url: `/seed/photos/${f}` });
  }
  return Object.fromEntries(Object.entries(bySlug).map(([slug, list]) => [slug, list.sort((a, b) => a.n - b.n).map((x) => x.url)]));
}

/** True when every image is a seeded placeholder (safe to replace). */
const onlySeedImages = (images) => (images ?? []).every((u) => typeof u === "string" && u.startsWith("/seed/"));

async function main() {
  const [{ connectDB, disconnectDB, DB_NAME }, { Category, Product }, { categories, products }, { slugify }] = await Promise.all([
    import("../lib/db.js"),
    import("../lib/models/index.js"),
    import("./seed-data.js"),
    import("../lib/format.js"),
  ]);
  if (!process.env.MONGODB_URI) {
    console.error("✖ MONGODB_URI is missing. Add it to .env.local (see .env.example).");
    process.exit(1);
  }
  const photos = await loadSeedPhotos();
  console.log(`• Found photos for ${Object.keys(photos).length} products in /public/seed/photos`);

  console.log(`• Connecting to MongoDB (database "${DB_NAME}") …`);
  await connectDB();

  let updated = 0;
  for (const slug of Object.keys(photos)) {
    const p = await Product.findOne({ slug }).select("images").lean();
    if (!p || !onlySeedImages(p.images)) continue;
    await Product.updateOne({ _id: p._id }, { $set: { images: photos[slug] } });
    updated++;
  }
  console.log(`  - products updated: ${updated}`);

  let cats = 0;
  for (const c of categories) {
    const first = products.find((p) => p.category === c.slug && photos[slugify(p.title)]);
    if (!first) continue;
    const doc = await Category.findOne({ slug: c.slug }).select("image").lean();
    if (!doc || (doc.image && !doc.image.startsWith("/seed/"))) continue;
    await Category.updateOne({ _id: doc._id }, { $set: { image: photos[slugify(first.title)][0] } });
    cats++;
  }
  console.log(`  - categories updated: ${cats}`);
  await disconnectDB();
  console.log("✓ Done.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (err) => {
    console.error(`✖ ${err.name}: ${err.message}`);
    process.exitCode = 1;
  });
}
