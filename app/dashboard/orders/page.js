import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import Form from "next/form";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import { buttonClass } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { requireSeller } from "@/lib/auth/dal";
import { listSellerOrders } from "@/lib/orders";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/models/constants";
import { formatDate, formatPKR } from "@/lib/format";

export const metadata = { title: "My orders" };

const one = (v) => (Array.isArray(v) ? v[0] : v);
const href = (params) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v && v !== 1));
  return qs.toString() ? `/dashboard/orders?${qs}` : "/dashboard/orders";
};

async function OrdersList({ searchParams }) {
  const seller = await requireSeller("/dashboard/orders");
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(one(sp.status)) ? one(sp.status) : undefined;
  const q = one(sp.q) ?? "";
  const { items, total, page, pages, counts } = await listSellerOrders(seller.id, { status, q, page: one(sp.page) });

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Form action="/dashboard/orders" role="search" className="flex w-full gap-2 sm:max-w-md">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="orders-q" className="sr-only">
            Search orders
          </label>
          <input id="orders-q" name="q" type="search" defaultValue={q} placeholder="Order no., customer, phone, tracking…" className={inputClass} />
          <button type="submit" className={buttonClass({ variant: "outline" })}>
            Search
          </button>
        </Form>
        <Link href="/dashboard/orders/new" className={buttonClass({ variant: "accent" })}>
          + New order
        </Link>
      </div>

      <nav aria-label="Filter by status" className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {[undefined, ...ORDER_STATUSES].map((s) => {
          const active = s === status;
          const n = s ? counts[s] ?? 0 : counts.ALL ?? 0;
          return (
            <Link
              key={s ?? "all"}
              href={href({ status: s, q })}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                active ? "border-brand-700 bg-brand-700 text-white dark:border-brand-500 dark:bg-brand-500 dark:text-brand-950" : "border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              {s ? ORDER_STATUS_LABELS[s] : "All"} ({n})
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line p-10 text-center">
          <p className="font-semibold">{counts.ALL ? "No orders match" : "No orders yet"}</p>
          <p className="mt-1 text-sm text-muted">
            {counts.ALL ? "Try a different filter or search." : "When a customer buys from your store, place the order here."}
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((o) => {
            const first = o.items?.[0];
            const more = (o.items?.length ?? 1) - 1;
            return (
              <li key={o._id}>
                <Link
                  href={`/dashboard/orders/${o._id}`}
                  className="flex gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    {first?.image && <Image src={first.image} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{o.orderNumber}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="mt-1 truncate text-sm">
                      {first?.title}
                      {first?.qty > 1 ? ` ×${first.qty}` : ""}
                      {more > 0 ? ` + ${more} more` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      For {o.customerName}, {o.city} · {formatDate(o.createdAt)}
                      {o.trackingNumber ? ` · ${o.courier ?? "Courier"} ${o.trackingNumber}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-right font-semibold">{formatPKR(o.total)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={href({ status, q, page: n })}
              aria-current={n === page ? "page" : undefined}
              className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold ${
                n === page ? "border-brand-700 bg-brand-700 text-white dark:bg-brand-500 dark:text-brand-950" : "border-line bg-surface"
              }`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
      <p className="sr-only" aria-live="polite">
        {total} orders
      </p>
    </>
  );
}

export default function OrdersPage({ searchParams }) {
  return (
    <>
      <DashboardBanner />
      <h1 className="text-2xl font-semibold tracking-tight">My orders</h1>
      <p className="mt-1 mb-6 text-muted">Every order you&apos;ve sent us, with live status and tracking.</p>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <OrdersList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
