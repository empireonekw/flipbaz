import { Suspense } from "react";
import Link from "next/link";
import ProductCard from "@/components/catalog/ProductCard";
import CatalogFilters from "@/components/catalog/CatalogFilters";
import { GridSkeleton } from "@/components/marketing/DataSections";
import Alert from "@/components/ui/Alert";
import { listCategories, listProducts, SORTS } from "@/lib/catalog";
import { getMemberAccess } from "@/lib/membership";

export const metadata = {
  title: "Catalog",
  description: "Browse Sialkot-made leather goods, sportswear, boxing gear and gloves you can sell without holding stock.",
};

/** Read one string value from searchParams. */
const one = (v) => (Array.isArray(v) ? v[0] : v) || undefined;

/**
 * Build a /catalog URL keeping current filters.
 * @param {Object} params
 */
function catalogHref(params) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v && v !== "newest" && v !== 1));
  const s = qs.toString();
  return s ? `/catalog?${s}` : "/catalog";
}

/**
 * The member-aware part of the page: reads the session and the URL, so it
 * renders at request time inside <Suspense>.
 */
async function CatalogResults({ searchParams }) {
  const sp = await searchParams;
  const current = { q: one(sp.q), category: one(sp.category), sort: one(sp.sort), page: Number(one(sp.page)) || 1 };

  const access = await getMemberAccess();
  const [categories, result] = await Promise.all([
    listCategories(),
    listProducts(current, { isMember: access.isMember }),
  ]);
  const sorts = Object.entries(SORTS)
    .filter(([, s]) => !s.memberOnly || access.isMember)
    .map(([value, s]) => ({ value, label: s.label }));
  const activeCategory = categories.find((c) => c.slug === current.category);

  return (
    <>
      {!access.isMember && (
        <Alert tone={access.state === "NONE" ? "info" : "warning"} className="mb-6">
          {access.state === "PENDING" ? (
            <>Your payment is being reviewed. Prices unlock as soon as it&apos;s approved.</>
          ) : access.state === "EXPIRED" ? (
            <>
              Your membership has ended.{" "}
              <Link href="/dashboard/membership" className="font-semibold underline">
                Renew now
              </Link>{" "}
              to see prices and place orders again.
            </>
          ) : (
            <>
              You&apos;re browsing as a guest. Wholesale prices, profit estimates and listing photos are for
              members.{" "}
              <Link href="/pricing" className="font-semibold underline">
                See plans
              </Link>
            </>
          )}
        </Alert>
      )}

      <CatalogFilters categories={categories} sorts={sorts} current={{ ...current, sort: result.sort }} />

      <nav aria-label="Categories" className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {[{ slug: undefined, name: "All" }, ...categories].map((c) => {
          const active = (c.slug ?? "") === (current.category ?? "");
          return (
            <Link
              key={c.slug ?? "all"}
              href={catalogHref({ ...current, category: c.slug, page: 1 })}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium ${
                active
                  ? "border-brand-700 bg-brand-700 text-white dark:border-brand-500 dark:bg-brand-500 dark:text-brand-950"
                  : "border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </nav>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {result.total} {result.total === 1 ? "product" : "products"}
        {activeCategory ? ` in ${activeCategory.name}` : ""}
        {current.q ? ` matching “${current.q}”` : ""}
      </p>

      {result.items.length ? (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {result.items.map((p, i) => (
            <ProductCard key={p._id} product={p} isMember={access.isMember} state={access.state} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line p-10 text-center">
          <p className="font-semibold">No products found</p>
          <p className="mt-1 text-sm text-muted">Try a different word or category.</p>
          <Link href="/catalog" className="mt-4 inline-block font-semibold text-brand-700 underline dark:text-brand-400">
            Clear filters
          </Link>
        </div>
      )}

      {result.pages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={catalogHref({ ...current, sort: result.sort, page: n })}
              aria-current={n === result.page ? "page" : undefined}
              className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold ${
                n === result.page ? "border-brand-700 bg-brand-700 text-white dark:bg-brand-500 dark:text-brand-950" : "border-line bg-surface hover:bg-surface-2"
              }`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

export default function CatalogPage({ searchParams }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Catalog</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Every product here is made in Sialkot, quality-checked, and shipped to your customer under your
          store&apos;s name.
        </p>
      </header>
      <Suspense
        fallback={
          <>
            <div className="mb-6 h-11 animate-pulse rounded-xl bg-surface-2" />
            <GridSkeleton count={8} />
          </>
        }
      >
        <CatalogResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
