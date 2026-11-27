/**
 * Enum values shared by models, validators and UI.
 * Plain data only, so this file is safe to import from client components.
 */

/** @type {readonly ["SELLER", "ADMIN"]} */
export const ROLES = Object.freeze(["SELLER", "ADMIN"]);

/** @type {readonly ["PENDING", "ACTIVE", "EXPIRED"]} */
export const MEMBERSHIP_STATUSES = Object.freeze(["PENDING", "ACTIVE", "EXPIRED"]);

/** @type {readonly ["MEMBERSHIP", "ORDER"]} */
export const PAYMENT_PURPOSES = Object.freeze(["MEMBERSHIP", "ORDER"]);

/** @type {readonly ["JAZZCASH", "EASYPAISA", "BANK_TRANSFER"]} */
export const PAYMENT_METHODS = Object.freeze(["JAZZCASH", "EASYPAISA", "BANK_TRANSFER"]);

/** @type {readonly ["PENDING", "APPROVED", "REJECTED"]} */
export const PAYMENT_STATUSES = Object.freeze(["PENDING", "APPROVED", "REJECTED"]);

/** Allowed plan lengths in months. */
export const PLAN_MONTHS = Object.freeze([1, 3, 6, 12]);

/**
 * Order lifecycle. The happy path is the array order; CANCELLED can be reached
 * from any status before SHIPPED.
 */
export const ORDER_STATUSES = Object.freeze([
  "PENDING_PAYMENT",
  "CONFIRMED",
  "IN_PRODUCTION",
  "QC_PASSED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

/** Human labels for order statuses. */
export const ORDER_STATUS_LABELS = Object.freeze({
  PENDING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  IN_PRODUCTION: "In production",
  QC_PASSED: "Quality checked",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
});

/** Where a seller made the sale. */
export const MARKETPLACES = Object.freeze([
  "Daraz",
  "Shopify",
  "Instagram",
  "Facebook",
  "WhatsApp",
  "eBay",
  "Etsy",
  "Amazon",
  "Other",
]);

/** Where sellers can say they sell (profile + launch checklist). */
export const SELLING_PLATFORMS = Object.freeze(["Daraz", "Shopify", "Instagram", "Facebook", "WhatsApp", "TikTok Shop", "eBay", "Etsy", "Amazon", "Own website"]);

/** Custom product request lifecycle. */
export const PRODUCT_REQUEST_STATUSES = Object.freeze(["OPEN", "REVIEWING", "ADDED", "DECLINED"]);

/** Human labels for custom request statuses. */
export const PRODUCT_REQUEST_STATUS_LABELS = Object.freeze({
  OPEN: "Submitted",
  REVIEWING: "In review",
  ADDED: "Added to catalog",
  DECLINED: "Not possible",
});

/** Who ships a custom-request item to the buyer. */
export const REQUEST_SHIPPING_MODES = Object.freeze(["FLIPBAZ", "SELF"]);

/** Labels for REQUEST_SHIPPING_MODES. */
export const REQUEST_SHIPPING_LABELS = Object.freeze({
  FLIPBAZ: "Flip Baz ships it",
  SELF: "I'll arrange shipping",
});

/** Where a seller's buyers usually are (custom requests "Ship to"). */
export const SHIP_TO_COUNTRIES = Object.freeze([
  "Pakistan",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Germany",
  "France",
  "Italy",
  "Netherlands",
  "Other",
]);

/** Most photos on one custom request. */
export const MAX_REQUEST_PHOTOS = 5;

/* ---------- Services: store management ---------- */

/** Marketplaces we can run for a seller. */
export const MANAGED_PLATFORMS = Object.freeze(["ETSY", "EBAY", "WALMART", "TIKTOK", "INSTAGRAM"]);

/** Labels for MANAGED_PLATFORMS. */
export const MANAGED_PLATFORM_LABELS = Object.freeze({
  ETSY: "Etsy",
  EBAY: "eBay",
  WALMART: "Walmart",
  TIKTOK: "TikTok Shop",
  INSTAGRAM: "Instagram",
});

/** Does the seller already have an account on that platform? */
export const PLATFORM_ACCOUNT_STATES = Object.freeze(["ACTIVE", "NEW", "NONE"]);
export const PLATFORM_ACCOUNT_LABELS = Object.freeze({
  ACTIVE: "Yes, it's selling",
  NEW: "Yes, but new or not selling yet",
  NONE: "No, please set one up",
});

/** Store-management application lifecycle. */
export const SERVICE_STATUSES = Object.freeze(["SUBMITTED", "MEETING_SCHEDULED", "QUOTE_READY", "ACTIVE", "DECLINED", "WITHDRAWN"]);
export const SERVICE_STATUS_LABELS = Object.freeze({
  SUBMITTED: "Under review",
  MEETING_SCHEDULED: "Meeting scheduled",
  QUOTE_READY: "Quote ready",
  ACTIVE: "Active",
  DECLINED: "Not a fit right now",
  WITHDRAWN: "Withdrawn",
});
/** Statuses that still count as an open application. */
export const SERVICE_OPEN_STATUSES = Object.freeze(["SUBMITTED", "MEETING_SCHEDULED", "QUOTE_READY"]);

export const SERVICE_CONTACT_METHODS = Object.freeze(["WhatsApp", "Phone call", "Email"]);
export const SERVICE_EXPERIENCE = Object.freeze(["New, no sales yet", "Less than 6 months", "6 to 12 months", "1 to 3 years", "More than 3 years"]);
export const SERVICE_SELLER_TYPES = Object.freeze(["Individual / personal seller", "Small business", "Brand or manufacturer", "Agency / reseller"]);
export const SERVICE_BUDGETS = Object.freeze(["Under Rs 25,000", "Rs 25,000 to 50,000", "Rs 50,000 to 100,000", "Rs 100,000 to 250,000", "More than Rs 250,000"]);

/** Human labels for payment methods. */
export const PAYMENT_METHOD_LABELS = Object.freeze({
  JAZZCASH: "JazzCash",
  EASYPAISA: "EasyPaisa",
  BANK_TRANSFER: "Bank transfer",
});
