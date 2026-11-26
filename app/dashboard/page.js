import { Suspense } from "react";
import Link from "next/link";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import SessionBanner from "@/components/dashboard/home/SessionBanner";
import StepToggle from "@/components/dashboard/home/StepToggle";
import ShellIcon from "@/components/dashboard/shell/icons";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { requireSeller } from "@/lib/auth/dal";
import { getMemberAccess } from "@/lib/membership";
import { getSellerHome } from "@/lib/seller";
import { whatsappLink } from "@/lib/config";
import { formatDate, formatPKR } from "@/lib/format";

export const metadata = { title: "Home" };

const card = "rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm sm:p-6";

/** "Good morning" etc. in Pakistan time. */
function greeting(now = new Date()) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Karachi" }).format(now));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** "Thursday, 26 Nov · 9:00 pm PKT" */
function sessionWhen(date) {
  const d = new Date(date);
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "Asia/Karachi" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Karachi" }).format(d).toLowerCase();
  return `${day} · ${time} PKT`;
}

/** Relative-ish date for update items. */
function when(date) {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60e3) return "just now";
  if (diff < 3600e3) return `${Math.floor(diff / 60e3)}m ago`;
  if (diff < 86400e3) return `${Math.floor(diff / 3600e3)}h ago`;
  return formatDate(date).replace(/ \d{4}$/, "");
}

const PAY_BADGE = {
  PAID: ["Paid", "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"],
  UNPAID: ["Unpaid", "bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200"],
  IN_REVIEW: ["Payment in review", "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200"],
  REJECTED: ["Payment rejected", "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200"],
};

/** Header row: title, greeting and quick actions. */
function Header({ firstName, access }) {
  const chip = "inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-2";
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Home</h1>
        <p className="mt-1 text-muted">
          {greeting()}, {firstName}.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/membership" className={chip}>
          <ShellIcon name="calendar" className="h-4 w-4" />
          {access.state === "ACTIVE"
            ? `${access.daysLeft} ${access.daysLeft === 1 ? "day" : "days"} left`
            : access.state === "PENDING"
              ? "Payment in review"
              : access.state === "EXPIRED"
                ? "Renew membership"
                : "Choose a plan"}
        </Link>
        <a href={whatsappLink("Hi Flip Baz, I'd like to talk to someone about my store.")} target="_blank" rel="noopener noreferrer" className={chip}>
          <ShellIcon name="phone" className="h-4 w-4" />
          Talk to us
        </a>
        <Link
          href="/dashboard/catalog"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400"
        >
          <ShellIcon name="bag" className="h-4 w-4" />
          Browse catalog
        </Link>
      </div>
    </div>
  );
}

