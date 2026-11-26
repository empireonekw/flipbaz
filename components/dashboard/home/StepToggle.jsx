"use client";

import { useActionState } from "react";
import { setLaunchStepAction } from "@/app/dashboard/actions";
import SubmitButton from "@/components/ui/SubmitButton";

/**
 * "Mark as done" for launch steps only the seller can confirm.
 * @param {{ step: string }} props
 */
export default function StepToggle({ step }) {
  const [state, formAction] = useActionState(setLaunchStepAction, {});
  return (
    <form action={formAction} className="inline-flex flex-col">
      <input type="hidden" name="step" value={step} />
      <input type="hidden" name="done" value="true" />
      <SubmitButton size="sm" pendingText="Saving…" className="rounded-full!">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 10.5 3.5 3.5 7.5-8" />
        </svg>
        Mark as done
      </SubmitButton>
      {state.error && <span className="mt-1 text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
