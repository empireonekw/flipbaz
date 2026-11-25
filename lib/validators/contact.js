import { z } from "zod";
import { email, optionalPkPhone } from "./common.js";

/** Public contact form. `website` is a honeypot: humans never fill it. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, { message: "Enter your name" }).max(80),
  email,
  phone: optionalPkPhone,
  message: z
    .string()
    .trim()
    .min(10, { message: "Please write at least a sentence (10+ characters)" })
    .max(3000, { message: "Please keep it under 3,000 characters" }),
  website: z.string().max(0).optional().default(""),
});
