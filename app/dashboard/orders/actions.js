"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth/dal";
import { getMemberAccess } from "@/lib/membership";
import { OrderError, cancelSellerOrder, createOrderWithPayment } from "@/lib/orders";
import { PaymentError, submitOrderPayment } from "@/lib/payments";
import { UploadError } from "@/lib/storage";
import { orderPaymentSchema, placeOrderSchema } from "@/lib/validators/order";
import { fieldErrors } from "@/lib/validators/common";
import { logError } from "@/lib/security/log";
import { LIMITS } from "@/lib/security/config";
import { checkLimit } from "@/lib/security/guard";

/** Errors whose message we can show as-is. */
const isUserError = (err) => err instanceof OrderError || err instanceof PaymentError || err instanceof UploadError;

/** Text fields echoed back so the form keeps them after an error. */
const TEXT_FIELDS = ["lines", "customerName", "customerPhone", "address", "city", "marketplace", "marketplaceOrderRef", "notes", "method", "transactionId"];

/**
 * Place an order for an end customer, with payment proof.
 * Only sellers with a live membership may order (checked here, server-side).
 * @param {Object} _prev
 * @param {FormData} formData
 */
export async function placeOrderAction(_prev, formData) {
  const seller = await requireSeller("/dashboard/orders/new");
  const access = await getMemberAccess();
  if (!access.isMember) {
    return { message: "You need an active membership to place orders. Please renew first." };
  }

  const values = Object.fromEntries(TEXT_FIELDS.map((k) => [k, String(formData.get(k) ?? "")]));
  const parsed = placeOrderSchema.safeParse({ ...values, screenshot: formData.get("screenshot") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const limited = checkLimit("order", seller.id, LIMITS.orderPlace);
  if (limited) return { ...limited, values };

  const { lines, method, transactionId, screenshot, ...customer } = parsed.data;
  let result;
  try {
    result = await createOrderWithPayment({
      sellerId: seller.id,
      lines,
      customer,
      payment: { method, transactionId, screenshot },
    });
  } catch (err) {
    if (isUserError(err)) return { message: err.message, values };
    logError("place-order", err);
    return { message: "Something went wrong while placing the order. Please try again.", values };
  }

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/orders/${result.orderId}?placed=1`);
}

/**
 * Submit (new) payment proof for an existing order, e.g. after a rejection.
 * Allowed even if the membership has since expired: the order already exists.
 * @param {Object} _prev
 * @param {FormData} formData
 */
export async function submitOrderPaymentAction(_prev, formData) {
  const seller = await requireSeller("/dashboard/orders");
  const values = {
    orderId: String(formData.get("orderId") ?? ""),
    method: String(formData.get("method") ?? ""),
    transactionId: String(formData.get("transactionId") ?? ""),
  };
  const parsed = orderPaymentSchema.safeParse({ ...values, screenshot: formData.get("screenshot") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const limited = checkLimit("payment", seller.id, LIMITS.paymentSubmit);
  if (limited) return { ...limited, values };

  try {
    await submitOrderPayment({ userId: seller.id, ...parsed.data });
  } catch (err) {
    if (isUserError(err)) return { message: err.message, values };
    logError("order-payment", err);
    return { message: "Something went wrong while saving your payment. Please try again.", values };
  }
  revalidatePath(`/dashboard/orders/${parsed.data.orderId}`);
  redirect(`/dashboard/orders/${parsed.data.orderId}?paid=1`);
}

/**
 * Cancel an unpaid order.
 * @param {Object} _prev
 * @param {FormData} formData
 */
export async function cancelOrderAction(_prev, formData) {
  const seller = await requireSeller("/dashboard/orders");
  const orderId = String(formData.get("orderId") ?? "");
  if (!/^[a-f0-9]{24}$/i.test(orderId)) return { message: "Order not found." };
  try {
    await cancelSellerOrder(seller.id, orderId);
  } catch (err) {
    if (isUserError(err)) return { message: err.message };
    logError("cancel-order", err);
    return { message: "Something went wrong. Please try again." };
  }
  revalidatePath(`/dashboard/orders/${orderId}`);
  return { ok: true };
}
