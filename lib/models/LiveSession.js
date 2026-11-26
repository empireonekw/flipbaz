import mongoose from "mongoose";
import { defineModel } from "./define.js";

/**
 * A live training / Q&A session for members (Zoom, Google Meet…).
 * The join link is never sent to the browser directly: sellers go through
 * /dashboard/sessions/[id]/join, which checks membership and timing first.
 *
 * @typedef {Object} LiveSession
 * @property {string} title
 * @property {string} [host]
 * @property {Date} startsAt
 * @property {number} durationMinutes
 * @property {string} joinUrl
 * @property {string} [description]
 * @property {boolean} active
 */
const LiveSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    host: { type: String, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500 },
    startsAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 60, min: 10, max: 600 },
    joinUrl: { type: String, required: true, trim: true, maxlength: 500 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/** Minutes before the start when the Join button unlocks. */
export const JOIN_OPENS_MINUTES = 15;

export const LiveSession = defineModel("LiveSession", LiveSessionSchema);
export default LiveSession;
