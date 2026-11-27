"use client";

import { useState } from "react";
import { formatPKR } from "@/lib/format";

/** Round up to a clean axis maximum (1, 2, 2.5 or 5 × 10ⁿ) for `ticks` steps. */
function niceMax(max, ticks = 4) {
  if (max <= 0) return ticks * 1000;
  const raw = max / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * pow >= raw) * pow;
  return step * ticks;
}

/** Axis label: full under 10,000, compact above (10K, 25K, 1.2M). */
function tick(n, axisMax) {
  if (axisMax < 10000) return new Intl.NumberFormat("en-US").format(n);
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  return `${+(n / 1000).toFixed(1)}K`;
}

/**
 * Monthly spend columns (one series, so no legend: the card title names it).
 * Each column is the hover/focus target for its own tooltip; the busiest
 * month carries a direct value label; a table view mirrors every value.
 *
 * @param {{ data: { key: string, label: string, long: string, spend: number, orders: number }[] }} props
 */
export default function SpendChart({ data }) {
  const [active, setActive] = useState(null);
  const max = Math.max(0, ...data.map((d) => d.spend));
  const axisMax = niceMax(max);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(axisMax * f));
  const peak = max > 0 ? data.findIndex((d) => d.spend === max) : -1;
  const empty = max === 0;

  return (
    <div>
      <div className="relative mt-3 h-52 pl-11" role="img" aria-label={`Spend per month: ${data.map((d) => `${d.long} ${formatPKR(d.spend)}`).join(", ")}`}>
        {/* Grid + y-axis (recessive, hairline, solid) */}
        {ticks.map((t) => (
          <div key={t} className="pointer-events-none absolute inset-x-0 flex items-center" style={{ bottom: `${(t / axisMax) * 100}%` }} aria-hidden="true">
            <span className="w-10 -translate-y-px pr-2 text-right text-[11px] tabular-nums text-muted">{tick(t, axisMax)}</span>
            <span className={`h-px flex-1 ${t === 0 ? "bg-muted/40" : "bg-line"}`} />
          </div>
        ))}

        {empty && (
          <p className="absolute inset-x-11 top-1/2 -translate-y-1/2 text-center text-sm text-muted">No orders in the last 6 months yet.</p>
        )}

        {/* Columns */}
        <div className="absolute inset-y-0 left-11 right-0 flex items-end justify-around" aria-hidden={empty || undefined}>
          {data.map((d, i) => {
            const h = (d.spend / axisMax) * 100;
            const on = active === i;
            return (
              <div
                key={d.key}
                tabIndex={empty ? -1 : 0}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive((a) => (a === i ? null : a))}
                onFocus={() => setActive(i)}
                onBlur={() => setActive((a) => (a === i ? null : a))}
                aria-label={`${d.long}: ${formatPKR(d.spend)}, ${d.orders} ${d.orders === 1 ? "order" : "orders"}`}
                className="group relative flex h-full w-12 cursor-default items-end justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {d.spend > 0 && (
                  <span
                    className={`block w-6 max-w-6 rounded-t-[4px] transition-colors ${on ? "bg-brand-700 dark:bg-brand-400" : "bg-brand-600 dark:bg-brand-500"}`}
                    style={{ height: `${Math.max(h, 1.5)}%` }}
                  />
                )}
                {i === peak && !on && (
                  <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium tabular-nums text-ink" style={{ bottom: `calc(${h}% + 4px)` }}>
                    {formatPKR(d.spend)}
                  </span>
                )}
                {on && (
                  <span
                    role="tooltip"
                    className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-md ${
                      // Edge columns open inward so the tooltip stays inside the card.
                      i === 0 ? "left-0" : i === data.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2"
                    }`}
                    style={{ bottom: `calc(${Math.min(h, 80)}% + 8px)` }}
                  >
                    <strong className="block font-semibold tabular-nums">{formatPKR(d.spend)}</strong>
                    <span className="text-muted">
                      {d.long} · {d.orders} {d.orders === 1 ? "order" : "orders"}
                    </span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="mt-2 flex justify-around pl-11 text-xs text-muted" aria-hidden="true">
        {data.map((d) => (
          <span key={d.key} className="w-12 text-center">
            {d.label}
          </span>
        ))}
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-muted hover:text-ink">Show as table</summary>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th scope="col" className="py-1 font-medium">Month</th>
              <th scope="col" className="py-1 text-right font-medium">Orders</th>
              <th scope="col" className="py-1 text-right font-medium">Spend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.map((d) => (
              <tr key={d.key}>
                <td className="py-1.5">{d.long}</td>
                <td className="py-1.5 text-right tabular-nums">{d.orders}</td>
                <td className="py-1.5 text-right tabular-nums">{formatPKR(d.spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
