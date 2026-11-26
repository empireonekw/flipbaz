"use client";

import { useActionState, useState } from "react";
import SubmitButton from "@/components/ui/SubmitButton";

/**
 * One-click admin action (toggle, mark read, delete…) as a tiny form posting
 * hidden fields to a Server Action that returns `{ ok?: string, error?: string }`.
 * With `confirm`, the first click asks inline before anything happens.
 *
 * @param {Object} props
 * @param {(prev: Object, fd: FormData) => Promise<{ok?: string, error?: string}>} props.action
 * @param {Record<string, string>} props.fields   hidden inputs
 * @param {string} props.label
 * @param {string} [props.confirm]                 confirmation question
 * @param {"primary"|"outline"|"danger"|"ghost"} [props.variant]
 */
export default function InlineAction({ action, fields, label, confirm, variant = "outline" }) {
  const [state, formAction] = useActionState(action, {});
  const [asking, setAsking] = useState(false);

  return (
    <div className="inline-flex flex-col items-start gap-1">
      {confirm && !asking ? (
        <button
          type="button"
          onClick={() => setAsking(true)}
          className={`h-9 rounded-xl px-3 text-sm font-semibold ${
            variant === "danger" ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40" : "border border-line bg-surface hover:bg-surface-2"
          }`}
        >
          {label}
        </button>
      ) : (
        <form action={formAction} className="inline-flex flex-wrap items-center gap-2">
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          {confirm && <span className="text-sm font-medium">{confirm}</span>}
          <SubmitButton size="sm" variant={variant} pendingText="…">
            {confirm ? "Yes" : label}
          </SubmitButton>
          {confirm && (
            <button type="button" onClick={() => setAsking(false)} className="h-9 rounded-xl border border-line px-3 text-sm font-semibold">
              No
            </button>
          )}
        </form>
      )}
      {state.error && (
        <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </div>
  );
}
