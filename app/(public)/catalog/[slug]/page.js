import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/catalog/ProductGallery";
import ProductCard from "@/components/catalog/ProductCard";
import CopyListingButton from "@/components/catalog/CopyListingButton";
import PriceLock from "@/components/catalog/PriceLock";
import Button, { buttonClass } from "@/components/ui/Button";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { getMemberAccess } from "@/lib/membership";
import { buildListingText } from "@/lib/listing";
import { formatPKR } from "@/lib/format";
import { DEFAULT_SHIPPING_FEE } from "@/lib/pricing";

/** Title/description from the product (never includes prices). */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug, { isMember: false }).catch(() => null);
  if (!product) return { title: "Product not found" };
  return { title: product.title, description: product.description.slice(0, 155) };
}

/** Member pricing panel, or a lock + join prompt for everyone else. */
function PricePanel({ product, access }) {
  if (!access.isMember) {
    return (
      <div className="rounded-[var(--radius-card)] border border-line bg-surface-2/60 p-5">
        <PriceLock state={access.state} />
        <p className="mt-3 text-sm text-muted">
          Members see the wholesale price, a suggested selling price, an estimated profit per sale, and
          can download listing photos and order this for their customers.
        </p>
        {access.state === "NONE" && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button href="/pricing" variant="accent">
              See membership plans
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

  return (
    <div className="rounded-[var(--radius-card)] border border-brand-200 bg-brand-50/60 p-5 dark:border-brand-800 dark:bg-brand-950/40">
      <dl className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-surface p-3">
          <dt className="text-xs text-muted">Your cost</dt>
          <dd className="mt-1 text-lg font-extrabold">{formatPKR(product.costPrice)}</dd>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <dt className="text-xs text-muted">Suggested price</dt>
          <dd className="mt-1 text-lg font-bold">{formatPKR(product.suggestedRetailPrice)}</dd>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <dt className="text-xs text-muted">Est. profit</dt>
          <dd className="mt-1 text-lg font-extrabold text-brand-700 dark:text-brand-400">{formatPKR(product.profit)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted">
        Profit estimate = suggested price − your cost − {formatPKR(DEFAULT_SHIPPING_FEE)} shipping.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
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

async function ProductDetail({ params }) {
  const { slug } = await params;
  const access = await getMemberAccess();
  const product = await getProductBySlug(slug, { isMember: access.isMember });
  if (!product) notFound();
  const related = await getRelatedProducts(product.category?._id, product._id, { isMember: access.isMember });

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/catalog" className="hover:text-ink hover:underline">
              Catalog
            </Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/catalog?category=${product.category.slug}`} className="hover:text-ink hover:underline">
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {product.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} title={product.title} />

        <div>
          <h1 className="text-balance text-3xl font-extrabold tracking-tight">{product.title}</h1>
          <p className="mt-1 text-sm text-muted">SKU {product.sku}</p>

          <div className="mt-6">
            <PricePanel product={product} access={access} />
          </div>

          <div className="mt-8 space-y-5">
            {product.sizes?.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold">Sizes</h2>
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
                <h2 className="text-sm font-semibold">Colours</h2>
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
              Made to order in about <strong className="text-ink">{product.processingDays} days</strong>, then 2–4
              days by courier.
            </p>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold">About this product</h2>
            <p className="mt-2 whitespace-pre-line text-pretty text-muted">{product.description}</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-16">
          <h2 id="related-heading" className="text-2xl font-extrabold tracking-tight">
            More from {product.category?.name ?? "this category"}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} isMember={access.isMember} state={access.state} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function ProductPage({ params }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Suspense
        fallback={
          <div className="grid gap-8 lg:grid-cols-2" aria-hidden="true">
            <div className="aspect-square animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
            <div className="space-y-4">
              <div className="h-10 w-3/4 animate-pulse rounded-lg bg-surface-2" />
              <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
            </div>
          </div>
        }
      >
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}
