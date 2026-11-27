import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { signSessionToken, verifySessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "./token.js";

/**
 * Cookie-based sessions for Server Components, Server Actions and Route
 * Handlers. The cookie holds a signed JWT (see token.js) and is httpOnly, so
 * browser JavaScript can never read it.
 */

/**
 * Start a session for a user by setting the signed cookie.
 * @param {{ _id: any, role: "SELLER"|"ADMIN", sessionVersion?: number }} user
 * @returns {Promise<void>}
 */
export async function createSession(user) {
  const token = await signSessionToken({
    sub: String(user._id),
    role: user.role,
    ver: user.sessionVersion ?? 0,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * End the current session.
 * @returns {Promise<void>}
 */
export async function deleteSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Read and verify the session cookie.
 * This only proves the token is valid; use `getCurrentUser()` in dal.js to
 * confirm the account still exists and is active.
 * @returns {Promise<{ userId: string, role: string, ver: number } | null>}
 */
export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  // Verifying the JWT checks its expiry against the current time. With Cache
  // Components + partial prefetching, Next can prerender with cookies, so
  // reading the cookie alone doesn't make this request-time: connection()
  // does (otherwise Next reports `new Date()` while prerendering).
  await connection();
  return verifySessionToken(token);
}
