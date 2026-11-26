"use client";

import { startTransition, useActionState, useState } from "react";
import { useHydrated } from "@/components/ui/useHydrated";
import { savePlanAction } from "./actions";
import Field from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import { buttonClass } from "@/components/ui/Button";
import { formatPKR } from "@/lib/format";
import { PLAN_MONTHS } from "@/lib/models/constants";

/**
 * Create / edit a membership plan. Total is optional: leave it empty to
 * charge months × monthly price.
 * @param {{ plan?: Object }} props
 */
export default function PlanForm({ plan }) {
  const [state, formAction, isPending] = useActionState(savePlanAction, {});
  const hydrated = useHydrated();
  const errors = state.errors ?? {};
  const v = state.values ?? {};
  const p = plan ?? {};
  const [months, setMonths] = useState(Number(v.months ?? p.months ?? 1));
  const [perMonth, setPerMonth] = useState(String(v.pricePerMonth ?? p.pricePerMonth ?? ""));
  // An existing plan whose total isn't simply months × price keeps its custom total.
  const customTotal = p._id && p.totalPrice !== p.months * p.pricePerMonth ? p.totalPrice : "";

  function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return (
    <form onSubmit={onSubmit} method="post" className="space-y-5" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {p._id && <input type="hidden" name="id" value={p._id} />}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Plan name" name="name" required defaultValue={v.name ?? p.name} placeholder="e.g. Quarterly" error={errors.name} />
        <Field as="select" label="Length" name="months" value={months} onChange={(e) => setMonths(Number(e.target.value))} error={errors.months}>
          {PLAN_MONTHS.map((m) => (
            <option key={m} value={m}>
              {m} {m === 1 ? "month" : "months"}
            </option>
          ))}
        </Field>
        <Field
          label="Price per month, Rs"
          name="pricePerMonth"
          type="number"
          min={0}
          inputMode="numeric"
          required
          value={perMonth}
          onChange={(e) => setPerMonth(e.target.value)}
          error={errors.pricePerMonth}
        />
        <Field
          label="Total price, Rs (optional)"
          name="totalPrice"
          type="number"
          min={0}
          inputMode="numeric"
          defaultValue={v.totalPrice ?? customTotal}
          hint={`Leave empty to charge ${formatPKR(months * (Number(perMonth) || 0))}`}
          error={errors.totalPrice}
        />
        <Field
          as="textarea"
          label="Features (one per line)"
          name="features"
          rows={4}
          defaultValue={v.features ?? (p.features ?? []).join("\n")}
          error={errors.features}
          className="sm:col-span-2"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="active" defaultChecked={v.active ? v.active === "on" : p.active ?? true} className="h-5 w-5 accent-brand-700" />
          Show on pricing page
        </label>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="isRecommended" defaultChecked={v.isRecommended ? v.isRecommended === "on" : p.isRecommended ?? false} className="h-5 w-5 accent-brand-700" />
          Mark as &quot;Most popular&quot; (only one plan)
        </label>
      </div>
      <button type="submit" disabled={!hydrated || isPending} className={buttonClass({ size: "lg" })}>
        {isPending ? "Saving…" : p._id ? "Save changes" : "Create plan"}
      </button>
    </form>
  );
}
