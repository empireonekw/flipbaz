"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth/dal";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { changePasswordSchema, profileSchema } from "@/lib/validators/profile";
import { fieldErrors, formToObject } from "@/lib/validators/common";

/**
 * Update the seller's contact details.
 * @param {Object} _prev
 * @param {FormData} formData
 */
export async function updateProfileAction(_prev, formData) {
  const seller = await requireSeller("/dashboard/profile");
  const raw = formToObject(formData);
  const platforms = formData.getAll("sellingPlatforms").map(String);
  const parsed = profileSchema.safeParse({ ...raw, sellingPlatforms: platforms });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: { ...raw, sellingPlatforms: platforms } };

  await connectDB();
  const { name, phone, whatsapp, city, storeName, sellingPlatforms } = parsed.data;
  const user = await User.findByIdAndUpdate(
    seller.id,
    { $set: { name, phone, whatsapp: whatsapp || phone, city, storeName, sellingPlatforms } },
    { returnDocument: "after" }
  ).lean();
  // Keep the name in the session token in sync.
  if (user) await createSession(user);
  revalidatePath("/dashboard", "layout");
  return { ok: "Profile saved.", values: { name, phone, whatsapp: whatsapp || phone, city, storeName, sellingPlatforms } };
}

/**
 * Change password after confirming the current one.
 * @param {Object} _prev
 * @param {FormData} formData
 */
export async function changePasswordAction(_prev, formData) {
  const seller = await requireSeller("/dashboard/profile");
  const parsed = changePasswordSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await connectDB();
  const user = await User.findById(seller.id).select("+passwordHash").lean();
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { errors: { currentPassword: "That's not your current password." } };
  }
  await User.updateOne({ _id: seller.id }, { $set: { passwordHash: await hashPassword(parsed.data.newPassword) } });
  return { ok: "Password changed. Use the new one next time you log in." };
}
