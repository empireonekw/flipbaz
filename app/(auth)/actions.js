"use server";

import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/dal";
import { loginSchema, signupSchema, safeNextPath } from "@/lib/validators/auth";
import { fieldErrors, formToObject } from "@/lib/validators/common";
import { LIMITS } from "@/lib/security/config";
import {
  checkAccount,
  checkBlocked,
  checkLimit,
  clearLimit,
  emailIdentity,
  peekLimit,
  requestIp,
  userIdentity,
} from "@/lib/security/guard";
import { GENERIC_ERROR, logError } from "@/lib/security/log";

/**
 * @typedef {Object} FormState
 * @property {Record<string, string>} [errors]  field → message
 * @property {string} [message]                 form-level error
 * @property {Record<string, string>} [values]  echoed back so inputs keep their text
 */

/**
 * A bcrypt hash of a random string, compared against when the email isn't
 * found, so "unknown email" and "wrong password" take the same time.
 */
const DUMMY_HASH = "$2b$12$5RDECdp5w6.QE41PvXRnzup8mFpcVnf96hk6Jh76jrB48NRHF3oVe";

/** Only these fields are echoed back to the signup form after an error. */
const SIGNUP_ECHO = ["name", "email", "phone", "whatsapp", "city", "terms"];

/**
 * Log in with email + password.
 *
 * Protections, in order: blocked-IP check → per-IP attempt limit → per-email
 * failed-attempt limit → record which account this IP is using (an IP trying
 * too many different accounts gets blocked) → constant-time password check.
 *
 * @param {FormState} _prev
 * @param {FormData} formData
 * @returns {Promise<FormState>}
 */
export async function loginAction(_prev, formData) {
  const raw = formToObject(formData);
  const values = { email: String(raw.email ?? "").slice(0, 120) };
  const ip = await requestIp();

  const gate = checkBlocked(ip) ?? checkLimit("login-ip", ip, LIMITS.loginPerIp);
  if (gate) return { ...gate, values };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const emailKey = emailIdentity(parsed.data.email);
  const tooManyFailures = peekLimit("login-fail", emailKey, LIMITS.loginPerEmail);
  if (tooManyFailures) return { ...tooManyFailures, values };

  let user;
  try {
    await connectDB();
    user = await User.findOne({ email: parsed.data.email })
      .select("+passwordHash name role isActive sessionVersion")
      .lean();
  } catch (err) {
    logError("login", err);
    return { message: GENERIC_ERROR, values };
  }

  const abuse = checkAccount(ip, user ? userIdentity(String(user._id)) : emailKey);
  if (abuse) return { ...abuse, values };

  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    checkLimit("login-fail", emailKey, LIMITS.loginPerEmail);
    return { message: "That email and password don't match. Please try again.", values };
  }
  if (user.isActive === false) {
    return { message: "This account has been disabled. Please contact support.", values };
  }

  clearLimit("login-fail", emailKey);
  await createSession(user);
  redirect(safeNextPath(raw.next) ?? homeForRole(user.role));
}

/**
 * Create a seller account and sign them in. Limited per IP, and each new
 * account counts toward the IP's cross-account threshold.
 * @param {FormState} _prev
 * @param {FormData} formData
 * @returns {Promise<FormState>}
 */
export async function signupAction(_prev, formData) {
  const raw = formToObject(formData);
  const values = Object.fromEntries(SIGNUP_ECHO.map((k) => [k, String(raw[k] ?? "").slice(0, 120)]));
  const ip = await requestIp();

  const gate = checkBlocked(ip);
  if (gate) return { ...gate, values };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const limited = checkLimit("signup-ip", ip, LIMITS.signupPerIp);
  if (limited) return { ...limited, values };

  const { name, email, phone, whatsapp, city, password } = parsed.data;
  let user;
  try {
    await connectDB();
    if (await User.exists({ email })) {
      return { errors: { email: "An account with this email already exists. Try logging in." }, values };
    }
    user = await User.create({
      name,
      email,
      phone,
      whatsapp: whatsapp || phone,
      city,
      passwordHash: await hashPassword(password),
      role: "SELLER",
    });
  } catch (err) {
    if (err?.code === 11000) return { errors: { email: "An account with this email already exists." }, values };
    logError("signup", err);
    return { message: GENERIC_ERROR, values };
  }

  // The account exists either way; a blocked IP just isn't signed in to it.
  const abuse = checkAccount(ip, userIdentity(String(user._id)));
  if (abuse) return { ...abuse, values };

  await createSession(user);
  redirect(safeNextPath(raw.next) ?? "/dashboard");
}

/** Sign out and go back to the home page. */
export async function logoutAction() {
  await deleteSession();
  redirect("/");
}
