import { Suspense } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";
import { AdminNavList } from "@/components/admin/shell/AdminNav";
import { AdminFooterCard, AdminNavWithBadges, AdminWelcome } from "@/components/admin/shell/AdminSidebarParts";
import AdminMobileShell from "@/components/admin/shell/AdminMobileShell";

const WelcomeFallback = () => <div className="h-[8.5rem] animate-pulse rounded-2xl bg-white/5" aria-hidden="true" />;

/** Sidebar body shared by the desktop column and the phone drawer. */
function SidebarBody() {
  return (
    <>
      <Suspense fallback={<WelcomeFallback />}>
        <AdminWelcome />
      </Suspense>
      <div className="mt-5 flex-1">
        <Suspense fallback={<AdminNavList pathname={null} />}>
          <AdminNavWithBadges />
        </Suspense>
      </div>
      <div className="mt-5">
        <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-white/5" aria-hidden="true" />}>
          <AdminFooterCard />
        </Suspense>
      </div>
    </>
  );
}

/**
 * Admin shell: dark sidebar (welcome card, grouped nav with waiting-item
 * badges, review card) on desktop, top bar + drawer on phones. Every admin
 * page still calls requireAdmin() itself; proxy.js 404s everyone else.
 */
export default function AdminLayout({ children }) {
  return (
    <div className="min-h-dvh bg-page font-app text-[15px] lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto bg-[#0f1714] px-3 pb-3 pt-4 text-white lg:flex">
        <Link href="/admin" className="mb-4 flex items-center gap-2 px-2 font-sans text-base font-extrabold tracking-tight">
          <LogoMark className="h-8 w-8" />
          <span>
            flip<span className="text-brand-300">baz</span>
          </span>
          <span className="ml-1 rounded-md bg-accent-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-200">Admin</span>
        </Link>
        <SidebarBody />
      </aside>

      <div className="flex min-w-0 flex-col">
        <AdminMobileShell sidebar={<SidebarBody />} />
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
