import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductForm from "../ProductForm";
import { deleteProductAction } from "../actions";
import { AdminHeader, adminCard, one } from "@/components/admin/AdminUI";
import InlineAction from "@/components/admin/InlineAction";
import Alert from "@/components/ui/Alert";
import { requireAdmin } from "@/lib/auth/dal";
import { listCategoriesWithCounts } from "@/lib/admin/categories";
import { MAX_PRODUCT_IMAGES, getProduct } from "@/lib/admin/products";

export const metadata = { title: "Edit product · Admin" };

async function EditProduct({ params, searchParams }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([getProduct(id), listCategoriesWithCounts()]);
  if (!product) notFound();

  return (
    <>
      <AdminHeader
        title={product.title}
        description={`SKU ${product.sku}`}
        action={
          product.active ? (
            <Link href={`/catalog/${product.slug}`} className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
              View in catalog ↗
            </Link>
          ) : (
            <span className="text-sm font-semibold text-muted">Hidden from catalog</span>
          )
        }
      />
      {one(sp.saved) && (
        <Alert tone="success" className="mb-4">
          Saved.
        </Alert>
      )}
      <div className={adminCard}>
        {/* Keyed by updatedAt so the form (and photo list) reloads fresh after each save. */}
        <ProductForm key={product.updatedAt} product={product} categories={categories} maxImages={MAX_PRODUCT_IMAGES} />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-red-200 p-4 dark:border-red-900/60">
        <p className="text-sm text-muted">Delete only works for products that were never ordered. Otherwise, hide it.</p>
        <InlineAction action={deleteProductAction} fields={{ id: product._id }} label="Delete product" confirm="Delete permanently?" variant="danger" />
      </div>
    </>
  );
}

export default function EditProductPage({ params, searchParams }) {
  return (
    <>
      <Link href="/admin/products" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
        ← Products
      </Link>
      <div className="mt-3">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
          <EditProduct params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
