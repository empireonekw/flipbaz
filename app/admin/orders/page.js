import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import Form from "next/form";
import { one, withQuery } from "@/components/admin/AdminUI";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import ShellIcon from "@/components/dashboard/shell/icons";
import { requireAdmin } from "@/lib/auth/dal";
import { listOrders } from "@/lib/admin/orders";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/models/constants";
import { formatDate, formatPKR } from "@/lib/format";

export const metadata = { title: "Orders · Admin" };

/** "21 Nov" (year only when it isn't this year). */
function shortDate(d) {
  const s = formatDate(d);
  return new Date(d).getFullYear() === new Date().getFullYear() ? s.replace(/ \d{4}$/, "") : s;
}

/** The next thing an admin does with an order (bold button) or just "Open". */
function rowAction(o) {
  const url = `/admin/orders/${o._id}`;
  if (o.status === "PENDING_PAYMENT" && o.payment?.status === "PENDING") return { label: "Review payment", href: "/admin/payments", strong: true };
  if (["CONFIRMED", "IN_PRODUCTION", "QC_PASSED"].includes(o.status)) return { label: "Update", href: url, strong: true };
  return { label: "Open", href: url, strong: false };
}

function Thumb({ src }) {
  return (
    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
      {src && <Image src={src} alt="" fill sizes="36px" className="object-cover" />}
    </span>
  );
}

const productText = (o) => {
  const first = o.items?.[0];
  const more = (o.items?.length ?? 1) - 1;
  return `${first?.title ?? ""}${first?.qty > 1 ? ` ×${first.qty}` : ""}${more > 0 ? ` + ${more} more` : ""}`;
};

const pager = "inline-flex h-9 items-center rounded-full border border-line bg-surface px-4 font-medium hover:bg-surface-2";

async function OrdersList({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(one(sp.status)) ? one(sp.status) : undefined;
  const q = String(one(sp.q) ?? "").slice(0, 60);
  const { items, total, page, pages, counts } = await listOrders({ status, q, page: one(sp.page) });

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
        <nav aria-label="Filter orders" className="flex gap-1 overflow-x-auto border-b border-line px-2 py-2">
          {[undefined, ...ORDER_STATUSES].map((s) => {
            const active = s === status;
            const n = s ? counts[s] ?? 0 : counts.ALL ?? 0;
            return (
              <Link
                key={s ?? "all"}
                href={withQuery("/admin/orders", { status: s, q })}
                aria-current={active ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active ? "bg-surface-2 font-medium text-ink" : "text-muted hover:bg-surface-2/60 hover:text-ink"
                }`}
              >
                {s ? ORDER_STATUS_LABELS[s] : "All"}
                {n > 0 && <span className={`tabular-nums ${active ? "text-ink" : "text-muted"}`}>{n}</span>}
              </Link>
            );
          })}
        </nav>

        <Form action="/admin/orders" role="search" className="border-b border-line p-3">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="admin-orders-q" className="sr-only">
            Search orders
          </label>
          <div className="relative">
            <ShellIcon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="admin-orders-q"
              name="q"
              type="search"
              defaultValue={q}
              maxLength={60}
              placeholder="Search order, seller, buyer, city, tracking or product"
              className="h-10 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-muted/80 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
          </div>
        </Form>

        {items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-medium">{counts.ALL ? "No orders here" : "No orders yet"}</p>
            <p className="mt-1 text-sm text-muted">{q ? "Try a different search." : counts.ALL ? "Nothing with this status right now." : "Orders sellers place will show up here."}</p>
          </div>
        ) : (
          <>
            {/* Wide screens: table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2/60 text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Order</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Seller</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Product</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Ship to</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Total</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-4 py-2.5"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((o) => {
                    const act = rowAction(o);
                    return (
                      <tr key={o._id} className="hover:bg-surface-2/40">
                        <td className="whitespace-nowrap px-4 py-3">
                          <Link href={`/admin/orders/${o._id}`} className="font-mono text-[13px] font-medium hover:underline">
                            {o.orderNumber}
                          </Link>
                          <span className="block text-xs text-muted">{shortDate(o.createdAt)}</span>
                        </td>
                        <td className="max-w-[10rem] px-3 py-3">
                          <span className="line-clamp-1">{o.seller?.storeName || o.seller?.name || "—"}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="flex min-w-0 items-center gap-3">
                            <Thumb src={o.items?.[0]?.image} />
                            <span className="line-clamp-1 max-w-[16rem]">{productText(o)}</span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          {o.customerName}
                          <span className="text-muted"> · {o.city}</span>
                          {o.trackingNumber && <span className="block text-xs text-muted">{o.courier ?? "Courier"} {o.trackingNumber}</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right font-medium tabular-nums">{formatPKR(o.total)}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <OrderStatusBadge status={o.status} />
                          {o.status === "PENDING_PAYMENT" && o.payment?.status === "PENDING" && <span className="mt-0.5 block text-[11px] text-muted">Proof to review</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <Link
                            href={act.href}
                            className={`inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-medium ${
                              act.strong ? "border border-line bg-surface shadow-xs hover:bg-surface-2" : "text-muted hover:text-ink"
                            }`}
                          >
                            {act.label}
                            <span className="sr-only"> order {o.orderNumber}</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Phones and tablets: compact rows */}
            <ul className="divide-y divide-line lg:hidden">
              {items.map((o) => (
                <li key={o._id}>
                  <Link href={`/admin/orders/${o._id}`} className="flex gap-3 px-4 py-3.5 hover:bg-surface-2/40">
                    <Thumb src={o.items?.[0]?.image} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[13px] font-medium">{o.orderNumber}</span>
                        <span className="text-sm font-medium tabular-nums">{formatPKR(o.total)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm">{productText(o)}</span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted">
                          {o.seller?.storeName || o.seller?.name} → {o.customerName}, {o.city} · {shortDate(o.createdAt)}
                        </span>
                        <OrderStatusBadge status={o.status} />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          <span className="flex gap-2">
            {page > 1 && (
              <Link href={withQuery("/admin/orders", { status, q, page: page - 1 })} className={pager}>
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={withQuery("/admin/orders", { status, q, page: page + 1 })} className={pager}>
                Next
              </Link>
            )}
          </span>
        </nav>
      )}
      <p className="sr-only" aria-live="polite">
        {total} orders
      </p>
    </>
  );
}

/** Admin orders: tabs by status, search, and a compact table. */
export default function AdminOrdersPage({ searchParams }) {
  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted">Move orders through production, quality check and shipping.</p>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}>
        <OrdersList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
