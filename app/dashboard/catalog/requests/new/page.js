import { Suspense } from "react";
import Link from "next/link";
import RequestForm from "./RequestForm";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import { requireSeller } from "@/lib/auth/dal";
import { listCategories } from "@/lib/catalog";

export const metadata = { title: "New custom request" };

async function Form() {
  await requireSeller("/dashboard/catalog/requests/new");
  const categories = await listCategories();
  return <RequestForm categories={categories.map((c) => ({ _id: c._id, name: c.name }))} />;
}

/** Ask us to make or source something that isn't in the catalog yet. */
export default function NewRequestPage() {
  return (
    <>
      <DashboardBanner />
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/dashboard/catalog" className="hover:text-ink hover:underline">
              Catalog
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href="/dashboard/catalog/requests" className="hover:text-ink hover:underline">
              Custom requests
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-ink">
            New request
          </li>
        </ol>
      </nav>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">New custom request</h1>
      <Suspense fallback={<div className="h-[32rem] animate-pulse rounded-2xl bg-surface-2" />}>
        <Form />
      </Suspense>
    </>
  );
}
