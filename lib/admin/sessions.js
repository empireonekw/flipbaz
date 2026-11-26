import "server-only";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { LiveSession } from "@/lib/models";
import { serialize } from "@/lib/serialize";
import { AdminError } from "./common";

/** "2026-11-26T21:00" from <input type="datetime-local">, read as Pakistan time. */
const pktDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, { message: "Choose a date and time" })
  .transform((v) => new Date(`${v}:00+05:00`))
  .refine((d) => !Number.isNaN(d.getTime()), { message: "Choose a date and time" });

export const sessionSchema = z.object({
  title: z.string().trim().min(4, { message: "Enter a title" }).max(140),
  host: z.string().trim().max(80).optional().default(""),
  description: z.string().trim().max(500).optional().default(""),
  startsAt: pktDateTime,
  durationMinutes: z.coerce.number().int().min(10).max(600),
  joinUrl: z
    .string()
    .trim()
    .url({ message: "Paste the full meeting link" })
    .refine((u) => u.startsWith("https://"), { message: "Use an https:// meeting link" }),
});

/** Upcoming and recent sessions for the admin list, with an `ended` flag. */
export async function listSessions() {
  await connectDB();
  const now = Date.now();
  const since = new Date(now - 7 * 86400e3);
  const list = await LiveSession.find({ startsAt: { $gte: since } }).sort({ startsAt: 1 }).lean();
  return serialize(list.map((s) => ({ ...s, ended: new Date(s.startsAt).getTime() + s.durationMinutes * 60000 < now })));
}

/** @param {Object} data validated sessionSchema output */
export async function createSession(data) {
  await connectDB();
  const s = await LiveSession.create({ ...data, active: true });
  return String(s._id);
}

/** @param {string} id */
export async function deleteSession(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) throw new AdminError("Session not found.");
  const res = await LiveSession.deleteOne({ _id: id });
  if (!res.deletedCount) throw new AdminError("Session not found.");
}
