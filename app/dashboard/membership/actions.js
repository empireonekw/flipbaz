"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth/dal";
import { PaymentError, submitMembershipPayment } from "@/lib/payments";
import { UploadError } from "@/lib/storage";
import { membershipPaymentSchema } from "@/lib/validators/payment";
import { fieldErrors } from "@/lib/validators/common";

/**
 * Seller submits proof of payment for a membership plan.
 * @param {Object} _prev
 * @param {FormData} formData
 * @returns {Promise<{ errors?: Record<string,string>, message?: string, values?: Record<string,string> }>}
 */
export async function submitMembershipPaymentAction(_prev, formData) {
  const user = await requireSeller("/dashboard/membership");

  const values = {
    planId: String(formData.get("planId") ?? ""),
    method: String(formData.get("method") ?? ""),
    transactionId: String(formData.get("transactionId") ?? ""),
  };
  const parsed = membershipPaymentSchema.safeParse({ ...values, screenshot: formData.get("screenshot") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  try {
    await submitMembershipPayment({ userId: user.id, ...parsed.data });
  } catch (err) {
    if (err instanceof PaymentError || err instanceof UploadError) {
      return { message: err.message, values };
    }
    console.error("Membership payment failed:", err);
    return { message: "Something went wrong while saving your payment. Please try again.", values };
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/membership?submitted=1");
}
