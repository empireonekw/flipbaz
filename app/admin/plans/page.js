import { Suspense } from "react";
import Link from "next/link";
import { deletePlanAction } from "./actions";
import { AdminHeader, EmptyState, adminCard, one } from "@/components/admin/AdminUI";
import InlineAction from "@/components/admin/InlineAction";
import Alert from "@/components/ui/Alert";
import { buttonClass } from "@/components/ui/Button";
import { requireAdmin } from "@/lib/auth/dal";
import { listPlans } from "@/lib/admin/plans";
import { formatPKR } from "@/lib/format";

export const metadata = { title: "Plans · Admin" };

async function Plans({ searchParams }) {
  await requireAdmin();
  const [plans, sp] = await Promise.all([listPlans(), searchParams]);
  return (
    <>
      {one(sp.saved) && (
        <Alert tone="success" className="mb-4">
          Plan saved.
        </Alert>
      )}
      {plans.length === 0 ? (
        <EmptyState>No plans yet. Sellers can&apos;t join until you create one.</EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <li key={p._id} className={`${adminCard} ${p.active ? "" : "opacity-70"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">{p.name}</h2>
                {p.isRecommended && <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">Most popular</span>}
                {!p.active && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">Hidden</span>}
              </div>
              <p className="mt-2 text-2xl font-semibold">{formatPKR(p.totalPrice)}</p>
              <p className="text-sm text-muted">
                {p.months} {p.months === 1 ? "month" : "months"} · {formatPKR(p.pricePerMonth)}/month
              </p>
              <p className="mt-2 text-xs text-muted">{p.membershipCount} memberships sold</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/admin/plans/${p._id}`} className={buttonClass({ variant: "outline", size: "sm" })}>
                  Edit
                </Link>
                {p.membershipCount === 0 && <InlineAction action={deletePlanAction} fields={{ id: p._id }} label="Delete" confirm="Delete?" variant="danger" />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function AdminPlansPage({ searchParams }) {
  return (
    <>
      <AdminHeader
        title="Plans"
        description="Membership plans on the pricing page. Plans that have been bought can be hidden but not deleted."
        action={
          <Link href="/admin/plans/new" className={buttonClass({ variant: "accent" })}>
            + New plan
          </Link>
        }
      />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <Plans searchParams={searchParams} />
      </Suspense>
    </>
  );
}
