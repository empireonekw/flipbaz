import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { getSession } from "./session";

/**
 * Data Access Layer for authentication.
 *
 * Every protected page, Server Action and Route Handler should call one of
 * these helpers. `proxy.js` only does a quick cookie check for redirects; the
 * real decision is made here, against the database, so a deleted or disabled
 * account (or a changed role) takes effect immediately.
 */

/**
 * @typedef {Object} CurrentUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {"SELLER"|"ADMIN"} role
 * @property {string} [phone]
 * @property {string} [whatsapp]
 * @property {string} [city]
 */

/**
 * The signed-in user, or null. Memoised per request with React `cache`, so
 * calling it from several components costs one DB lookup.
 * @returns {Promise<CurrentUser | null>}
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session || !mongoose.isValidObjectId(session.userId)) return null;

  await connectDB();
  const user = await User.findById(session.userId)
    .select("name email role phone whatsapp city isActive")
    .lean();
  if (!user || user.isActive === false) return null;

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? "",
    whatsapp: user.whatsapp ?? "",
    city: user.city ?? "",
  };
});

/**
 * Require any signed-in user, else redirect to /login.
 * @param {string} [next] path to come back to after login
 * @returns {Promise<CurrentUser>}
 */
export async function requireUser(next) {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}

/**
 * Require an ADMIN, else redirect (sellers go to their dashboard).
 * @returns {Promise<CurrentUser>}
 */
export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

/**
 * Require a SELLER, else redirect (admins go to the admin panel).
 * @param {string} [next]
 * @returns {Promise<CurrentUser>}
 */
export async function requireSeller(next = "/dashboard") {
  const user = await requireUser(next);
  if (user.role !== "SELLER") redirect("/admin");
  return user;
}

/**
 * Home route for a role.
 * @param {"SELLER"|"ADMIN"} role
 * @returns {string}
 */
export function homeForRole(role) {
  return role === "ADMIN" ? "/admin" : "/dashboard";
}
