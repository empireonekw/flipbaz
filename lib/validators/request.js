import { z } from "zod";
import { PRODUCT_REQUEST_STATUSES } from "@/lib/models/constants";

/**
 * Optional positive whole number from a form field ("" → undefined).
 * @param {number} max
 * @param {string} message
 */
const optionalInt = (max, message) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/[,\s]/g, ""))
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= max), { message })
    .transform((v) => (v === "" ? undefined : Number(v)));

/** A seller's custom product request. The photo is checked separately. */
export const productRequestSchema = z.object({
  title: z.string().trim().min(3, { message: "Tell us what you're looking for" }).max(120, { message: "Keep the name under 120 characters" }),
  details: z.string().trim().max(1000, { message: "Keep details under 1000 characters" }).default(""),
  referenceUrl: z
    .string()
    .trim()
    .max(500, { message: "That link is too long" })
    .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), { message: "Paste a full link starting with https://" })
    .default(""),
  quantity: optionalInt(100000, "Enter a number of pieces, e.g. 20").default(""),
  targetPrice: optionalInt(10000000, "Enter a price in rupees, e.g. 2500").default(""),
});

/** Admin reply to a custom request. */
export const productRequestReplySchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(PRODUCT_REQUEST_STATUSES, { message: "Choose a status" }),
  adminReply: z.string().trim().max(500, { message: "Keep the reply under 500 characters" }).default(""),
  productSlug: z.string().trim().max(120).default(""),
});
