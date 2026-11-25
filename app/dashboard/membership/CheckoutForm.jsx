"use client";

import { useActionState, useState } from "react";
import { submitMembershipPaymentAction } from "./actions";
import PaymentProofFields from "@/components/dashboard/PaymentProofFields";
import SubmitButton from "@/components/ui/SubmitButton";
import Alert from "@/components/ui/Alert";
import { formatPKR } from "@/lib/format";
import { planDiscountPercent } from "@/lib/pricing";

/**
 * Membership checkout: pick a plan, pay to one of our accounts, upload proof.
 * @param {{ plans: Object[], accounts: Object[], defaultPlanId?: string }} props
 */
export default function CheckoutForm({ plans, accounts, defaultPlanId }) {
  const [state, formAction] = useActionState(submitMembershipPaymentAction, {});
  const errors = state.errors ?? {};
  const values = state.values ?? {};
  // Radios are uncontrolled on purpose: React 19 resets a form after its action
  // runs, restoring each input to its default. Deriving defaultChecked from the
  // values the action echoes back makes that reset land on the seller's choice.
  const initialPlanId = values.planId || defaultPlanId || plans[0]?._id;
  const [planId, setPlanId] = useState(initialPlanId);
  const plan = plans.find((p) => p._id === planId);
  const base = plans.find((p) => p.months === 1)?.pricePerMonth;

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}

      <fieldset>
        <legend className="mb-3 text-lg font-bold">1. Choose your plan</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {plans.map((p) => {
            const save = planDiscountPercent(p.pricePerMonth, base);
            return (
              <label
                key={p._id}
                className="relative flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface p-4 has-[:checked]:border-brand-600 has-[:checked]:ring-2 has-[:checked]:ring-brand-600/30 dark:has-[:checked]:border-brand-400"
              >
                <input
                  type="radio"
                  name="planId"
                  value={p._id}
                  defaultChecked={initialPlanId === p._id}
                  onChange={() => setPlanId(p._id)}
                  className="mt-1 accent-brand-700"
                />
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-bold">
                    {p.name}
                    {p.isRecommended && (
                      <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">
                        Most popular
                      </span>
                    )}
                  </span>
                  <span className="block text-sm text-muted">
                    {p.months} {p.months === 1 ? "month" : "months"} · {formatPKR(p.pricePerMonth)}/month
                    {save > 0 ? ` · save ${save}%` : ""}
                  </span>
                </span>
                <span className="text-right font-extrabold">{formatPKR(p.totalPrice)}</span>
              </label>
            );
          })}
        </div>
        {errors.planId && <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{errors.planId}</p>}
      </fieldset>

      <section aria-labelledby="pay-heading">
        <h2 id="pay-heading" className="mb-3 text-lg font-bold">
          2. Pay and upload proof
        </h2>
        <PaymentProofFields accounts={accounts} amount={plan?.totalPrice ?? 0} errors={errors} values={values} />
      </section>

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Total: <strong className="text-lg text-ink">{formatPKR(plan?.totalPrice ?? 0)}</strong>
          {plan ? ` for ${plan.months} ${plan.months === 1 ? "month" : "months"}` : ""}
        </p>
        <SubmitButton variant="accent" pendingText="Uploading…" disabled={!accounts.length}>
          Submit payment for review
        </SubmitButton>
      </div>
    </form>
  );
}
