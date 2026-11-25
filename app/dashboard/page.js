import { Suspense } from "react";
import Link from "next/link";
import MembershipStatusCard from "@/components/dashboard/MembershipStatusCard";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { buttonClass } from "@/components/ui/Button";
import { requireSeller } from "@/lib/auth/dal";
import { getMemberAccess } from "@/lib/membership";
import { getPendingMembership } from "@/lib/payments";
import { getSellerOrderSummary } from "@/lib/orders";
import { serialize } from "@/lib/serialize";
import { formatDate, formatPKR } from "@/lib/format";

export const metadata = { title: "Dashboard" };

const card = "rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm sm:p-6";

async function Overview() {
  const user = await requireSeller();
  const [access, pending, summary] = await Promise.all([
    getMemberAccess(),
    getPendingMembership(user.id),
    getSellerOrderSummary(user.id),
  ]);
  const firstName = user.name.split(" ")[0];
  const stats = [
    { label: "Awaiting payment", value: summary.awaitingPayment, href: "/dashboard/orders?status=PENDING_PAYMENT" },
    { label: "In progress", value: summary.inProgress, href: "/dashboard/orders" },
    { label: "Shipped", value: summary.shipped, href: "/dashboard/orders?status=SHIPPED" },
    { label: "Delivered", value: summary.delivered, href: "/dashboard/orders?status=DELIVERED" },
  ];

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Assalam-o-Alaikum, {firstName}</h1>
          <p className="mt-1 text-muted">Here&apos;s where your Flip Baz business stands today.</p>
        </div>
        {access.isMember && (
          <Link href="/dashboard/orders/new" className={buttonClass({ variant: "accent" })}>
            + Place an order
          </Link>
        )}
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="block rounded-2xl border border-line bg-surface p-4 hover:border-brand-300 dark:hover:border-brand-700">
              <p className="text-2xl font-extrabold">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.3fr]">
        <MembershipStatusCard access={access} pending={serialize(pending)} />

        <section aria-labelledby="recent-heading" className={card}>
          <div className="flex items-center justify-between">
            <h2 id="recent-heading" className="text-lg font-bold">
              Recent orders
            </h2>
            <Link href="/dashboard/orders" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
              View all
            </Link>
          </div>
          {summary.recent.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No orders yet.{" "}
              <Link href="/catalog" className="font-semibold text-brand-700 underline dark:text-brand-400">
                Pick products to list
              </Link>
              , and when a customer buys, place the order here.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {summary.recent.map((o) => (
                <li key={o._id}>
                  <Link href={`/dashboard/orders/${o._id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-surface-2/50">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold">{o.orderNumber}</span>
                        <OrderStatusBadge status={o.status} />
                      </p>
                      <p className="truncate text-xs text-muted">
                        {o.items?.[0]?.title} · {o.customerName} · {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">{formatPKR(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <>
      <DashboardBanner />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <Overview />
      </Suspense>
    </>
  );
}
