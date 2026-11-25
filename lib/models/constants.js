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

/** Human labels for payment methods. */
export const PAYMENT_METHOD_LABELS = Object.freeze({
  JAZZCASH: "JazzCash",
  EASYPAISA: "EasyPaisa",
  BANK_TRANSFER: "Bank transfer",
});
