import mongoose from "mongoose";
import { defineModel } from "./define.js";

const { Schema } = mongoose;

/**
 * A support chat thread. Each seller has one ongoing thread with the Flip Baz
 * team; any admin can answer it.
 *
 * @typedef {Object} Conversation
 * @property {import("mongoose").Types.ObjectId} seller
 * @property {{ body: string, role: "SELLER"|"ADMIN", at: Date }} [lastMessage]
 * @property {number} sellerUnread   messages from admins the seller hasn't seen
 * @property {number} adminUnread    messages from the seller no admin has seen
 * @property {"OPEN"|"RESOLVED"} status
 */
const ConversationSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    lastMessage: {
      body: String,
      role: { type: String, enum: ["SELLER", "ADMIN"] },
      at: Date,
    },
    sellerUnread: { type: Number, default: 0, min: 0 },
    adminUnread: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["OPEN", "RESOLVED"], default: "OPEN", index: true },
  },
  { timestamps: true }
);

ConversationSchema.index({ "lastMessage.at": -1 });

export const Conversation = defineModel("Conversation", ConversationSchema);
export default Conversation;