/** Launch checklist card. */
function Checklist({ checklist }) {
  const { current, steps, completed, total } = checklist;
  const pct = Math.round((completed / total) * 100);
  const upNext = current ? steps.filter((s) => !s.done && s.id !== current.id).slice(0, 2) : [];
  return (
    <section aria-labelledby="launch-heading" className={card}>
      <p id="launch-heading" className="text-sm font-medium text-muted">
        Launch checklist
      </p>
      {current ? (
        <>
          <h2 className="mt-2 text-lg font-bold">{current.title}</h2>
          <p className="mt-1 text-sm text-muted">{current.body}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {current.manual && <StepToggle step={current.id} />}
            {current.href && (
              <Link
                href={current.href}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${
                  current.manual ? "border border-line hover:bg-surface-2" : "bg-brand-700 text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950"
                }`}
              >
                {current.cta}
                <ShellIcon name="arrow" className="h-4 w-4" />
              </Link>
            )}
          </div>
          {upNext.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-sm font-medium text-muted">Coming up</p>
              <ul className="mt-2 space-y-2">
                {upNext.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    <span className="h-4 w-4 shrink-0 rounded-full border-2 border-line" aria-hidden="true" />
                    {s.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="mt-2 text-lg font-bold">You&apos;re fully launched</h2>
          <p className="mt-1 text-sm text-muted">Every step done. Keep listing, keep selling.</p>
        </>
      )}
      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Launch progress</span>
          <span className="font-semibold">
            {completed}/{total} · {pct}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Launch progress">
          <div className="h-full rounded-full bg-accent-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </section>
  );
}

/** Latest updates card. */
function Updates({ items, unread }) {
  return (
    <section aria-labelledby="updates-heading" className={card}>
      <div className="flex items-center justify-between">
        <h2 id="updates-heading" className="font-bold">
          Updates {unread > 0 && <span className="ml-1 rounded-full bg-accent-500 px-2 py-0.5 text-xs font-bold text-white">{unread} new</span>}
        </h2>
        <Link href="/dashboard/updates" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
          See all
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nothing yet. Payment confirmations, order progress and replies from our team will show up here.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {items.map((n) => (
            <li key={n._id} className="flex gap-3 py-3">
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.readAt ? "bg-surface-2 text-muted" : "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"}`}>
                <ShellIcon name="bell" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{n.title}</p>
                  <span className="shrink-0 text-xs text-muted">{when(n.updatedAt ?? n.createdAt)}</span>
                </div>
                {n.body && <p className="line-clamp-2 text-sm text-muted">{n.body}</p>}
                {n.href && (
                  <Link href={n.href} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
                    Open <ShellIcon name="arrow" className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Order pipeline tiles + account balance. */
function OrderFlow({ flow, balance }) {
  const tiles = [
    { label: "Awaiting payment", sub: "Upload payment proof", n: flow.awaitingPayment, icon: "cash", href: "/dashboard/orders?status=PENDING_PAYMENT" },
    { label: "Payment review", sub: "We're verifying", n: flow.paymentReview, icon: "review", href: "/dashboard/orders?status=PENDING_PAYMENT" },
    { label: "In production", sub: "Being made & checked", n: flow.inProduction, icon: "factory", href: "/dashboard/orders" },
    { label: "Shipped", sub: "On the way to buyers", n: flow.shipped, icon: "truck", href: "/dashboard/orders?status=SHIPPED" },
  ];
  return (
    <section aria-labelledby="flow-heading" className={card}>
      <div className="flex items-center justify-between">
        <h2 id="flow-heading" className="font-bold">
          Order flow
        </h2>
        <span className="text-sm text-muted">
          {flow.total} {flow.total === 1 ? "order" : "orders"} total
        </span>
      </div>
      <ol className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <li key={t.label} className="relative">
            <Link href={t.href} className="block h-full rounded-2xl bg-surface-2/70 p-4 hover:bg-surface-2">
              <ShellIcon name={t.icon} className={`h-5 w-5 ${t.n ? "text-brand-700 dark:text-brand-400" : "text-muted"}`} />
              <p className={`mt-3 text-3xl font-extrabold tabular-nums ${t.n ? "" : "text-muted"}`}>{t.n}</p>
              <p className="mt-1 text-sm font-semibold">{t.label}</p>
              <p className="text-xs text-muted">{t.sub}</p>
            </Link>
            {i < tiles.length - 1 && (
              <ShellIcon name="chevron" className="absolute -right-3 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-muted lg:block" />
            )}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-line px-4 py-3">
        <span className="flex items-center gap-2 text-sm">
          <ShellIcon name="wallet" className="h-4 w-4 text-muted" />
          Account balance
        </span>
        <span className="font-bold">{formatPKR(balance)}</span>
      </div>
    </section>
  );
}

/** Recent orders: table on wide screens, stacked cards on phones. */
function RecentOrders({ orders }) {
  return (
    <section aria-labelledby="recent-heading" className={`${card} p-0! overflow-hidden`}>
      <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
        <h2 id="recent-heading" className="font-bold">
          Recent orders
        </h2>
        <Link href="/dashboard/orders" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
          View all
        </Link>
      </div>
      {orders.length === 0 ? (
        <p className="px-5 pb-6 pt-3 text-sm text-muted sm:px-6">
          No orders yet. When a buyer orders from your store,{" "}
          <Link href="/dashboard/orders/new" className="font-semibold text-brand-700 underline dark:text-brand-400">
            place it here
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="mt-4 hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2/70 text-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold">Order</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Product</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Status · next step</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Total</th>
                  <th scope="col" className="px-6 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td className="px-6 py-3.5 font-mono font-bold">{o.orderNumber}</td>
                    <td className="max-w-56 truncate px-3 py-3.5">
                      {o.product}
                      {o.more ? ` +${o.more}` : ""}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-muted">{formatDate(o.createdAt).replace(/ \d{4}$/, "")}</td>
                    <td className="px-3 py-3.5">
                      <span className="flex flex-wrap gap-1.5">
                        <OrderStatusBadge status={o.status} />
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${PAY_BADGE[o.payment][1]}`}>{PAY_BADGE[o.payment][0]}</span>
                      </span>
                      <span className="mt-1 block text-xs text-muted">{o.next}</span>
                    </td>
                    <td className="px-3 py-3.5 text-right font-semibold">{formatPKR(o.total)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <Link href={`/dashboard/orders/${o._id}`} className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
                        Open<span className="sr-only"> order {o.orderNumber}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-3 divide-y divide-line md:hidden">
            {orders.map((o) => (
              <li key={o._id}>
                <Link href={`/dashboard/orders/${o._id}`} className="block px-5 py-3.5">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold">{o.orderNumber}</span>
                    <span className="text-sm font-semibold">{formatPKR(o.total)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted">{o.product}</span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    <OrderStatusBadge status={o.status} />
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${PAY_BADGE[o.payment][1]}`}>{PAY_BADGE[o.payment][0]}</span>
                  </span>
                  <span className="mt-1 block text-xs text-muted">{o.next}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

async function Home() {
  const user = await requireSeller();
  const access = await getMemberAccess();
  const data = await getSellerHome(user.id, access);

  return (
    <div className="space-y-5">
      <Header firstName={user.name.split(" ")[0]} access={access} />
      {data.session && <SessionBanner session={data.session} isMember={access.isMember} whenLabel={sessionWhen(data.session.startsAt)} />}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Checklist checklist={data.checklist} />
        <Updates items={data.notifications} unread={data.unread} />
      </div>
      <OrderFlow flow={data.flow} balance={data.balance} />
      <RecentOrders orders={data.recentOrders} />
    </div>
  );
}

export default function DashboardHomePage() {
  return (
    <>
      <DashboardBanner />
      <Suspense
        fallback={
          <div className="space-y-5" aria-busy="true" aria-label="Loading">
            <div className="h-16 animate-pulse rounded-2xl bg-surface-2" />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="h-72 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
              <div className="h-72 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
            </div>
            <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
          </div>
        }
      >
        <Home />
      </Suspense>
    </>
  );
}
