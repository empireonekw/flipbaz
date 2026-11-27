"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ShellIcon from "@/components/dashboard/shell/icons";

/**
 * Rotating "what needs attention" card. Advances every 7 s unless the reader
 * prefers reduced motion or is hovering/focused inside it; dots switch slides.
 * @param {{ insights: { text: string, href: string, cta: string }[] }} props
 */
export default function InsightsCard({ insights }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = insights.length;

  useEffect(() => {
    if (n < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((x) => (x + 1) % n), 7000);
    return () => clearInterval(id);
  }, [n, paused]);

  const cur = insights[Math.min(i, n - 1)];
  return (
    <section
      aria-label="Insights"
      aria-roledescription="carousel"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative flex min-h-64 flex-col overflow-hidden rounded-2xl bg-[#0c1311] p-5 text-white shadow-xs"
    >
      {/* Decorative glow + grid */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-10 h-64 w-64 rounded-full bg-brand-500/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-accent-500/15 blur-3xl" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium">
        <ShellIcon name="sparkle" className="h-3.5 w-3.5 text-brand-300" />
        Insights
      </span>

      <div className="relative mt-auto">
        {n > 1 && (
          <div className="mb-3 flex gap-1.5">
            {insights.map((_, k) => (
              <button
                key={k}
                type="button"
                onClick={() => setI(k)}
                aria-label={`Insight ${k + 1} of ${n}`}
                aria-current={k === i ? "true" : undefined}
                className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-white" : "w-1.5 bg-white/35 hover:bg-white/60"}`}
              />
            ))}
          </div>
        )}
        <div className="flex items-end justify-between gap-3">
          <p className="text-lg font-semibold leading-snug" aria-live="polite">
            {cur.text}
          </p>
          <Link
            href={cur.href}
            aria-label={cur.cta}
            title={cur.cta}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 hover:bg-white/20"
          >
            <ShellIcon name="external" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
