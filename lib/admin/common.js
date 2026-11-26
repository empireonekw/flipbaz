import "server-only";

/**
 * Shared helpers for the admin data layer (lib/admin/*). Every exported
 * function in lib/admin assumes the caller already ran requireAdmin().
 */

/** Error whose message is safe to show to an admin in the UI. */
export class AdminError extends Error {}

/** Escape user text for use inside a RegExp. */
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Admin list page size. */
export const ADMIN_PAGE_SIZE = 20;

/**
 * Start of the current calendar month in Pakistan time (UTC+5, no DST),
 * returned as a UTC Date for querying.
 * @param {Date} [now]
 * @returns {Date}
 */
export function startOfMonthPKT(now = new Date()) {
  const pkt = new Date(now.getTime() + 5 * 3600e3);
  return new Date(Date.UTC(pkt.getUTCFullYear(), pkt.getUTCMonth(), 1) - 5 * 3600e3);
}

/**
 * Normalise a 1-based page number.
 * @param {unknown} page
 * @returns {number}
 */
export const pageNum = (page) => Math.max(1, Math.floor(Number(page)) || 1);
