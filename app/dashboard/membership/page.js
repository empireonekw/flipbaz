import { Suspense } from "react";
import Link from "next/link";
import CheckoutForm from "./CheckoutForm";
import MembershipStatusCard from "@/components/dashboard/MembershipStatusCard";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import Alert from "@/components/ui/Alert";
import { requireSeller } from "@/lib/auth/dal";
import { getMemberAccess } from "@/lib/membership";
import { getActivePlans } from "@/lib/catalog";
import { getPaymentAccounts, getPendingMembership } from "@/lib/payments";
import { serialize } from "@/lib/serialize";
import { formatDateTime, formatPKR } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/models/constants";

export const metadata = { title: "Membership" };

const one = (v) => (Array.isArray(v) ? v[0] : v);

async function MembershipContent({ searchParams }) {
  const seller = await requireSeller("/dashboard/membership");
  const sp = await searchParams;
  const [access, pendingRaw, plans] = await Promise.all([getMemberAccess(), getPendingMembership(seller.id), getActivePlans()]);
  const pending = serialize(pendingRaw);
  const accounts = getPaymentAccounts();
  const awaitingReview = pending?.payment?.status === "PENDING";
  const rejected = pending?.payment?.status === "REJECTED";

  // Plan preselection: ?plan= from the pricing page, then the rejected attempt, then the recommended plan.
  const requested = one(sp.plan);
  const defaultPlanId =
    plans.find((p) => p._id === requested)?._id ??
    plans.find((p) => p._id === pending?.membership?.plan)?._id ??
    plans.find((p) => p.isRecommended)?._id;

  return (
    <div className="space-y-6">
      {one(sp.submitted) && awaitingReview && (
        <Alert tone="success">
          <strong>Payment submitted.</strong> We&apos;ll verify it and activate your membership, usually within a few
          working hours. You&apos;ll see the update here.
        </Alert>
      )}

      <MembershipStatusCard access={access} pending={pending} showActions={false} />

      {awaitingReview ? (
        <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:p-6" aria-labelledby="review-heading">
          <h2 id="review-heading" className="text-base font-semibold">
            Payment under review
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Plan</dt>
              <dd className="font-semibold">{pending.membership.planSnapshot?.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Amount</dt>
              <dd className="font-semibold">{formatPKR(pending.payment.amount)}</dd>
            </div>
            <div>
              <dt className="text-muted">Paid by</dt>
              <dd className="font-semibold">{PAYMENT_METHOD_LABELS[pending.payment.method]}</dd>
            </div>
            <div>
              <dt className="text-muted">Transaction ID</dt>
              <dd className="font-mono font-semibold">{pending.payment.transactionId}</dd>
            </div>
            <div>
              <dt className="text-muted">Submitted</dt>
              <dd className="font-semibold">{formatDateTime(pending.payment.createdAt)}</dd>
            </div>
            {pending.payment.screenshotUrl && (
              <div>
                <dt className="text-muted">Screenshot</dt>
                <dd>
                  <a href={pending.payment.screenshotUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline dark:text-brand-400">
                    View your upload
                  </a>
                </dd>
              </div>
            )}
          </dl>
          <p className="mt-5 text-sm text-muted">
            Sent the wrong details?{" "}
            <Link href="/contact" className="font-semibold text-brand-700 underline dark:text-brand-400">
              Contact support
            </Link>{" "}
            and we&apos;ll sort it out.
          </p>
        </section>
      ) : (
        <section id="checkout" className="scroll-mt-24 rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:p-6" aria-labelledby="checkout-heading">
          <h2 id="checkout-heading" className="text-lg font-semibold tracking-tight">
            {access.state === "ACTIVE" ? "Extend your membership" : access.state === "EXPIRED" ? "Renew your membership" : "Get your membership"}
          </h2>
          {access.state === "ACTIVE" && (
            <p className="mt-1 text-sm text-muted">Your new period will start the day your current one ends, so you never lose paid days.</p>
          )}
          {rejected && (
            <Alert tone="error" className="mt-4">
              <strong>Your last payment couldn&apos;t be verified.</strong>
              {pending.payment.adminNote ? <> Reason: {pending.payment.adminNote}.</> : null} Please check the details and submit
              again.
            </Alert>
          )}
          <div className="mt-6">
            {plans.length ? (
              <CheckoutForm plans={plans} accounts={accounts} defaultPlanId={defaultPlanId} />
            ) : (
              <p className="text-muted">No plans are available right now. Please check back soon.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default function MembershipPage({ searchParams }) {
  return (
    <>
      <DashboardBanner />
      <h1 className="text-2xl font-semibold tracking-tight">Membership</h1>
      <p className="mt-1 mb-6 text-muted">Your plan, renewals and payments.</p>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <MembershipContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
