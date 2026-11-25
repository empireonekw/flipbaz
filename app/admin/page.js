import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata = { title: "Admin" };

/** Admin home (stats arrive in phase 6). */
async function AdminHome() {
  const user = await requireAdmin();
  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Admin panel</h1>
      <p className="mt-1 text-muted">Signed in as {user.email}.</p>
      <Link href="/admin/payments" className="mt-6 inline-block font-semibold text-brand-700 underline dark:text-brand-400">
        Review pending payments →
      </Link>
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="h-32 animate-pulse rounded-2xl bg-surface-2" />}>
      <AdminHome />
    </Suspense>
  );
}
