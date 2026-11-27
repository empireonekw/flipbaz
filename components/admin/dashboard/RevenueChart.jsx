"use client";

import { useState } from "react";
import { formatPKR } from "@/lib/format";

const W = 100;
const H = 40;
const TOP = 6; // headroom for the peak label

/** Smooth path through points without overshooting (horizontal-tangent cubic). */
function smooth(pts) {
  return pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = pts[i - 1];
    const mx = (px + x) / 2;
    return `${d} C${mx},${py} ${mx},${y} ${x},${y}`;
  }, "");
}

const dayNum = (iso) => Number(iso.slice(8, 10));
const longDay = (iso) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

/**
 * Daily revenue line (one series, so no legend: the card title names it).
 * Crosshair + tooltip on hover; arrow keys step through days when focused;
 * the peak day carries a direct label; a table view mirrors every value.
 *
 * @param {{ data: { day: string, total: number, payments: number }[] }} props
 */
export default function RevenueChart({ data }) {
  const [active, setActive] = useState(null);
  const max = Math.max(0, ...data.map((d) => d.total));
  const scaleMax = max || 1;
  const n = data.length;
  const pts = data.map((d, i) => [(i / (n - 1)) * W, H - (d.total / scaleMax) * (H - TOP)]);
  const line = smooth(pts);
  const area = `${line} L${W},${H} L0,${H} Z`;
  const peak = max > 0 ? data.findIndex((d) => d.total === max) : -1;
  const pct = (i) => (i / (n - 1)) * 100;
  const yPct = (i) => (pts[i][1] / H) * 100;

  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    setActive(Math.max(0, Math.min(n - 1, i)));
  }
  function onKey(e) {
    if (e.key === "ArrowRight") setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
    else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? n) - 1));
    else return;
    e.preventDefault();
  }
  const a = active == null ? null : data[active];

  return (
    <div>
      <div className="relative h-32">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible text-brand-600 dark:text-brand-500" aria-hidden="true">
          {[0.5, 1].map((f) => (
            <line key={f} x1="0" x2={W} y1={H - f * (H - TOP)} y2={H - f * (H - TOP)} className="stroke-line" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <line x1="0" x2={W} y1={H} y2={H} className="stroke-muted/40" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={area} fill="currentColor" opacity="0.1" />
          <path d={line} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {max === 0 && <p className="absolute inset-x-0 top-1/3 text-center text-sm text-muted">No approved payments in the last {n} days.</p>}

        {/* Peak label (hidden while the crosshair is active) */}
        {peak >= 0 && active == null && (
          <>
            <span
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600 ring-2 ring-surface dark:bg-brand-500"
              style={{ left: `${pct(peak)}%`, top: `${yPct(peak)}%` }}
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute -translate-y-full whitespace-nowrap pb-2 text-xs font-semibold tabular-nums text-ink"
              style={{ left: `${pct(peak)}%`, top: `${yPct(peak)}%`, transform: `translate(${peak > n * 0.7 ? "-100%" : peak < n * 0.3 ? "0" : "-50%"}, -100%)` }}
            >
              +{formatPKR(max)}
            </span>
          </>
        )}

        {/* Crosshair layer: the whole plot is the hover/focus target */}
        <div
          tabIndex={0}
          role="group"
          aria-label={`Revenue per day for the last ${n} days. Use the left and right arrow keys to read each day.`}
          onPointerMove={onMove}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((x) => x ?? n - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={onKey}
          className="absolute inset-0 cursor-crosshair rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {a && (
            <>
              <span className="pointer-events-none absolute inset-y-0 w-px bg-muted/40" style={{ left: `${pct(active)}%` }} aria-hidden="true" />
              <span
                className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600 ring-2 ring-surface dark:bg-brand-500"
                style={{ left: `${pct(active)}%`, top: `${yPct(active)}%` }}
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute top-0 z-10 whitespace-nowrap rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-md"
                style={{ left: `${pct(active)}%`, transform: `translateX(${active > n * 0.6 ? "calc(-100% - 8px)" : "8px"})` }}
              >
                <strong className="block font-semibold tabular-nums">{formatPKR(a.total)}</strong>
                <span className="text-muted">
                  {longDay(a.day)} · {a.payments} {a.payments === 1 ? "payment" : "payments"}
                </span>
              </span>
            </>
          )}
        </div>
        <p className="sr-only" aria-live="polite">
          {a ? `${longDay(a.day)}: ${formatPKR(a.total)}, ${a.payments} payments` : ""}
        </p>
      </div>

      {/* X axis */}
      <div className="mt-2 flex justify-between text-[11px] tabular-nums text-muted" aria-hidden="true">
        {data.map((d, i) => (
          <span key={d.day} className={`w-0 text-center ${i % 2 && i !== n - 1 ? "hidden sm:inline" : ""} ${active === i ? "font-semibold text-ink" : ""}`}>
            <span className="-ml-2 inline-block w-4">{dayNum(d.day)}</span>
          </span>
        ))}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-muted hover:text-ink">Show as table</summary>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th scope="col" className="py-1 font-medium">Day</th>
              <th scope="col" className="py-1 text-right font-medium">Payments</th>
              <th scope="col" className="py-1 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.map((d) => (
              <tr key={d.day}>
                <td className="py-1">{longDay(d.day)}</td>
                <td className="py-1 text-right tabular-nums">{d.payments}</td>
                <td className="py-1 text-right tabular-nums">{formatPKR(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
