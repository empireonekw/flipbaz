import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Membership, Order, Payment } from "@/lib/models";
import { PAYMENT_METHOD_LABELS } from "@/lib/models/constants";

/**
 * A seller's account ledger ("Finances"), built from the records we already
 * keep, so it can never drift from them:
 *
 *   debit   order placed (order total)               at order date
 *   credit  order payment approved (amount paid)     at review date
 *   credit  order cancelled (charge reversed)        at cancel date
 *   debit   membership bought (plan price)           at approval date
 *   credit  membership payment approved              at approval date
 *
 * Balance = debits − credits. Positive: the seller owes Flip Baz ("Debit").
 * Negative: Flip Baz owes the seller, e.g. a paid order we cancelled
 * ("Credit"). Zero: settled. Payments still in review aren't counted until
 * approved.
 */

/** Most orders / payments read for one statement. */
const LIMIT = 5000;

/** @typedef {"DEBIT"|"CREDIT"|"SETTLED"} BalanceSide */

/**
 * @typedef {Object} LedgerEntry
 * @property {string} id
 * @property {string} date        ISO
 * @property {string} reference   order number, or "Membership"
 * @property {string} title
 * @property {string} detail
 * @property {number} debit
 * @property {number} credit
 * @property {number} balance     running balance after this entry
 * @property {string} [href]      where the entry links to in the seller app
 */

/** Which side of zero a balance is on. @returns {BalanceSide} */
export const balanceSide = (n) => (n > 0 ? "DEBIT" : n < 0 ? "CREDIT" : "SETTLED");

/** "YYYY-MM-DD" of a date in Pakistan time. */
export function pkDay(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));
}

const itemsText = (items = []) => {
  const first = items[0]?.title ?? "";
  return items.length > 1 ? `${first} + ${items.length - 1} more` : first;
};

const payText = (p) => [PAYMENT_METHOD_LABELS[p.method] ?? p.method, p.transactionId && `Txn ${p.transactionId}`].filter(Boolean).join(" · ");

/**
 * Every ledger entry for a seller, oldest first, with running balances.
 * @param {string} sellerId
 * @returns {Promise<LedgerEntry[]>}
 */
async function buildEntries(sellerId) {
  await connectDB();
  const sid = new mongoose.Types.ObjectId(sellerId);
  const [orders, payments] = await Promise.all([
    Order.find({ seller: sid }).sort({ createdAt: 1 }).limit(LIMIT).select("orderNumber items.title total status statusHistory createdAt").lean(),
    Payment.find({ user: sid, status: "APPROVED" }).sort({ reviewedAt: 1 }).limit(LIMIT).select("purpose amount method transactionId order membership reviewedAt createdAt").lean(),
  ]);
  const orderById = new Map(orders.map((o) => [String(o._id), o]));
  const membershipIds = payments.filter((p) => p.purpose === "MEMBERSHIP" && p.membership).map((p) => p.membership);
  const memberships = membershipIds.length ? await Membership.find({ _id: { $in: membershipIds } }).select("planSnapshot").lean() : [];
  const planById = new Map(memberships.map((m) => [String(m._id), m.planSnapshot]));

  // [time, tie-break order, entry]: on the same instant a charge comes before its payment.
  const raw = [];
  for (const o of orders) {
    const href = `/dashboard/orders/${o._id}`;
    raw.push([new Date(o.createdAt), 0, { id: `o-${o._id}`, reference: o.orderNumber, title: `Order ${o.orderNumber}`, detail: `Order charge · ${itemsText(o.items)}`, debit: o.total, credit: 0, href }]);
    if (o.status === "CANCELLED") {
      const at = [...(o.statusHistory ?? [])].reverse().find((h) => h.status === "CANCELLED")?.at ?? o.createdAt;
      raw.push([new Date(at), 2, { id: `c-${o._id}`, reference: o.orderNumber, title: "Order cancelled · charge reversed", detail: `Cancelled · ${itemsText(o.items)}`, debit: 0, credit: o.total, href }]);
    }
  }
  for (const p of payments) {
    const at = new Date(p.reviewedAt ?? p.createdAt);
    if (p.purpose === "ORDER") {
      const o = orderById.get(String(p.order));
      raw.push([at, 1, {
        id: `p-${p._id}`,
        reference: o?.orderNumber ?? "Order",
        title: `Payment verified${o ? ` · order ${o.orderNumber}` : ""} · ${payText(p)}`,
        detail: `Payment received${o ? ` · ${itemsText(o.items)}` : ""}`,
        debit: 0,
        credit: p.amount,
        href: o ? `/dashboard/orders/${o._id}` : undefined,
      }]);
    } else {
      const plan = planById.get(String(p.membership));
      const name = plan ? `${plan.name}${plan.months ? ` (${plan.months} ${plan.months === 1 ? "month" : "months"})` : ""}` : "Membership plan";
      raw.push([at, 0, { id: `m-${p._id}`, reference: "Membership", title: `Membership · ${name}`, detail: "Plan charge", debit: p.amount, credit: 0, href: "/dashboard/membership" }]);
      raw.push([at, 1, { id: `mp-${p._id}`, reference: "Membership", title: `Payment verified · ${payText(p)}`, detail: `Payment received · ${name}`, debit: 0, credit: p.amount, href: "/dashboard/membership" }]);
    }
  }

  raw.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let running = 0;
  return raw.map(([at, , e]) => {
    running += e.debit - e.credit;
    return { ...e, date: at.toISOString(), balance: running };
  });
}

/**
 * Account summary plus the statement for a date range (newest first).
 * Running balances always come from the full history, so a filtered
 * statement still shows true balances, plus the opening balance before `from`.
 *
 * @param {string} sellerId
 * @param {{ from?: string, to?: string }} [range]  "YYYY-MM-DD", Pakistan time, inclusive
 * @returns {Promise<{ balance: number, side: BalanceSide, totalDebit: number, totalCredit: number, inReview: number, opening: number|null, entries: LedgerEntry[] }>}
 */
export async function getLedger(sellerId, { from, to } = {}) {
  const sid = new mongoose.Types.ObjectId(sellerId);
  const [all, reviewAgg] = await Promise.all([
    buildEntries(sellerId),
    Payment.aggregate([{ $match: { user: sid, status: "PENDING" } }, { $group: { _id: null, n: { $sum: "$amount" } } }]),
  ]);
  const totalDebit = all.reduce((s, e) => s + e.debit, 0);
  const totalCredit = all.reduce((s, e) => s + e.credit, 0);
  const balance = totalDebit - totalCredit;

  const inRange = all.filter((e) => {
    const day = pkDay(e.date);
    return (!from || day >= from) && (!to || day <= to);
  });
  let opening = null;
  if (from) {
    const before = all.filter((e) => pkDay(e.date) < from);
    opening = before.length ? before[before.length - 1].balance : 0;
  }

  return {
    balance,
    side: balanceSide(balance),
    totalDebit,
    totalCredit,
    inReview: reviewAgg[0]?.n ?? 0,
    opening,
    entries: inRange.reverse(),
  };
}

/**
 * Current balance only (Home page tile).
 * @param {string} sellerId
 * @returns {Promise<number>}
 */
export async function getLedgerBalance(sellerId) {
  const all = await buildEntries(sellerId);
  return all.length ? all[all.length - 1].balance : 0;
}
