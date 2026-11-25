import bcrypt from "bcryptjs";

/** bcrypt cost factor. 12 is a good balance of safety and speed on serverless. */
const BCRYPT_ROUNDS = 12;

/**
 * Hash a plain-text password with bcrypt.
 * @param {string} plain
 * @returns {Promise<string>}
 */
export function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Check a plain-text password against a stored bcrypt hash.
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export function verifyPassword(plain, hash) {
  if (!plain || !hash) return Promise.resolve(false);
  return bcrypt.compare(plain, hash);
}
