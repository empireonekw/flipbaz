import { IP_ACCOUNT_WINDOW_MS, IP_BLOCK_MS, IP_MAX_ACCOUNTS } from "./config.js";
import { ipKey, isExempt } from "./ip.js";

/**
 * In-memory rate limiter, cross-account IP tracker and IP block list.
 *
 * State lives on globalThis so the proxy bundle, the app bundle, server.js and
 * the Socket.IO server (all in one Node process under the custom server) share
 * it. Active blocks are also persisted to MongoDB by server.js (see
 * `setBlockHooks`) so they survive restarts. For several app instances behind a
 * load balancer, swap this store for Redis; the function signatures stay the same.
 *
 * Plain module: no Next.js or database imports.
 */

/**
 * @typedef {{ ip: string, reason: string, until: number, accounts: number, createdAt: number }} BlockEntry
 */
const state =
  globalThis.__flipBazSecurity ??
  (globalThis.__flipBazSecurity = {
    /** key → { count, prev, windowStart } */
    counters: new Map(),
    /** ipKey → Map<identity, lastSeenMs> */
    identities: new Map(),
    /** ipKey → BlockEntry */
    blocks: new Map(),
    hooks: {},
    sweeper: null,
  });

// Periodic cleanup so the maps don't grow forever.
if (!state.sweeper) {
  state.sweeper = setInterval(() => {
    const now = Date.now();
    for (const [k, c] of state.counters) if (now - c.windowStart > c.windowMs * 2) state.counters.delete(k);
    for (const [ip, ids] of state.identities) {
      for (const [id, seen] of ids) if (now - seen > IP_ACCOUNT_WINDOW_MS) ids.delete(id);
      if (!ids.size) state.identities.delete(ip);
    }
    for (const [ip, b] of state.blocks) if (b.until <= now) state.blocks.delete(ip);
  }, 60_000);
  state.sweeper.unref?.();
}

/**
 * Count one hit against `key` using a sliding-window approximation
 * (current window + weighted previous window).
 *
 * @param {string} key                     e.g. "login:ip:1.2.3.4"
 * @param {{ limit: number, windowMs: number }} rule
 * @returns {{ ok: boolean, remaining: number, retryAfterSec: number }}
 */
export function hit(key, { limit, windowMs }) {
  const now = Date.now();
  let c = state.counters.get(key);
  if (!c) {
    c = { count: 0, prev: 0, windowStart: now, windowMs };
    state.counters.set(key, c);
  }
  const elapsed = now - c.windowStart;
  if (elapsed >= windowMs) {
    c.prev = elapsed >= windowMs * 2 ? 0 : c.count;
    c.count = 0;
    c.windowStart = now - (elapsed % windowMs);
  }
  const weight = 1 - (now - c.windowStart) / windowMs;
  const estimated = c.count + c.prev * weight;
  if (estimated >= limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.max(1, Math.ceil((c.windowStart + windowMs - now) / 1000)) };
  }
  c.count += 1;
  return { ok: true, remaining: Math.max(0, Math.floor(limit - estimated - 1)), retryAfterSec: 0 };
}

/** Forget a counter (e.g. failed-login counter after a successful login). */
export function resetCounter(key) {
  state.counters.delete(key);
}

/**
 * Is this IP currently blocked?
 * @param {string} ip
 * @returns {{ blocked: boolean, retryAfterSec: number, reason?: string }}
 */
export function blockStatus(ip) {
  if (!ip || isExempt(ip)) return { blocked: false, retryAfterSec: 0 };
  const b = state.blocks.get(ipKey(ip));
  if (!b) return { blocked: false, retryAfterSec: 0 };
  const left = b.until - Date.now();
  if (left <= 0) {
    state.blocks.delete(ipKey(ip));
    return { blocked: false, retryAfterSec: 0 };
  }
  return { blocked: true, retryAfterSec: Math.ceil(left / 1000), reason: b.reason };
}

/**
 * Block an IP (its /64 for IPv6).
 * @param {string} ip
 * @param {{ reason: string, ms?: number, accounts?: number }} opts
 * @returns {BlockEntry}
 */
