import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { ipFromHeaders } from "./ip.js";
import { blockStatus, hit, peek, resetCounter, trackAccount, waitText } from "./limiter.js";

/**
 * Rate-limit and abuse helpers for Server Actions and Route Handlers.
 *
 * Each `check*` returns `null` when the request may continue, or a ready-made
 * form state `{ message, error, rateLimited }` to return from the action, so
 * every form shows the same clear "slow down" message.
 */

/** Client IP for the current request ("" when not behind server.js). */
export async function requestIp() {
  return ipFromHeaders(await headers());
}

/**
 * Standard "too many requests" state for forms.
 * @param {number} retryAfterSec
 * @param {boolean} [blocked]  true when the whole IP is blocked
 */
export function limitedState(retryAfterSec, blocked = false) {
  const message = blocked
    ? `This network has been temporarily blocked for unusual activity. Try again in ${waitText(retryAfterSec)} or contact support.`
    : `Too many attempts. Please wait ${waitText(retryAfterSec)} and try again.`;
  return { message, error: message, rateLimited: true };
}

/**
 * Stable, non-reversible identity for an email address (used before we know
 * whether the account exists, so raw emails never sit in memory).
 * @param {string} email
 */
export function emailIdentity(email) {
  return `e:${createHash("sha256").update(String(email).trim().toLowerCase()).digest("hex").slice(0, 24)}`;
}

/** Identity for a known account. */
export const userIdentity = (userId) => `u:${userId}`;

/**
 * Apply a rate limit rule. `scope` names the action; `key` is what is being
 * limited (IP, account id, email hash). Requests without a known IP are only
 * limited by non-IP keys.
 *
 * @param {string} scope
 * @param {string} key
 * @param {{ limit: number, windowMs: number }} rule
 * @returns {Object|null}
 */
export function checkLimit(scope, key, rule) {
  if (!key) return null;
  const r = hit(`${scope}:${key}`, rule);
  return r.ok ? null : limitedState(r.retryAfterSec);
}

/**
 * Check a limit without counting (pair with `checkLimit` to count only
 * failures, e.g. wrong passwords).
 */
export function peekLimit(scope, key, rule) {
  if (!key) return null;
  const r = peek(`${scope}:${key}`, rule);
  return r.ok ? null : limitedState(r.retryAfterSec);
}

/** Clear a limiter key (e.g. failed logins after a success). */
export function clearLimit(scope, key) {
  if (key) resetCounter(`${scope}:${key}`);
}

/**
 * Refuse requests from blocked IPs (proxy.js already does this; this repeats
 * it for code paths that must be airtight, like login).
 * @param {string} ip
 */
export function checkBlocked(ip) {
  const b = blockStatus(ip);
  return b.blocked ? limitedState(b.retryAfterSec, true) : null;
}

/**
 * Record that this IP is acting as `identity`; blocks the IP once it has used
 * too many different accounts. Returns a blocked state, or null.
 * @param {string} ip
 * @param {string} identity
 */
export function checkAccount(ip, identity) {
  const r = trackAccount(ip, identity);
  return r.blocked ? limitedState(r.retryAfterSec, true) : null;
}
