import Link from "next/link";
import ProductImage from "./ProductImage";
import SaveButton from "./SaveButton";
import { formatPKR } from "@/lib/format";

const LockIcon = () => (
  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M10 2a4 4 0 0 0-4 4v2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1V6a4 4 0 0 0-4-4Zm2 6V6a2 2 0 1 0-4 0v2h4Z" clipRule="evenodd" />
  </svg>
);

/**
 * Compact product tile for the seller app's catalog. Prices render only when
 * the server included them (members); everyone else sees a short lock line.
 *
 * @param {{ product: Object, isMember: boolean, state: string, saved: boolean, priority?: boolean }} props
 */
export default function SellerProductCard({ product, isMember, state, saved, priority = false }) {
  const href = `/dashboard/catalog/${product.slug}`;
  return (
    <article className="group relative">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block overflow-hidden rounded-xl border border-line bg-surface p-1.5 transition group-hover:shadow-sm">
        <ProductImage src={product.images?.[0]} alt="" priority={priority} className="rounded-lg" />
      </Link>
      <SaveButton productId={product._id} title={product.title} saved={saved} className="absolute right-3 top-3" />
      <div className="mt-2.5 px-0.5">
        <h3 className="line-clamp-2 text-sm leading-snug">
          <Link href={href} className="hover:underline">
            {product.title}
          </Link>
        </h3>
        {isMember && product.costPrice != null ? (
          <>
            <p className="mt-1.5">
              <span className="font-semibold tabular-nums">{formatPKR(product.costPrice)}</span>
              <span className="text-xs text-muted"> / unit</span>
            </p>
            <p className="text-xs text-muted">
              Sell at {formatPKR(product.suggestedRetailPrice)} · <span className="text-brand-700 dark:text-brand-400">earn ~{formatPKR(product.profit)}</span>
            </p>
          </>
        ) : (
          <Link href="/dashboard/membership" className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink">
            <LockIcon />
            {state === "PENDING" ? "Unlocks after payment approval" : state === "EXPIRED" ? "Renew to see price" : "Join to see price"}
          </Link>
        )}
      </div>
    </article>
  );
}
