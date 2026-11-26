"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth/dal";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { changePasswordSchema, profileSchema } from "@/lib/validators/profile";
import { fieldErrors, formToObject } from "@/lib/validators/common";
import { LIMITS } from "@/lib/security/config";
import { checkLimit } from "@/lib/security/guard";
import { GENERIC_ERROR, logError } from "@/lib/security/log";

/** Fields echoed back to the profile form (never anything else from the request). */
const PROFILE_ECHO = ["name", "phone", "whatsapp", "city", "storeName"];

/**
 * Update the seller's contact and store details. Only the allow-listed fields
 * in profileSchema can change; email, role, balance etc. are never touched.
 * @param {Object} _prev
 * @param {FormData} formData
 */
export async function updateProfileAction(_prev, formData) {
  const seller = await requireSeller("/dashboard/profile");
  const raw = formToObject(formData);
  const platforms = formData.getAll("sellingPlatforms").map(String).slice(0, 20);
  const echo = { ...Object.fromEntries(PROFILE_ECHO.map((k) => [k, String(raw[k] ?? "").slice(0, 120)])), sellingPlatforms: platforms };

  const limited = checkLimit("profile", seller.id, LIMITS.profileUpdate);
  if (limited) return { ...limited, values: echo };

  const parsed = profileSchema.safeParse({ ...raw, sellingPlatforms: platforms });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: echo };

  const { name, phone, whatsapp, city, storeName, sellingPlatforms } = parsed.data;
  try {
    await connectDB();
    await User.updateOne({ _id: seller.id }, { $set: { name, phone, whatsapp: whatsapp || phone, city, storeName, sellingPlatforms } });
  } catch (err) {
    logError("profile-update", err);
    return { message: GENERIC_ERROR, error: GENERIC_ERROR, values: echo };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: "Profile saved.", values: { name, phone, whatsapp: whatsapp || phone, city, storeName, sellingPlatforms } };
}

/**
 * Change password after confirming the current one. Bumps the account's
 * session version, which signs out every other device; this device gets a
 * fresh session.
 * @param {Object} _prev
 * @param {FormData} formData
 */
export async function changePasswordAction(_prev, formData) {
  const seller = await requireSeller("/dashboard/profile");
  const limited = checkLimit("password", seller.id, LIMITS.passwordChange);
  if (limited) return limited;

  const parsed = changePasswordSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  try {
    await connectDB();
    const user = await User.findById(seller.id).select("+passwordHash").lean();
    if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return { errors: { currentPassword: "That's not your current password." } };
    }
    const updated = await User.findByIdAndUpdate(
      seller.id,
      { $set: { passwordHash: await hashPassword(parsed.data.newPassword) }, $inc: { sessionVersion: 1 } },
      { returnDocument: "after" }
    )
      .select("role sessionVersion")
      .lean();
    await createSession(updated);
  } catch (err) {
    logError("password-change", err);
    return { message: GENERIC_ERROR, error: GENERIC_ERROR };
  }
  return { ok: "Password changed. You've been signed out on your other devices." };
}
