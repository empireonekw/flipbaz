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
  const parsed = productRequestReplySchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { error: Object.values(errors)[0] ?? GENERIC_ERROR };
  }
  try {
    await replyToProductRequest(parsed.data);
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message };
    logError("admin-request-reply", err);
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/admin/requests");
  revalidatePath("/admin");
  return { ok: "Saved and the seller was notified." };
}
