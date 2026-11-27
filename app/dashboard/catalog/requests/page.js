import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import RequestForm from "./RequestForm";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import { requireSeller } from "@/lib/auth/dal";
import { listSellerRequests } from "@/lib/requests";
import { PRODUCT_REQUEST_STATUS_LABELS } from "@/lib/models/constants";
import { formatDate, formatPKR } from "@/lib/format";

export const metadata = { title: "Custom requests" };

const STATUS_STYLE = {
  OPEN: "bg-surface-2 text-ink",
  REVIEWING: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200",
  ADDED: "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300",
  DECLINED: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

async function RequestList() {
  const seller = await requireSeller("/dashboard/catalog/requests");
  const items = await listSellerRequests(seller.id);

  if (!items.length) {
    return <p className="px-4 py-10 text-center text-sm text-muted">No requests yet. Anything you ask for will show up here with our reply.</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {items.map((r) => (
        <li key={r._id} className="flex gap-3 px-4 py-4">
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
            {/* Private upload: served only to the owner and admins, so skip the image optimiser. */}
            {r.image && <Image src={r.image} alt="" fill sizes="48px" unoptimized className="object-cover" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{r.title}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>{PRODUCT_REQUEST_STATUS_LABELS[r.status]}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              Sent {formatDate(r.createdAt)}
              {r.quantity ? ` · ~${r.quantity} pcs/month` : ""}
              {r.targetPrice ? ` · target ${formatPKR(r.targetPrice)}` : ""}
              {r.referenceUrl && (
                <>
                  {" · "}
                  <a href={r.referenceUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-ink">
                    reference link
                  </a>
                </>
              )}
            </p>
            {r.details && <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-sm text-muted">{r.details}</p>}
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
      ))}
    </ul>
  );
}

/** Ask us to make or source something that isn't in the catalog yet. */
export default function CustomRequestsPage() {
  return (
    <>
      <DashboardBanner />
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Custom requests</h1>
        <p className="mt-1 text-sm text-muted">Can&apos;t find it in the catalog? Tell us what your buyers want and our Sialkot team will check if we can make it.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <section id="new" aria-labelledby="new-request-heading" className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
          <h2 id="new-request-heading" className="mb-4 text-base font-semibold">
            Request an item
          </h2>
          <RequestForm />
        </section>
        <section aria-labelledby="my-requests-heading" className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
          <h2 id="my-requests-heading" className="border-b border-line px-4 py-3 text-base font-semibold">
            Your requests
          </h2>
          <Suspense fallback={<div className="m-4 h-40 animate-pulse rounded-xl bg-surface-2" />}>
            <RequestList />
          </Suspense>
        </section>
      </div>
    </>
  );
}
