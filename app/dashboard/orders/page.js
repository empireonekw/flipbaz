import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import Form from "next/form";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import ShellIcon from "@/components/dashboard/shell/icons";
import { requireSeller } from "@/lib/auth/dal";
import { ORDER_TABS, listSellerOrders, tabForStatus } from "@/lib/orders";
import { formatDate, formatPKR } from "@/lib/format";

export const metadata = { title: "My orders" };

const one = (v) => (Array.isArray(v) ? v[0] : v);
const TAB_IDS = ORDER_TABS.map((t) => t.id);

/** Orders URL keeping the current tab/search. */
const href = ({ tab, q, page }) => {
  const qs = new URLSearchParams(Object.entries({ tab: tab === "all" ? "" : tab, q, page: page > 1 ? page : "" }).filter(([, v]) => v));
  return qs.toString() ? `/dashboard/orders?${qs}` : "/dashboard/orders";
};

/** "17 Nov" (year only when it isn't this year). */
function shortDate(d) {
  const s = formatDate(d);
  return new Date(d).getFullYear() === new Date().getFullYear() ? s.replace(/ \d{4}$/, "") : s;
}

const PAY_BADGE = {
  UNPAID: ["Awaiting payment", "bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200"],
  IN_REVIEW: ["Payment review", "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200"],
  REJECTED: ["Payment rejected", "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200"],
};

/** Order status, or the payment step while it's still awaiting payment. */
function StatusCell({ order }) {
  if (order.status === "PENDING_PAYMENT" && PAY_BADGE[order.pay]) {
    const [label, cls] = PAY_BADGE[order.pay];
    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
  }
  return <OrderStatusBadge status={order.status} />;
}

/** The one thing to do next for an order, if any. */
function rowAction(o) {
  const url = `/dashboard/orders/${o._id}`;
  if (o.trackingNumber && (o.status === "SHIPPED" || o.status === "DELIVERED")) return { label: "Track", href: `${url}#tracking-heading`, strong: true };
  if (o.status === "PENDING_PAYMENT" && (o.pay === "UNPAID" || o.pay === "REJECTED")) return { label: "Pay", href: `${url}#payment-heading`, strong: true };
  return { label: "View", href: url, strong: false };
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

async function OrdersList({ searchParams }) {
  const seller = await requireSeller("/dashboard/orders");
  const sp = await searchParams;
  const rawTab = one(sp.tab) ?? tabForStatus(one(sp.status));
  const tab = TAB_IDS.includes(rawTab) ? rawTab : "all";
  const q = String(one(sp.q) ?? "").slice(0, 60);
  const { items, total, page, pages, counts } = await listSellerOrders(seller.id, { tab, q, page: one(sp.page) });

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
        <nav aria-label="Filter orders" className="flex gap-1 overflow-x-auto border-b border-line px-2 py-2">
          {ORDER_TABS.map((t) => {
            const active = t.id === tab;
            const n = counts[t.id] ?? 0;
            return (
              <Link
                key={t.id}
                href={href({ tab: t.id, q })}
                aria-current={active ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active ? "bg-surface-2 font-medium text-ink" : "text-muted hover:bg-surface-2/60 hover:text-ink"
                }`}
              >
                {t.label}
                {t.id !== "all" && n > 0 && <span className={`tabular-nums ${active ? "text-ink" : "text-muted"}`}>{n}</span>}
              </Link>
            );
          })}
        </nav>

        <Form action="/dashboard/orders" role="search" className="border-b border-line p-3">
          {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
          <label htmlFor="orders-q" className="sr-only">
            Search orders
          </label>
          <div className="relative">
            <ShellIcon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="orders-q"
              name="q"
              type="search"
              defaultValue={q}
              maxLength={60}
              placeholder="Search order, tracking, buyer or product"
              className="h-10 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-muted/80 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
          </div>
        </Form>

        {items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-medium">{counts.all ? "No orders here" : "No orders yet"}</p>
            <p className="mt-1 text-sm text-muted">
              {counts.all ? (q ? "Try a different search." : "Nothing in this tab right now.") : "When a buyer orders from your store, place it with us here."}
            </p>
            {!counts.all && (
              <Link href="/dashboard/orders/new" className="mt-4 inline-flex h-9 items-center rounded-full bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950">
                Place your first order
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Wide screens: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2/60 text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Order</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Date</th>
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
                          <Link href={`/dashboard/orders/${o._id}`} className="font-mono text-[13px] font-medium hover:underline">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted">{shortDate(o.createdAt)}</td>
                        <td className="px-3 py-3">
                          <span className="flex min-w-0 items-center gap-3">
                            <Thumb src={o.items?.[0]?.image} />
                            <span className="line-clamp-1 max-w-[22rem]">{productText(o)}</span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          {o.customerName}
                          <span className="text-muted"> · {o.city}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right font-medium tabular-nums">{formatPKR(o.total)}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <StatusCell order={o} />
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

            {/* Phones: compact rows */}
            <ul className="divide-y divide-line md:hidden">
              {items.map((o) => (
                <li key={o._id}>
                  <Link href={`/dashboard/orders/${o._id}`} className="flex gap-3 px-4 py-3.5 hover:bg-surface-2/40">
                    <Thumb src={o.items?.[0]?.image} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[13px] font-medium">{o.orderNumber}</span>
                        <span className="text-sm font-medium tabular-nums">{formatPKR(o.total)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm">{productText(o)}</span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted">
                          {o.customerName} · {o.city} · {shortDate(o.createdAt)}
                        </span>
                        <StatusCell order={o} />
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
              <Link href={href({ tab, q, page: page - 1 })} className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-4 font-medium hover:bg-surface-2">
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={href({ tab, q, page: page + 1 })} className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-4 font-medium hover:bg-surface-2">
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

export default function OrdersPage({ searchParams }) {
  return (
    <>
      <DashboardBanner />
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">My orders</h1>
        <Link
          href="/dashboard/orders/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400"
        >
          <ShellIcon name="plus" className="h-4 w-4" />
          New order
        </Link>
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}>
        <OrdersList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
