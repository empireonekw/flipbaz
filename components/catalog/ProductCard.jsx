import Link from "next/link";
import ProductImage from "./ProductImage";
import PriceLock from "./PriceLock";
import { formatPKR } from "@/lib/format";

/**
 * Catalog card. Prices and profit render only when the server included them
 * (i.e. for members); everyone else sees a lock.
 * @param {{ product: Object, isMember?: boolean, state?: string, priority?: boolean }} props
 */
export default function ProductCard({ product, isMember = false, state = "GUEST", priority = false }) {
  const href = `/catalog/${product.slug}`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-sm transition hover:shadow-md">
      <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
        <ProductImage src={product.images?.[0]} alt="" priority={priority} className="transition group-hover:opacity-95" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-sm font-semibold leading-snug text-ink sm:text-base">
          <Link href={href} className="hover:underline">
            {product.title}
          </Link>
        </h3>
        <div className="mt-auto">
          {isMember && product.costPrice != null ? (
            <dl className="space-y-1 text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-muted">Your cost</dt>
                <dd className="text-base font-bold text-ink">{formatPKR(product.costPrice)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-muted">Sell at</dt>
                <dd className="font-medium">{formatPKR(product.suggestedRetailPrice)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-muted">Est. profit</dt>
                <dd className="font-semibold text-brand-700 dark:text-brand-400">{formatPKR(product.profit)}</dd>
              </div>
              <div className="pt-2">
                <a
                  href={`/api/listing-images/${product.slug}`}
                  download
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400"
                >
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 3v10m0 0-4-4m4 4 4-4M4 16h12" />
                  </svg>
                  Download images
                  <span className="sr-only"> for {product.title}</span>
                </a>
              </div>
            </dl>
          ) : (
            <PriceLock state={state} compact />
          )}
        </div>
      </div>
    </article>
  );
}
