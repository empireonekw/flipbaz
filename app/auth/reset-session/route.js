import { NextResponse } from "next/server";
import { getCurrentUser, homeForRole } from "@/lib/auth/dal";
import { SESSION_COOKIE } from "@/lib/auth/token";
import { safeNextPath } from "@/lib/validators/auth";

/**
 * GET /auth/reset-session?next=/path
 *
 * Clears a session cookie that is correctly signed but no longer matches an
 * active account (deleted, disabled), then sends the visitor to log in.
 * If the session is actually fine, nothing is cleared, so this link can't be
 * abused to log people out.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));

  const user = await getCurrentUser();
  if (user) {
    return NextResponse.redirect(new URL(next ?? homeForRole(user.role), url));
  }

  const login = new URL("/login", url);
  if (next) login.searchParams.set("next", next);
  const res = NextResponse.redirect(login);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
