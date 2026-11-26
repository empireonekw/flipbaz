"use server";

import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/lib/models";
import { contactSchema } from "@/lib/validators/contact";
import { fieldErrors, formToObject } from "@/lib/validators/common";
import { LIMITS } from "@/lib/security/config";
import { checkBlocked, checkLimit, requestIp } from "@/lib/security/guard";

/** Fields echoed back to the form after an error (never the honeypot). */
const ECHO = ["name", "email", "phone", "message"];
import { logError } from "@/lib/security/log";

/**
 * Save a contact-form message for the admin inbox.
 * Bots that fill the hidden honeypot get a fake success and nothing is saved.
 * @param {Object} _prev
 * @param {FormData} formData
 * @returns {Promise<{ ok?: boolean, errors?: Record<string,string>, values?: Record<string,string>, message?: string }>}
 */
export async function sendContactMessage(_prev, formData) {
  const raw = formToObject(formData);
  const values = Object.fromEntries(ECHO.map((k) => [k, String(raw[k] ?? "").slice(0, 3000)]));
  if (raw.website) return { ok: true };

  const ip = await requestIp();
  const gate = checkBlocked(ip) ?? checkLimit("contact-ip", ip, LIMITS.contactPerIp);
  if (gate) return { ...gate, values };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  try {
    await connectDB();
    const { name, email, phone, message } = parsed.data;
    await ContactMessage.create({ name, email, phone, message });
  } catch (err) {
    logError("contact-message", err);
    return {
      message: "We couldn't send your message just now. Please try again, or reach us on WhatsApp.",
      values,
    };
  }
  return { ok: true };
}
