import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Membership, Plan } from "@/lib/models";
import { serialize } from "@/lib/serialize";
import { AdminError } from "./common";

/** All plans (active and hidden) with how many memberships used each. */
export async function listPlans() {
  await connectDB();
  const [plans, usage] = await Promise.all([
    Plan.find().sort({ months: 1, createdAt: 1 }).lean(),
    Membership.aggregate([{ $group: { _id: "$plan", n: { $sum: 1 } } }]),
  ]);
  const used = new Map(usage.map((u) => [String(u._id), u.n]));
  return serialize(plans.map((p) => ({ ...p, membershipCount: used.get(String(p._id)) ?? 0 })));
}

/** @param {string} id */
export async function getPlan(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  return serialize(await Plan.findById(id).lean());
}

/**
 * Create or update a plan. Total defaults to months × monthly price. Only one
 * plan can be "recommended" at a time.
 * @param {{ id?: string, data: Object }} input
 * @returns {Promise<string>}
 */
export async function savePlan({ id, data }) {
  await connectDB();
  const existing = id ? await Plan.findById(id) : null;
  if (id && !existing) throw new AdminError("Plan not found.");
  const totalPrice = data.totalPrice === "" || data.totalPrice == null ? data.months * data.pricePerMonth : data.totalPrice;

  const doc = existing ?? new Plan();
  doc.set({ ...data, totalPrice });
  await doc.save();
  if (doc.isRecommended) await Plan.updateMany({ _id: { $ne: doc._id } }, { $set: { isRecommended: false } });
  return String(doc._id);
}

/**
 * Delete a plan nobody has bought; otherwise it must be hidden instead so
 * membership history stays intact.
 * @param {string} id
 */
export async function deletePlan(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) throw new AdminError("Plan not found.");
  if (await Membership.exists({ plan: id })) throw new AdminError("Sellers have bought this plan. Hide it instead of deleting.");
  const res = await Plan.deleteOne({ _id: id });
  if (!res.deletedCount) throw new AdminError("Plan not found.");
}
