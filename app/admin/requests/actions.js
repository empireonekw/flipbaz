"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { AdminError } from "@/lib/admin/common";
import { replyToProductRequest } from "@/lib/admin/requests";
import { productRequestReplySchema } from "@/lib/validators/request";
import { fieldErrors, formToObject } from "@/lib/validators/common";
import { GENERIC_ERROR, logError } from "@/lib/security/log";

/**
 * Update a seller's custom request (status, reply, linked product) and
 * notify the seller.
 * @param {Object} _prev
 * @param {FormData} formData
 */
export async function replyRequestAction(_prev, formData) {
  await requireAdmin();
  const raw = formToObject(formData);
  // Echo back only the form's own fields, so the admin's input survives an error.
  const at = Date.now(); // lets the form re-mount after each submit
  const values = { status: String(raw.status ?? ""), adminReply: String(raw.adminReply ?? "").slice(0, 500), productSlug: String(raw.productSlug ?? "").slice(0, 120) };
  const parsed = productRequestReplySchema.safeParse(raw);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { error: Object.values(errors)[0] ?? GENERIC_ERROR, values, at };
  }
  try {
    await replyToProductRequest(parsed.data);
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message, values, at };
    logError("admin-request-reply", err);
    return { error: GENERIC_ERROR, values, at };
  }
  revalidatePath("/admin/requests");
  revalidatePath("/admin");
  return { ok: "Saved and the seller was notified.", at };
}
