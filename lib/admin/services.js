import "server-only";
import { connectDB } from "@/lib/db";
import { ServiceRequest } from "@/lib/models";
import { SERVICE_STATUSES, SERVICE_STATUS_LABELS } from "@/lib/models/constants";
import { formatDateTime, formatPKR } from "@/lib/format";
import { notify } from "@/lib/notifications";
import { serialize } from "@/lib/serialize";
import { ADMIN_PAGE_SIZE, AdminError, assertId, pageNum } from "./common";

/**
 * Admin side of store-management applications.
 */

/**
 * Applications for the admin queue; open ones oldest first.
 * @param {{ status?: string, page?: number }} opts
 */
export async function listApplications({ status, page } = {}) {
  await connectDB();
  const where = SERVICE_STATUSES.includes(status) ? { status } : {};
  const p = pageNum(page);
  const [items, total, countsAgg] = await Promise.all([
    ServiceRequest.find(where)
      .sort(status === "SUBMITTED" ? { createdAt: 1 } : { updatedAt: -1 })
      .skip((p - 1) * ADMIN_PAGE_SIZE)
      .limit(ADMIN_PAGE_SIZE)
      .populate("seller", "name email storeName")
      .select("-history.by")
      .lean(),
    ServiceRequest.countDocuments(where),
    ServiceRequest.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  return { items: serialize(items), counts: Object.fromEntries(countsAgg.map((c) => [c._id, c.n])), page: p, pages: Math.ceil(total / ADMIN_PAGE_SIZE) };
}

/**
 * "2026-12-02T15:30" typed in Pakistan time (UTC+5, no DST) → Date.
 * @param {string} local
 */
const fromPkLocal = (local) => new Date(`${local}:00+05:00`);

/**
 * Update an application: status, Google Meet meeting, quote, note. Tells the
 * seller in their Updates feed what changed.
 * @param {Object} input  validated by serviceUpdateSchema
 * @param {string} adminId
 * @throws {AdminError}
 */
export async function updateApplication(input, adminId) {
  assertId(input.id, "Application");
  await connectDB();
  const doc = await ServiceRequest.findById(input.id);
  if (!doc) throw new AdminError("Application not found.");

  const $set = { status: input.status };
  if (input.meetingAt) {
    const at = fromPkLocal(input.meetingAt);
    if (Number.isNaN(at.getTime())) throw new AdminError("That meeting time isn't valid.");
    $set["meeting.at"] = at;
  }
  if (input.meetingUrl) $set["meeting.url"] = input.meetingUrl;
  $set["meeting.note"] = input.meetingNote || undefined;
  if (input.quoteAmount != null) $set["quote.amount"] = input.quoteAmount;
  $set["quote.details"] = input.quoteDetails || undefined;
  $set.adminNote = input.note || undefined;

  const statusChanged = input.status !== doc.status;
  const meetingChanged =
    (input.meetingUrl && input.meetingUrl !== doc.meeting?.url) ||
    (input.meetingAt && $set["meeting.at"]?.getTime() !== doc.meeting?.at?.getTime());

  doc.set($set);
  if (statusChanged || input.note || meetingChanged) {
    doc.history.push({ status: input.status, note: input.note || (meetingChanged ? "Meeting updated" : undefined), by: adminId, at: new Date() });
  }
  await doc.save();

  if (!statusChanged && !meetingChanged && !input.note) return;
  const s = input.status;
  const body =
    s === "MEETING_SCHEDULED"
      ? `Google Meet call on ${formatDateTime(doc.meeting.at)} (Pakistan time). Open Services to join.`
      : s === "QUOTE_READY"
        ? `Your quote: ${formatPKR(doc.quote.amount)} per month. Open Services for the details.`
        : s === "ACTIVE"
          ? "We're now running your stores. Welcome aboard!"
          : input.note || SERVICE_STATUS_LABELS[s];
  await notify(String(doc.seller), {
    type: "SERVICE",
    title: `Store management: ${SERVICE_STATUS_LABELS[s]}`,
    body: input.note && s !== "DECLINED" ? `${body} Note: ${input.note}` : body,
    href: "/dashboard/services",
  });
}
