import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import CopyListingButton from "@/components/catalog/CopyListingButton";
import SaveButton from "@/components/catalog/SaveButton";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import ShellIcon from "@/components/dashboard/shell/icons";
import { requireSeller } from "@/lib/auth/dal";
import { getSavedProducts } from "@/lib/listings";
import { getMemberAccess } from "@/lib/membership";
import { buildListingText } from "@/lib/listing";
import { formatPKR } from "@/lib/format";

export const metadata = { title: "My listings" };

const small = "inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-medium hover:bg-surface-2";

function Thumb({ src, href }) {
  return (
    <Link href={href} tabIndex={-1} aria-hidden="true" className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
      {src && <Image src={src} alt="" fill sizes="48px" className="object-cover" />}
    </Link>
  );
}

/** Copy / images / order buttons for one saved product (members only). */
function MemberActions({ p }) {
  return (
    <>
      <CopyListingButton compact text={buildListingText(p)} />
      <a href={`/api/listing-images/${p.slug}`} download className={small}>
        <ShellIcon name="download" className="h-3.5 w-3.5" />
        Images<span className="sr-only"> for {p.title}</span>
      </a>
      <Link
        href={`/dashboard/orders/new?product=${p.slug}`}
        className="inline-flex h-8 items-center rounded-full bg-brand-700 px-3.5 text-[13px] font-medium text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400"
      >
        Order<span className="sr-only"> {p.title}</span>
      </Link>
    </>
  );
}

async function Listings() {
  const seller = await requireSeller("/dashboard/catalog/listings");
  const access = await getMemberAccess();
  const items = await getSavedProducts(seller.id, { isMember: access.isMember });

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-muted">
          <ShellIcon name="bookmark" className="h-5 w-5" />
        </span>
        <p className="mt-3 font-medium">No saved products yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Tap the bookmark on any catalog product to keep it here, with its listing text, photos and price in one place.
        </p>
        <Link href="/dashboard/catalog" className="mt-4 inline-flex h-9 items-center rounded-full bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950">
          Browse catalog
        </Link>
      </div>
    );
  }

  const href = (p) => `/dashboard/catalog/${p.slug}`;
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 text-sm">
        <span className="text-muted">
          {items.length} saved {items.length === 1 ? "product" : "products"}
        </span>
        {!access.isMember && (
          <Link href="/dashboard/membership" className="font-medium text-brand-700 hover:underline dark:text-brand-400">
            Unlock prices and listing photos
          </Link>
        )}
      </div>

      {/* Wide screens */}
      <table className="hidden w-full text-left text-sm lg:table">
        <thead className="bg-surface-2/60 text-muted">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">Product</th>
            {access.isMember && (
              <>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">Your cost</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">Sell at</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">Est. profit</th>
              </>
            )}
            <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((p) => (
            <tr key={p._id} className="hover:bg-surface-2/40">
              <td className="px-4 py-3">
                <span className="flex items-center gap-3">
                  <Thumb src={p.images?.[0]} href={href(p)} />
                  <span className="min-w-0">
                    <Link href={href(p)} className="line-clamp-1 hover:underline">
                      {p.title}
                    </Link>
                    <span className="block text-xs text-muted">
                      {p.category?.name ?? "Product"} · SKU {p.sku}
                    </span>
                  </span>
                </span>
              </td>
              {access.isMember && (
                <>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-medium tabular-nums">{formatPKR(p.costPrice)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-muted">{formatPKR(p.suggestedRetailPrice)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-brand-700 dark:text-brand-400">{formatPKR(p.profit)}</td>
                </>
              )}
              <td className="px-4 py-3">
                <span className="flex items-center justify-end gap-2">
                  {access.isMember && <MemberActions p={p} />}
                  <SaveButton productId={p._id} title={p.title} saved />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Phones and tablets */}
      <ul className="divide-y divide-line lg:hidden">
        {items.map((p) => (
          <li key={p._id} className="px-4 py-3.5">
            <div className="flex gap-3">
              <Thumb src={p.images?.[0]} href={href(p)} />
              <div className="min-w-0 flex-1">
                <Link href={href(p)} className="line-clamp-2 text-sm hover:underline">
                  {p.title}
                </Link>
                {access.isMember ? (
                  <p className="mt-0.5 text-xs text-muted">
                    <span className="font-medium text-ink">{formatPKR(p.costPrice)}</span> cost · sell at {formatPKR(p.suggestedRetailPrice)} ·{" "}
                    <span className="text-brand-700 dark:text-brand-400">earn ~{formatPKR(p.profit)}</span>
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted">{p.category?.name ?? "Product"}</p>
                )}
              </div>
              <SaveButton productId={p._id} title={p.title} saved className="relative" />
            </div>
            {access.isMember && (
              <div className="mt-3 flex flex-wrap gap-2 pl-[3.75rem]">
                <MemberActions p={p} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Products the seller has saved to sell on their own store. */
export default function MyListingsPage() {
  return (
    <>
      <DashboardBanner />
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My listings</h1>
          <p className="mt-1 text-sm text-muted">Products you&apos;ve saved to sell. Copy the text, grab the photos, order when you make a sale.</p>
        </div>
        <Link href="/dashboard/catalog" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-[13px] font-medium shadow-xs hover:bg-surface-2">
          <ShellIcon name="plus" className="h-4 w-4" />
          Add products
        </Link>
      </div>
      <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-surface-2" />}>
        <Listings />
      </Suspense>
    </>
  );
}
