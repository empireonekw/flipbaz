import { z } from "zod";
import { email } from "./common.js";
import {
  MANAGED_PLATFORMS,
  PLATFORM_ACCOUNT_STATES,
  SERVICE_BUDGETS,
  SERVICE_CONTACT_METHODS,
  SERVICE_EXPERIENCE,
  SERVICE_SELLER_TYPES,
  SERVICE_STATUSES,
} from "../models/constants.js";

/** International phone / WhatsApp: digits with optional +, spaces, dashes. */
const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ""))
  .refine((v) => /^\+?\d{7,15}$/.test(v), { message: "Enter a phone number like +92 300 1234567" });

const platformSchema = z
  .object({
    platform: z.enum(MANAGED_PLATFORMS),
    account: z.enum(PLATFORM_ACCOUNT_STATES, { message: "Tell us if you have an account" }),
    handle: z.string().trim().max(200, { message: "Keep this under 200 characters" }).default(""),
  })
  .refine((p) => p.account === "NONE" || p.handle.length >= 2, { message: "Add your store link or username", path: ["handle"] });

/**
 * Store-management application. Field names match the form; the action
 * turns per-platform inputs (`account_ETSY`, `handle_ETSY`) into `platforms`.
 */
export const serviceApplicationSchema = z.object({
  firstName: z.string().trim().min(1, { message: "Enter your first name" }).max(40),
  lastName: z.string().trim().min(1, { message: "Enter your last name" }).max(40),
  email,
  phone,
  country: z.string().trim().min(2, { message: "Enter your country" }).max(60),
  method: z.enum(SERVICE_CONTACT_METHODS, { message: "Choose how to contact you" }),
  experience: z.enum(SERVICE_EXPERIENCE, { message: "Select your e-commerce experience" }),
  sellerType: z.enum(SERVICE_SELLER_TYPES, { message: "Select what best describes you" }),
  budget: z.enum(SERVICE_BUDGETS, { message: "Select your monthly budget" }),
  platforms: z.array(platformSchema).min(1, { message: "Choose at least one platform" }).max(MANAGED_PLATFORMS.length),
  goals: z.string().trim().max(1000, { message: "Keep this under 1000 characters" }).default(""),
});

/**
 * Admin update. Google Meet links only, so sellers always know where the call is.
 * `meetingAt` comes from <input type="datetime-local"> and is read as Pakistan time.
 */
export const serviceUpdateSchema = z
  .object({
    id: z.string().regex(/^[a-f0-9]{24}$/i, { message: "Application not found" }),
    status: z.enum(SERVICE_STATUSES, { message: "Choose a status" }),
    meetingAt: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v), { message: "Pick a date and time" })
      .default(""),
    meetingUrl: z
      .string()
      .trim()
      .refine((v) => v === "" || /^https:\/\/meet\.google\.com\/[a-z0-9-]{6,40}(\?[^\s]*)?$/i.test(v), { message: "Paste a Google Meet link (https://meet.google.com/…)" })
      .default(""),
    meetingNote: z.string().trim().max(300).default(""),
    quoteAmount: z
      .string()
      .trim()
      .transform((v) => v.replace(/[,\s]/g, ""))
      .refine((v) => v === "" || /^\d{1,9}$/.test(v), { message: "Enter the monthly fee in rupees" })
      .transform((v) => (v === "" ? undefined : Number(v))),
    quoteDetails: z.string().trim().max(1000).default(""),
    note: z.string().trim().max(500, { message: "Keep the note under 500 characters" }).default(""),
  })
  .superRefine((d, ctx) => {
    if (d.status === "MEETING_SCHEDULED" && (!d.meetingAt || !d.meetingUrl)) {
      ctx.addIssue({ code: "custom", path: ["meetingUrl"], message: "Add the meeting time and Google Meet link" });
    }
    if (d.status === "QUOTE_READY" && !d.quoteAmount) {
      ctx.addIssue({ code: "custom", path: ["quoteAmount"], message: "Add the monthly fee for the quote" });
    }
    if (d.status === "DECLINED" && !d.note) {
      ctx.addIssue({ code: "custom", path: ["note"], message: "Tell the seller why" });
    }
  });
