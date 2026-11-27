import { Suspense } from "react";
import Link from "next/link";
import InsightsCard from "@/components/admin/dashboard/InsightsCard";
import RevenueChart from "@/components/admin/dashboard/RevenueChart";
import FulfilmentGauge from "@/components/admin/dashboard/FulfilmentGauge";
import PipelineBars from "@/components/admin/dashboard/PipelineBars";
import ShellIcon from "@/components/dashboard/shell/icons";
import { requireAdmin } from "@/lib/auth/dal";
import { getDashboardStats } from "@/lib/admin/stats";
import { formatDateTime, formatPKR } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/models/constants";

export const metadata = { title: "Admin" };

const TZ = "Asia/Karachi";
const card = "rounded-2xl border border-line bg-surface p-5 shadow-xs";
const iconBtn = "flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:bg-surface-2 hover:text-ink";

/** Card title row with an "open" arrow link. */
function CardHead({ id, title, href, label, children }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 id={id} className="text-base font-semibold">
        {title}
      </h2>
      <div className="flex gap-2">
        {children}
        <Link href={href} aria-label={label} title={label} className={iconBtn}>
          <ShellIcon name="external" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/** "↑ 12% vs last month" chip. Up is good for revenue. */
function Trend({ change }) {
  if (change == null) return <span className="text-xs text-muted">No sales last month to compare</span>;
  const up = change >= 0;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold ${up ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"}`}>
        {up ? "↑" : "↓"} {Math.abs(change)}%
      </span>
      vs last month
    </span>
  );
}

const PAY_STATUS = {
  PENDING: ["Waiting", "bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200"],
  APPROVED: ["Approved", "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300"],
  REJECTED: ["Rejected", "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200"],
};

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

/** Short, useful lines for the insights card, most urgent first. */
function buildInsights(s, month) {
  const list = [];
  if (s.pendingPayments.total) {
    list.push({
      text: `${s.pendingPayments.total} ${s.pendingPayments.total === 1 ? "payment is" : "payments are"} waiting for review (${formatPKR(s.pendingPayments.amount)}).`,
      href: "/admin/payments",
      cta: "Review payments",
    });
  }
  if (s.revenueChange != null) {
    list.push({
      text: `Revenue is ${s.revenueChange >= 0 ? "up" : "down"} ${Math.abs(s.revenueChange)}% on last month so far.`,
      href: "/admin/payments",
      cta: "See payments",
    });
  } else {
    list.push({ text: `${formatPKR(s.revenueThisMonth.total)} collected so far in ${month}.`, href: "/admin/payments", cta: "See payments" });
  }
  const making = s.ordersByStatus.CONFIRMED + s.ordersByStatus.IN_PRODUCTION + s.ordersByStatus.QC_PASSED;
  if (making) list.push({ text: `${making} ${making === 1 ? "order is" : "orders are"} being made right now.`, href: "/admin/orders?status=IN_PRODUCTION", cta: "Open production queue" });
  if (s.openRequests + s.newApplications) {
    list.push({
      text: `${s.openRequests} custom ${s.openRequests === 1 ? "request" : "requests"} and ${s.newApplications} store-management ${s.newApplications === 1 ? "application" : "applications"} need a reply.`,
      href: s.openRequests ? "/admin/requests" : "/admin/services",
      cta: "Reply to sellers",
    });
  }
  if (s.newSellersThisMonth) list.push({ text: `${s.newSellersThisMonth} new ${s.newSellersThisMonth === 1 ? "seller" : "sellers"} joined in ${month}.`, href: "/admin/members", cta: "See members" });
  if (s.unreadMessages) list.push({ text: `${s.unreadMessages} unread ${s.unreadMessages === 1 ? "message" : "messages"} from the contact form.`, href: "/admin/messages?filter=unread", cta: "Read messages" });
  return list;
}

/** Period chip and quick actions above the widgets. */
function Toolbar({ monthLabel }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] font-medium shadow-xs">
        <ShellIcon name="calendar" className="h-4 w-4 text-muted" />
        This month · {monthLabel}
      </span>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/payments" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[13px] font-medium shadow-xs hover:bg-surface-2">
        <ShellIcon name="cash" className="h-4 w-4 text-muted" />
        Review payments
        </Link>
        <Link
        href="/admin/products/new"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-700 px-3 text-[13px] font-medium text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400"
        >
        <ShellIcon name="plus" className="h-4 w-4" />
        Add product
        </Link>
      </div>
    </div>
  );
}

