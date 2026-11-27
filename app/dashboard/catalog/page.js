import { Suspense } from "react";
import Link from "next/link";
import SellerProductCard from "@/components/catalog/SellerProductCard";
import SellerCatalogFilters from "@/components/catalog/SellerCatalogFilters";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import ShellIcon from "@/components/dashboard/shell/icons";
import { requireSeller } from "@/lib/auth/dal";
import { listCategories, listProducts, SORTS } from "@/lib/catalog";
import { getSavedProductIds } from "@/lib/listings";
import { getMemberAccess } from "@/lib/membership";

export const metadata = { title: "Catalog" };

const BASE = "/dashboard/catalog";
const one = (v) => (Array.isArray(v) ? v[0] : v) || undefined;

/** Catalog URL keeping current filters. */
function pageHref(params) {
  const qs = new URLSearchParams(Object.entries(params).filter(([k, v]) => v && !(k === "sort" && v === "newest") && !(k === "page" && Number(v) === 1)));
  return qs.toString() ? `${BASE}?${qs}` : BASE;
}

const pagerLink = "inline-flex h-9 items-center rounded-full border border-line bg-surface px-4 text-sm font-medium hover:bg-surface-2";

async function Results({ searchParams }) {
  const seller = await requireSeller(BASE);
  const sp = await searchParams;
  const current = { q: one(sp.q)?.slice(0, 80), category: one(sp.category), sort: one(sp.sort), page: Number(one(sp.page)) || 1 };

  const access = await getMemberAccess();
  const [categories, result, saved] = await Promise.all([
    listCategories(),
    listProducts(current, { isMember: access.isMember }),
    getSavedProductIds(seller.id),
  ]);
  const sorts = Object.entries(SORTS)
    .filter(([, s]) => !s.memberOnly || access.isMember)
    .map(([value, s]) => ({ value, label: s.label }));
  const filtered = Boolean(current.q || current.category);

  return (
    <>
      <SellerCatalogFilters basePath={BASE} categories={categories} sorts={sorts} current={{ ...current, sort: result.sort }} total={result.total} />

      {result.items.length ? (
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 xl:grid-cols-4">
          {result.items.map((p, i) => (
            <SellerProductCard key={p._id} product={p} isMember={access.isMember} state={access.state} saved={saved.has(p._id)} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <p className="font-medium">{filtered ? "No products match" : "The catalog is empty right now"}</p>
          <p className="mt-1 text-sm text-muted">
            {filtered ? "Try another word or category, or ask us to make it." : "Check back soon, or ask us for something specific."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {filtered && (
              <Link href={BASE} className={pagerLink}>
                Clear filters
              </Link>
            )}
            <Link href={`${BASE}/requests/new`} className={pagerLink}>
              Request an item
            </Link>
          </div>
        </div>
      )}

      {result.pages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-between text-sm">
          <span className="text-muted">
            Page {result.page} of {result.pages}
          </span>
          <span className="flex gap-2">
            {result.page > 1 && (
              <Link href={pageHref({ ...current, sort: result.sort, page: result.page - 1 })} className={pagerLink}>
                Previous
              </Link>
            )}
            {result.page < result.pages && (
              <Link href={pageHref({ ...current, sort: result.sort, page: result.page + 1 })} className={pagerLink}>
                Next
              </Link>
            )}
          </span>
        </nav>
      )}
    </>
  );
}

/** The catalog inside the seller app: Flip Baz products sellers can list and order. */
export default function DashboardCatalogPage({ searchParams }) {
  return (
    <>
      <DashboardBanner />
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
          <p className="mt-1 text-sm text-muted">Prices are what you pay us. You set your own selling price.</p>
        </div>
        <Link
          href={`${BASE}/requests/new`}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-[13px] font-medium shadow-xs hover:bg-surface-2"
        >
          <ShellIcon name="plus" className="h-4 w-4" />
          Request an item
        </Link>
      </div>
      <Suspense
        fallback={
          <>
            <div className="h-9 w-full animate-pulse rounded-full bg-surface-2 sm:w-96" />
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i}>
                  <div className="aspect-square animate-pulse rounded-xl bg-surface-2" />
                  <div className="mt-2.5 h-4 w-3/4 animate-pulse rounded bg-surface-2" />
                </div>
              ))}
            </div>
          </>
        }
      >
        <Results searchParams={searchParams} />
      </Suspense>
    </>
  );
}
