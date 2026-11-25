import { z } from "zod";
import { MARKETPLACES } from "../models/constants.js";
import { pkPhone } from "./common.js";
import { paymentProofFields } from "./payment.js";

/** One line as sent by the order form (prices are looked up server-side). */
export const orderLineSchema = z.object({
  productId: z.string().regex(/^[a-f0-9]{24}$/i, { message: "Choose a product" }),
  qty: z.coerce.number().int().min(1, { message: "Quantity must be at least 1" }).max(50, { message: "Max 50 per line" }),
  size: z.string().trim().max(30).optional().default(""),
  color: z.string().trim().max(40).optional().default(""),
});

/** The `lines` field arrives as a JSON string from a hidden input. */
const linesField = z
  .string()
  .transform((s, ctx) => {
    try {
      return JSON.parse(s);
    } catch {
      ctx.addIssue({ code: "custom", message: "Add at least one product" });
      return z.NEVER;
    }
  })
  .pipe(z.array(orderLineSchema).min(1, { message: "Add at least one product" }).max(20, { message: "Up to 20 items per order" }));

/** End customer + marketplace details. */
export const orderCustomerSchema = z.object({
  customerName: z.string().trim().min(2, { message: "Enter the customer's name" }).max(80),
  customerPhone: pkPhone,
  address: z.string().trim().min(10, { message: "Enter the full delivery address" }).max(300),
  city: z.string().trim().min(2, { message: "Enter the city" }).max(60),
  marketplace: z.enum(MARKETPLACES, { message: "Choose where you made the sale" }),
  marketplaceOrderRef: z.string().trim().max(60).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
});

/** Full "place order" form. */
export const placeOrderSchema = orderCustomerSchema.extend({
  lines: linesField,
  ...paymentProofFields,
});

/** Re-submitting payment proof for an existing order. */
export const orderPaymentSchema = z.object({
  orderId: z.string().regex(/^[a-f0-9]{24}$/i),
  ...paymentProofFields,
});
