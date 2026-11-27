import { Suspense } from "react";
import Link from "next/link";
import Form from "next/form";
import { AdminHeader, EmptyState, FilterTabs, Pagination, one, withQuery } from "@/components/admin/AdminUI";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { buttonClass } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { requireAdmin } from "@/lib/auth/dal";
import { listOrders } from "@/lib/admin/orders";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/models/constants";
import { formatDate, formatPKR } from "@/lib/format";

export const metadata = { title: "Orders · Admin" };

async function OrdersTable({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(one(sp.status)) ? one(sp.status) : undefined;
  const q = one(sp.q) ?? "";
  const { items, page, pages, counts } = await listOrders({ status, q, page: one(sp.page) });

  return (
    <>
      <Form action="/admin/orders" role="search" className="mb-4 flex gap-2 sm:max-w-lg">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="admin-orders-q" className="sr-only">
          Search orders
        </label>
        <input id="admin-orders-q" name="q" type="search" defaultValue={q} placeholder="Order no., customer, seller, city, tracking…" className={inputClass} />
        <button type="submit" className={buttonClass({ variant: "outline" })}>
          Search
        </button>
      </Form>
      <FilterTabs
        label="Filter by status"
        tabs={[undefined, ...ORDER_STATUSES].map((s) => ({
          href: withQuery("/admin/orders", { status: s, q }),
          label: `${s ? ORDER_STATUS_LABELS[s] : "All"} (${s ? counts[s] ?? 0 : counts.ALL ?? 0})`,
          active: s === status,
        }))}
      />

      {items.length === 0 ? (
        <div className="mt-5">
          <EmptyState>No orders found.</EmptyState>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line bg-surface-2/60 text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Order</th>
                <th scope="col" className="px-4 py-3 font-semibold">Seller</th>
                <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Tracking</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((o) => (
                <tr key={o._id} className="hover:bg-surface-2/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o._id}`} className="font-mono font-semibold text-brand-700 hover:underline dark:text-brand-400">
                      {o.orderNumber}
                    </Link>
                    <span className="block text-xs text-muted">{formatDate(o.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">{o.seller?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {o.customerName}
                    <span className="block text-xs text-muted">{o.city}</span>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-xs">{o.trackingNumber ? `${o.courier ?? ""} ${o.trackingNumber}` : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPKR(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} hrefFor={(n) => withQuery("/admin/orders", { status, q, page: n })} />
    </>
  );
}

export default function AdminOrdersPage({ searchParams }) {
  return (
    <>
      <AdminHeader title="Orders" description="Move orders through production, quality check and shipping." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <OrdersTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}
