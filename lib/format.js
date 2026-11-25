const pkr = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/**
 * Format a number as Pakistani Rupees, e.g. 1500 → "Rs 1,500".
 * @param {number} amount
 * @returns {string}
 */
export function formatPKR(amount) {
  const n = Number(amount) || 0;
  const sign = n < 0 ? "-" : "";
  return `${sign}Rs ${pkr.format(Math.abs(Math.round(n)))}`;
}

/**
 * Format a date as "25 Nov 2026" in Pakistan time.
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Karachi",
  }).format(new Date(date));
}

/**
 * Format a date and time, e.g. "25 Nov 2026, 14:05".
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Karachi",
  }).format(new Date(date));
}

/**
 * Turn text into a URL slug.
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
