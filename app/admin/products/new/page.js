import { Suspense } from "react";
import Link from "next/link";
import ProductForm from "../ProductForm";
import { AdminHeader, adminCard } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/auth/dal";
import { listCategoriesWithCounts } from "@/lib/admin/categories";
import { MAX_PRODUCT_IMAGES } from "@/lib/admin/products";

export const metadata = { title: "New product · Admin" };

async function NewProduct() {
  await requireAdmin();
  const categories = await listCategoriesWithCounts();
  if (!categories.length) {
    return (
      <p className="text-muted">
        Create a{" "}
        <Link href="/admin/categories/new" className="font-semibold underline">
          category
        </Link>{" "}
        first.
      </p>
    );
  }
  return (
    <div className={adminCard}>
      <ProductForm categories={categories} maxImages={MAX_PRODUCT_IMAGES} />
    </div>
  );
}

export default function NewProductPage() {
  return (
    <>
      <Link href="/admin/products" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
        ← Products
      </Link>
      <div className="mt-3">
        <AdminHeader title="New product" />
      </div>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <NewProduct />
      </Suspense>
    </>
  );
}
