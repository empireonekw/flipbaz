"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { AdminError } from "@/lib/admin/common";
import { endMembership, extendMembership, setAccountActive } from "@/lib/admin/members";
import { extendMembershipSchema } from "@/lib/validators/admin";
import { formToObject } from "@/lib/validators/common";
import { formatDate } from "@/lib/format";
import { GENERIC_ERROR, logError } from "@/lib/security/log";

const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v ?? ""));

function refresh(userId) {
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${userId}`);
}

/** Add days or months to a seller's membership. */
export async function extendMembershipAction(_prev, formData) {
  const admin = await requireAdmin();
  const parsed = extendMembershipSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { error: "Choose how much time to add." };
  try {
    const endsAt = await extendMembership({ ...parsed.data, adminId: admin.id });
    refresh(parsed.data.userId);
    return { ok: `Membership now runs until ${formatDate(endsAt)}.` };
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message };
    logError("admin-action", err);
    return { error: GENERIC_ERROR };
  }
}

/** End a seller's live membership immediately. */
export async function endMembershipAction(_prev, formData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!isId(userId)) return { error: "Invalid seller." };
  try {
    await endMembership({ userId });
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message };
    logError("admin-action", err);
    return { error: GENERIC_ERROR };
  }
  refresh(userId);
  return { ok: "Membership ended." };
}

/** Disable or re-enable a seller's account. */
export async function setAccountActiveAction(_prev, formData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!isId(userId)) return { error: "Invalid seller." };
  const active = formData.get("active") === "true";
  try {
    await setAccountActive({ userId, active });
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message };
    logError("admin-action", err);
    return { error: GENERIC_ERROR };
  }
  refresh(userId);
  return { ok: active ? "Account enabled." : "Account disabled." };
}
