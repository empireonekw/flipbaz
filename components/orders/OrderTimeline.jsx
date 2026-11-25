import { ORDER_STATUS_LABELS } from "@/lib/models/constants";
import { formatDateTime } from "@/lib/format";

/** The normal path an order takes. */
const FLOW = ["PENDING_PAYMENT", "CONFIRMED", "IN_PRODUCTION", "QC_PASSED", "SHIPPED", "DELIVERED"];

/**
 * Vertical status timeline: completed steps get the time they happened, the
 * current step is highlighted, future steps are muted. Cancelled orders show
 * their actual history instead.
 *
 * @param {{ status: string, history: { status: string, note?: string, at: string }[] }} props
 */
export default function OrderTimeline({ status, history = [] }) {
  const lastAt = {};
  const notes = {};
  for (const h of history) {
    lastAt[h.status] = h.at;
    if (h.note) notes[h.status] = h.note;
  }

  const steps =
    status === "CANCELLED"
      ? history.map((h) => h.status)
      : FLOW;
  const currentIndex = steps.lastIndexOf(status);

  return (
    <ol className="relative space-y-0">
      {steps.map((s, i) => {
        const done = i <= currentIndex;
        const current = i === currentIndex;
        const isLast = i === steps.length - 1;
        return (
          <li key={`${s}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden="true"
                className={`absolute left-[11px] top-6 h-full w-0.5 ${i < currentIndex ? "bg-brand-600 dark:bg-brand-400" : "bg-line"}`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                s === "CANCELLED"
                  ? "border-stone-500 bg-stone-500"
                  : done
                    ? "border-brand-600 bg-brand-600 dark:border-brand-400 dark:bg-brand-400"
                    : "border-line bg-surface"
              } ${current ? "ring-4 ring-brand-500/25" : ""}`}
            >
              {done && (
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-white dark:text-brand-950" fill="none" stroke="currentColor" strokeWidth="3">
                  {s === "CANCELLED" ? <path strokeLinecap="round" d="M6 6l8 8M14 6l-8 8" /> : <path strokeLinecap="round" strokeLinejoin="round" d="m5 10.5 3.5 3.5L15 7" />}
                </svg>
              )}
            </span>
            <div className="min-w-0">
              <p className={`font-semibold ${done ? "text-ink" : "text-muted"}`}>
                {ORDER_STATUS_LABELS[s] ?? s}
                {current && <span className="sr-only"> (current status)</span>}
              </p>
              {done && lastAt[s] && <p className="text-xs text-muted">{formatDateTime(lastAt[s])}</p>}
              {done && notes[s] && <p className="mt-0.5 text-sm text-muted">{notes[s]}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
