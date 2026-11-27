import { Suspense } from "react";
import { notFound } from "next/navigation";
import ProductDetailView from "@/components/catalog/ProductDetailView";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { getMemberAccess } from "@/lib/membership";

/** Title/description from the product (never includes prices). */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug, { isMember: false }).catch(() => null);
  if (!product) return { title: "Product not found" };
  return { title: product.title, description: product.description.slice(0, 155) };
}

async function ProductDetail({ params }) {
  const { slug } = await params;
  const access = await getMemberAccess();
  const product = await getProductBySlug(slug, { isMember: access.isMember });
  if (!product) notFound();
  const related = await getRelatedProducts(product.category?._id, product._id, { isMember: access.isMember });
  return <ProductDetailView product={product} related={related} access={access} />;
}

export default function ProductPage({ params }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2" aria-hidden="true">
            <div className="aspect-square animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
            <div className="space-y-4">
              <div className="h-10 w-3/4 animate-pulse rounded-lg bg-surface-2" />
              <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
            </div>
          </div>
        }
      >
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}
