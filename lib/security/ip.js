import { CLIENT_IP_HEADER, EXEMPT_IPS, TRUST_PROXY_HOPS } from "./config.js";

/**
 * Client IP resolution.
 *
 * server.js calls `resolveClientIp(req)` on every raw Node request and stores
 * the result in the CLIENT_IP_HEADER request header (after deleting any copy
 * the client sent). Everything downstream (proxy.js, Server Actions, route
 * handlers) reads that header via `ipFromHeaders()`.
 *
 * X-Forwarded-For is only honoured when TRUST_PROXY_HOPS > 0, and then only
 * the entry added by the outermost trusted proxy is used, never the
 * client-controlled left end of the list.
 */

/** Strip IPv4-mapped IPv6 and zone ids: "::ffff:1.2.3.4" → "1.2.3.4". */
export function normalizeIp(raw) {
  let ip = String(raw ?? "").trim().toLowerCase();
  if (!ip) return "";
  if (ip.startsWith("[") && ip.includes("]")) ip = ip.slice(1, ip.indexOf("]"));
  ip = ip.split("%")[0];
  if (ip.startsWith("::ffff:") && ip.includes(".")) ip = ip.slice(7);
  // "1.2.3.4:5678" (port on IPv4) → "1.2.3.4"
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.split(":")[0];
  return ip;
}

/** Expand an IPv6 address to 8 full hextets, or null if it isn't one. */
function expandIpv6(ip) {
  if (!ip.includes(":")) return null;
  const [head, tail = ""] = ip.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  if (!ip.includes("::") && h.length !== 8) return null;
  const fill = Array(Math.max(0, 8 - h.length - t.length)).fill("0");
  const parts = [...h, ...fill, ...t];
  return parts.length === 8 && parts.every((p) => /^[0-9a-f]{1,4}$/.test(p)) ? parts : null;
}

/**
 * The key used for limiting/blocking. IPv4 as-is; IPv6 grouped by /64,
 * because a single home or phone connection usually owns a whole /64 and
 * could otherwise rotate addresses to dodge limits.
 * @param {string} ip normalized IP
 * @returns {string}
 */
export function ipKey(ip) {
  const v6 = expandIpv6(ip);
  if (!v6) return ip;
  return `${v6.slice(0, 4).map((p) => p.padStart(4, "0")).join(":")}::/64`;
}

/**
 * Resolve the client IP of a raw Node request (server.js / Socket.IO).
 * @param {import("node:http").IncomingMessage} req
 * @returns {string} normalized IP ("" if unknown)
 */
export function resolveClientIp(req) {
  const peer = normalizeIp(req.socket?.remoteAddress);
  if (TRUST_PROXY_HOPS <= 0) return peer;
  const xff = String(req.headers["x-forwarded-for"] ?? "")
    .split(",")
    .map((s) => normalizeIp(s))
    .filter(Boolean);
  // With N trusted proxies, the real client is the Nth entry from the right.
  const candidate = xff[xff.length - TRUST_PROXY_HOPS];
  return candidate || peer;
}

/**
 * Client IP from request headers set by server.js. Returns "" when the app is
 * not running behind server.js (e.g. plain `next dev`): callers then skip
 * IP-based checks rather than lumping every visitor into one bucket.
 * @param {Headers | { get(name: string): string | null }} headers
 * @returns {string}
 */
export function ipFromHeaders(headers) {
  return normalizeIp(headers.get(CLIENT_IP_HEADER) ?? "");
}

/** True for IPs (or their /64) listed in SECURITY_EXEMPT_IPS. */
export function isExempt(ip) {
  return Boolean(ip) && (EXEMPT_IPS.has(ip) || EXEMPT_IPS.has(ipKey(ip)));
}
