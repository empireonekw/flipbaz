"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Orders pipeline as columns (one series: order count per stage). Each
 * column links to its filtered orders list, carries its own hover/focus
 * tooltip, and shows its count on the cap (only four, so they all fit).
 *
 * @param {{ data: { key: string, label: string, value: number, href: string, hint: string }[] }} props
 */
export default function PipelineBars({ data }) {
  const [active, setActive] = useState(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <ul className="flex h-40 items-end gap-2" aria-label="Orders by stage">
        {data.map((d, i) => {
          const h = (d.value / max) * 100;
          return (
            <li key={d.key} className="relative flex h-full flex-1 flex-col items-center justify-end">
              <Link
                href={d.href}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive((a) => (a === i ? null : a))}
                onFocus={() => setActive(i)}
                onBlur={() => setActive((a) => (a === i ? null : a))}
                aria-label={`${d.label}: ${d.value} ${d.value === 1 ? "order" : "orders"}. ${d.hint}`}
                className="group flex h-full w-full flex-col items-center justify-end rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <span className="mb-1 text-xs font-semibold tabular-nums text-ink">{d.value}</span>
                <span
                  className={`block w-full max-w-12 rounded-t-[4px] transition-colors ${
                    d.value === 0 ? "bg-line" : active === i ? "bg-brand-700 dark:bg-brand-400" : "bg-brand-600 dark:bg-brand-500"
                  }`}
                  style={{ height: `${d.value === 0 ? 2 : Math.max(h, 4)}%` }}
                />
              </Link>
              {active === i && (
                <span role="tooltip" className="pointer-events-none absolute bottom-full z-10 mb-1 w-max max-w-[11rem] rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-md">
                  <strong className="block font-semibold">
                    {d.value} {d.value === 1 ? "order" : "orders"}
                  </strong>
                  <span className="text-muted">{d.hint}</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex gap-2 border-t border-muted/30 pt-2" aria-hidden="true">
        {data.map((d) => (
          <span key={d.key} className="flex-1 text-center text-[11px] leading-tight text-muted">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
