import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Membership, Order, Payment, Plan, addMonths } from "@/lib/models";
import { deleteStoredFile } from "@/lib/storage";
import { getProvider } from "./providers";

/**
 * Payment service: the ONE place that creates payments and applies their
 * effects (activating memberships, confirming orders). UI code and future
 * gateway webhooks both call these functions.
 */

/** Error with a message that is safe to show the user. */
export class PaymentError extends Error {}

/**
 * Throw if this wallet/bank transaction ID was already used on a payment that
 * wasn't rejected (stops the same receipt being submitted twice).
 * @param {string} method
 * @param {string} transactionId
 */
async function assertUnusedTransaction(method, transactionId) {
  const dupe = await Payment.exists({
    method,
    transactionId: new RegExp(`^${transactionId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    status: { $ne: "REJECTED" },
  });
  if (dupe) {
    throw new PaymentError("This transaction ID has already been submitted. Please check it and try again.");
  }
}

/**
 * The seller's in-progress membership purchase, if any: a PENDING membership
 * plus its latest payment.
 * @param {string} userId
 * @returns {Promise<{ membership: Object, payment: Object|null } | null>}
 */
export async function getPendingMembership(userId) {
  await connectDB();
  const membership = await Membership.findOne({ user: userId, status: "PENDING" }).sort({ createdAt: -1 }).lean();
  if (!membership) return null;
  const payment = membership.payment ? await Payment.findById(membership.payment).lean() : null;
  return { membership, payment };
}

/**
 * Seller submits proof for a membership plan. Creates (or reuses, after a
 * rejection) a PENDING membership and a PENDING payment.
 *
 * @param {Object} input
 * @param {string} input.userId
 * @param {string} input.planId
 * @param {"JAZZCASH"|"EASYPAISA"|"BANK_TRANSFER"} input.method
 * @param {string} input.transactionId
 * @param {File} input.screenshot
 * @returns {Promise<{ membershipId: string, paymentId: string }>}
 * @throws {PaymentError}
 */
export async function submitMembershipPayment({ userId, planId, method, transactionId, screenshot }) {
  await connectDB();
  if (!mongoose.isValidObjectId(planId)) throw new PaymentError("Please choose a plan.");
  const plan = await Plan.findOne({ _id: planId, active: true }).lean();
  if (!plan) throw new PaymentError("That plan is no longer available. Please choose another.");

  const pending = await getPendingMembership(userId);
  if (pending?.payment?.status === "PENDING") {
    throw new PaymentError("You already have a payment waiting for review. We'll update you shortly.");
  }
  await assertUnusedTransaction(method, transactionId);

  const proof = await getProvider(method).collectProof({ transactionId, screenshot });

  // Reuse a PENDING membership whose last payment was rejected; otherwise start one.
  let membership = pending?.membership ? await Membership.findById(pending.membership._id) : null;
  if (!membership) membership = new Membership({ user: userId, status: "PENDING" });
  membership.plan = plan._id;
  membership.planSnapshot = { name: plan.name, months: plan.months, totalPrice: plan.totalPrice };

  try {
    const payment = await Payment.create({
      user: userId,
      purpose: "MEMBERSHIP",
      amount: plan.totalPrice,
      method,
      ...proof,
      provider: getProvider(method).id,
      membership: membership._id,
    });
    membership.payment = payment._id;
    await membership.save();
    return { membershipId: String(membership._id), paymentId: String(payment._id) };
  } catch (err) {
    await deleteStoredFile(proof.screenshotUrl);
    throw err;
  }
}

/**
 * Activate a membership after its payment is approved. Renewals stack: if
 * the seller still has time left, the new period starts when the current one
 * ends, so no paid days are lost.
 * @param {import("mongoose").Document} membership
 * @param {Date} now
 */
async function activateMembership(membership, now) {
  const current = await Membership.findOne({
    user: membership.user,
    status: "ACTIVE",
    endsAt: { $gt: now },
    _id: { $ne: membership._id },
  })
    .sort({ endsAt: -1 })
    .lean();
  const startsAt = current ? new Date(current.endsAt) : now;
  membership.startsAt = startsAt;
  membership.endsAt = addMonths(startsAt, membership.planSnapshot?.months || 1);
  membership.status = "ACTIVE";
  await membership.save();
}

/**
 * Approve a PENDING payment and apply its effect.
 * Uses an atomic status flip so a double click can't approve twice.
 *
 * @param {Object} input
 * @param {string} input.paymentId
 * @param {string} input.adminId
 * @param {string} [input.note]
 * @returns {Promise<Object>} updated payment (lean)
 * @throws {PaymentError}
 */
export async function approvePayment({ paymentId, adminId, note }) {
  await connectDB();
  const now = new Date();
  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, status: "PENDING" },
    { $set: { status: "APPROVED", reviewedBy: adminId, reviewedAt: now, adminNote: note || undefined } },
    { returnDocument: "after" }
  );
  if (!payment) throw new PaymentError("This payment was already reviewed or doesn't exist.");

  try {
    if (payment.purpose === "MEMBERSHIP") {
      const membership = await Membership.findById(payment.membership);
      if (!membership) throw new PaymentError("The membership for this payment is missing.");
      await activateMembership(membership, now);
    } else if (payment.purpose === "ORDER") {
      const order = await Order.findById(payment.order);
      if (!order) throw new PaymentError("The order for this payment is missing.");
      if (order.status === "PENDING_PAYMENT") {
        order.status = "CONFIRMED";
        order.statusHistory.push({ status: "CONFIRMED", note: "Payment approved", changedBy: adminId, at: now });
        await order.save();
      }
    }
  } catch (err) {
    // Roll the payment back so it can be reviewed again.
    await Payment.updateOne(
      { _id: payment._id },
      { $set: { status: "PENDING" }, $unset: { reviewedBy: 1, reviewedAt: 1 } }
    );
    throw err;
  }
  return payment.toObject();
}

/**
 * Reject a PENDING payment with a reason the seller will see. The membership
 * (or order) stays pending so the seller can submit new proof.
 * @param {Object} input
 * @param {string} input.paymentId
 * @param {string} input.adminId
 * @param {string} input.note  required reason
 * @returns {Promise<Object>}
 * @throws {PaymentError}
 */
export async function rejectPayment({ paymentId, adminId, note }) {
  if (!note?.trim()) throw new PaymentError("Please give the seller a reason for rejecting.");
  await connectDB();
  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, status: "PENDING" },
    { $set: { status: "REJECTED", reviewedBy: adminId, reviewedAt: new Date(), adminNote: note.trim() } },
    { returnDocument: "after" }
  ).lean();
  if (!payment) throw new PaymentError("This payment was already reviewed or doesn't exist.");
  return payment;
}
