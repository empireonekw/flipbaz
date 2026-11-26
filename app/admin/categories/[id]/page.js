import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryForm from "../CategoryForm";
import { AdminHeader, adminCard } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/auth/dal";
import { getCategory } from "@/lib/admin/categories";

export const metadata = { title: "Edit category · Admin" };

async function EditCategory({ params }) {
  await requireAdmin();
  const { id } = await params;
  const category = await getCategory(id);
  if (!category) notFound();
  return (
    <>
      <AdminHeader title={category.name} description={`/catalog?category=${category.slug}`} />
      <div className={adminCard}>
        <CategoryForm category={category} />
      </div>
    </>
  );
}

export default function EditCategoryPage({ params }) {
  return (
    <>
      <Link href="/admin/categories" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
        ← Categories
      </Link>
      <div className="mt-3">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
          <EditCategory params={params} />
        </Suspense>
      </div>
    </>
  );
}
