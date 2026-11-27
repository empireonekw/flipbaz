import { Suspense } from "react";
import Link from "next/link";
import ApplyForm from "./ApplyForm";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import { requireSeller } from "@/lib/auth/dal";
import { getOpenApplication } from "@/lib/services";

export const metadata = { title: "Apply for store management" };

async function Apply() {
  const user = await requireSeller("/dashboard/services/apply");
  const open = await getOpenApplication(user.id);
  if (open) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-6 text-center shadow-xs">
        <p className="font-medium">You already have an application in progress</p>
        <p className="mt-1 text-sm text-muted">We&apos;ll book a call or send your quote soon. You can follow it on the Services page.</p>
        <Link href="/dashboard/services" className="mt-4 inline-flex h-9 items-center rounded-full bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950">
          View my application
        </Link>
      </div>
    );
  }
  const [firstName, ...rest] = user.name.trim().split(/\s+/);
  return (
    <ApplyForm
      defaults={{
        firstName: firstName ?? "",
        lastName: rest.join(" "),
        email: user.email,
        phone: user.whatsapp || user.phone || "",
        country: "Pakistan",
      }}
    />
  );
}

/** Three-step application for store management. */
export default function ApplyPage() {
  return (
    <>
      <DashboardBanner />
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/dashboard" className="hover:text-ink hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href="/dashboard/services" className="hover:text-ink hover:underline">
              Store management
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-ink">
            Apply
          </li>
        </ol>
      </nav>
      <div className="mx-auto mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Apply for store management</h1>
        <p className="mt-1 text-sm text-muted">Three short steps. We review your stores, meet you on Google Meet, then send a quote.</p>
      </div>
      <Suspense fallback={<div className="mx-auto h-[36rem] max-w-2xl animate-pulse rounded-2xl bg-surface-2" />}>
        <Apply />
      </Suspense>
    </>
  );
}
