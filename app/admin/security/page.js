import { Suspense } from "react";
import { unblockAction } from "./actions";
import { AdminHeader, EmptyState, adminCard } from "@/components/admin/AdminUI";
import InlineAction from "@/components/admin/InlineAction";
import { requireAdmin } from "@/lib/auth/dal";
import { IP_ACCOUNT_WINDOW_MS, IP_BLOCK_MS, IP_MAX_ACCOUNTS, LIMITS, TRUST_PROXY_HOPS } from "@/lib/security/config";
import { listBlocks } from "@/lib/security/limiter";
import { requestIp } from "@/lib/security/guard";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Security · Admin" };

const minutes = (ms) => Math.round(ms / 60000);

async function SecurityPanel() {
  await requireAdmin();
  const [blocks, myIp] = [listBlocks(), await requestIp()];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.4fr]">
      <section aria-labelledby="rules-heading" className={adminCard}>
        <h2 id="rules-heading" className="text-lg font-bold">
          Current rules
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Accounts per IP before block</dt>
            <dd className="font-semibold">
              {IP_MAX_ACCOUNTS} in {minutes(IP_ACCOUNT_WINDOW_MS)} min (block on #{IP_MAX_ACCOUNTS + 1})
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Block length</dt>
            <dd className="font-semibold">{minutes(IP_BLOCK_MS)} min</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Requests per IP</dt>
            <dd className="font-semibold">
              {LIMITS.globalRead.limit}/min reads · {LIMITS.globalWrite.limit}/min writes
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Login attempts</dt>
            <dd className="font-semibold">
              {LIMITS.loginPerIp.limit}/IP · {LIMITS.loginPerEmail.limit} failures/account per {minutes(LIMITS.loginPerEmail.windowMs)} min
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Trusted proxy hops</dt>
            <dd className="font-semibold">{TRUST_PROXY_HOPS}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Your IP</dt>
            <dd className="font-mono font-semibold">{myIp || "unknown (not behind server.js)"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted">
          Change these with env vars (IP_MAX_ACCOUNTS, IP_ACCOUNT_WINDOW_MINUTES, IP_BLOCK_MINUTES, RATE_GLOBAL_PER_MIN,
          RATE_WRITE_PER_MIN, TRUST_PROXY_HOPS). Add trusted addresses, like your office, to SECURITY_EXEMPT_IPS.
        </p>
      </section>

      <section aria-labelledby="blocks-heading" className={adminCard}>
        <h2 id="blocks-heading" className="text-lg font-bold">
          Blocked IPs ({blocks.length})
        </h2>
        <p className="mt-1 text-sm text-muted">Many mobile users in Pakistan share an IP. Unblock if a real seller is caught.</p>
        {blocks.length === 0 ? (
          <div className="mt-4">
            <EmptyState>No IPs are blocked right now.</EmptyState>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {blocks.map((b) => (
              <li key={b.ip} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold">{b.ip}</p>
                  <p className="text-xs text-muted">
                    {b.reason} · until {formatDateTime(b.until)}
                  </p>
                </div>
                <InlineAction action={unblockAction} fields={{ ip: b.ip }} label="Unblock" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function AdminSecurityPage() {
  return (
    <>
      <AdminHeader title="Security" description="Rate limits and IPs blocked for using too many accounts." />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <SecurityPanel />
      </Suspense>
    </>
  );
}
