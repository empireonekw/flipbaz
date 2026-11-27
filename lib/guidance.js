import "server-only";
import { connectDB } from "@/lib/db";
import { LiveSession } from "@/lib/models";
import { serialize } from "@/lib/serialize";

/**
 * Data for the seller Guidance page: the next live session and past ones
 * (with whether a recording exists). Meeting and recording links are never
 * returned; members reach them through /dashboard/sessions/[id]/join|watch.
 */
export async function getGuidanceSessions() {
  await connectDB();
  const now = new Date();
  const endsAfter = { $expr: { $gt: [{ $add: ["$startsAt", { $multiply: ["$durationMinutes", 60000] }] }, now] } };
  const endedBefore = { $expr: { $lte: [{ $add: ["$startsAt", { $multiply: ["$durationMinutes", 60000] }] }, now] } };
  const fields = "title host description startsAt durationMinutes recordingUrl";
  const [next, past] = await Promise.all([
    LiveSession.findOne({ active: true, ...endsAfter }).sort({ startsAt: 1 }).select(fields).lean(),
    LiveSession.find({ active: true, ...endedBefore }).sort({ startsAt: -1 }).limit(12).select(fields).lean(),
  ]);
  const strip = ({ recordingUrl, ...s }) => ({ ...s, hasRecording: Boolean(recordingUrl) });
  return serialize({ next: next ? strip(next) : null, past: past.map(strip) });
}
