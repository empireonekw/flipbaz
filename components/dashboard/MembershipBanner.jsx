import { Suspense } from "react";
import Link from "next/link";
import { getMemberAccess } from "@/lib/membership";
import { getPendingMembership } from "@/lib/payments";

/**
 * Site-wide notice in the seller area about membership state: pending
 * review, rejected proof, expired, none yet, or ending soon. Renders nothing
 * when all is well.
 */
export default async function MembershipBanner() {
  const access = await getMemberAccess();
  if (!access.user || access.isAdmin) return null;
  const pending = access.state === "ACTIVE" || access.state === "PENDING" ? await getPendingMembership(access.user.id) : null;

  let tone = "warning";
  let body = null;

  if (access.state === "PENDING" && pending?.payment?.status === "REJECTED") {
    tone = "error";
    body = (
      <>
        Your payment couldn&apos;t be verified{pending.payment.adminNote ? `: ${pending.payment.adminNote}` : ""}.{" "}
        <Link href="/dashboard/membership#checkout" className="font-semibold underline">
          Submit new proof
        </Link>
      </>
    );
  } else if (access.state === "PENDING") {
    tone = "info";
    body = <>Your payment is being reviewed. Prices and ordering unlock as soon as it&apos;s approved.</>;
  } else if (access.state === "EXPIRED") {
    tone = "error";
    body = (
      <>
        Your membership has expired. Prices and new orders are paused, but your order history is safe.{" "}
        <Link href="/dashboard/membership#checkout" className="font-semibold underline">
          Renew now
        </Link>
      </>
    );
  } else if (access.state === "NONE") {
    tone = "info";
    body = (
      <>
        Welcome! Choose a membership plan to unlock wholesale prices and start taking orders.{" "}
        <Link href="/dashboard/membership#checkout" className="font-semibold underline">
          Choose a plan
        </Link>
      </>
    );
  } else if (access.state === "ACTIVE" && access.daysLeft <= 7 && pending?.payment?.status !== "PENDING") {
    body = (
      <>
        Your membership ends in {access.daysLeft} {access.daysLeft === 1 ? "day" : "days"}.{" "}
        <Link href="/dashboard/membership#checkout" className="font-semibold underline">
          Renew early
        </Link>{" "}
        and the new period starts when this one ends.
      </>
    );
  }

  if (!body) return null;
  const tones = {
    info: "border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-100",
    warning: "border-accent-200 bg-accent-50 text-accent-900 dark:border-accent-800 dark:bg-accent-900/30 dark:text-accent-100",
    error: "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`mb-6 rounded-xl border ${tones[tone]}`}>
      <p className="px-4 py-3 text-sm">{body}</p>
    </div>
  );
}

/**
 * Drop-in for the top of every dashboard page. Pages (unlike layouts) are
 * re-rendered on each navigation, so the banner is always current.
 */
export function DashboardBanner() {
  return (
    <Suspense fallback={null}>
      <MembershipBanner />
    </Suspense>
  );
}
