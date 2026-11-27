"use client";

import { useState } from "react";
import { FAQ_CATEGORIES, MARKETPLACE_FAQS } from "@/lib/guidance-faqs";

/** Lower-case, accent-free text for matching. */
const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/**
 * Marketplace FAQs: category chips, a search box and grouped questions that
 * open in place (<details>, so it works without JS and with the keyboard).
 */
export default function FaqBrowser() {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const words = norm(q).split(/\s+/).filter(Boolean);
  const matches = (f) => words.every((w) => norm(`${f.q} ${f.a}`).includes(w));
  const groups = FAQ_CATEGORIES.filter((c) => cat === "all" || c.id === cat)
    .map((c) => ({ ...c, items: MARKETPLACE_FAQS.filter((f) => f.cat === c.id && matches(f)) }))
    .filter((g) => g.items.length);
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div>
      <div className="rounded-2xl border border-line bg-surface shadow-xs">
        <div role="tablist" aria-label="FAQ topics" className="flex gap-1 overflow-x-auto border-b border-line px-2 py-2">
          {[{ id: "all", label: "All" }, ...FAQ_CATEGORIES].map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={cat === c.id}
              onClick={() => setCat(c.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors ${cat === c.id ? "bg-surface-2 font-medium text-ink" : "text-muted hover:bg-surface-2/60 hover:text-ink"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="p-3">
          <label htmlFor="faq-q" className="sr-only">
            Search questions
          </label>
          <div className="relative">
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm9.5 3-4.8-4.8" />
            </svg>
            <input
              id="faq-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={80}
              placeholder="Search, e.g. production partner, SKU, tracking"
              className="h-10 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm placeholder:text-muted/80 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {total} {total === 1 ? "question" : "questions"}
      </p>

      {groups.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">
          No answers match &ldquo;{q}&rdquo;. Try another word, or ask us in chat.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.id} aria-labelledby={`faq-${g.id}`} className="mt-6">
            <div className="flex items-baseline justify-between px-1">
              <h3 id={`faq-${g.id}`} className="text-base font-semibold">
                {g.label}
              </h3>
              <span className="text-xs tabular-nums text-muted">{g.items.length}</span>
            </div>
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
              {g.items.map((f) => (
                <li key={f.id}>
                  <details className="group" open={words.length > 0 && total <= 3}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-sm hover:bg-surface-2/40 [&::-webkit-details-marker]:hidden">
                      <span>{f.q}</span>
                      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </summary>
                    <p className="px-4 pb-4 text-sm leading-relaxed text-muted">{f.a}</p>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
