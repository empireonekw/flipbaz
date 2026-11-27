import Link from "next/link";
import ProductGallery from "./ProductGallery";
import ProductCard from "./ProductCard";
import SellerProductCard from "./SellerProductCard";
import SaveButton from "./SaveButton";
import CopyListingButton from "./CopyListingButton";
import PriceLock from "./PriceLock";
import Button, { buttonClass } from "@/components/ui/Button";
import { buildListingText } from "@/lib/listing";
import { formatPKR } from "@/lib/format";
import { DEFAULT_SHIPPING_FEE } from "@/lib/pricing";

/** Member pricing panel, or a lock + join prompt for everyone else. */
function PricePanel({ product, access, app }) {
  if (!access.isMember) {
    return (
      <div className="rounded-[var(--radius-card)] border border-line bg-surface-2/60 p-5">
        <PriceLock state={access.state} />
        <p className="mt-3 text-sm text-muted">
          Members see the wholesale price, a suggested selling price, an estimated profit per sale, and
          can download listing photos and order this for their customers.
        </p>
        {(access.state === "GUEST" || access.state === "NONE") && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button href={access.user ? "/dashboard/membership" : "/pricing"} variant="accent">
              {access.user ? "Choose a plan" : "See membership plans"}
            </Button>
            {!access.user && (
              <Button href={`/login?next=/catalog/${product.slug}`} variant="outline">
                I&apos;m a member, log in
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  const strong = app ? "font-semibold" : "font-extrabold";
  return (
    <div className="rounded-[var(--radius-card)] border border-brand-200 bg-brand-50/60 p-5 dark:border-brand-800 dark:bg-brand-950/40">
      <dl className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-surface p-3">
          <dt className="text-xs text-muted">Your cost</dt>
          <dd className={`mt-1 text-lg ${strong}`}>{formatPKR(product.costPrice)}</dd>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <dt className="text-xs text-muted">Suggested price</dt>
          <dd className={`mt-1 text-lg ${app ? "font-medium" : "font-bold"}`}>{formatPKR(product.suggestedRetailPrice)}</dd>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <dt className="text-xs text-muted">Est. profit</dt>
          <dd className={`mt-1 text-lg ${strong} text-brand-700 dark:text-brand-400`}>{formatPKR(product.profit)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted">
        Profit estimate = suggested price − your cost − {formatPKR(DEFAULT_SHIPPING_FEE)} shipping.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {!access.isAdmin && (
          <Link href={`/dashboard/orders/new?product=${product.slug}`} className={buttonClass({ variant: "accent", className: "sm:col-span-2" })}>
            Order this for a customer
          </Link>
        )}
        <CopyListingButton text={buildListingText(product)} />
        <a href={`/api/listing-images/${product.slug}`} download className={buttonClass({ variant: "outline", className: "w-full" })}>
          Download listing images
        </a>
      </div>
    </div>
  );
}

/**
 * Product page body, shared by the public /catalog/[slug] and the seller
 * app's /dashboard/catalog/[slug]. `app` switches to the seller app's quieter
 * type, links back into the app and adds the "Save to My listings" control.
 *
 * @param {Object} props
 * @param {Object} props.product        member-aware product (from lib/catalog)
 * @param {Object[]} props.related
 * @param {import("@/lib/membership").MemberAccess} props.access
 * @param {boolean} [props.app]
 * @param {Set<string>} [props.saved]   seller's saved product ids (app only)
 */
export default function ProductDetailView({ product, related, access, app = false, saved }) {
  const base = app ? "/dashboard/catalog" : "/catalog";
  const sellerView = app && access.user?.role === "SELLER";
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={base} className="hover:text-ink hover:underline">
              Catalog
            </Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`${base}?category=${product.category.slug}`} className="hover:text-ink hover:underline">
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="line-clamp-1 text-ink">
            {product.title}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} title={product.title} />

        <div>
          <h1 className={`text-balance tracking-tight ${app ? "text-2xl font-semibold" : "text-3xl font-extrabold"}`}>{product.title}</h1>
          <p className="mt-1 text-sm text-muted">SKU {product.sku}</p>

          {sellerView && <SaveButton variant="button" productId={product._id} title={product.title} saved={saved?.has(product._id) ?? false} className="mt-4" />}

          <div className="mt-6">
            <PricePanel product={product} access={access} app={app} />
          </div>

          <div className="mt-8 space-y-5">
            {product.sizes?.length > 0 && (
              <div>
                <h2 className={`text-sm ${app ? "font-medium" : "font-semibold"}`}>Sizes</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <li key={s} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {product.colors?.length > 0 && (
              <div>
                <h2 className={`text-sm ${app ? "font-medium" : "font-semibold"}`}>Colours</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <li key={c} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-muted">
              Made to order in about <strong className="font-medium text-ink">{product.processingDays} days</strong>, then 2–4
              days by courier.
            </p>
          </div>

          <div className="mt-8">
            <h2 className={app ? "text-base font-semibold" : "text-lg font-bold"}>About this product</h2>
            <p className={`mt-2 whitespace-pre-line text-pretty text-muted ${app ? "text-sm leading-relaxed" : ""}`}>{product.description}</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className={app ? "mt-12" : "mt-16"}>
          <h2 id="related-heading" className={app ? "text-lg font-semibold tracking-tight" : "text-2xl font-extrabold tracking-tight"}>
            More from {product.category?.name ?? "this category"}
          </h2>
          <div className={`grid grid-cols-2 md:grid-cols-4 ${app ? "mt-4 gap-x-4 gap-y-6" : "mt-6 gap-4 sm:gap-5"}`}>
            {related.map((p) =>
              sellerView ? (
                <SellerProductCard key={p._id} product={p} isMember={access.isMember} state={access.state} saved={saved?.has(p._id) ?? false} />
              ) : (
                <ProductCard key={p._id} product={p} isMember={access.isMember} state={access.state} />
              )
            )}
          </div>
        </section>
      )}
    </>
  );
}
