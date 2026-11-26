import { z } from "zod";
import { ORDER_STATUSES, PLAN_MONTHS } from "../models/constants.js";

/**
 * zod schemas for admin forms. Text-only fields; image files are validated
 * separately by lib/storage.js (byte sniffing + size limit).
 */

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Use lowercase letters, numbers and dashes" })
  .optional()
  .or(z.literal(""));

/**
 * Whole-rupee amount. Empty input is an error (plain z.coerce would turn ""
 * into 0 and silently list a product for free).
 */
const money = (label) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce
      .number({ message: `Enter ${label.toLowerCase()}` })
      .refine((n) => !Number.isNaN(n), { message: `Enter ${label.toLowerCase()}` })
      .pipe(
        z
          .number()
          .int({ message: `${label} must be a whole number` })
          .min(0, { message: `${label} can't be negative` })
          .max(10_000_000, { message: `${label} is too large` })
      )
  );

/** "S, M, L" or one per line → ["S","M","L"] (deduplicated, trimmed). */
const listField = z
  .string()
  .optional()
  .default("")
  .transform((s) => [...new Set(s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean))].slice(0, 30));

/** HTML checkbox: "on" when ticked, absent when not. */
const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

export const productSchema = z
  .object({
    title: z.string().trim().min(3, { message: "Enter a product title" }).max(120),
    slug: slugField,
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .min(2, { message: "Enter a SKU" })
      .max(40)
      .regex(/^[A-Z0-9-]+$/, { message: "Use letters, numbers and dashes" }),
    category: z.string().regex(/^[a-f0-9]{24}$/i, { message: "Choose a category" }),
    description: z.string().trim().min(20, { message: "Write at least a couple of sentences" }).max(4000),
    costPrice: money("Cost price"),
    suggestedRetailPrice: money("Suggested price"),
    sizes: listField,
    colors: listField,
    processingDays: z.coerce.number().int().min(0).max(60),
    active: checkbox,
  })
  .refine((d) => d.suggestedRetailPrice >= d.costPrice, {
    path: ["suggestedRetailPrice"],
    message: "Suggested price should be at least the cost price",
    when: (p) => Number.isFinite(p.value?.costPrice) && Number.isFinite(p.value?.suggestedRetailPrice),
  });

export const categorySchema = z.object({
  name: z.string().trim().min(2, { message: "Enter a name" }).max(60),
  slug: slugField,
  description: z.string().trim().max(300).optional().default(""),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const planSchema = z.object({
  name: z.string().trim().min(2, { message: "Enter a plan name" }).max(60),
  months: z.coerce.number().refine((m) => PLAN_MONTHS.includes(m), { message: "Choose 1, 3, 6 or 12 months" }),
  pricePerMonth: money("Price per month"),
  totalPrice: z.union([z.literal(""), money("Total price")]).optional(),
  features: z
    .string()
    .optional()
    .default("")
    .transform((s) => s.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 10)),
  isRecommended: checkbox,
  active: checkbox,
});

export const orderUpdateSchema = z.object({
  orderId: z.string().regex(/^[a-f0-9]{24}$/i),
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional().default(""),
  courier: z.string().trim().max(60).optional().default(""),
  trackingNumber: z.string().trim().max(60).optional().default(""),
});

export const extendMembershipSchema = z.object({
  userId: z.string().regex(/^[a-f0-9]{24}$/i),
  amount: z.coerce.number().int().min(1).max(36),
  unit: z.enum(["days", "months"]),
  note: z.string().trim().max(300).optional().default(""),
});