export function blockIp(ip, { reason, ms = IP_BLOCK_MS, accounts = 0 }) {
  const key = ipKey(ip);
  const entry = { ip: key, reason, until: Date.now() + ms, accounts, createdAt: Date.now() };
  state.blocks.set(key, entry);
  state.identities.delete(key);
  try {
    state.hooks.onBlock?.(entry);
  } catch {
    /* persistence is best-effort */
  }
  return entry;
}

/** Lift a block (admin action). Also clears the IP's account history. */
export function unblockIp(ipOrKey) {
  const key = ipOrKey.includes("/64") ? ipOrKey : ipKey(ipOrKey);
  state.blocks.delete(key);
  state.identities.delete(key);
  try {
    state.hooks.onUnblock?.(key);
  } catch {
    /* best-effort */
  }
}

/** Load blocks (e.g. from MongoDB at startup) without firing hooks. */
export function restoreBlocks(entries) {
  const now = Date.now();
  for (const e of entries) if (e.until > now) state.blocks.set(e.ip, e);
}

/** Active blocks, newest first. */
export function listBlocks() {
  const now = Date.now();
  return [...state.blocks.values()].filter((b) => b.until > now).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Register persistence callbacks (server.js).
 * @param {{ onBlock?: (e: BlockEntry) => void, onUnblock?: (key: string) => void }} hooks
 */
export function setBlockHooks(hooks) {
  state.hooks = hooks ?? {};
}

/**
 * Record that `ip` acted as `identity` (an account id, or a hashed email for
 * login attempts on unknown addresses). When the number of distinct
 * identities seen from the IP within the window exceeds IP_MAX_ACCOUNTS, the
 * IP is blocked.
 *
 * @param {string} ip
 * @param {string} identity  stable, non-secret account key, e.g. "u:<userId>"
 * @returns {{ blocked: boolean, accounts: number, retryAfterSec: number }}
 */
export function trackAccount(ip, identity) {
  if (!ip || !identity || isExempt(ip)) return { blocked: false, accounts: 0, retryAfterSec: 0 };
  const already = blockStatus(ip);
  if (already.blocked) return { blocked: true, accounts: 0, retryAfterSec: already.retryAfterSec };

  const key = ipKey(ip);
  const now = Date.now();
  let ids = state.identities.get(key);
  if (!ids) state.identities.set(key, (ids = new Map()));
  for (const [id, seen] of ids) if (now - seen > IP_ACCOUNT_WINDOW_MS) ids.delete(id);
  ids.set(identity, now);

  if (ids.size > IP_MAX_ACCOUNTS) {
    const entry = blockIp(ip, { reason: `Used ${ids.size} different accounts`, accounts: ids.size });
    return { blocked: true, accounts: ids.size, retryAfterSec: Math.ceil((entry.until - now) / 1000) };
  }
  return { blocked: false, accounts: ids.size, retryAfterSec: 0 };
}

/** Human "try again in …" text. */
export function waitText(sec) {
  if (sec < 90) return `${Math.max(1, sec)} seconds`;
  const m = Math.ceil(sec / 60);
  return m < 90 ? `${m} minutes` : `${Math.ceil(m / 60)} hours`;
}

/**
 * Would one more hit be allowed? (Doesn't count anything.) Used for
 * failed-login counters that should only grow on failure.
 * @param {string} key
 * @param {{ limit: number, windowMs: number }} rule
 * @returns {{ ok: boolean, retryAfterSec: number }}
 */
export function peek(key, { limit, windowMs }) {
  const c = state.counters.get(key);
  if (!c) return { ok: true, retryAfterSec: 0 };
  const now = Date.now();
  const elapsed = now - c.windowStart;
  if (elapsed >= windowMs * 2) return { ok: true, retryAfterSec: 0 };
  const count = elapsed >= windowMs ? 0 : c.count;
  const prev = elapsed >= windowMs ? c.count : c.prev;
  const weight = 1 - (elapsed % windowMs) / windowMs;
  const ok = count + prev * weight < limit;
  return { ok, retryAfterSec: ok ? 0 : Math.max(1, Math.ceil((windowMs - (elapsed % windowMs)) / 1000)) };
}
