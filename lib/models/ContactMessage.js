import mongoose from "mongoose";
import { defineModel } from "./define.js";

/**
 * A message sent through the public contact form.
 *
 * @typedef {Object} ContactMessage
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {string} message
 * @property {boolean} read  toggled by admins in the inbox
 */
const ContactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 20 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const ContactMessage =
  defineModel("ContactMessage", ContactMessageSchema);
export default ContactMessage;
