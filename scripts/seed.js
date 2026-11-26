/**
 * Flip Baz seed script: `npm run seed`
 *
 * Clears and refills ONLY Flip Baz's own collections (the models below), in
 * Flip Baz's own database (MONGODB_DB, default "flipbaz"). It never drops a
 * database, and it REFUSES to run if that database contains any collection
 * Flip Baz doesn't own (see seed-guard.js), so another app's data can't be hit.
 *
 * Reads from .env.local (loaded by `node --env-file-if-exists`):
 *   MONGODB_URI, MONGODB_DB (optional), ADMIN_EMAIL, ADMIN_PASSWORD,
 *   DEMO_SELLER_EMAIL, DEMO_SELLER_PASSWORD (optional demo seller login)
 *
 * Also writes SVG placeholder images to /public/seed.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mongoose from "mongoose";
import { connectDB, disconnectDB, DB_NAME } from "../lib/db.js";
import { findForeignCollections } from "./seed-guard.js";
import { hashPassword } from "../lib/auth/password.js";
import { slugify } from "../lib/format.js";
import { computeOrderTotals } from "../lib/pricing.js";
import {
  User,
  Plan,
  Membership,
  Payment,
  Category,
  Product,
  Order,
  ContactMessage,
  Notification,
  LiveSession,
  Conversation,
  ChatMessage,
  SecurityBlock,
  addMonths,
  generateOrderNumber,
} from "../lib/models/index.js";
import { productSvg } from "./placeholders.js";
import { plans, categories, products } from "./seed-data.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEED_DIR = path.join(ROOT, "public", "seed");

/** Every collection the seed owns. Nothing outside this list is touched. */
const OWNED_MODELS = [
  User, Plan, Membership, Payment, Category, Product, Order, ContactMessage,
  Notification, LiveSession, Conversation, ChatMessage, SecurityBlock,
];

/** Read a required env var or exit with a helpful message (never prints values). */
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`✖ ${name} is missing. Add it to .env.local (see .env.example).`);
    process.exit(1);
  }
  return value;
}

