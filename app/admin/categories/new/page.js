import { Suspense } from "react";
import Link from "next/link";
import CategoryForm from "../CategoryForm";
import { AdminHeader, adminCard } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata = { title: "New category · Admin" };

async function Guard({ children }) {
  await requireAdmin();
  return children;
}

export default function NewCategoryPage() {
  return (
    <>
      <Link href="/admin/categories" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
        ← Categories
      </Link>
      <div className="mt-3">
        <AdminHeader title="New category" />
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <Guard>
          <div className={adminCard}>
            <CategoryForm />
          </div>
        </Guard>
      </Suspense>
    </>
  );
}
