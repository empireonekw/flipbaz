"use client";

import { useActionState, useState } from "react";
import { withdrawServiceAction } from "./actions";

/**
 * Two-step "Withdraw application" (asks before anything happens).
 * @param {{ id: string }} props
 */
export default function WithdrawButton({ id }) {
  const [state, formAction, pending] = useActionState(withdrawServiceAction, {});
  const [asking, setAsking] = useState(false);
  const small = "inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium";

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={`${small} text-muted hover:bg-surface-2 hover:text-ink`}>
        Withdraw application
      </button>
    );
  }
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2 text-sm">
      <input type="hidden" name="id" value={id} />
      <span>Withdraw this application?</span>
      <button type="submit" disabled={pending} className={`${small} bg-red-600 text-white hover:bg-red-700 disabled:opacity-60`}>
        {pending ? "Withdrawing…" : "Yes, withdraw"}
      </button>
      <button type="button" onClick={() => setAsking(false)} className={`${small} border border-line hover:bg-surface-2`}>
        Keep it
      </button>
      {state.error && (
        <span role="alert" className="w-full text-xs text-red-600 dark:text-red-400">
          {state.error}
        </span>
      )}
    </form>
  );
}
