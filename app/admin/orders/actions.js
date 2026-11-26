"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { AdminError } from "@/lib/admin/common";
import { updateOrder } from "@/lib/admin/orders";
import { orderUpdateSchema } from "@/lib/validators/admin";
import { fieldErrors, formToObject } from "@/lib/validators/common";

/**
 * Update an order's status / courier / tracking (admin only).
 * @param {Object} _prev
 * @param {FormData} formData
 */
export async function updateOrderAction(_prev, formData) {
  const admin = await requireAdmin();
  const raw = formToObject(formData);
  const parsed = orderUpdateSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  try {
    await updateOrder({ ...parsed.data, adminId: admin.id });
  } catch (err) {
    if (err instanceof AdminError) return { error: err.message, values: raw };
    console.error("Admin order update failed:", err);
    return { error: "Something went wrong. Please try again.", values: raw };
  }
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/orders");
  return { ok: "Order updated." };
}
