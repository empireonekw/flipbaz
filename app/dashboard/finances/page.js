import { Suspense } from "react";
import Link from "next/link";
import StatementFilters from "./StatementFilters";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import { requireSeller } from "@/lib/auth/dal";
import { balanceSide, getLedger } from "@/lib/ledger";
import { formatDate, formatPKR } from "@/lib/format";

export const metadata = { title: "Finances" };

const one = (v) => (Array.isArray(v) ? v[0] : v);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const card = "rounded-2xl border border-line bg-surface shadow-xs";

const SIDE_LABEL = { DEBIT: "You owe", CREDIT: "In credit", SETTLED: "Settled" };
const SIDE_SHORT = { DEBIT: "Debit", CREDIT: "Credit", SETTLED: "Settled" };

/** Amount plus a small Debit / Credit / Settled tag. Balances are shown unsigned. */
function Balance({ amount, big = false }) {
  const side = balanceSide(amount);
  return (
    <span className="whitespace-nowrap">
      <span className={`tabular-nums ${big ? "text-xl font-semibold" : "font-medium"}`}>{formatPKR(Math.abs(amount))}</span>
      <span className={`ml-1.5 text-xs ${side === "DEBIT" ? "text-accent-700 dark:text-accent-300" : side === "CREDIT" ? "text-brand-700 dark:text-brand-400" : "text-muted"}`}>
        {big ? SIDE_LABEL[side] : SIDE_SHORT[side]}
      </span>
    </span>
  );
}

const Dash = () => <span className="text-muted">—</span>;

async function Ledger({ searchParams }) {
  const seller = await requireSeller("/dashboard/finances");
  const sp = await searchParams;
  let from = DAY.test(one(sp.from) ?? "") ? one(sp.from) : undefined;
  let to = DAY.test(one(sp.to) ?? "") ? one(sp.to) : undefined;
  if (from && to && from > to) [from, to] = [to, from];
  const ledger = await getLedger(seller.id, { from, to });

  return (
    <>
      <section aria-labelledby="summary-heading" className={`${card} p-5`}>
        <h2 id="summary-heading" className="text-base font-semibold">
          Account summary
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-2/70 p-4">
            <dt className="text-sm text-muted">Balance</dt>
            <dd className="mt-1">
              <Balance amount={ledger.balance} big />
            </dd>
          </div>
          <div className="rounded-xl bg-surface-2/70 p-4">
            <dt className="text-sm text-muted">Total debit</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{formatPKR(ledger.totalDebit)}</dd>
          </div>
          <div className="rounded-xl bg-surface-2/70 p-4">
            <dt className="text-sm text-muted">Total credit</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{formatPKR(ledger.totalCredit)}</dd>
          </div>
        </dl>
        {ledger.inReview > 0 && (
          <p className="mt-3 text-sm text-muted">
            {formatPKR(ledger.inReview)} in payments is still being checked by our team and will show here once approved.
          </p>
        )}
      </section>

      <section aria-labelledby="statement-heading" className={`${card} mt-5 overflow-hidden`}>
        <div className="p-5">
          <h2 id="statement-heading" className="text-base font-semibold">
            Statement
          </h2>
          <p className="mt-1 text-sm text-muted">Every charge and payment on your account, with the balance after each one.</p>
          <div className="mt-4">
            <StatementFilters from={from} to={to} />
          </div>
        </div>
        <p className="border-t border-line bg-surface-2/40 px-5 py-2.5 text-xs text-muted">
          A <strong className="font-medium text-ink">debit</strong> balance is what you owe Flip Baz. A <strong className="font-medium text-ink">credit</strong> balance is what Flip Baz owes you (for example a paid order we cancelled).
        </p>

        {ledger.entries.length === 0 && ledger.opening == null ? (
          <div className="border-t border-line px-6 py-12 text-center">
            <p className="font-medium">{from || to ? "Nothing in these dates" : "No transactions yet"}</p>
            <p className="mt-1 text-sm text-muted">
              {from || to ? "Try a wider date range." : "Orders you place and payments we verify will show up here."}
            </p>
          </div>
        ) : (
          <>
            {/* Wide screens */}
            <div className="hidden overflow-x-auto border-t border-line md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2/60 text-muted">
                  <tr>
                    <th scope="col" className="whitespace-nowrap px-5 py-2.5 font-medium">Date</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Reference</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Description</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Debit</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Credit</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {ledger.entries.map((e) => (
                    <tr key={e.id} className="hover:bg-surface-2/40">
                      <td className="whitespace-nowrap px-5 py-3 text-muted">{formatDate(e.date)}</td>
                      <td className={`whitespace-nowrap px-3 py-3 ${e.reference.startsWith("FB-") ? "font-mono text-[13px]" : ""}`}>
                        {e.href ? (
                          <Link href={e.href} className="hover:underline">
                            {e.reference}
                          </Link>
                        ) : (
                          e.reference
                        )}
                      </td>
                      <td className="max-w-[26rem] px-3 py-3">
                        <span className="line-clamp-1">{e.title}</span>
                        <span className="line-clamp-1 text-xs text-muted">{e.detail}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                        {e.debit ? <span className="font-medium text-accent-700 dark:text-accent-300">{formatPKR(e.debit)}</span> : <Dash />}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{e.credit ? <span className="font-medium">{formatPKR(e.credit)}</span> : <Dash />}</td>
                      <td className="px-5 py-3 text-right">
                        <Balance amount={e.balance} />
                      </td>
                    </tr>
                  ))}
                  {ledger.opening != null && (
                    <tr className="bg-surface-2/30">
                      <td className="whitespace-nowrap px-5 py-3 text-muted">{formatDate(`${from}T00:00:00+05:00`)}</td>
                      <td className="px-3 py-3" />
                      <td className="px-3 py-3 font-medium">Opening balance</td>
                      <td className="px-3 py-3" />
                      <td className="px-3 py-3" />
                      <td className="px-5 py-3 text-right">
                        <Balance amount={ledger.opening} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Phones */}
            <ul className="divide-y divide-line border-t border-line md:hidden">
              {ledger.entries.map((e) => (
                <li key={e.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm">{e.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDate(e.date)} · <span className={e.reference.startsWith("FB-") ? "font-mono" : ""}>{e.reference}</span>
                      </p>
                    </div>
                    <p className={`shrink-0 text-sm font-medium tabular-nums ${e.debit ? "text-accent-700 dark:text-accent-300" : ""}`}>
                      {e.debit ? `+${formatPKR(e.debit)}` : `−${formatPKR(e.credit)}`}
                    </p>
                  </div>
                  <p className="mt-1 text-right text-xs text-muted">
                    Balance <Balance amount={e.balance} />
                  </p>
                </li>
              ))}
              {ledger.opening != null && (
                <li className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium">Opening balance</span>
                  <Balance amount={ledger.opening} />
                </li>
              )}
            </ul>
          </>
        )}
      </section>
    </>
  );
}

/** Seller account ledger: balance, totals and a running statement. */
export default function FinancesPage({ searchParams }) {
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
            Finances
          </li>
        </ol>
      </nav>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Finances</h1>
        <p className="mt-1 text-sm text-muted">Your balance, every charge and payment, and a running statement.</p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-5" aria-busy="true" aria-label="Loading">
            <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
            <div className="h-96 animate-pulse rounded-2xl bg-surface-2" />
          </div>
        }
      >
        <Ledger searchParams={searchParams} />
      </Suspense>
    </>
  );
}
