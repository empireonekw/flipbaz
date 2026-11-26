"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { AdminError } from "@/lib/admin/common";
import { deleteMessage, setMessageRead } from "@/lib/admin/messages";
import { GENERIC_ERROR, logError } from "@/lib/security/log";

/** Mark a contact message read / unread. */
export async function setReadAction(_prev, formData) {
  await requireAdmin();
  try {
    await setMessageRead(String(formData.get("id") ?? ""), formData.get("read") === "true");
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message };
    logError("admin-action", err);
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { ok: "Updated" };
}

/** Delete a contact message. */
export async function deleteMessageAction(_prev, formData) {
  await requireAdmin();
  try {
    await deleteMessage(String(formData.get("id") ?? ""));
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message };
    logError("admin-action", err);
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { ok: "Deleted" };
}
