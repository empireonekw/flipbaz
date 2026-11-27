"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";

/**
 * Copies ready-made listing text to the clipboard (members only; the parent
 * decides whether to render it).
 * @param {{ text: string, compact?: boolean }} props  compact = small pill (seller tables)
 */
export default function CopyListingButton({ text, compact = false }) {
  const [status, setStatus] = useState("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      // Fallback for older browsers / non-secure contexts.
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      setStatus(ok ? "copied" : "failed");
    }
    setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className={
          compact
            ? "inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-medium hover:bg-surface-2"
            : buttonClass({ variant: "outline", className: "w-full" })
        }
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="7" y="7" width="10" height="10" rx="2" />
          <path d="M13 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        </svg>
        {status === "copied" ? "Copied!" : compact ? "Copy text" : "Copy listing text"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {status === "copied" ? "Listing text copied to clipboard" : status === "failed" ? "Copy failed" : ""}
      </span>
    </>
  );
}
