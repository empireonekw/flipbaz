@AGENTS.md

# Flip Baz: project requirements

Flip Baz is a membership-based sourcing and fulfilment platform for online sellers in
Pakistan. Products are made in Sialkot (leather goods, sportswear, boxing gear, gloves).
Sellers pay a monthly membership to see the catalog with prices, list our products on
their own stores (Daraz, Shopify, Instagram/Facebook, eBay, Etsy, Amazon) without holding
stock, and when they make a sale they place the order with us and pay for it. We make it,
quality-check it and ship it to their customer.

The model is similar to nova-bazaar.com, but ALL branding, wording, logo and design must be
original. Never copy their text or assets.

## Tech stack (hard rules)
- Next.js (App Router, v16) in **JavaScript only**: `.js` / `.jsx`. NO TypeScript, no
  `.ts/.tsx`, no `tsconfig.json`. `jsconfig.json` provides the `@/*` alias.
- Tailwind CSS v4.
- MongoDB Atlas + Mongoose. Connection string ONLY from `process.env.MONGODB_URI`
  (in `.env.local`). Never hardcode, print, log, or commit it. `lib/db.js` caches the
  connection across hot reloads / serverless invocations.
- `.gitignore` must include `.env*.local`.
- Auth: email + password (bcrypt), httpOnly cookie session holding a JWT signed with `jose`.
  Roles: `SELLER`, `ADMIN`.
- Validation: zod. Mutations via Server Actions or route handlers.
- JSDoc on key functions and models.
- Image uploads go through ONE storage helper (`lib/storage.js`): saved to `storage/uploads`
  (not /public: `next start` 404s files added to /public after build) and served by the
  `/uploads/[folder]/[name]` route; payment screenshots are owner/admin only. The module is swappable
  for Cloudinary/S3 later.
- Light/dark toggle, fully responsive, mobile-first (most users are on phones).
- Currency PKR, formatted `Rs 1,500` (`lib/format.js`).

## Models (timestamps: true on all)
- User: name, email (unique, indexed), phone, whatsapp, city, passwordHash, role
- Plan: name, months (1/3/6/12), pricePerMonth, totalPrice, isRecommended, active
- Membership: user, plan, startsAt, endsAt, status (PENDING/ACTIVE/EXPIRED)
- Payment: user, purpose (MEMBERSHIP/ORDER), amount, method (JAZZCASH/EASYPAISA/BANK_TRANSFER),
  transactionId, screenshotUrl, status (PENDING/APPROVED/REJECTED), adminNote
  (+ membership/order back-refs)
- Category: name, slug (unique), image
- Product: title, slug (unique), description, category, images[], sku, costPrice (what the
  seller pays us), suggestedRetailPrice, sizes[], colors[], processingDays, active.
  Text index on title/description. Profit estimate = suggestedRetailPrice − costPrice − shipping
- Order: seller, items[] (product, title snapshot, qty, variant, unitPrice), customerName,
  customerPhone, address, city, marketplace, marketplaceOrderRef, shippingFee, total, payment,
  status (PENDING_PAYMENT → CONFIRMED → IN_PRODUCTION → QC_PASSED → SHIPPED → DELIVERED, or
  CANCELLED), courier, trackingNumber, notes, statusHistory[] (status, note, changedBy, at)
- ContactMessage: name, email, phone, message, read

## Public pages
1. Landing: hero (sell Sialkot-made products without buying stock, in our own words), catalog
   preview (image + title + "Join to see price"), who it's for (store owners, marketplace
   sellers, social sellers, retailers), 4-step how it works (Join → List → Get an order → We
   deliver), member benefits grid, "doing it yourself vs. with Flip Baz" table, pricing, FAQ,
   contact block with WhatsApp button, footer.
2. `/catalog`: grid, category filter, search, sort. Prices, profit estimate and "download
   listing images" ONLY for active members; others see a "Join to see price" lock.
3. `/catalog/[slug]`: gallery, description, options, then (members only) cost price, suggested
   price, profit estimate, "copy listing text", "Order this for a customer".
