"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary: a calm message with a retry, instead of a
 * blank screen. Details stay in the server logs.
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent-600 dark:text-accent-300">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight">We couldn&apos;t load this page</h1>
      <p className="mt-3 text-muted">This is usually temporary. Please try again in a moment.</p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="h-11 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950"
        >
          Try again
        </button>
        <Link href="/" className="inline-flex h-11 items-center rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface-2">
          Go home
        </Link>
      </div>
      {error?.digest && <p className="mt-6 text-xs text-muted">Reference: {error.digest}</p>}
    </div>
  );
}
