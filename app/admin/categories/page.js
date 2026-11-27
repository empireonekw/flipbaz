import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { deleteCategoryAction } from "./actions";
import { AdminHeader, EmptyState, one } from "@/components/admin/AdminUI";
import InlineAction from "@/components/admin/InlineAction";
import Alert from "@/components/ui/Alert";
import { buttonClass } from "@/components/ui/Button";
import { requireAdmin } from "@/lib/auth/dal";
import { listCategoriesWithCounts } from "@/lib/admin/categories";

export const metadata = { title: "Categories · Admin" };

async function Categories({ searchParams }) {
  await requireAdmin();
  const [cats, sp] = await Promise.all([listCategoriesWithCounts(), searchParams]);
  return (
    <>
      {one(sp.saved) && (
        <Alert tone="success" className="mb-4">
          Category saved.
        </Alert>
      )}
      {cats.length === 0 ? (
        <EmptyState>No categories yet.</EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cats.map((c) => (
            <li key={c._id} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                {c.image && <Image src={c.image} alt="" fill sizes="64px" className="object-cover" />}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/categories/${c._id}`} className="font-semibold hover:underline">
                  {c.name}
                </Link>
                <p className="text-xs text-muted">
                  /{c.slug} · order {c.sortOrder} · {c.productCount} products ({c.activeCount} visible)
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link href={`/admin/categories/${c._id}`} className={buttonClass({ variant: "outline", size: "sm" })}>
                    Edit
                  </Link>
                  {c.productCount === 0 && (
                    <InlineAction action={deleteCategoryAction} fields={{ id: c._id }} label="Delete" confirm="Delete?" variant="danger" />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function AdminCategoriesPage({ searchParams }) {
  return (
    <>
      <AdminHeader
        title="Categories"
        description="Group products in the catalog. A category can only be deleted when it's empty."
        action={
          <Link href="/admin/categories/new" className={buttonClass({ variant: "accent" })}>
            + New category
          </Link>
        }
      />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <Categories searchParams={searchParams} />
      </Suspense>
    </>
  );
}
