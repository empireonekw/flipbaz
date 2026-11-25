import { z } from "zod";
import { email, optionalPkPhone, password, pkPhone } from "./common.js";

/** Login form. */
export const loginSchema = z.object({
  email,
  password: z.string().min(1, { message: "Enter your password" }).max(100),
});

/** Seller sign-up form. */
export const signupSchema = z
  .object({
    name: z.string().trim().min(2, { message: "Enter your full name" }).max(80),
    email,
    phone: pkPhone,
    whatsapp: optionalPkPhone,
    city: z.string().trim().min(2, { message: "Enter your city" }).max(60),
    password,
    confirmPassword: z.string(),
    terms: z.literal("on", { message: "Please accept the terms to continue" }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
    // Run even when other fields fail, so every error shows in one pass.
    when: (payload) =>
      typeof payload.value?.password === "string" &&
      typeof payload.value?.confirmPassword === "string",
  });

/**
 * Only allow same-site relative redirects after login (blocks
 * "//evil.com" and "https://..." open redirects).
 * @param {unknown} next
 * @returns {string | null}
 */
export function safeNextPath(next) {
  if (typeof next !== "string") return null;
  // Browsers treat "\" like "/", so "/\evil.com" would become "//evil.com".
  if (!next.startsWith("/") || next.startsWith("//") || /[\\\s]/.test(next)) return null;
  return next.slice(0, 200);
}
