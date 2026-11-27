import { Suspense } from "react";
import Link from "next/link";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import ShellIcon from "@/components/dashboard/shell/icons";
import Alert from "@/components/ui/Alert";
import { requireSeller } from "@/lib/auth/dal";
import { listSellerRequests } from "@/lib/requests";
import { PRODUCT_REQUEST_STATUS_LABELS, REQUEST_SHIPPING_LABELS } from "@/lib/models/constants";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Custom requests" };

const STATUS_STYLE = {
  OPEN: "bg-surface-2 text-ink",
  REVIEWING: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200",
  ADDED: "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300",
  DECLINED: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

const newButton =
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400";

async function RequestList({ searchParams }) {
  const seller = await requireSeller("/dashboard/catalog/requests");
  const [items, sp] = await Promise.all([listSellerRequests(seller.id), searchParams]);
  const sent = sp?.sent === "1";

  return (
    <>
      {sent && (
        <Alert tone="success" className="mb-5">
          Request sent. We&apos;ll reply here and in your Updates, usually within 2 working days.
        </Alert>
      )}
      {!items.length ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-muted">
            <ShellIcon name="request" className="h-5 w-5" />
          </span>
          <p className="mt-3 font-medium">No requests yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Buyers asking for something we don&apos;t list? Send us a photo and our Sialkot makers will check if we can make it.
          </p>
          <Link href="/dashboard/catalog/requests/new" className={`${newButton} mt-4`}>
            Request an item
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
          {items.map((r) => {
            const photo = r.images?.[0] ?? r.image; // `image` = requests made before multi-photo
            return (
              <li key={r._id} className="flex gap-4 px-4 py-4 sm:px-5">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2">
                  {photo && (
                    // Private upload (owner + admins only), so it skips the image optimiser.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  )}
                  {r.images?.length > 1 && (
                    <span className="absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 text-[10px] font-medium text-white">+{r.images.length - 1}</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium">{r.title}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>{PRODUCT_REQUEST_STATUS_LABELS[r.status]}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {[
                      `Sent ${formatDate(r.createdAt)}`,
                      r.category?.name ?? (r.shipTo ? "Category not sure" : null),
                      r.variants,
                      r.shipTo && `Ship to ${r.shipTo}`,
                      r.shipping && REQUEST_SHIPPING_LABELS[r.shipping],
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    {r.referenceUrl && (
                      <>
                        {" · "}
                        <a href={r.referenceUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-ink">
                          reference
                        </a>
                      </>
                    )}
                  </p>
                  {r.details && <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-sm text-muted">{r.details}</p>}
                  {(r.adminReply || r.product) && (
                    <div className="mt-2.5 rounded-xl bg-surface-2/70 px-3 py-2.5 text-sm">
                      <p className="text-xs font-medium text-muted">Flip Baz replied{r.repliedAt ? ` · ${formatDate(r.repliedAt)}` : ""}</p>
                      {r.adminReply && <p className="mt-0.5 whitespace-pre-line">{r.adminReply}</p>}
                      {r.product?.active && (
                        <Link href={`/dashboard/catalog/${r.product.slug}`} className="mt-1 inline-block font-medium text-brand-700 hover:underline dark:text-brand-400">
                          View {r.product.title} →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** The seller's custom requests and our replies. */
export default function CustomRequestsPage({ searchParams }) {
  return (
    <>
      <DashboardBanner />
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Custom requests</h1>
          <p className="mt-1 text-sm text-muted">Items you asked us to make, with our replies and quotes.</p>
        </div>
        <Link href="/dashboard/catalog/requests/new" className={newButton}>
          <ShellIcon name="plus" className="h-4 w-4" />
          New request
        </Link>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface-2" />}>
        <RequestList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
