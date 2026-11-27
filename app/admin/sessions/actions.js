"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { AdminError } from "@/lib/admin/common";
import { createSession, deleteSession, recordingSchema, sessionSchema, setRecording } from "@/lib/admin/sessions";
import { fieldErrors, formToObject } from "@/lib/validators/common";
import { GENERIC_ERROR, logError } from "@/lib/security/log";

/** Schedule a live session. */
export async function createSessionAction(_prev, formData) {
  await requireAdmin();
  const raw = formToObject(formData);
  const parsed = sessionSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };
  await createSession(parsed.data);
  revalidatePath("/admin/sessions");
  revalidatePath("/dashboard");
  return { ok: "Session scheduled. It now shows on every seller's Home." };
}

/** Add, change or remove a finished session's recording link. */
export async function setRecordingAction(_prev, formData) {
  await requireAdmin();
  const parsed = recordingSchema.safeParse({ id: String(formData.get("id") ?? ""), recordingUrl: String(formData.get("recordingUrl") ?? "") });
  if (!parsed.success) return { error: Object.values(fieldErrors(parsed.error))[0] };
  try {
    await setRecording(parsed.data);
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message };
    logError("admin-action", err);
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/admin/sessions");
  revalidatePath("/dashboard/guidance");
  return { ok: parsed.data.recordingUrl ? "Recording saved." : "Recording removed." };
}

/** Remove a session. */
export async function deleteSessionAction(_prev, formData) {
  await requireAdmin();
  try {
    await deleteSession(String(formData.get("id") ?? ""));
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message };
    logError("admin-action", err);
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/admin/sessions");
  revalidatePath("/dashboard");
  return { ok: "Deleted" };
}
