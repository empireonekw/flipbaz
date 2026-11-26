import { Suspense } from "react";
import CatalogResults from "@/components/catalog/CatalogResults";
import { GridSkeleton } from "@/components/marketing/DataSections";

export const metadata = {
  title: "Catalog",
  description: "Browse Sialkot-made leather goods, sportswear, boxing gear and gloves you can sell without holding stock.",
};

export default function CatalogPage({ searchParams }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Catalog</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Every product here is made in Sialkot, quality-checked, and shipped to your customer under your
          store&apos;s name.
        </p>
      </header>
      <Suspense
        fallback={
          <>
            <div className="mb-6 h-11 animate-pulse rounded-xl bg-surface-2" />
            <GridSkeleton count={8} />
          </>
        }
      >
        <CatalogResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
