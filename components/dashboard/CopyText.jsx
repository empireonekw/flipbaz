"use client";

import { useState } from "react";

/**
 * Small "Copy" button for account numbers etc.
 * @param {{ value: string, label: string }} props  label is announced, e.g. "JazzCash number"
 */
export default function CopyText({ value, label }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-surface-2 dark:text-brand-400"
    >
      {copied ? "Copied" : "Copy"}
      <span className="sr-only"> {label}</span>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? `${label} copied` : ""}
      </span>
    </button>
  );
}
