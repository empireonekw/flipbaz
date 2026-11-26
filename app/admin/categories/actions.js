"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { AdminError } from "@/lib/admin/common";
import { deleteCategory, saveCategory } from "@/lib/admin/categories";
import { UploadError } from "@/lib/storage";
import { categorySchema } from "@/lib/validators/admin";
import { fieldErrors, formToObject } from "@/lib/validators/common";
import { GENERIC_ERROR, logError } from "@/lib/security/log";

function refresh() {
  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
}

/**
 * Create or update a category (with optional image).
 * @param {Object} _prev
 * @param {FormData} formData
 */
export async function saveCategoryAction(_prev, formData) {
  await requireAdmin();
  const raw = formToObject(formData);
  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };
  try {
    await saveCategory({
      id: raw.id || undefined,
      data: parsed.data,
      imageFile: formData.get("image"),
      removeImage: raw.removeImage === "on",
    });
  } catch (err) {
    if (err instanceof AdminError || err instanceof UploadError) return { error: err.message, values: raw };
    logError("save-category", err);
    return { error: "Something went wrong. Please try again.", values: raw };
  }
  refresh();
  redirect("/admin/categories?saved=1");
}

/** Delete an empty category. */
export async function deleteCategoryAction(_prev, formData) {
  await requireAdmin();
  try {
    await deleteCategory(String(formData.get("id") ?? ""));
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message };
    logError("admin-action", err);
    return { error: GENERIC_ERROR };
  }
  refresh();
  return { ok: "Deleted" };
}
