import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { formatDate, formatPKR } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/models/constants";

const badge = {
  ACTIVE: "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300",
  PENDING: "bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200",
  EXPIRED: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200",
  NONE: "bg-surface-2 text-muted",
};
const label = { ACTIVE: "Active", PENDING: "Pending approval", EXPIRED: "Expired", NONE: "No membership" };

/**
 * Membership summary for the seller dashboard.
 * @param {{ access: import("@/lib/membership").MemberAccess, pending: { membership: Object, payment: Object|null } | null, showActions?: boolean }} props
 */
export default function MembershipStatusCard({ access, pending, showActions = true }) {
  const m = access.membership;
  const renewalPending = access.state === "ACTIVE" && pending?.payment?.status === "PENDING";

  return (
    <section aria-labelledby="membership-heading" className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="membership-heading" className="text-lg font-bold">
          Membership
        </h2>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge[access.state] ?? badge.NONE}`}>{label[access.state] ?? label.NONE}</span>
      </div>

      {access.state === "ACTIVE" && m && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted">Plan</p>
            <p className="font-semibold">{m.planSnapshot?.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Valid until</p>
            <p className="font-semibold">{formatDate(m.endsAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Days left</p>
            <p className={`text-2xl font-extrabold ${access.daysLeft <= 7 ? "text-accent-600 dark:text-accent-300" : "text-brand-700 dark:text-brand-400"}`}>
              {access.daysLeft}
            </p>
          </div>
        </div>
      )}

      {access.state === "PENDING" && pending?.payment && (
        <p className="mt-3 text-sm text-muted">
          We received your {PAYMENT_METHOD_LABELS[pending.payment.method]} payment of{" "}
          {formatPKR(pending.payment.amount)} for the {pending.membership.planSnapshot?.name} plan on{" "}
          {formatDate(pending.payment.createdAt)}.{" "}
          {pending.payment.status === "REJECTED"
            ? "It couldn't be verified; please submit new proof."
            : "Our team is verifying it, usually within a few working hours."}
        </p>
      )}

      {access.state === "EXPIRED" && (
        <p className="mt-3 text-sm text-muted">
          Your {m?.planSnapshot?.name ?? ""} membership ended {m?.endsAt ? `on ${formatDate(m.endsAt)}` : ""}. Your order
          history is safe; renew to see prices and place new orders.
        </p>
      )}

      {access.state === "NONE" && (
        <p className="mt-3 text-sm text-muted">
          Choose a plan to unlock wholesale prices, listing photos and order fulfilment.
        </p>
      )}

      {renewalPending && (
        <p className="mt-4 rounded-xl bg-accent-50 px-3 py-2 text-sm text-accent-900 dark:bg-accent-900/30 dark:text-accent-100">
          Renewal payment received. Once approved, the new period starts when this one ends.
        </p>
      )}

      {showActions && access.state !== "PENDING" && !renewalPending && (
        <Link
          href="/dashboard/membership#checkout"
          className={buttonClass({ variant: access.state === "ACTIVE" ? "outline" : "accent", className: "mt-5" })}
        >
          {access.state === "ACTIVE" ? "Renew or extend" : access.state === "EXPIRED" ? "Renew membership" : "Choose a plan"}
        </Link>
      )}
    </section>
  );
}
