"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { AdminError } from "@/lib/admin/common";
import { updateApplication } from "@/lib/admin/services";
import { serviceUpdateSchema } from "@/lib/validators/service";
import { fieldErrors, formToObject } from "@/lib/validators/common";
import { GENERIC_ERROR, logError } from "@/lib/security/log";

const ECHO = ["status", "meetingAt", "meetingUrl", "meetingNote", "quoteAmount", "quoteDetails", "note"];

/**
 * Update a store-management application and notify the seller.
 * @param {Object} _prev
 * @param {FormData} formData
 */
export async function updateServiceAction(_prev, formData) {
  const admin = await requireAdmin();
  const raw = formToObject(formData);
  const values = Object.fromEntries(ECHO.map((k) => [k, String(raw[k] ?? "").slice(0, 1000)]));
  const at = Date.now(); // re-mount the form with the echoed values
  const parsed = serviceUpdateSchema.safeParse({ ...values, id: String(raw.id ?? "") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values, at };
  try {
    await updateApplication(parsed.data, admin.id);
  } catch (err) {
    if (err instanceof AdminError) return { message: err.message, values, at };
    logError("admin-service-update", err);
    return { message: GENERIC_ERROR, values, at };
  }
  revalidatePath("/admin/services");
  revalidatePath("/dashboard/services");
  return { ok: "Saved and the seller was notified.", at };
}
