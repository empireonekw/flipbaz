import { buttonClass } from "@/components/ui/Button";
import Link from "next/link";
import { formatPKR } from "@/lib/format";
import { planDiscountPercent } from "@/lib/pricing";

/**
 * Pricing cards for membership plans. The CTA sends guests to sign up (then
 * on to checkout) and signed-in sellers straight to checkout.
 * @param {{ plans: Object[], signedIn?: boolean }} props
 */
export default function PlanCards({ plans, signedIn = false }) {
  if (!plans.length) {
    return <p className="text-center text-muted">Plans will be announced soon.</p>;
  }
  const base = plans.find((p) => p.months === 1)?.pricePerMonth ?? plans[0].pricePerMonth;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {plans.map((plan) => {
        const save = planDiscountPercent(plan.pricePerMonth, base);
        const checkout = `/dashboard/membership?plan=${plan._id}`;
        const href = signedIn ? checkout : `/signup?next=${encodeURIComponent(checkout)}`;
        return (
          <div
            key={plan._id}
            className={`relative flex flex-col rounded-[var(--radius-card)] border bg-surface p-6 shadow-sm ${
              plan.isRecommended ? "border-brand-600 ring-2 ring-brand-600 dark:border-brand-400 dark:ring-brand-400" : "border-line"
            }`}
          >
            {plan.isRecommended && (
              <span className="absolute -top-3 left-6 rounded-full bg-accent-500 px-3 py-1 text-xs font-bold text-white dark:bg-accent-400 dark:text-accent-900">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="text-sm text-muted">
              {plan.months} {plan.months === 1 ? "month" : "months"}
            </p>
            <p className="mt-5">
              <span className="text-3xl font-extrabold tracking-tight">{formatPKR(plan.pricePerMonth)}</span>
              <span className="text-sm text-muted"> /month</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              {formatPKR(plan.totalPrice)} billed once
              {save > 0 && (
                <span className="ml-2 rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                  Save {save}%
                </span>
              )}
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {(plan.features ?? []).map((f) => (
                <li key={f} className="flex gap-2">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4 10.5 4 4 8-9" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={href}
              className={buttonClass({ variant: plan.isRecommended ? "primary" : "outline", className: "mt-8 w-full" })}
            >
              Choose {plan.name}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
