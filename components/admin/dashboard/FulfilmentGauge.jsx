/**
 * Half-ring meter: share of this month's orders that have shipped or been
 * delivered. The track is a lighter step of the same ramp as the fill, so the
 * state reads across the whole arc; the number and legend carry it in text.
 *
 * @param {{ shipped: number, total: number }} props
 */
export default function FulfilmentGauge({ shipped, total }) {
  const pct = total ? Math.round((shipped / total) * 100) : 0;
  const arc = "M 20 100 A 80 80 0 0 1 180 100";
  return (
    <div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${pct}% of this month's orders shipped or delivered (${shipped} of ${total})`}
        className="relative mx-auto w-full max-w-[15rem]"
      >
        <svg viewBox="0 0 200 112" className="w-full" aria-hidden="true">
          <path d={arc} fill="none" strokeWidth="18" strokeLinecap="round" pathLength="100" className="stroke-brand-100 dark:stroke-brand-950" />
          {pct > 0 && (
            <path
              d={arc}
              fill="none"
              strokeWidth="18"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray={`${pct} 100`}
              className="stroke-brand-600 dark:stroke-brand-500"
            />
          )}
        </svg>
        <div className="absolute inset-x-0 bottom-1 text-center">
          <p className="text-xs text-muted">Shipped</p>
          <p className="text-2xl font-semibold tabular-nums">{pct}%</p>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-600 dark:bg-brand-500" aria-hidden="true" />
          Shipped or delivered ({shipped})
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-100 dark:bg-brand-950" aria-hidden="true" />
          Still to ship ({Math.max(0, total - shipped)})
        </li>
      </ul>
    </div>
  );
}
