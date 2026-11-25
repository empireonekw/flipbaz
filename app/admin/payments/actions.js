"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { PaymentError, approvePayment, rejectPayment } from "@/lib/payments";

const reviewSchema = z.object({
  paymentId: z.string().regex(/^[a-f0-9]{24}$/i),
  decision: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional().default(""),
});

/**
 * Admin approves or rejects a payment. Approval activates the membership (or
 * confirms the order) through the payments service.
 * @param {Object} _prev
 * @param {FormData} formData
 * @returns {Promise<{ ok?: string, error?: string }>}
 */
export async function reviewPaymentAction(_prev, formData) {
  const admin = await requireAdmin();
  const parsed = reviewSchema.safeParse({
    paymentId: formData.get("paymentId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { error: "Invalid request." };
  const { paymentId, decision, note } = parsed.data;

  try {
    if (decision === "approve") {
      await approvePayment({ paymentId, adminId: admin.id, note });
    } else {
      await rejectPayment({ paymentId, adminId: admin.id, note });
    }
  } catch (err) {
    if (err instanceof PaymentError) return { error: err.message };
    console.error("Payment review failed:", err);
    return { error: "Something went wrong. Please try again." };
  }
  revalidatePath("/admin/payments");
  return { ok: decision === "approve" ? "Payment approved." : "Payment rejected." };
}
