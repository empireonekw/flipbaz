"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth/dal";
import { MANUAL_STEPS, setLaunchStep } from "@/lib/seller";
import { connectDB } from "@/lib/db";
import { markAllNotificationsRead } from "@/lib/notifications";

/**
 * Tick or untick a self-reported launch-checklist step.
 * @param {Object} _prev
 * @param {FormData} formData  { step, done: "true"|"false" }
 */
export async function setLaunchStepAction(_prev, formData) {
  const seller = await requireSeller();
  const step = String(formData.get("step") ?? "");
  if (!MANUAL_STEPS.includes(step)) return { error: "Unknown step." };
  await setLaunchStep(seller.id, step, formData.get("done") === "true");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Mark every update as read. */
export async function markUpdatesReadAction() {
  const seller = await requireSeller();
  await connectDB();
  await markAllNotificationsRead(seller.id);
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
