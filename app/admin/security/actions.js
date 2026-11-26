"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { unblockIp } from "@/lib/security/limiter";

/** Lift a block on an IP (or IPv6 /64). */
export async function unblockAction(_prev, formData) {
  await requireAdmin();
  const ip = String(formData.get("ip") ?? "").trim();
  if (!ip || ip.length > 64 || !/^[0-9a-f.:/]+$/i.test(ip)) return { error: "Invalid address." };
  unblockIp(ip);
  revalidatePath("/admin/security");
  return { ok: "Unblocked" };
}
