import Link from "next/link";

/**
 * Shown in place of prices for guests and non-members.
 * @param {{ state?: "GUEST"|"NONE"|"PENDING"|"EXPIRED", compact?: boolean }} props
 */
export default function PriceLock({ state = "GUEST", compact = false }) {
  const text =
    state === "PENDING" ? "Prices unlock once payment is approved" : state === "EXPIRED" ? "Renew to see price" : "Join to see price";
  const href = state === "GUEST" ? "/pricing" : "/dashboard/membership";
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-lg bg-surface-2 font-semibold text-brand-800 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950 ${
        compact ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2.5 text-sm"
      }`}
    >
      <svg viewBox="0 0 20 20" className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 2a4 4 0 0 0-4 4v2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1V6a4 4 0 0 0-4-4Zm2 6V6a2 2 0 1 0-4 0v2h4Z" clipRule="evenodd" />
      </svg>
      {text}
    </Link>
  );
}
