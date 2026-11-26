import { Suspense } from "react";
import CatalogResults from "@/components/catalog/CatalogResults";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import { GridSkeleton } from "@/components/marketing/DataSections";
import { requireSeller } from "@/lib/auth/dal";

export const metadata = { title: "Catalog" };

async function SellerCatalog({ searchParams }) {
  await requireSeller("/dashboard/catalog");
  return <CatalogResults searchParams={searchParams} basePath="/dashboard/catalog" />;
}

/** The catalog inside the seller app (same data and gating as /catalog). */
export default function DashboardCatalogPage({ searchParams }) {
  return (
    <>
      <DashboardBanner />
      <h1 className="text-3xl font-extrabold tracking-tight">Catalog</h1>
      <p className="mt-1 mb-6 text-muted">Pick products to list on your store. Prices are what you pay us; you set your own selling price.</p>
      <Suspense fallback={<GridSkeleton count={8} />}>
        <SellerCatalog searchParams={searchParams} />
      </Suspense>
    </>
  );
}
