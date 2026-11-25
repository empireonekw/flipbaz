"use server";

import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/lib/models";
import { contactSchema } from "@/lib/validators/contact";
import { fieldErrors, formToObject } from "@/lib/validators/common";

/**
 * Save a contact-form message for the admin inbox.
 * Bots that fill the hidden honeypot get a fake success and nothing is saved.
 * @param {Object} _prev
 * @param {FormData} formData
 * @returns {Promise<{ ok?: boolean, errors?: Record<string,string>, values?: Record<string,string>, message?: string }>}
 */
export async function sendContactMessage(_prev, formData) {
  const raw = formToObject(formData);
  if (raw.website) return { ok: true };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  try {
    await connectDB();
    const { name, email, phone, message } = parsed.data;
    await ContactMessage.create({ name, email, phone, message });
  } catch (err) {
    console.error("Contact message failed:", err.message);
    return {
      message: "We couldn't send your message just now. Please try again, or reach us on WhatsApp.",
      values: raw,
    };
  }
  return { ok: true };
}
