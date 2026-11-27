"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth/dal";
import { ServiceError, submitApplication, withdrawApplication } from "@/lib/services";
import { serviceApplicationSchema } from "@/lib/validators/service";
import { fieldErrors, formToObject } from "@/lib/validators/common";
import { MANAGED_PLATFORMS } from "@/lib/models/constants";
import { LIMITS } from "@/lib/security/config";
import { checkLimit } from "@/lib/security/guard";
import { GENERIC_ERROR, logError } from "@/lib/security/log";

/** Single-value fields echoed back to the form (never anything else). */
const ECHO = ["firstName", "lastName", "email", "phone", "country", "method", "experience", "sellerType", "budget", "goals"];

/**
 * Submit a store-management application.
 * Per-platform inputs arrive as `platforms` (checked ids), `account_<ID>`, `handle_<ID>`.
 * @param {Object} _prev
 * @param {FormData} formData
 */
export async function applyForServiceAction(_prev, formData) {
  const seller = await requireSeller("/dashboard/services/apply");
  const raw = formToObject(formData);
  const values = Object.fromEntries(ECHO.map((k) => [k, String(raw[k] ?? "").slice(0, 1000)]));
  const picked = formData
    .getAll("platforms")
    .map(String)
    .filter((p, i, a) => MANAGED_PLATFORMS.includes(p) && a.indexOf(p) === i);
  const platforms = picked.map((p) => ({ platform: p, account: String(raw[`account_${p}`] ?? ""), handle: String(raw[`handle_${p}`] ?? "").slice(0, 200) }));
  const echo = { ...values, platforms };

  const parsed = serviceApplicationSchema.safeParse({ ...values, platforms });
  if (!parsed.success) {
    // Flatten "platforms.0.handle" into "handle_ETSY" so the form can show it on the right field.
    const errors = {};
    for (const [key, msg] of Object.entries(fieldErrors(parsed.error))) {
      const m = key.match(/^platforms\.(\d+)\.(account|handle)$/);
      errors[m ? `${m[2]}_${platforms[Number(m[1])]?.platform}` : key] = msg;
    }
    return { errors, values: echo };
  }

  const limited = checkLimit("service-apply", seller.id, LIMITS.serviceApply);
  if (limited) return { ...limited, values: echo };

  try {
    await submitApplication(seller.id, parsed.data);
  } catch (err) {
    if (err instanceof ServiceError) return { message: err.message, values: echo };
    logError("service-apply", err);
    return { message: GENERIC_ERROR, values: echo };
  }
  revalidatePath("/dashboard/services");
  revalidatePath("/admin/services");
  redirect("/dashboard/services?sent=1");
}

/**
 * Withdraw an open application.
 * @param {Object} _prev
 * @param {FormData} formData  { id }
 */
export async function withdrawServiceAction(_prev, formData) {
  const seller = await requireSeller("/dashboard/services");
  try {
    await withdrawApplication(seller.id, String(formData.get("id") ?? ""));
  } catch (err) {
    if (err instanceof ServiceError) return { error: err.message };
    logError("service-withdraw", err);
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/dashboard/services");
  revalidatePath("/admin/services");
  return { ok: "Withdrawn." };
}
