import { Suspense } from "react";
import Link from "next/link";
import ReviewForm from "./ReviewForm";
import { requireAdmin } from "@/lib/auth/dal";
import { connectDB } from "@/lib/db";
import { Payment } from "@/lib/models";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUSES } from "@/lib/models/constants";
import { serialize } from "@/lib/serialize";
import { formatDateTime, formatPKR } from "@/lib/format";

export const metadata = { title: "Payments" };

const one = (v) => (Array.isArray(v) ? v[0] : v);
const statusBadge = {
  PENDING: "bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200",
  APPROVED: "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200",
};

async function PaymentsQueue({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = PAYMENT_STATUSES.includes(one(sp.status)) ? one(sp.status) : "PENDING";

  await connectDB();
  const [payments, counts] = await Promise.all([
    Payment.find({ status })
      .sort({ createdAt: status === "PENDING" ? 1 : -1 })
      .limit(100)
      .populate("user", "name email phone whatsapp city")
      .populate("membership", "planSnapshot")
      .populate("order", "orderNumber total")
      .lean(),
    Payment.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  const count = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  const list = serialize(payments);

  return (
    <>
      <nav aria-label="Payment status" className="flex flex-wrap gap-2">
        {PAYMENT_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/payments?status=${s}`}
            aria-current={s === status ? "page" : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              s === status ? "border-brand-700 bg-brand-700 text-white dark:border-brand-500 dark:bg-brand-500 dark:text-brand-950" : "border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()} ({count[s] ?? 0})
          </Link>
        ))}
      </nav>

      {list.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center text-muted">No {status.toLowerCase()} payments.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((p) => (
            <li key={p._id} className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusBadge[p.status]}`}>{p.status}</span>
                    <span className="text-sm font-semibold">
                      {p.purpose === "MEMBERSHIP"
                        ? `Membership · ${p.membership?.planSnapshot?.name ?? "plan"}`
                        : `Order ${p.order?.orderNumber ?? ""}`}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-extrabold">{formatPKR(p.amount)}</p>
                  <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted">Seller</dt>
                      <dd className="font-medium">
                        {p.user?.name} · {p.user?.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Phone</dt>
                      <dd className="font-medium">{p.user?.phone || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Method</dt>
                      <dd className="font-medium">{PAYMENT_METHOD_LABELS[p.method]}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Transaction ID</dt>
                      <dd className="font-mono font-semibold">{p.transactionId}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Submitted</dt>
                      <dd className="font-medium">{formatDateTime(p.createdAt)}</dd>
                    </div>
                    {p.reviewedAt && (
                      <div>
                        <dt className="text-muted">Reviewed</dt>
                        <dd className="font-medium">{formatDateTime(p.reviewedAt)}</dd>
                      </div>
                    )}
                    {p.adminNote && (
                      <div className="sm:col-span-2">
                        <dt className="text-muted">Note</dt>
                        <dd className="font-medium">{p.adminNote}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                {p.screenshotUrl && (
                  <a href={p.screenshotUrl} target="_blank" rel="noopener noreferrer" className="block w-full md:w-48" title="Open full screenshot">
                    {/* eslint-disable-next-line @next/next/no-img-element -- private upload; the optimiser can't forward the admin's cookie */}
                    <img src={p.screenshotUrl} alt={`Payment screenshot from ${p.user?.name ?? "seller"}`} className="max-h-64 w-full rounded-xl border border-line object-contain" />
                    <span className="mt-1 block text-center text-xs text-muted">Open full size</span>
                  </a>
                )}
              </div>
              {p.status === "PENDING" && (
                <div className="mt-5 border-t border-line pt-5">
                  <ReviewForm paymentId={p._id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function AdminPaymentsPage({ searchParams }) {
  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Payments</h1>
      <p className="mt-1 mb-6 text-muted">Check each screenshot against your JazzCash, EasyPaisa or bank statement before approving.</p>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface-2" />}>
        <PaymentsQueue searchParams={searchParams} />
      </Suspense>
    </>
  );
}
