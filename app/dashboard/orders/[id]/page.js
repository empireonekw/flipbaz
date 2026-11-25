import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import OrderPaymentForm from "./OrderPaymentForm";
import CancelOrderButton from "./CancelOrderButton";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import OrderTimeline from "@/components/orders/OrderTimeline";
import CopyText from "@/components/dashboard/CopyText";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import Alert from "@/components/ui/Alert";
import { requireSeller } from "@/lib/auth/dal";
import { canSellerCancel, getSellerOrder } from "@/lib/orders";
import { getPaymentAccounts } from "@/lib/payments";
import { formatDateTime, formatPKR } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/models/constants";

export const metadata = { title: "Order details" };

const one = (v) => (Array.isArray(v) ? v[0] : v);
const card = "rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm sm:p-6";

/** Payment block: status, rejection reason, and a pay form when needed. */
function PaymentSection({ order, payment }) {
  const needsPayment = order.status === "PENDING_PAYMENT" && (!payment || payment.status === "REJECTED");
  return (
    <section aria-labelledby="payment-heading" className={card}>
      <h2 id="payment-heading" className="text-lg font-bold">
        Payment
      </h2>
      {payment && (
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Status</dt>
            <dd className="font-semibold">
              {payment.status === "PENDING" ? "Waiting for review" : payment.status === "APPROVED" ? "Approved" : "Rejected"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Amount</dt>
            <dd className="font-semibold">{formatPKR(payment.amount)}</dd>
          </div>
          <div>
            <dt className="text-muted">Method</dt>
            <dd className="font-semibold">{PAYMENT_METHOD_LABELS[payment.method]}</dd>
          </div>
          <div>
            <dt className="text-muted">Transaction ID</dt>
            <dd className="font-mono font-semibold">{payment.transactionId}</dd>
          </div>
          {payment.screenshotUrl && (
            <div>
              <dt className="text-muted">Screenshot</dt>
              <dd>
                <a href={payment.screenshotUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline dark:text-brand-400">
                  View your upload
                </a>
              </dd>
            </div>
          )}
        </dl>
      )}
      {payment?.status === "REJECTED" && (
        <Alert tone="error" className="mt-4">
          We couldn&apos;t verify this payment{payment.adminNote ? `: ${payment.adminNote}` : ""}. Please pay again below.
        </Alert>
      )}
      {needsPayment && (
        <div className="mt-5">
          <OrderPaymentForm orderId={order._id} amount={order.total} accounts={getPaymentAccounts()} />
        </div>
      )}
    </section>
  );
}

async function OrderDetail({ params, searchParams }) {
  const seller = await requireSeller("/dashboard/orders");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const found = await getSellerOrder(seller.id, id);
  if (!found) notFound();
  const { order, payment } = found;

  return (
    <>
      <Link href="/dashboard/orders" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
        ← All orders
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-extrabold tracking-tight sm:text-3xl">{order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted">
        Placed {formatDateTime(order.createdAt)} · {order.marketplace}
        {order.marketplaceOrderRef ? ` order ${order.marketplaceOrderRef}` : ""}
      </p>

      {one(sp.placed) && (
        <Alert tone="success" className="mt-5">
          <strong>Order placed.</strong> We&apos;ll verify your payment and start production. Track every step here.
        </Alert>
      )}
      {one(sp.paid) && payment?.status === "PENDING" && (
        <Alert tone="success" className="mt-5">
          Payment submitted. We&apos;ll confirm it shortly.
        </Alert>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          {order.trackingNumber && (
            <section aria-labelledby="tracking-heading" className={`${card} border-brand-200 dark:border-brand-800`}>
              <h2 id="tracking-heading" className="text-lg font-bold">
                Tracking
              </h2>
              <p className="mt-2 text-sm text-muted">Share this with your customer.</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm font-semibold">{order.courier || "Courier"}</span>
                <span className="font-mono text-lg font-bold">{order.trackingNumber}</span>
                <CopyText value={order.trackingNumber} label="tracking number" />
              </div>
            </section>
          )}

          <section aria-labelledby="items-heading" className={card}>
            <h2 id="items-heading" className="text-lg font-bold">
              Items
            </h2>
            <ul className="mt-3 divide-y divide-line">
              {order.items.map((it) => (
                <li key={it._id} className="flex gap-3 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    {it.image && <Image src={it.image} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold">{it.title}</p>
                    <p className="text-muted">
                      {[it.variant?.size, it.variant?.color].filter(Boolean).join(" · ") || "Standard"} · Qty {it.qty} ·{" "}
                      {formatPKR(it.unitPrice)} each
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">{formatPKR(it.unitPrice * it.qty)}</p>
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
              <div className="flex justify-between text-base font-bold">
                <dt>Total</dt>
                <dd>{formatPKR(order.total)}</dd>
              </div>
            </dl>
          </section>

          <PaymentSection order={order} payment={payment} />
        </div>

        <div className="space-y-5">
          <section aria-labelledby="status-heading" className={card}>
            <h2 id="status-heading" className="mb-4 text-lg font-bold">
              Status
            </h2>
            <OrderTimeline status={order.status} history={order.statusHistory} />
          </section>

          <section aria-labelledby="customer-heading" className={card}>
            <h2 id="customer-heading" className="text-lg font-bold">
              Deliver to
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
            {order.notes && <p className="mt-3 text-sm text-muted">Notes: {order.notes}</p>}
          </section>

          {canSellerCancel(order, payment) && (
            <div className="px-1">
              <CancelOrderButton orderId={order._id} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function OrderDetailPage({ params, searchParams }) {
  return (
    <>
      <DashboardBanner />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <OrderDetail params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
