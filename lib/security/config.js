/**
 * Security tuning, read once from env with safe defaults.
 * Plain module (no Next/server-only imports) so proxy.js, server.js and the
 * socket server can all use it.
 */

const num = (name, fallback) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
};

const MIN = 60_000;

/**
 * Cross-account IP abuse: if one IP is seen using more than IP_MAX_ACCOUNTS
 * different accounts (logins, signups, signed-in requests, chat sockets)
 * within IP_ACCOUNT_WINDOW_MINUTES, it is blocked for IP_BLOCK_MINUTES.
 * Default: the 4th distinct account within an hour triggers a 1-hour block.
 */
export const IP_MAX_ACCOUNTS = Math.max(1, num("IP_MAX_ACCOUNTS", 3));
export const IP_ACCOUNT_WINDOW_MS = num("IP_ACCOUNT_WINDOW_MINUTES", 60) * MIN;
export const IP_BLOCK_MS = num("IP_BLOCK_MINUTES", 60) * MIN;

/**
 * How many reverse proxies (Nginx, Cloudflare, a load balancer…) sit in front
 * of server.js and append to X-Forwarded-For. 0 = none: X-Forwarded-For is
 * ignored completely and the TCP peer address is used, so it can't be spoofed.
 */
export const TRUST_PROXY_HOPS = Math.floor(num("TRUST_PROXY_HOPS", 0));

/** IPs (or IPv6 /64 prefixes) never rate-limited or blocked, e.g. the office. */
export const EXEMPT_IPS = new Set(
  String(process.env.SECURITY_EXEMPT_IPS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

/**
 * Rate limits: `limit` requests per `windowMs`, per key (IP or account).
 * Global ones run in proxy.js on every request; the rest guard specific
 * actions.
 */
export const LIMITS = {
  // proxy.js, per IP
  globalRead: { limit: num("RATE_GLOBAL_PER_MIN", 300), windowMs: MIN },
  globalWrite: { limit: num("RATE_WRITE_PER_MIN", 60), windowMs: MIN },
  // auth
  loginPerIp: { limit: 10, windowMs: 15 * MIN },
  loginPerEmail: { limit: 8, windowMs: 15 * MIN }, // failed attempts only
  signupPerIp: { limit: 3, windowMs: 60 * MIN },
  passwordChange: { limit: 5, windowMs: 15 * MIN },
  // seller actions, per account
  paymentSubmit: { limit: 6, windowMs: 10 * MIN },
  orderPlace: { limit: 10, windowMs: 10 * MIN },
  profileUpdate: { limit: 10, windowMs: 10 * MIN },
  listingDownload: { limit: 30, windowMs: 10 * MIN },
  // public
  contactPerIp: { limit: 3, windowMs: 10 * MIN },
  // sockets
  socketConnectPerIp: { limit: 30, windowMs: MIN },
  chatPerUser: { limit: 30, windowMs: MIN },
};

/**
 * Name of the header server.js sets with the resolved client IP. Any copy sent
 * by the client is deleted first, so app code can trust it.
 */
export const CLIENT_IP_HEADER = "x-flipbaz-client-ip";
