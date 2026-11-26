import { SignJWT, jwtVerify } from "jose";

/**
 * JWT helpers with no Next.js imports, so they work in `proxy.js` as well as
 * in server code. Tokens are HS256-signed with JWT_SECRET.
 */

/** Name of the httpOnly session cookie. */
export const SESSION_COOKIE = "fb_session";

/** Session lifetime in seconds (7 days). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const ISSUER = "flipbaz";

/** @returns {Uint8Array} signing key from JWT_SECRET */
function getKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set to a random string of at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Sign a session token. The payload is readable by anyone holding the cookie,
 * so it carries only what routing needs: user id, role and session version
 * (bumped to revoke all sessions, e.g. after a password change).
 * @param {{ sub: string, role: string, ver?: number }} payload
 * @returns {Promise<string>}
 */
export function signSessionToken({ sub, role, ver = 0 }) {
  return new SignJWT({ role, ver })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getKey());
}

/**
 * Verify a session token. Returns null for a missing, expired, or tampered token.
 * @param {string | undefined} token
 * @returns {Promise<{ userId: string, role: string, ver: number } | null>}
 */
export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      issuer: ISSUER,
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return { userId: payload.sub, role: String(payload.role), ver: Number(payload.ver) || 0 };
  } catch {
    return null;
  }
}
