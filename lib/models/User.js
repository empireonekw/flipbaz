import mongoose from "mongoose";
import { defineModel } from "./define.js";
import { ROLES } from "./constants.js";

/**
 * A Flip Baz account. Sellers buy memberships and place orders; admins run the
 * catalog, approve payments and fulfil orders.
 *
 * `passwordHash` is excluded from queries by default (`select: false`); ask for
 * it explicitly with `.select("+passwordHash")` when checking a login.
 *
 * @typedef {Object} User
 * @property {string} name
 * @property {string} email       unique, lower-cased
 * @property {string} [phone]
 * @property {string} [whatsapp]
 * @property {string} [city]
 * @property {string} passwordHash bcrypt hash
 * @property {"SELLER"|"ADMIN"} role
 * @property {boolean} isActive   false = account disabled by an admin
 */
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },
    phone: { type: String, trim: true, maxlength: 20 },
    whatsapp: { type: String, trim: true, maxlength: 20 },
    city: { type: String, trim: true, maxlength: 60 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "SELLER", index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = defineModel("User", UserSchema);
export default User;
