import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import ProductCard from "@/components/catalog/ProductCard";
import PlanCards from "./PlanCards";
import { getActivePlans, getPreviewProducts } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth/dal";

/**
 * Database-backed sections. They render at request time behind <Suspense>,
 * and degrade to a friendly message if the database is unreachable so one
 * failing query never takes down a marketing page.
 */

function Unavailable({ what }) {
  return (
    <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
      We couldn&apos;t load {what} right now. Please refresh in a moment.
    </p>
  );
}

/** Grid of products WITHOUT prices (the query never selects them). */
export async function CatalogPreview({ limit = 8 }) {
  let products;
  try {
    products = await getPreviewProducts(limit);
  } catch (err) {
    unstable_rethrow(err);
    console.error("CatalogPreview failed:", err.message);
    return <Unavailable what="the catalog" />;
  }
  if (!products.length) return <Unavailable what="products" />;
  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p._id} product={p} isMember={false} priority={i < 2} />
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link href="/catalog" className="font-semibold text-brand-700 underline-offset-4 hover:underline dark:text-brand-400">
          Browse the full catalog →
        </Link>
      </div>
    </>
  );
}

/** Live membership plans from the database. */
export async function PricingPlans() {
  let plans;
  let user;
  try {
    [plans, user] = await Promise.all([getActivePlans(), getCurrentUser()]);
  } catch (err) {
    unstable_rethrow(err);
    console.error("PricingPlans failed:", err.message);
    return <Unavailable what="our plans" />;
  }
  return <PlanCards plans={plans} signedIn={Boolean(user)} />;
}

/** Skeleton grid used as a Suspense fallback. */
export function GridSkeleton({ count = 8, tall = false }) {
  return (
    <div className={`grid gap-4 sm:gap-5 ${tall ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse rounded-[var(--radius-card)] bg-surface-2 ${tall ? "h-96" : "aspect-[3/4]"}`} />
      ))}
    </div>
  );
}
