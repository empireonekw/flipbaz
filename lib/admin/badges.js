import "server-only";
import { cache } from "react";
import { connectDB } from "@/lib/db";
import { ContactMessage, Payment, ProductRequest, ServiceRequest } from "@/lib/models";

/**
 * Counts of things waiting for an admin, for the sidebar badges and the
 * "needs you" card. Memoised per request (the layout uses it twice).
 * @returns {Promise<{ payments: number, paymentsAmount: number, requests: number, services: number, messages: number }>}
 */
export const getAdminBadges = cache(async () => {
  await connectDB();
  const [pay, requests, services, messages] = await Promise.all([
    Payment.aggregate([{ $match: { status: "PENDING" } }, { $group: { _id: null, n: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
    ProductRequest.countDocuments({ status: { $in: ["OPEN", "REVIEWING"] } }),
    ServiceRequest.countDocuments({ status: "SUBMITTED" }),
    ContactMessage.countDocuments({ read: false }),
  ]);
  return { payments: pay[0]?.n ?? 0, paymentsAmount: pay[0]?.amount ?? 0, requests, services, messages };
});
