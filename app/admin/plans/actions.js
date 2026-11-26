"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { AdminError } from "@/lib/admin/common";
import { deletePlan, savePlan } from "@/lib/admin/plans";
import { planSchema } from "@/lib/validators/admin";
import { fieldErrors, formToObject } from "@/lib/validators/common";
import { GENERIC_ERROR, logError } from "@/lib/security/log";

function refresh() {
  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  revalidatePath("/");
}

/**
 * Create or update a membership plan.
 * @param {Object} _prev
 * @param {FormData} formData
 */
export async function savePlanAction(_prev, formData) {
  await requireAdmin();
  const raw = formToObject(formData);
  const parsed = planSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };
  try {
    await savePlan({ id: raw.id || undefined, data: parsed.data });
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message, values: raw };
    logError("save-plan", err);
    return { error: "Something went wrong. Please try again.", values: raw };
  }
  refresh();
  redirect("/admin/plans?saved=1");
}

/** Delete a plan nobody bought. */
export async function deletePlanAction(_prev, formData) {
  await requireAdmin();
  try {
    await deletePlan(String(formData.get("id") ?? ""));
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message };
    logError("admin-action", err);
    return { error: GENERIC_ERROR };
  }
  refresh();
  return { ok: "Deleted" };
}
