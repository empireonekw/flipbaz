import { z } from "zod";
import { PAYMENT_METHODS } from "../models/constants.js";

const MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Screenshot upload. The server re-checks the real file type from its bytes
 * in lib/storage.js; this gives quick, friendly messages first.
 */
export const screenshotFile = z
  .any()
  .refine((f) => f && typeof f === "object" && typeof f.arrayBuffer === "function" && f.size > 0, {
    message: "Please attach a screenshot of your payment",
  })
  .refine((f) => !f?.size || f.size <= MAX_BYTES, { message: "Screenshot must be 5 MB or smaller" })
  .refine((f) => !f?.type || IMAGE_TYPES.includes(f.type), {
    message: "Screenshot must be a JPG, PNG, WebP or GIF image",
  });

/** Shared proof-of-payment fields. */
export const paymentProofFields = {
  method: z.enum(PAYMENT_METHODS, { message: "Choose how you paid" }),
  transactionId: z
    .string()
    .trim()
    .min(4, { message: "Enter the transaction ID from your payment receipt" })
    .max(60, { message: "Transaction ID is too long" })
    .regex(/^[A-Za-z0-9\-_/. ]+$/, { message: "Use only letters, numbers and - _ / ." }),
  screenshot: screenshotFile,
};

/** Membership checkout form. */
export const membershipPaymentSchema = z.object({
  planId: z.string().regex(/^[a-f0-9]{24}$/i, { message: "Please choose a plan" }),
  ...paymentProofFields,
});
