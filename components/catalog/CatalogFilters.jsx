"use client";

import Form from "next/form";
import { inputClass } from "@/components/ui/Field";

/**
 * Search / category / sort controls. A plain GET form (works without JS);
 * next/form turns submits into client-side navigations, and the selects
 * submit as soon as they change.
 *
 * @param {{ basePath?: string, categories: {slug: string, name: string}[], sorts: {value: string, label: string}[], current: {q?: string, category?: string, sort?: string} }} props
 */
export default function CatalogFilters({ basePath = "/catalog", categories, sorts, current }) {
  const submitOnChange = (e) => e.currentTarget.form?.requestSubmit();

  return (
    <Form action={basePath} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
      <div>
        <label htmlFor="catalog-q" className="sr-only">
          Search products
        </label>
        <input
          id="catalog-q"
          name="q"
          type="search"
          defaultValue={current.q ?? ""}
          placeholder="Search gloves, jackets, kits…"
          className={inputClass}
          maxLength={80}
        />
      </div>
      <div>
        <label htmlFor="catalog-category" className="sr-only">
          Category
        </label>
        <select id="catalog-category" name="category" defaultValue={current.category ?? ""} onChange={submitOnChange} className={inputClass}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="catalog-sort" className="sr-only">
          Sort by
        </label>
        <select id="catalog-sort" name="sort" defaultValue={current.sort ?? "newest"} onChange={submitOnChange} className={inputClass}>
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="h-11 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400"
      >
        Search
      </button>
    </Form>
  );
}