4. `/pricing`, `/how-it-works`, `/help` (FAQ accordion), `/contact` (form saved to DB + WhatsApp
   link), `/privacy`, `/terms`, `/refund-policy` (placeholder legal text).
5. `/signup`, `/login`, forgot-password placeholder.

## Membership and payments (manual, Pakistan-style)
- After signup the seller picks a plan, sees our JazzCash/EasyPaisa/bank details (env/config),
  submits transaction ID + screenshot.
- Membership stays PENDING until an admin approves the payment; approval activates it with the
  correct end date. Clear banners for pending/expired.
- Expired members lose price visibility and ordering but keep order history.
- Payment logic lives in ONE module (`lib/payments/`) so JazzCash/EasyPaisa/Safepay APIs can be
  plugged in later.

## Seller dashboard (`/dashboard`)
Membership status, days left, renew; place order (product/variant/qty, end-customer details,
total, payment proof); orders list with status badges, filters, courier + tracking, status
timeline; profile settings.

## Admin panel (`/admin`, ADMIN only)
Stats via aggregation (active members, pending payments, orders by status, revenue this month);
products + categories CRUD with multi-image upload and active toggle; plans CRUD; payments queue
(view screenshot, approve/reject with note); members (search, view membership/orders, extend or
deactivate); orders (filter, update status → statusHistory, courier + tracking); contact inbox.

## Security / data rules
- Protect routes with proxy (Next 16's renamed middleware) AND server-side role checks.
- NEVER send member-only fields (costPrice, profit) to non-members: strip them server-side
  (`lib/catalog.js`), not just in the UI.
- Convert Mongoose docs to plain objects (`.lean()` + stringify ObjectIds, see `lib/serialize.js`)
  before passing to client components.

## Seed (`npm run seed` → `scripts/seed.js`)
1 admin (ADMIN_EMAIL/ADMIN_PASSWORD from `.env.local`), 1 demo seller with an active
membership, 4 plans (1/3/6/12 months, discounted, 3-month recommended), 4 categories, ~16
products with locally generated SVG placeholders. The seed clears and refills ONLY Flip Baz's
own collections. NEVER drop the whole database.

## Deliverables
- `.env.example` with placeholders only (MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD,
  payment account details, WhatsApp number).
- README: setup, seed, deploy (Vercel + MongoDB Atlas, incl. allowing Vercel IPs in Atlas
  Network Access).
- Clean, modern, trustworthy design with a distinctive Flip Baz identity. Accessible: labels,
  focus states, contrast.

## How we work
Build in phases: (1) models + db + seed → (2) auth → (3) public pages + catalog gating →
(4) membership/payments → (5) seller dashboard/orders → (6) admin → (7) polish.
After each phase: `npm run build` and `npm run lint`, fix all errors, `git commit`, then STOP
and wait for the user to say "continue".
Final step: test full flow (sign up → choose plan → submit payment → admin approves → seller
sees prices → places order → admin moves to SHIPPED with tracking → seller sees it) and report
anything unfinished.

## Folder structure
```
app/
  (public)/            landing, catalog, pricing, how-it-works, help, contact, legal pages
  (auth)/              login, signup, forgot-password
  dashboard/           seller area (membership, orders, new order, profile)
  admin/               admin panel (stats, products, categories, plans, payments, members, orders, messages)
  api/                 route handlers (uploads, image downloads) where Server Actions don't fit
components/            UI building blocks (ui/, layout/, catalog/, admin/, dashboard/)
lib/
  db.js                cached Mongoose connection
  models/              Mongoose models (one file each) + index.js
  auth/                session (jose JWT cookie), password hashing, guards
  payments/            payment provider abstraction (manual now, gateways later)
  storage.js           upload helper (local disk now, S3/Cloudinary later)
  catalog.js           member-aware product queries/field stripping
  config.js            site + payment account config from env
  format.js            PKR + date formatting
  serialize.js         lean doc → plain JSON
  validators/          zod schemas
scripts/seed.js        seed script
storage/uploads/       uploaded images, served by app/uploads/[folder]/[name] (payments private)
public/seed/           seeded placeholder images (committed)
proxy.js               route protection (Next 16 "proxy", formerly middleware)
```