/** Slightly shift a hex colour lighter/darker so gallery images differ. */
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amount);
  const g = clamp(((n >> 8) & 0xff) + amount);
  const b = clamp((n & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Write SVG placeholders and return their public URLs. */
async function writeImages() {
  await mkdir(path.join(SEED_DIR, "categories"), { recursive: true });
  await mkdir(path.join(SEED_DIR, "products"), { recursive: true });

  const categoryImages = {};
  for (const c of categories) {
    const file = `categories/${c.slug}.svg`;
    await writeFile(
      path.join(SEED_DIR, file),
      productSvg({ glyph: c.glyph, colors: c.colors, label: c.name, sublabel: "Made in Sialkot" })
    );
    categoryImages[c.slug] = `/seed/${file}`;
  }

  const productImages = {};
  for (const p of products) {
    const slug = slugify(p.title);
    const cat = categories.find((c) => c.slug === p.category);
    const urls = [];
    const variants = [0, 28, -28];
    for (let i = 0; i < variants.length; i++) {
      const file = `products/${slug}-${i + 1}.svg`;
      const colors = [shade(cat.colors[0], variants[i]), shade(cat.colors[1], variants[i])];
      await writeFile(
        path.join(SEED_DIR, file),
        productSvg({
          glyph: p.glyph,
          colors,
          label: p.title,
          sublabel: i === 0 ? "Flip Baz sample" : `View ${i + 1}`,
        })
      );
      urls.push(`/seed/${file}`);
    }
    productImages[slug] = urls;
  }
  return { categoryImages, productImages };
}

async function main() {
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
    console.error("✖ Refusing to seed with NODE_ENV=production. Pass --force if you really mean it.");
    process.exit(1);
  }

  console.log("• Writing placeholder images to /public/seed …");
  const { categoryImages, productImages } = await writeImages();

  requireEnv("MONGODB_URI");
  const adminEmail = requireEnv("ADMIN_EMAIL").toLowerCase();
  const adminPassword = requireEnv("ADMIN_PASSWORD");
  if (adminPassword.length < 8) {
    console.error("✖ ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }
  const sellerEmail = (process.env.DEMO_SELLER_EMAIL || "seller@flipbaz.test").toLowerCase();
  const sellerPassword = process.env.DEMO_SELLER_PASSWORD;
  if (!sellerPassword || sellerPassword.length < 8) {
    console.error("✖ DEMO_SELLER_PASSWORD must be set (8+ characters) in .env.local.");
    process.exit(1);
  }

  console.log(`• Connecting to MongoDB (database "${DB_NAME}") …`);
  await connectDB();

  const foreign = await findForeignCollections(
    mongoose.connection.db,
    OWNED_MODELS.map((M) => M.collection.collectionName)
  );
  if (foreign.length) {
    console.error(`✖ Database "${DB_NAME}" also contains collections Flip Baz doesn't own:`);
    console.error(`    ${foreign.join(", ")}`);
    console.error("  It looks shared with another app, so nothing was changed.");
    console.error("  Set MONGODB_DB in .env.local to a database used only by Flip Baz (e.g. flipbaz).");
    process.exitCode = 1;
    return;
  }

  console.log("• Clearing Flip Baz collections (database itself is kept) …");
  for (const Model of OWNED_MODELS) {
    const { deletedCount } = await Model.deleteMany({});
    console.log(`  - ${Model.collection.collectionName}: removed ${deletedCount}`);
  }
  // Make sure unique/text indexes exist before inserting.
  await Promise.all(OWNED_MODELS.map((M) => M.createIndexes()));

  console.log("• Creating users …");
  const [admin, seller] = await User.create([
    {
      name: "Flip Baz Admin",
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      role: "ADMIN",
      city: "Sialkot",
    },
    {
      name: "Ayesha Demo Seller",
      email: sellerEmail,
      passwordHash: await hashPassword(sellerPassword),
      role: "SELLER",
      phone: "03001234567",
      whatsapp: "03001234567",
      city: "Lahore",
    },
  ]);

  console.log("• Creating plans …");
  const planDocs = await Plan.insertMany(plans.map((p) => ({ ...p, active: true })));

  console.log("• Creating categories …");
  const categoryDocs = await Category.insertMany(
    categories.map(({ name, slug, description, sortOrder }) => ({
      name,
      slug,
      description,
      sortOrder,
      image: categoryImages[slug],
    }))
  );
  const categoryBySlug = Object.fromEntries(categoryDocs.map((c) => [c.slug, c]));

  console.log("• Creating products …");
  const productDocs = await Product.insertMany(
    products.map((p) => {
      const slug = slugify(p.title);
      return {
        title: p.title,
        slug,
        description: p.description,
        category: categoryBySlug[p.category]._id,
        images: productImages[slug],
        sku: p.sku,
        costPrice: p.costPrice,
        suggestedRetailPrice: p.suggestedRetailPrice,
        sizes: p.sizes,
        colors: p.colors,
        processingDays: p.processingDays,
        active: true,
      };
    })
  );

  console.log("• Giving the demo seller an active membership …");
  const quarterly = planDocs.find((p) => p.months === 3);
  const startsAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const membership = await Membership.create({
    user: seller._id,
    plan: quarterly._id,
    planSnapshot: {
      name: quarterly.name,
      months: quarterly.months,
      totalPrice: quarterly.totalPrice,
    },
    startsAt,
    endsAt: addMonths(startsAt, quarterly.months),
    status: "ACTIVE",
  });
  const membershipPayment = await Payment.create({
    user: seller._id,
    purpose: "MEMBERSHIP",
    amount: quarterly.totalPrice,
    method: "JAZZCASH",
    transactionId: "DEMO-JC-000001",
    status: "APPROVED",
    adminNote: "Seeded demo payment",
    membership: membership._id,
    reviewedBy: admin._id,
    reviewedAt: startsAt,
  });
  membership.payment = membershipPayment._id;
  await membership.save();

  console.log("• Creating a sample shipped order …");
  const gloves = productDocs.find((p) => p.sku === "FB-BX-001");
  const items = [
    {
      product: gloves._id,
      title: gloves.title,
      sku: gloves.sku,
      image: gloves.images[0],
      qty: 1,
      variant: { size: "12 oz", color: "Red" },
      unitPrice: gloves.costPrice,
    },
  ];
  const totals = computeOrderTotals(items);
  const placedAt = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const order = await Order.create({
    orderNumber: generateOrderNumber(placedAt),
    seller: seller._id,
    items,
    customerName: "Bilal Ahmed",
    customerPhone: "03211234567",
    address: "House 12, Street 4, Gulberg III",
    city: "Lahore",
    marketplace: "Daraz",
    marketplaceOrderRef: "DZ-889120",
    ...totals,
    status: "SHIPPED",
    courier: "TCS",
    trackingNumber: "TCS7700123456",
    statusHistory: [
      { status: "PENDING_PAYMENT", note: "Order placed", changedBy: seller._id, at: placedAt },
      { status: "CONFIRMED", note: "Payment approved", changedBy: admin._id, at: new Date(placedAt.getTime() + 3600e3) },
      { status: "IN_PRODUCTION", changedBy: admin._id, at: new Date(placedAt.getTime() + 86400e3) },
      { status: "QC_PASSED", note: "Stitching and padding checked", changedBy: admin._id, at: new Date(placedAt.getTime() + 4 * 86400e3) },
      { status: "SHIPPED", note: "Handed to TCS", changedBy: admin._id, at: new Date(placedAt.getTime() + 5 * 86400e3) },
    ],
    createdAt: placedAt,
  });
  const orderPayment = await Payment.create({
    user: seller._id,
    purpose: "ORDER",
    amount: totals.total,
    method: "EASYPAISA",
    transactionId: "DEMO-EP-000002",
    status: "APPROVED",
    order: order._id,
    reviewedBy: admin._id,
    reviewedAt: new Date(placedAt.getTime() + 3600e3),
  });
  order.payment = orderPayment._id;
  await order.save();

  await ContactMessage.create({
    name: "Hamza Khan",
    email: "hamza@example.com",
    phone: "03331234567",
    message: "Do you offer custom logo printing on football kits for a club order of 40 sets?",
  });

  console.log("\n✔ Seed complete");
  console.log(`  users: 2 (admin + demo seller)  plans: ${planDocs.length}`);
  console.log(`  categories: ${categoryDocs.length}  products: ${productDocs.length}  orders: 1`);
  console.log("  Log in with ADMIN_EMAIL / DEMO_SELLER_EMAIL and the passwords in .env.local.");
}

main()
  .catch((err) => {
    console.error("✖ Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
