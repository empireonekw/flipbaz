"use client";

import { useActionState } from "react";
import { extendMembershipAction } from "../actions";
import { inputClass } from "@/components/ui/Field";
import SubmitButton from "@/components/ui/SubmitButton";
import Alert from "@/components/ui/Alert";

/**
 * Add time to a seller's membership (extends the current one, or starts one
 * from today if they have none).
 * @param {{ userId: string, hasLive: boolean }} props
 */
export default function ExtendForm({ userId, hasLive }) {
  const [state, formAction] = useActionState(extendMembershipAction, {});
  return (
    <form action={formAction} className="space-y-3">
      {state.ok && <Alert tone="success">{state.ok}</Alert>}
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="userId" value={userId} />
      <p className="text-sm text-muted">
        {hasLive ? "Adds time to the end of the current membership." : "No active membership: this starts one from today."}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="extend-amount" className="mb-1 block text-sm font-medium">
            Add
          </label>
          <input id="extend-amount" name="amount" type="number" min={1} max={36} defaultValue={1} inputMode="numeric" className={`${inputClass} w-24`} />
        </div>
        <div>
          <label htmlFor="extend-unit" className="sr-only">
            Unit
          </label>
          <select id="extend-unit" name="unit" defaultValue="months" className={inputClass}>
            <option value="days">days</option>
            <option value="months">months</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="extend-note" className="mb-1 block text-sm font-medium">
          Reason (internal)
        </label>
        <input id="extend-note" name="note" maxLength={300} placeholder="e.g. Compensation for delayed order" className={inputClass} />
      </div>
      <SubmitButton size="md" pendingText="Saving…">
        Extend membership
      </SubmitButton>
    </form>
  );
}
