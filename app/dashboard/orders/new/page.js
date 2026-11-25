import { Suspense } from "react";
import Link from "next/link";
import OrderForm from "./OrderForm";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import { buttonClass } from "@/components/ui/Button";
import { requireSeller } from "@/lib/auth/dal";
import { getMemberAccess } from "@/lib/membership";
import { getOrderableProducts } from "@/lib/catalog";
import { getPaymentAccounts } from "@/lib/payments";

export const metadata = { title: "New order" };

const one = (v) => (Array.isArray(v) ? v[0] : v);

async function NewOrder({ searchParams }) {
  await requireSeller("/dashboard/orders/new");
  const sp = await searchParams;
  const access = await getMemberAccess();

  if (!access.isMember) {
    return (
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6 text-center">
        <h2 className="text-lg font-bold">Ordering needs an active membership</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {access.state === "PENDING"
            ? "Your membership payment is being reviewed. You can place orders as soon as it's approved."
            : "Renew your membership to see prices and send us orders. Your past orders are still in your history."}
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          {access.state !== "PENDING" && (
            <Link href="/dashboard/membership#checkout" className={buttonClass({ variant: "accent" })}>
              {access.state === "EXPIRED" ? "Renew membership" : "Choose a plan"}
            </Link>
          )}
          <Link href="/dashboard/orders" className={buttonClass({ variant: "outline" })}>
            View my orders
          </Link>
        </div>
      </div>
    );
  }

  const products = await getOrderableProducts(access);
  return <OrderForm products={products} accounts={getPaymentAccounts()} initialProductSlug={one(sp.product)} />;
}

export default function NewOrderPage({ searchParams }) {
  return (
    <>
      <DashboardBanner />
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Place an order</h1>
      <p className="mt-1 mb-6 text-muted">Got a sale? Tell us what to make and where to send it.</p>
      <Suspense fallback={<div className="h-[40rem] animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <NewOrder searchParams={searchParams} />
      </Suspense>
    </>
  );
}
