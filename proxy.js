import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";
import { LIMITS } from "@/lib/security/config";
import { ipFromHeaders, isExempt } from "@/lib/security/ip";
import { blockStatus, hit, trackAccount, waitText } from "@/lib/security/limiter";

/**
 * Request gate (Next 16 "proxy", formerly middleware). Runs before every
 * page, Server Action and route handler (static files excluded).
 *
 *  1. Blocked IPs get a 429 straight away.
 *  2. Per-IP rate limits: a generous budget for reads, a tighter one for
 *     writes (POST/PUT/DELETE and Server Action calls).
 *  3. Signed-in requests record which account the IP is using; an IP that
 *     cycles through too many accounts is blocked (see lib/security/limiter.js).
 *  4. Auth redirects: logged-out visitors can't reach /dashboard, and /admin
 *     answers 404 to anyone who isn't a signed-in admin, so the admin area
 *     isn't advertised.
 *
 * Pages and actions still re-check the user against the database via
 * lib/auth/dal.js, which is the real authorization boundary.
 *
 * @param {import("next/server").NextRequest} request
 */
let warnedNoIp = false;

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const ip = ipFromHeaders(request.headers);
  const enforce = Boolean(ip) && !isExempt(ip);
  if (!ip && !warnedNoIp && process.env.NODE_ENV === "production") {
    warnedNoIp = true;
    console.warn("[security] No client IP header: run the app with server.js (npm start), or IP rate limits and blocking are off.");
  }

  if (enforce) {
    const block = blockStatus(ip);
    if (block.blocked) return tooMany(request, block.retryAfterSec, true);

    const isWrite = !["GET", "HEAD", "OPTIONS"].includes(request.method) || request.headers.has("next-action");
    const rule = isWrite ? LIMITS.globalWrite : LIMITS.globalRead;
    const r = hit(`${isWrite ? "w" : "r"}:${ip}`, rule);
    if (!r.ok) return tooMany(request, r.retryAfterSec, false);
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (enforce && session) {
    const t = trackAccount(ip, `u:${session.userId}`);
    if (t.blocked) return tooMany(request, t.retryAfterSec, true);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (session?.role !== "ADMIN") return notFound(request);
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname + search);
      const res = NextResponse.redirect(url);
      if (token) res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    if (session.role === "ADMIN") return NextResponse.redirect(new URL("/admin", request.url));
  }

  if ((pathname === "/login" || pathname === "/signup") && session) {
    return NextResponse.redirect(new URL(session.role === "ADMIN" ? "/admin" : "/dashboard", request.url));
  }

  return NextResponse.next();
}

/** Render the normal 404 page without revealing that the path exists. */
function notFound(request) {
  return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
}

/**
 * Consistent 429 response: a small HTML page for browser navigations, JSON for
 * everything else (fetches, Server Actions, APIs).
 */
function tooMany(request, retryAfterSec, blocked) {
  const message = blocked
    ? `This network has been temporarily blocked for unusual activity. Try again in ${waitText(retryAfterSec)} or contact support.`
    : `Too many requests. Please wait ${waitText(retryAfterSec)} and try again.`;
  const headers = { "Retry-After": String(retryAfterSec), "Cache-Control": "no-store" };
  const wantsHtml = request.method === "GET" && (request.headers.get("accept") ?? "").includes("text/html") && !request.headers.has("rsc");
  if (wantsHtml) {
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Please slow down · Flip Baz</title><body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#faf8f5;color:#1c1917"><main style="max-width:28rem;padding:2rem;text-align:center"><h1 style="font-size:1.5rem">Please slow down</h1><p>${message}</p></main></body></html>`;
    return new NextResponse(html, { status: 429, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
  }
  return NextResponse.json({ error: message }, { status: 429, headers });
}

export const config = {
  // Everything except build assets, optimised images and the committed seed images.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|seed/).*)"],
};
