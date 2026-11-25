"use server";

import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/dal";
import { loginSchema, signupSchema, safeNextPath } from "@/lib/validators/auth";
import { fieldErrors, formToObject } from "@/lib/validators/common";

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

/**
 * Log in with email + password.
 * @param {FormState} _prev
 * @param {FormData} formData
 * @returns {Promise<FormState>}
 */
export async function loginAction(_prev, formData) {
  const raw = formToObject(formData);
  const values = { email: raw.email ?? "" };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  await connectDB();
  const user = await User.findOne({ email: parsed.data.email })
    .select("+passwordHash name role isActive")
    .lean();

  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    return { message: "That email and password don't match. Please try again.", values };
  }
  if (user.isActive === false) {
    return { message: "This account has been disabled. Please contact support.", values };
  }

  await createSession(user);
  redirect(safeNextPath(raw.next) ?? homeForRole(user.role));
}

/**
 * Create a seller account and sign them in.
 * @param {FormState} _prev
 * @param {FormData} formData
 * @returns {Promise<FormState>}
 */
export async function signupAction(_prev, formData) {
  const raw = formToObject(formData);
  const { password: _p, confirmPassword: _c, ...values } = raw;
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const { name, email, phone, whatsapp, city, password } = parsed.data;
  await connectDB();

  if (await User.exists({ email })) {
    return {
      errors: { email: "An account with this email already exists. Try logging in." },
      values,
    };
  }

  let user;
  try {
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
    if (err?.code === 11000) {
      return { errors: { email: "An account with this email already exists." }, values };
    }
    throw err;
  }

  await createSession(user);
  redirect(safeNextPath(raw.next) ?? "/dashboard");
}

/** Sign out and go back to the home page. */
export async function logoutAction() {
  await deleteSession();
  redirect("/");
}
