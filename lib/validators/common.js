import { z } from "zod";

/**
 * Shared zod building blocks. Client-safe (no server imports).
 */

/**
 * Pakistani mobile number. Accepts 03XXXXXXXXX, +923XXXXXXXXX or 923XXXXXXXXX
 * (spaces/dashes allowed) and normalises to 03XXXXXXXXX.
 */
export const pkPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(\+92|92|0)3\d{9}$/.test(v), {
    message: "Enter a mobile number like 0300 1234567",
  })
  .transform((v) => v.replace(/^(\+92|92)/, "0"));

/** Same as pkPhone but empty is allowed (returns ""). */
export const optionalPkPhone = z.union([z.literal(""), pkPhone]).default("");

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: "Enter a valid email address" }))
  .refine((v) => v.length <= 120, { message: "Email is too long" });

export const password = z
  .string()
  .min(8, { message: "Use at least 8 characters" })
  .max(100, { message: "Password is too long" });

/**
 * Convert FormData into a plain object (last value wins for repeated keys).
 * @param {FormData} formData
 * @returns {Record<string, string>}
 */
export function formToObject(formData) {
  const out = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue;
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/**
 * Flatten zod errors to { field: "first message" } for forms.
 * @param {import("zod").ZodError} error
 * @returns {Record<string, string>}
 */
export function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
