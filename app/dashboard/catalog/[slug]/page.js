import { Suspense } from "react";
import { notFound } from "next/navigation";
import ProductDetailView from "@/components/catalog/ProductDetailView";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import { requireSeller } from "@/lib/auth/dal";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { getSavedProductIds } from "@/lib/listings";
import { getMemberAccess } from "@/lib/membership";

/** Title from the product (never includes prices). */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug, { isMember: false }).catch(() => null);
  return { title: product ? product.title : "Product not found" };
}

async function Detail({ params }) {
  const { slug } = await params;
  const seller = await requireSeller(`/dashboard/catalog/${encodeURIComponent(slug)}`);
  const access = await getMemberAccess();
  const product = await getProductBySlug(slug, { isMember: access.isMember });
  if (!product) notFound();
  const [related, saved] = await Promise.all([
    getRelatedProducts(product.category?._id, product._id, { isMember: access.isMember }),
    getSavedProductIds(seller.id),
  ]);
  return <ProductDetailView app product={product} related={related} access={access} saved={saved} />;
}

/** A catalog product inside the seller app (same data and gating as /catalog/[slug]). */
export default function DashboardProductPage({ params }) {
  return (
    <>
      <DashboardBanner />
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2" aria-hidden="true">
            <div className="aspect-square animate-pulse rounded-2xl bg-surface-2" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 animate-pulse rounded-lg bg-surface-2" />
              <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
            </div>
          </div>
        }
      >
        <Detail params={params} />
      </Suspense>
    </>
  );
}
