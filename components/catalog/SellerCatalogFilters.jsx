"use client";

import Form from "next/form";

const pill =
  "h-9 appearance-none rounded-full border border-line bg-surface text-sm font-medium text-ink shadow-xs transition-colors hover:bg-surface-2 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15";

const Chevron = () => (
  <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/**
 * Seller catalog toolbar: search, category and sort as compact pills. A plain
 * GET form (works without JS); the selects submit as soon as they change.
 *
 * @param {{ basePath: string, categories: {slug: string, name: string}[], sorts: {value: string, label: string}[], current: {q?: string, category?: string, sort?: string}, total: number }} props
 */
export default function SellerCatalogFilters({ basePath, categories, sorts, current, total }) {
  const submitOnChange = (e) => e.currentTarget.form?.requestSubmit();

  return (
    <Form action={basePath} role="search" className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <label htmlFor="sc-q" className="sr-only">
          Search products
        </label>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm9.5 3-4.8-4.8" />
        </svg>
        <input
          id="sc-q"
          name="q"
          type="search"
          maxLength={80}
          defaultValue={current.q ?? ""}
          placeholder="Search products"
          className={`${pill} w-full pl-9 pr-3 font-normal placeholder:text-muted/80`}
        />
      </div>

      <div className="relative min-w-0 flex-1 sm:flex-none">
        <label htmlFor="sc-category" className="sr-only">
          Category
        </label>
        <select id="sc-category" name="category" defaultValue={current.category ?? ""} onChange={submitOnChange} className={`${pill} w-full pl-3.5 pr-9`}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <Chevron />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:ml-auto sm:flex-none">
        <span className="hidden text-sm text-muted sm:inline" aria-live="polite">
          {total} {total === 1 ? "result" : "results"}
        </span>
        <div className="relative w-full sm:w-auto">
          <label htmlFor="sc-sort" className="sr-only">
            Sort by
          </label>
          <select id="sc-sort" name="sort" defaultValue={current.sort ?? "newest"} onChange={submitOnChange} className={`${pill} w-full pl-3.5 pr-9`}>
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      </div>
      <button type="submit" className="sr-only">
        Search
      </button>
    </Form>
  );
}
