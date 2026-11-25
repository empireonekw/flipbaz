import { Suspense } from "react";
import Link from "next/link";
import MembershipStatusCard from "@/components/dashboard/MembershipStatusCard";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import { requireSeller } from "@/lib/auth/dal";
import { getMemberAccess } from "@/lib/membership";
import { getPendingMembership } from "@/lib/payments";
import { serialize } from "@/lib/serialize";

export const metadata = { title: "Dashboard" };

async function Overview() {
  const user = await requireSeller();
  const [access, pending] = await Promise.all([getMemberAccess(), getPendingMembership(user.id)]);
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Assalam-o-Alaikum, {firstName}</h1>
      <p className="mt-1 text-muted">Here&apos;s where your Flip Baz business stands today.</p>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <MembershipStatusCard access={access} pending={serialize(pending)} />
        <section aria-labelledby="next-heading" className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm sm:p-6">
          <h2 id="next-heading" className="text-lg font-bold">
            Next steps
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>
              <Link href="/catalog" className="font-semibold text-brand-700 underline dark:text-brand-400">
                Browse the catalog
              </Link>{" "}
              and pick products for your store.
            </li>
            <li>Download the photos and copy the listing text onto your store.</li>
            <li>When a customer orders, place the order here and we&apos;ll deliver it.</li>
          </ol>
        </section>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <>
      <DashboardBanner />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <Overview />
      </Suspense>
    </>
  );
}
