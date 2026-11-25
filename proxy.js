import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

/**
 * Route protection (Next 16 "proxy", formerly middleware).
 *
 * This is a fast, optimistic check on the signed session cookie only. It keeps
 * logged-out visitors out of /dashboard and /admin, and sellers out of /admin.
 * Pages and Server Actions still re-check the user against the database via
 * `lib/auth/dal.js`, which is the real security boundary.
 *
 * @param {import("next/server").NextRequest} request
 */
export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isProtected && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    const res = NextResponse.redirect(url);
    // Clear a cookie that failed verification (expired or tampered).
    if (request.cookies.has(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  if (pathname.startsWith("/admin") && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL(session.role === "ADMIN" ? "/admin" : "/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup"],
};
