import { z } from "zod";
import { PRODUCT_REQUEST_STATUSES, REQUEST_SHIPPING_MODES, SHIP_TO_COUNTRIES } from "@/lib/models/constants";

/** A seller's custom product request. Photos are checked separately. */
export const productRequestSchema = z.object({
  title: z.string().trim().min(3, { message: "Tell us what you're looking for" }).max(120, { message: "Keep the title under 120 characters" }),
  details: z.string().trim().max(1000, { message: "Keep the description under 1000 characters" }).default(""),
  categoryId: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[a-f0-9]{24}$/i.test(v), { message: "Choose a category" })
    .default(""),
  variants: z.string().trim().max(200, { message: "Keep this under 200 characters" }).default(""),
  shipping: z.enum(REQUEST_SHIPPING_MODES, { message: "Choose who ships it" }),
  shipTo: z.enum(SHIP_TO_COUNTRIES, { message: "Choose where your buyers are" }),
  referenceUrl: z
    .string()
    .trim()
    .max(500, { message: "That link is too long" })
    .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), { message: "Paste a full link starting with https://" })
    .default(""),
  notes: z.string().trim().max(500, { message: "Keep notes under 500 characters" }).default(""),
});

/** Admin reply to a custom request. */
export const productRequestReplySchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(PRODUCT_REQUEST_STATUSES, { message: "Choose a status" }),
  adminReply: z.string().trim().max(500, { message: "Keep the reply under 500 characters" }).default(""),
  productSlug: z.string().trim().max(120).default(""),
});
