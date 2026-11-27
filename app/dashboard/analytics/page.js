import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import SpendChart from "@/components/dashboard/analytics/SpendChart";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import ShellIcon from "@/components/dashboard/shell/icons";
import { requireSeller } from "@/lib/auth/dal";
import { getSellerAnalytics } from "@/lib/analytics";
import { formatDate, formatPKR } from "@/lib/format";

export const metadata = { title: "Analytics" };

const card = "rounded-2xl border border-line bg-surface shadow-xs";
const pct = (n) => `${Math.round(n * 1000) / 10}%`;

/** One headline number (label · value · context line). */
function Stat({ label, value, sub, icon }) {
  return (
    <div className={`${card} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        <ShellIcon name={icon} className="h-[18px] w-[18px] text-muted" />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted">{sub}</p>
    </div>
  );
}

/** Profit section: how-to when nothing is tracked yet, numbers once it is. */
function Profit({ profit }) {
  if (!profit.tracked) {
    return (
      <div className="mt-4 rounded-xl bg-surface-2/60 p-4 sm:p-5">
        <p className="text-sm font-medium">Start tracking your profit</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li>When you place an order, fill in &ldquo;Your sale&rdquo;: what your customer paid you.</li>
          <li>Add the marketplace fees (commission, payment and delivery charges they kept).</li>
          <li>Your profit after Flip Baz costs shows up here straight away. For older orders, add it on the order page.</li>
        </ol>
        <Link href="/dashboard/orders/new" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400">
          Place an order <ShellIcon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const tiles = [
    { label: "Your sales", value: formatPKR(profit.revenue), sub: "What customers paid you" },
    { label: "Flip Baz cost", value: formatPKR(profit.cost), sub: "Products + shipping" },
    { label: "Marketplace fees", value: formatPKR(profit.fees), sub: "As you entered them" },
    { label: "Profit", value: formatPKR(profit.profit), sub: profit.margin == null ? "" : `${pct(profit.margin)} margin`, strong: true },
  ];
  return (
    <>
      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl bg-surface-2/60 p-4">
            <dt className="text-sm text-muted">{t.label}</dt>
            <dd className={`mt-1 text-xl font-semibold tabular-nums ${t.strong ? (profit.profit >= 0 ? "text-brand-700 dark:text-brand-400" : "text-red-600 dark:text-red-400") : ""}`}>{t.value}</dd>
            <dd className="text-xs text-muted">{t.sub}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted">
        Based on {profit.tracked} {profit.tracked === 1 ? "order" : "orders"} with sale figures
        {profit.untracked > 0 ? `; ${profit.untracked} ${profit.untracked === 1 ? "order has" : "orders have"} none yet (add them on the order page).` : "."}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium">By marketplace</h3>
          <table className="mt-2 w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th scope="col" className="py-1.5 font-medium">Marketplace</th>
                <th scope="col" className="py-1.5 text-right font-medium">Orders</th>
                <th scope="col" className="py-1.5 text-right font-medium">Sales</th>
                <th scope="col" className="py-1.5 text-right font-medium">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {profit.byMarketplace.map((m) => (
                <tr key={m.marketplace}>
                  <td className="py-2">{m.marketplace}</td>
                  <td className="py-2 text-right tabular-nums">{m.orders}</td>
                  <td className="py-2 text-right tabular-nums">{formatPKR(m.revenue)}</td>
                  <td className={`py-2 text-right font-medium tabular-nums ${m.profit < 0 ? "text-red-600 dark:text-red-400" : ""}`}>{formatPKR(m.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="text-sm font-medium">Latest orders</h3>
          <ul className="mt-2 divide-y divide-line">
            {profit.recent.map((o) => (
              <li key={o._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <Link href={`/dashboard/orders/${o._id}`} className="line-clamp-1 hover:underline">
                    {o.title}
                  </Link>
                  <span className="block text-xs text-muted">
                    <span className="font-mono">{o.orderNumber}</span> · {formatDate(o.createdAt)} · sold {formatPKR(o.revenue)}
                  </span>
                </span>
                <span className={`shrink-0 font-medium tabular-nums ${o.profit < 0 ? "text-red-600 dark:text-red-400" : ""}`}>{formatPKR(o.profit)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

async function Analytics() {
  const seller = await requireSeller("/dashboard/analytics");
  const a = await getSellerAnalytics(seller.id);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total spent" icon="receipt" value={formatPKR(a.totalSpent)} sub="All orders, excl. cancelled" />
        <Stat label="Orders placed" icon="box" value={a.orderCount} sub="All time, excl. cancelled" />
        <Stat label="Avg order value" icon="trend" value={formatPKR(a.avgOrderValue)} sub="Per order" />
        <Stat
          label="Reorder cadence"
          icon="repeat"
          value={a.reorderDays == null ? "—" : `${a.reorderDays} ${a.reorderDays === 1 ? "day" : "days"}`}
          sub={a.reorderDays == null ? "Needs 2 or more orders" : "Avg gap between orders"}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section aria-labelledby="spend-heading" className={`${card} p-5`}>
          <h2 id="spend-heading" className="text-base font-semibold">
            Spend, last 6 months
          </h2>
          <p className="mt-0.5 mb-4 text-xs text-muted">What you paid Flip Baz per month, incl. shipping</p>
          <SpendChart data={a.monthly} />
        </section>

        <section aria-labelledby="top-heading" className={`${card} p-5`}>
          <h2 id="top-heading" className="text-base font-semibold">
            Top products by spend
          </h2>
          {a.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Your most-ordered products will show here after your first order.</p>
          ) : (
            <ol className="mt-3 divide-y divide-line">
              {a.topProducts.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-medium tabular-nums">{i + 1}</span>
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
                    {p.image && <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    {p.slug ? (
                      <Link href={`/dashboard/catalog/${p.slug}`} className="line-clamp-1 text-sm hover:underline">
                        {p.title}
                      </Link>
                    ) : (
                      <span className="line-clamp-1 text-sm">{p.title}</span>
                    )}
                    <span className="block text-xs text-muted">
                      {p.units} {p.units === 1 ? "unit" : "units"} · {p.orders} {p.orders === 1 ? "order" : "orders"}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium tabular-nums">{formatPKR(p.spend)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section aria-labelledby="profit-heading" className={`${card} mt-5 p-5`}>
        <h2 id="profit-heading" className="flex items-center gap-2 text-base font-semibold">
          <ShellIcon name="trend" className="h-[18px] w-[18px] text-muted" />
          Profit
        </h2>
        <p className="mt-1 text-sm text-muted">What you actually keep after Flip Baz costs, shipping and marketplace fees.</p>
        <Profit profit={a.profit} />
      </section>
    </>
  );
}

/** Seller analytics: spend, order habits, top products and profit. */
export default function AnalyticsPage() {
  return (
    <>
      <DashboardBanner />
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/dashboard" className="hover:text-ink hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-ink">
            Analytics
          </li>
        </ol>
      </nav>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Analytics</h1>
      <Suspense
        fallback={
          <div className="space-y-5" aria-busy="true" aria-label="Loading">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
              ))}
            </div>
            <div className="h-80 animate-pulse rounded-2xl bg-surface-2" />
          </div>
        }
      >
        <Analytics />
      </Suspense>
    </>
  );
}
