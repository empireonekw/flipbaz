"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { AdminError } from "@/lib/admin/common";
import { deleteProduct, saveProduct, toggleProductActive } from "@/lib/admin/products";
import { UploadError } from "@/lib/storage";
import { productSchema } from "@/lib/validators/admin";
import { fieldErrors, formToObject } from "@/lib/validators/common";
import { GENERIC_ERROR, logError } from "@/lib/security/log";

const userError = (err) => err instanceof AdminError || err instanceof UploadError;

/** Pages that show products and must refresh after a change. */
function refreshCatalog(id) {
  revalidatePath("/admin/products");
  if (id) revalidatePath(`/admin/products/${id}`);
  revalidatePath("/catalog");
  revalidatePath("/");
}

/**
 * Create or update a product with its photos.
 * @param {Object} _prev
 * @param {FormData} formData
 */
export async function saveProductAction(_prev, formData) {
  await requireAdmin();
  const raw = formToObject(formData);
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  let keepImages = [];
  try {
    keepImages = JSON.parse(raw.keepImages || "[]");
    if (!Array.isArray(keepImages)) keepImages = [];
  } catch {
    keepImages = [];
  }

  let id;
  try {
    id = await saveProduct({
      id: raw.id || undefined,
      data: parsed.data,
      keepImages: keepImages.map(String),
      newFiles: formData.getAll("newImages"),
    });
  } catch (err) {
    if (userError(err)) return { error: err.message, values: raw };
    logError("save-product", err);
    return { error: "Something went wrong while saving. Please try again.", values: raw };
  }
  refreshCatalog(id);
  redirect(`/admin/products/${id}?saved=1`);
}

/** Toggle active/hidden. */
export async function toggleProductAction(_prev, formData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  try {
    await toggleProductActive(id);
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message };
    logError("admin-action", err);
    return { error: GENERIC_ERROR };
  }
  refreshCatalog(id);
  return { ok: "Updated" };
}

/** Delete a never-ordered product. */
export async function deleteProductAction(_prev, formData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  try {
    await deleteProduct(id);
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message };
    logError("admin-action", err);
    return { error: GENERIC_ERROR };
  }
  refreshCatalog();
  redirect("/admin/products?deleted=1");
}
