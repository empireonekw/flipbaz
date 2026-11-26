import mongoose from "mongoose";
import { defineModel } from "./define.js";

const { Schema } = mongoose;

/** Max characters per chat message. */
export const CHAT_MAX_LENGTH = 2000;

/**
 * One message in a support conversation. Plain text only (rendered as text,
 * never as HTML).
 *
 * @typedef {Object} ChatMessage
 * @property {import("mongoose").Types.ObjectId} conversation
 * @property {import("mongoose").Types.ObjectId} sender
 * @property {"SELLER"|"ADMIN"} role
 * @property {string} senderName  snapshot for display
 * @property {string} body
 */
const ChatMessageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["SELLER", "ADMIN"], required: true },
    senderName: { type: String, trim: true, maxlength: 80 },
    body: { type: String, required: true, trim: true, maxlength: CHAT_MAX_LENGTH },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ conversation: 1, createdAt: -1 });

export const ChatMessage = defineModel("ChatMessage", ChatMessageSchema);
export default ChatMessage;
