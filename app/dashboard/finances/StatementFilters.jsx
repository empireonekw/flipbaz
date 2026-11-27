"use client";

import Form from "next/form";

const dateInput =
  "h-10 w-full rounded-full border border-line bg-surface px-4 text-sm text-ink shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 sm:w-44";

/**
 * From / To date filter for the statement plus the CSV export link (which
 * keeps the same range). A GET form, so it works without JS; dates apply as
 * soon as they change.
 * @param {{ from?: string, to?: string }} props  "YYYY-MM-DD"
 */
export default function StatementFilters({ from, to }) {
  const submit = (e) => e.currentTarget.form?.requestSubmit();
  const qs = new URLSearchParams(Object.entries({ from, to }).filter(([, v]) => v)).toString();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <Form action="/dashboard/finances" className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 sm:flex-none">
          <label htmlFor="ledger-from" className="mb-1.5 block text-sm font-medium">
            From
          </label>
          <input id="ledger-from" name="from" type="date" defaultValue={from ?? ""} max={to || undefined} onChange={submit} className={dateInput} />
        </div>
        <div className="min-w-0 flex-1 sm:flex-none">
          <label htmlFor="ledger-to" className="mb-1.5 block text-sm font-medium">
            To
          </label>
          <input id="ledger-to" name="to" type="date" defaultValue={to ?? ""} min={from || undefined} onChange={submit} className={dateInput} />
        </div>
        {(from || to) && (
          <a href="/dashboard/finances" className="inline-flex h-10 items-center rounded-full px-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
            Clear
          </a>
        )}
        <button type="submit" className="sr-only">
          Apply dates
        </button>
      </Form>
      <a
        href={`/dashboard/finances/export${qs ? `?${qs}` : ""}`}
        className="inline-flex h-10 items-center justify-center gap-1.5 self-start rounded-full border border-line bg-surface px-4 text-[13px] font-medium shadow-xs hover:bg-surface-2 sm:self-auto"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
        </svg>
        Export CSV
      </a>
    </div>
  );
}
