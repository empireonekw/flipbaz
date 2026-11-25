import "server-only";
import { saveImage } from "@/lib/storage";

/**
 * Payment providers. Today there is one, "manual": the seller pays by
 * JazzCash / EasyPaisa / bank transfer outside the app and submits proof,
 * which an admin reviews.
 *
 * To add a gateway (JazzCash / EasyPaisa merchant APIs, Safepay, …), add an
 * entry with the same shape:
 *   - `id`                     stored on Payment.provider
 *   - `collectProof(formData)` returns the fields to store on the Payment
 *   - `autoApprove`            true when the gateway confirms payment itself
 * For a redirect-style gateway, add a `startCheckout()` that returns a URL and
 * a webhook route that calls `approvePayment()` from ./service.js.
 */

/** @typedef {{ transactionId: string, screenshotUrl?: string }} ProofFields */

export const manualProvider = {
  id: "manual",
  autoApprove: false,
  /**
   * Save the screenshot and return proof fields for the Payment record.
   * @param {{ transactionId: string, screenshot: File }} input already validated
   * @returns {Promise<ProofFields>}
   */
  async collectProof({ transactionId, screenshot }) {
    const screenshotUrl = await saveImage(screenshot, { folder: "payments" });
    return { transactionId, screenshotUrl };
  },
};

/**
 * Provider used for a payment method. All methods are manual for now.
 * @param {"JAZZCASH"|"EASYPAISA"|"BANK_TRANSFER"} _method
 */
export function getProvider(_method) {
  return manualProvider;
}
