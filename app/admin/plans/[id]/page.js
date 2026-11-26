import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PlanForm from "../PlanForm";
import { AdminHeader, adminCard } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/auth/dal";
import { getPlan } from "@/lib/admin/plans";

export const metadata = { title: "Plan · Admin" };

/** Handles both /admin/plans/new and /admin/plans/<id>. */
async function PlanEditor({ params }) {
  await requireAdmin();
  const { id } = await params;
  const plan = id === "new" ? null : await getPlan(id);
  if (id !== "new" && !plan) notFound();
  return (
    <>
      <AdminHeader title={plan ? plan.name : "New plan"} />
      <div className={adminCard}>
        <PlanForm plan={plan ?? undefined} />
      </div>
    </>
  );
}

export default function PlanPage({ params }) {
  return (
    <>
      <Link href="/admin/plans" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
        ← Plans
      </Link>
      <div className="mt-3">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
          <PlanEditor params={params} />
        </Suspense>
      </div>
    </>
  );
}
