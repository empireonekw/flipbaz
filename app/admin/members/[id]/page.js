import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ExtendForm from "./ExtendForm";
import { endMembershipAction, setAccountActiveAction } from "../actions";
import { AdminHeader, adminCard } from "@/components/admin/AdminUI";
import InlineAction from "@/components/admin/InlineAction";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { requireAdmin } from "@/lib/auth/dal";
import { getSellerDetail } from "@/lib/admin/members";
import { formatDate, formatDateTime, formatPKR } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/models/constants";
import { whatsappLinkTo } from "@/lib/config";

export const metadata = { title: "Member · Admin" };

const payCls = { PENDING: "text-accent-700 dark:text-accent-300", APPROVED: "text-brand-700 dark:text-brand-400", REJECTED: "text-red-600 dark:text-red-400" };

async function Member({ params }) {
  await requireAdmin();
  const { id } = await params;
  const d = await getSellerDetail(id);
  if (!d) notFound();
  const { user, memberships, payments, orders, orderCount, live } = d;
  const wa = user.whatsapp || user.phone;

  return (
    <>
      <AdminHeader
        title={user.name}
        description={`${user.email} · joined ${formatDate(user.createdAt)}`}
        action={
          wa ? (
            <a href={whatsappLinkTo(wa, `Assalam-o-Alaikum ${user.name.split(" ")[0]}, this is Flip Baz support.`)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
              WhatsApp {wa} ↗
            </a>
          ) : null
        }
      />
      {user.isActive === false && (
        <p role="status" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
          This account is disabled. The seller can&apos;t log in.
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-5">
          <section aria-labelledby="mem-heading" className={adminCard}>
            <h2 id="mem-heading" className="text-lg font-bold">
              Membership
            </h2>
            <p className="mt-2 text-sm">
              {live ? (
                <>
                  <strong className="text-brand-700 dark:text-brand-400">Active</strong> until {formatDate(live.endsAt)} ({live.planSnapshot?.name})
                </>
              ) : (
                <strong className="text-muted">No active membership</strong>
              )}
            </p>
            <div className="mt-4 border-t border-line pt-4">
              <ExtendForm userId={user._id} hasLive={Boolean(live)} />
            </div>
            {live && (
              <div className="mt-4 border-t border-line pt-4">
                <InlineAction action={endMembershipAction} fields={{ userId: user._id }} label="End membership now" confirm="End it today?" variant="danger" />
              </div>
            )}
          </section>

          <section aria-labelledby="acct-heading" className={adminCard}>
            <h2 id="acct-heading" className="text-lg font-bold">
              Account
            </h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div>
                <dt className="inline text-muted">Phone: </dt>
                <dd className="inline">{user.phone || "—"}</dd>
              </div>
              <div>
                <dt className="inline text-muted">WhatsApp: </dt>
                <dd className="inline">{user.whatsapp || "—"}</dd>
              </div>
              <div>
                <dt className="inline text-muted">City: </dt>
                <dd className="inline">{user.city || "—"}</dd>
              </div>
            </dl>
            <div className="mt-4">
              {user.isActive === false ? (
                <InlineAction action={setAccountActiveAction} fields={{ userId: user._id, active: "true" }} label="Enable account" />
              ) : (
                <InlineAction action={setAccountActiveAction} fields={{ userId: user._id, active: "false" }} label="Disable account" confirm="Disable and sign them out?" variant="danger" />
              )}
            </div>
          </section>

          <section aria-labelledby="hist-heading" className={adminCard}>
            <h2 id="hist-heading" className="text-lg font-bold">
              Membership history
            </h2>
            {memberships.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Never bought a plan.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line text-sm">
                {memberships.map((m) => (
                  <li key={m._id} className="py-2">
                    <span className="font-semibold">{m.planSnapshot?.name}</span> · {m.status}
                    <span className="block text-xs text-muted">
                      {m.startsAt ? `${formatDate(m.startsAt)} → ${formatDate(m.endsAt)}` : `Requested ${formatDate(m.createdAt)}`}
                      {m.adminNote ? ` · ${m.adminNote}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section aria-labelledby="orders-heading" className={adminCard}>
            <h2 id="orders-heading" className="text-lg font-bold">
              Orders ({orderCount})
            </h2>
            {orders.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No orders yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line text-sm">
                {orders.map((o) => (
                  <li key={o._id}>
                    <Link href={`/admin/orders/${o._id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-surface-2/50">
                      <span>
                        <span className="font-mono font-bold">{o.orderNumber}</span>
                        <span className="block text-xs text-muted">
                          {o.customerName}, {o.city} · {formatDate(o.createdAt)}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <OrderStatusBadge status={o.status} />
                        <span className="font-semibold">{formatPKR(o.total)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="pay-heading" className={adminCard}>
            <h2 id="pay-heading" className="text-lg font-bold">
              Payments
            </h2>
            {payments.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No payments yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line text-sm">
                {payments.map((p) => (
                  <li key={p._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span>
                      <strong className={payCls[p.status]}>{p.status}</strong> · {p.purpose === "MEMBERSHIP" ? "Membership" : `Order ${p.order?.orderNumber ?? ""}`}
                      <span className="block text-xs text-muted">
                        {PAYMENT_METHOD_LABELS[p.method]} · {p.transactionId} · {formatDateTime(p.createdAt)}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-semibold">{formatPKR(p.amount)}</span>
                      {p.screenshotUrl && (
                        <a href={p.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-700 underline dark:text-brand-400">
                          Proof
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default function AdminMemberPage({ params }) {
  return (
    <>
      <Link href="/admin/members" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
        ← Members
      </Link>
      <div className="mt-3">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
          <Member params={params} />
        </Suspense>
      </div>
    </>
  );
}
