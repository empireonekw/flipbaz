"use client";

import { useActionState } from "react";
import { reviewPaymentAction } from "./actions";
import Alert from "@/components/ui/Alert";
import { inputClass } from "@/components/ui/Field";
import SubmitButton from "@/components/ui/SubmitButton";

/**
 * Approve / reject controls for one pending payment. A note is optional for
 * approval and required for rejection (the seller sees it).
 * @param {{ paymentId: string }} props
 */
export default function ReviewForm({ paymentId }) {
  const [state, formAction] = useActionState(reviewPaymentAction, {});
  if (state.ok) return <Alert tone="success">{state.ok}</Alert>;

  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="paymentId" value={paymentId} />
      <div>
        <label htmlFor={`note-${paymentId}`} className="mb-1 block text-sm font-medium">
          Note to seller <span className="font-normal text-muted">(required to reject)</span>
        </label>
        <textarea id={`note-${paymentId}`} name="note" rows={2} maxLength={500} className={inputClass} />
      </div>
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="decision" value="approve" size="md" pendingText="Saving…">
          Approve
        </SubmitButton>
        <SubmitButton name="decision" value="reject" variant="danger" size="md" pendingText="Saving…">
          Reject
        </SubmitButton>
      </div>
    </form>
  );
}
