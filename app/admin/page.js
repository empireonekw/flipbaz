import { Suspense } from "react";
import Link from "next/link";
import { AdminHeader, adminCard } from "@/components/admin/AdminUI";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { requireAdmin } from "@/lib/auth/dal";
import { getDashboardStats } from "@/lib/admin/stats";
import { formatDate, formatDateTime, formatPKR } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/models/constants";

export const metadata = { title: "Admin" };

/** One KPI tile. */
function Stat({ label, value, sub, href, tone = "plain" }) {
  const toneCls = tone === "alert" ? "border-accent-300 bg-accent-50/60 dark:border-accent-800 dark:bg-accent-900/20" : "border-line bg-surface";
  const body = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </>
  );
  return href ? (
    <Link href={href} className={`block rounded-[var(--radius-card)] border p-5 shadow-sm hover:border-brand-400 ${toneCls}`}>
      {body}
    </Link>
  ) : (
    <div className={`rounded-[var(--radius-card)] border p-5 shadow-sm ${toneCls}`}>{body}</div>
  );
}

async function Overview() {
  await requireAdmin();
  const s = await getDashboardStats();
  const maxOrders = Math.max(1, ...Object.values(s.ordersByStatus));
  const month = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "Asia/Karachi" }).format(new Date(s.monthStart));

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li>
          <Stat label="Active members" value={s.activeMembers} sub={`${s.newSellersThisMonth} new sellers in ${month}`} href="/admin/members?state=ACTIVE" />
        </li>
        <li>
          <Stat
            label="Pending payments"
            value={s.pendingPayments.total}
            sub={`${s.pendingPayments.membership} membership · ${s.pendingPayments.order} order`}
            href="/admin/payments"
            tone={s.pendingPayments.total ? "alert" : "plain"}
          />
        </li>
        <li>
          <Stat
            label={`Revenue in ${month}`}
            value={formatPKR(s.revenueThisMonth.total)}
            sub={`${formatPKR(s.revenueThisMonth.membership)} memberships · ${formatPKR(s.revenueThisMonth.order)} orders`}
          />
        </li>
        <li>
          <Stat label="Unread messages" value={s.unreadMessages} href="/admin/messages?filter=unread" tone={s.unreadMessages ? "alert" : "plain"} />
        </li>
      </ul>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section aria-labelledby="orders-status-heading" className={adminCard}>
          <h2 id="orders-status-heading" className="text-lg font-bold">
            Orders by status
          </h2>
          <ul className="mt-4 space-y-2.5">
            {ORDER_STATUSES.map((st) => (
              <li key={st}>
                <Link href={`/admin/orders?status=${st}`} className="group grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 text-sm">
                  <span className="truncate text-muted group-hover:text-ink">{ORDER_STATUS_LABELS[st]}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                    <span
                      className="block h-full rounded-full bg-brand-600 dark:bg-brand-400"
                      style={{ width: `${(s.ordersByStatus[st] / maxOrders) * 100}%` }}
                    />
                  </span>
                  <span className="text-right font-semibold tabular-nums">{s.ordersByStatus[st]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="queue-heading" className={adminCard}>
          <div className="flex items-center justify-between">
            <h2 id="queue-heading" className="text-lg font-bold">
              To make and ship
            </h2>
            <Link href="/admin/orders?status=CONFIRMED" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
              All orders
            </Link>
          </div>
          {s.workQueue.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Nothing in production right now.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {s.workQueue.map((o) => (
                <li key={o._id}>
                  <Link href={`/admin/orders/${o._id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-surface-2/50">
                    <span className="min-w-0">
                      <span className="font-mono font-bold">{o.orderNumber}</span>
                      <span className="block truncate text-xs text-muted">
                        {o.seller?.name} → {o.city} · {formatDate(o.createdAt)}
                      </span>
                    </span>
                    <OrderStatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="pending-heading" className={`${adminCard} mt-5`}>
        <div className="flex items-center justify-between">
          <h2 id="pending-heading" className="text-lg font-bold">
            Oldest payments waiting
          </h2>
          <Link href="/admin/payments" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
            Review all
          </Link>
        </div>
        {s.recentPending.length === 0 ? (
          <p className="mt-4 text-sm text-muted">All caught up. No payments to review.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {s.recentPending.map((p) => (
              <li key={p._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span>
                  <span className="font-semibold">{p.user?.name ?? "Seller"}</span> · {p.purpose === "MEMBERSHIP" ? "Membership" : "Order"} ·{" "}
                  {PAYMENT_METHOD_LABELS[p.method]}
                </span>
                <span className="text-muted">
                  <strong className="text-ink">{formatPKR(p.amount)}</strong> · {formatDateTime(p.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function AdminPage() {
  return (
    <>
      <AdminHeader title="Overview" description="Today at Flip Baz." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <Overview />
      </Suspense>
    </>
  );
}
