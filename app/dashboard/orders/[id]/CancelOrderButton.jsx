"use client";

import { useActionState, useState } from "react";
import { cancelOrderAction } from "../actions";
import SubmitButton from "@/components/ui/SubmitButton";
import Alert from "@/components/ui/Alert";

/**
 * Two-step cancel: first click asks for confirmation inline (no browser
 * dialog), second click cancels.
 * @param {{ orderId: string }} props
 */
export default function CancelOrderButton({ orderId }) {
  const [state, formAction] = useActionState(cancelOrderAction, {});
  const [confirming, setConfirming] = useState(false);

  if (state.ok) return <Alert tone="info">Order cancelled.</Alert>;

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-sm font-semibold text-red-600 hover:underline dark:text-red-400">
        Cancel this order
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <p className="text-sm font-medium text-red-900 dark:text-red-100">Cancel this order? This can&apos;t be undone.</p>
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex gap-2">
        <SubmitButton variant="danger" size="sm" pendingText="Cancelling…">
          Yes, cancel order
        </SubmitButton>
        <button type="button" onClick={() => setConfirming(false)} className="h-9 rounded-xl border border-line bg-surface px-3 text-sm font-semibold">
          Keep it
        </button>
      </div>
    </form>
  );
}
