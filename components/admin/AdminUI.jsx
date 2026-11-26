import Link from "next/link";

/**
 * Small presentational building blocks shared by admin pages (server-safe).
 */

export const adminCard = "rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm";

/**
 * Page title row with optional description and action (e.g. "New product").
 * @param {{ title: string, description?: string, action?: React.ReactNode }} props
 */
export function AdminHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Pill-style filter links.
 * @param {{ label: string, tabs: { href: string, label: string, active: boolean }[] }} props
 */
export function FilterTabs({ label, tabs }) {
  return (
    <nav aria-label={label} className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
            t.active ? "border-brand-700 bg-brand-700 text-white dark:border-brand-500 dark:bg-brand-500 dark:text-brand-950" : "border-line bg-surface text-muted hover:text-ink"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Numbered pagination.
 * @param {{ page: number, pages: number, hrefFor: (n: number) => string }} props
 */
export function Pagination({ page, pages, hrefFor }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-wrap justify-center gap-2">
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={hrefFor(n)}
          aria-current={n === page ? "page" : undefined}
          className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold ${
            n === page ? "border-brand-700 bg-brand-700 text-white dark:bg-brand-500 dark:text-brand-950" : "border-line bg-surface"
          }`}
        >
          {n}
        </Link>
      ))}
    </nav>
  );
}

/** Empty-state box. */
export function EmptyState({ children }) {
  return <p className="rounded-[var(--radius-card)] border border-dashed border-line p-10 text-center text-muted">{children}</p>;
}

/**
 * Build a URL with query params, dropping empty ones and page=1.
 * @param {string} base
 * @param {Record<string, unknown>} params
 */
export function withQuery(base, params) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([k, v]) => v !== undefined && v !== null && v !== "" && !(k === "page" && Number(v) === 1))
  );
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

/** Read one value from Next searchParams. */
export const one = (v) => (Array.isArray(v) ? v[0] : v);
