"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setSavedAction } from "@/app/dashboard/catalog/actions";

const Bookmark = ({ filled, className }) => (
  <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 4h10v16l-5-3.5L7 20V4Z" />
  </svg>
);

/**
 * Save / unsave a product to My listings. Updates instantly (optimistic) and
 * rolls back with a short message if the server refuses.
 *
 * @param {{ productId: string, title: string, saved: boolean, variant?: "icon"|"button", className?: string }} props
 */
export default function SaveButton({ productId, title, saved, variant = "icon", className = "" }) {
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function toggle() {
    const next = !optimistic;
    setError("");
    startTransition(async () => {
      setOptimistic(next);
      const res = await setSavedAction({ productId, save: next });
      if (res?.error) setError(res.error);
    });
  }

  const label = optimistic ? `Remove ${title} from My listings` : `Save ${title} to My listings`;

  if (variant === "button") {
    return (
      <span className={`inline-flex flex-col ${className}`}>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-pressed={optimistic}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors disabled:opacity-70 ${
            optimistic ? "border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-200" : "border-line bg-surface hover:bg-surface-2"
          }`}
        >
          <Bookmark filled={optimistic} className="h-4 w-4" />
          {optimistic ? "Saved to My listings" : "Save to My listings"}
        </button>
        {error && (
          <span role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {error}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={className}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={optimistic}
        aria-label={label}
        title={optimistic ? "Saved to My listings" : "Save to My listings"}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-xs backdrop-blur transition-colors ${
          optimistic ? "border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500 dark:text-brand-950" : "border-line bg-surface/90 text-muted hover:text-ink"
        }`}
      >
        <Bookmark filled={optimistic} className="h-4 w-4" />
      </button>
      {error && (
        <span role="alert" className="absolute left-2 right-2 top-12 rounded-lg bg-red-600 px-2 py-1 text-[11px] text-white">
          {error}
        </span>
      )}
    </span>
  );
}
