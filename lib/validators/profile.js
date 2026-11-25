import { z } from "zod";
import { optionalPkPhone, password, pkPhone } from "./common.js";

/** Editable profile fields (email stays fixed; it's the login). */
export const profileSchema = z.object({
  name: z.string().trim().min(2, { message: "Enter your full name" }).max(80),
  phone: pkPhone,
  whatsapp: optionalPkPhone,
  city: z.string().trim().min(2, { message: "Enter your city" }).max(60),
});

/** Change password: current one required, new one confirmed. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Enter your current password" }).max(100),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
    when: (p) => typeof p.value?.newPassword === "string" && typeof p.value?.confirmPassword === "string",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from your current one",
    when: (p) => typeof p.value?.newPassword === "string" && typeof p.value?.currentPassword === "string",
  });
