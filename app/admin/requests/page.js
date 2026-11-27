import { Suspense } from "react";
import Link from "next/link";
import ReplyForm from "./ReplyForm";
import { AdminHeader, EmptyState, FilterTabs, Pagination, adminCard, one, withQuery } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/auth/dal";
import { listProductRequests } from "@/lib/admin/requests";
import { PRODUCT_REQUEST_STATUSES, PRODUCT_REQUEST_STATUS_LABELS, REQUEST_SHIPPING_LABELS } from "@/lib/models/constants";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Requests · Admin" };

async function Queue({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = PRODUCT_REQUEST_STATUSES.includes(one(sp.status)) ? one(sp.status) : undefined;
  const { items, counts, page, pages } = await listProductRequests({ status, page: one(sp.page) });
  const all = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <>
      <FilterTabs
        label="Request status"
        tabs={[
          { href: "/admin/requests", label: `All (${all})`, active: !status },
          ...PRODUCT_REQUEST_STATUSES.map((s) => ({
            href: `/admin/requests?status=${s}`,
            label: `${PRODUCT_REQUEST_STATUS_LABELS[s]} (${counts[s] ?? 0})`,
            active: status === s,
          })),
        ]}
      />
      {items.length === 0 ? (
        <div className="mt-5">
          <EmptyState>No requests here.</EmptyState>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((r) => (
            <li key={r._id} className={adminCard}>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-bold">{r.title}</p>
                    <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold">{PRODUCT_REQUEST_STATUS_LABELS[r.status]}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {r.seller ? (
                      <Link href={`/admin/members/${r.seller._id}`} className="underline">
                        {r.seller.name}
                        {r.seller.storeName ? ` (${r.seller.storeName})` : ""}
                      </Link>
                    ) : (
                      "Deleted seller"
                    )}{" "}
                    · {formatDateTime(r.createdAt)}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted">Category</dt>
                      <dd>{r.category?.name ?? "Not sure"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Sizes / colours</dt>
                      <dd>{r.variants || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Shipping</dt>
                      <dd>{r.shipping ? REQUEST_SHIPPING_LABELS[r.shipping] : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Ship to</dt>
                      <dd>{r.shipTo || "—"}</dd>
                    </div>
                  </dl>
                  {r.details && <p className="mt-3 whitespace-pre-line text-sm">{r.details}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    {r.referenceUrl && (
                      <a href={r.referenceUrl} target="_blank" rel="noopener noreferrer nofollow" className="break-all font-semibold text-brand-700 underline dark:text-brand-400">
                        Reference link
                      </a>
                    )}
                  </div>
                  {r.notes && (
                    <p className="mt-3 text-sm">
                      <span className="text-xs text-muted">Notes: </span>
                      {r.notes}
                    </p>
                  )}
                  {(r.images?.length > 0 || r.image) && (
                    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Seller's photos">
                      {(r.images?.length ? r.images : [r.image]).map((src, i) => (
                        <li key={src}>
                          <a href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-line hover:opacity-90">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`Seller's photo ${i + 1}`} className="h-20 w-20 object-cover" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <ReplyForm request={r} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pages={pages} hrefFor={(n) => withQuery("/admin/requests", { status, page: n })} />
    </>
  );
}

export default function AdminRequestsPage({ searchParams }) {
  return (
    <>
      <AdminHeader title="Custom requests" description="Items sellers want that aren't in the catalog. Reply, and link the product once you add it." />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <Queue searchParams={searchParams} />
      </Suspense>
    </>
  );
}
