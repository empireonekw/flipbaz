import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { ServiceRequest } from "@/lib/models";
import { SERVICE_OPEN_STATUSES } from "@/lib/models/constants";
import { emitToAdmins } from "@/lib/realtime";
import { serialize } from "@/lib/serialize";

/**
 * Seller side of Services (store management applications). Admin handling
 * lives in lib/admin/services.js.
 */

/** Error whose message is safe to show the seller. */
export class ServiceError extends Error {}

/**
 * The seller's applications, newest first. Each has `meetingUpcoming`: the
 * Google Meet call hasn't started more than 2 hours ago.
 * @param {string} sellerId
 * @returns {Promise<Object[]>}
 */
export async function listSellerApplications(sellerId) {
  await connectDB();
  const items = await ServiceRequest.find({ seller: sellerId }).sort({ createdAt: -1 }).limit(50).select("-seller -__v -history.by").lean();
  const cutoff = Date.now() - 2 * 3600e3;
  return serialize(items.map((a) => ({ ...a, meetingUpcoming: Boolean(a.meeting?.at && new Date(a.meeting.at).getTime() > cutoff) })));
}

/**
 * The seller's open application (one at a time), if any.
 * @param {string} sellerId
 */
export async function getOpenApplication(sellerId) {
  await connectDB();
  const doc = await ServiceRequest.findOne({ seller: sellerId, status: { $in: SERVICE_OPEN_STATUSES } }).select("_id status").lean();
  return doc ? serialize(doc) : null;
}

/**
 * Submit an application. Only one open application per seller.
 * @param {string} sellerId
 * @param {Object} data  validated by serviceApplicationSchema
 * @returns {Promise<string>} new id
 * @throws {ServiceError}
 */
export async function submitApplication(sellerId, data) {
  if (await getOpenApplication(sellerId)) {
    throw new ServiceError("You already have an application in progress. We'll be in touch about it soon.");
  }
  const { firstName, lastName, email, phone, country, method, ...rest } = data;
  const doc = await ServiceRequest.create({
    seller: sellerId,
    contact: { firstName, lastName, email, phone, country, method },
    experience: rest.experience,
    sellerType: rest.sellerType,
    budget: rest.budget,
    platforms: rest.platforms.map((p) => ({ platform: p.platform, account: p.account, handle: p.handle || undefined })),
    goals: rest.goals || undefined,
    status: "SUBMITTED",
    history: [{ status: "SUBMITTED", note: "Application sent", by: sellerId }],
  });
  emitToAdmins("service:new", { id: String(doc._id) });
  return String(doc._id);
}

/**
 * Seller withdraws an open application.
 * @param {string} sellerId
 * @param {string} id
 * @throws {ServiceError}
 */
export async function withdrawApplication(sellerId, id) {
  if (!mongoose.isValidObjectId(id)) throw new ServiceError("Application not found.");
  await connectDB();
  const res = await ServiceRequest.updateOne(
    { _id: id, seller: sellerId, status: { $in: SERVICE_OPEN_STATUSES } },
    { $set: { status: "WITHDRAWN" }, $push: { history: { status: "WITHDRAWN", note: "Withdrawn by seller", by: sellerId, at: new Date() } } }
  );
  if (!res.modifiedCount) throw new ServiceError("This application can't be withdrawn any more.");
}
