import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import OrderUpdateForm from "./OrderUpdateForm";
import { adminCard } from "@/components/admin/AdminUI";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { requireAdmin } from "@/lib/auth/dal";
import { COURIERS, allowedNextStatuses, getOrder } from "@/lib/admin/orders";
import { formatDateTime, formatPKR } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/models/constants";

export const metadata = { title: "Order · Admin" };

const payBadge = {
  PENDING: "text-accent-700 dark:text-accent-300",
  APPROVED: "text-brand-700 dark:text-brand-400",
  REJECTED: "text-red-600 dark:text-red-400",
};

async function AdminOrder({ params }) {
  await requireAdmin();
  const { id } = await params;
  const found = await getOrder(id);
  if (!found) notFound();
  const { order, payments } = found;

  return (
    <>
      <Link href="/admin/orders" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
        ← All orders
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-semibold tracking-tight">{order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted">
        Placed {formatDateTime(order.createdAt)} · {order.marketplace}
        {order.marketplaceOrderRef ? ` ${order.marketplaceOrderRef}` : ""}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <section aria-labelledby="update-heading" className={`${adminCard} border-brand-200 dark:border-brand-800`}>
            <h2 id="update-heading" className="mb-4 text-base font-semibold">
              Update order
            </h2>
            <OrderUpdateForm order={order} nextStatuses={allowedNextStatuses(order.status)} couriers={COURIERS} />
          </section>

          <section aria-labelledby="items-heading" className={adminCard}>
            <h2 id="items-heading" className="text-base font-semibold">
              Items to make
            </h2>
            <ul className="mt-3 divide-y divide-line">
              {order.items.map((it) => (
                <li key={it._id} className="flex gap-3 py-3 text-sm">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    {it.image && <Image src={it.image} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{it.title}</p>
                    <p className="text-muted">
                      SKU {it.sku} · {[it.variant?.size, it.variant?.color].filter(Boolean).join(" · ") || "Standard"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold">×{it.qty}</p>
                    <p className="text-xs text-muted">{formatPKR(it.unitPrice)} each</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatPKR(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd>{formatPKR(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Total</dt>
                <dd>{formatPKR(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="payments-heading" className={adminCard}>
            <h2 id="payments-heading" className="text-base font-semibold">
              Payments
            </h2>
            {payments.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No payment submitted yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line text-sm">
                {payments.map((p) => (
                  <li key={p._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span>
                      <strong className={payBadge[p.status]}>{p.status}</strong> · {PAYMENT_METHOD_LABELS[p.method]} ·{" "}
                      <span className="font-mono">{p.transactionId}</span>
                      {p.adminNote ? <span className="block text-xs text-muted">Note: {p.adminNote}</span> : null}
                    </span>
                    <span className="flex items-center gap-3">
                      {formatPKR(p.amount)}
                      {p.screenshotUrl && (
                        <a href={p.screenshotUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline dark:text-brand-400">
                          Screenshot
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {payments.some((p) => p.status === "PENDING") && (
              <Link href="/admin/payments" className="mt-3 inline-block text-sm font-semibold text-brand-700 underline dark:text-brand-400">
                Review in payments queue →
              </Link>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section aria-labelledby="ship-heading" className={adminCard}>
            <h2 id="ship-heading" className="text-base font-semibold">
              Ship to
            </h2>
            <address className="mt-2 text-sm not-italic">
              <span className="font-semibold">{order.customerName}</span>
              <br />
              {order.customerPhone}
              <br />
              {order.address}
              <br />
              {order.city}
            </address>
            {order.notes && <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">Seller note: {order.notes}</p>}
          </section>

          <section aria-labelledby="seller-heading" className={adminCard}>
            <h2 id="seller-heading" className="text-base font-semibold">
              Seller
            </h2>
            {order.seller ? (
              <p className="mt-2 text-sm">
                <Link href={`/admin/members/${order.seller._id}`} className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
                  {order.seller.name}
                </Link>
                <br />
                {order.seller.email}
                <br />
                {order.seller.phone}
                {order.seller.city ? `, ${order.seller.city}` : ""}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted">Seller account removed.</p>
            )}
          </section>

          <section aria-labelledby="timeline-heading" className={adminCard}>
            <h2 id="timeline-heading" className="mb-4 text-base font-semibold">
              Timeline
            </h2>
            <OrderTimeline status={order.status} history={order.statusHistory} />
            <ul className="mt-4 space-y-1 border-t border-line pt-3 text-xs text-muted">
              {order.statusHistory.map((h, i) => (
                <li key={i}>
                  {formatDateTime(h.at)}: {h.status.replace("_", " ").toLowerCase()} by {h.changedBy?.name ?? "system"}
                  {h.note ? `, "${h.note}"` : ""}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

export default function AdminOrderPage({ params }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
      <AdminOrder params={params} />
    </Suspense>
  );
}