async function Overview() {
  await requireAdmin();
  const s = await getDashboardStats();
  const month = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: TZ }).format(new Date(s.monthStart));
  const o = s.ordersByStatus;
  const making = o.CONFIRMED + o.IN_PRODUCTION + o.QC_PASSED;
  const pipeline = [
    { key: "pay", label: "Awaiting payment", value: o.PENDING_PAYMENT, href: "/admin/orders?status=PENDING_PAYMENT", hint: "Waiting for payment proof or review" },
    { key: "make", label: "Being made", value: making, href: "/admin/orders?status=IN_PRODUCTION", hint: "Confirmed, in production or quality checked" },
    { key: "ship", label: "Shipped", value: o.SHIPPED, href: "/admin/orders?status=SHIPPED", hint: "With the courier" },
    { key: "done", label: "Delivered", value: o.DELIVERED, href: "/admin/orders?status=DELIVERED", hint: "Received by the buyer" },
  ];
  const open = o.PENDING_PAYMENT + making + o.SHIPPED;

  const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: TZ }).format(new Date(s.monthStart));

  return (
    <>
      <Toolbar monthLabel={monthLabel} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InsightsCard insights={buildInsights(s, month)} />

        <section aria-labelledby="rev-heading" className={card}>
          <CardHead id="rev-heading" title="Revenue overview" href="/admin/payments" label="Open payments" />
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{formatPKR(s.revenueThisMonth.total)}</p>
          <div className="mt-1">
            <Trend change={s.revenueChange} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1">
              <ShellIcon name="cash" className="h-3.5 w-3.5 text-muted" />
              {s.revenueThisMonth.payments} payments
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1">
              <ShellIcon name="membership" className="h-3.5 w-3.5 text-muted" />
              {formatPKR(s.revenueThisMonth.membership)} memberships
            </span>
          </div>
          <div className="mt-8">
            <RevenueChart data={s.dailyRevenue} />
          </div>
        </section>

        <section aria-labelledby="ful-heading" className={card}>
          <CardHead id="ful-heading" title="Fulfilment" href="/admin/orders" label="Open orders" />
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{s.activeMembers}</p>
          <p className="mt-1 text-xs text-muted">
            active members · {s.newSellersThisMonth} new in {month}
          </p>
          <p className="mt-4 text-sm font-medium">{month} orders shipped</p>
          <div className="mt-2">
            <FulfilmentGauge shipped={s.fulfilment.shipped} total={s.fulfilment.total} />
          </div>
        </section>

        <section aria-labelledby="pay-heading" className={`${card} md:col-span-2`}>
          <CardHead id="pay-heading" title="Recent payments" href="/admin/payments" label="Review all payments">
            <Link href="/admin/payments" className="hidden h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium text-muted hover:bg-surface-2 hover:text-ink sm:inline-flex">
              <ShellIcon name="filter" className="h-4 w-4" />
              {s.pendingPayments.total} waiting
            </Link>
          </CardHead>
          {s.recentPayments.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No payments yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {s.recentPayments.map((p) => {
                const [label, cls] = PAY_STATUS[p.status] ?? PAY_STATUS.PENDING;
                return (
                  <li key={p._id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3 text-sm sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold" aria-hidden="true">
                        {initials(p.user?.name)}
                      </span>
                      <span className="truncate font-medium">{p.user?.name ?? "Seller"}</span>
                    </span>
                    <span className="hidden text-muted sm:block">
                      {p.purpose === "MEMBERSHIP" ? "Membership" : "Order"} · {PAYMENT_METHOD_LABELS[p.method]}
                    </span>
                    <span className="hidden text-muted sm:block">{formatDateTime(p.createdAt)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-center text-xs font-semibold ${cls} hidden sm:inline`}>{label}</span>
                    <span className={`text-right font-semibold tabular-nums ${p.status === "APPROVED" ? "text-brand-700 dark:text-brand-400" : ""}`}>
                      {formatPKR(p.amount)}
                      <span className="block text-xs font-normal text-muted sm:hidden">{label}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="pipe-heading" className={card}>
          <CardHead id="pipe-heading" title="Orders pipeline" href="/admin/orders" label="Open orders" />
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums tracking-tight">{open}</span>
            <span className="text-xs text-muted">
              open · {s.ordersThisWeek} new this week
            </span>
          </p>
          <div className="mt-6">
            <PipelineBars data={pipeline} />
          </div>
        </section>
      </div>
    </>
  );
}

/** Admin overview: widgets for money, fulfilment, payments and the order pipeline. */
export default function AdminPage() {
  return (
    <>
      <h1 className="sr-only">Admin overview</h1>
      <Suspense
        fallback={
          <div aria-busy="true" aria-label="Loading">
            <div className="mb-5 h-9 w-56 animate-pulse rounded-lg bg-surface-2" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-72 animate-pulse rounded-2xl bg-surface-2 ${i === 3 ? "md:col-span-2" : ""}`} />
              ))}
            </div>
          </div>
        }
      >
        <Overview />
      </Suspense>
    </>
  );
}
