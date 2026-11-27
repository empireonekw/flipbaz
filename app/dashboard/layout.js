import { Suspense } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";
import SidebarNav, { SidebarNavFallback } from "@/components/dashboard/shell/SidebarNav";
import SidebarUser from "@/components/dashboard/shell/SidebarUser";
import MobileShell from "@/components/dashboard/shell/MobileShell";
import ChatWidgetLoader from "@/components/chat/ChatWidgetLoader";
import LiveRefresh from "@/components/dashboard/shell/LiveRefresh";

const UserFallback = () => <div className="h-24 animate-pulse rounded-xl bg-white/5" aria-hidden="true" />;

/**
 * Seller app shell: dark sidebar on desktop, top bar + drawer on phones, and
 * the support chat bubble. Static parts prerender; anything that reads the
 * session streams in behind <Suspense>. Pages render their own banner via
 * <DashboardBanner /> because layouts don't re-render between sibling pages.
 */
export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-dvh bg-page font-app text-[15px] lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col bg-[#0f1714] px-3 pb-3 pt-4 text-white lg:flex">
        <Link href="/dashboard" className="mb-5 flex items-center gap-2 px-2 font-sans text-base font-extrabold tracking-tight">
          <LogoMark className="h-8 w-8" />
          <span>
            flip<span className="text-brand-300">baz</span>
          </span>
          <span className="ml-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/60">Seller</span>
        </Link>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <Suspense fallback={<SidebarNavFallback />}>
            <SidebarNav />
          </Suspense>
        </div>
        <div className="mt-3 border-t border-white/10 pt-3">
          <Suspense fallback={<UserFallback />}>
            <SidebarUser />
          </Suspense>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <MobileShell
          userSlot={
            <Suspense fallback={<UserFallback />}>
              <SidebarUser />
            </Suspense>
          }
        />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pt-8">
          {children}
        </main>
      </div>

      <Suspense fallback={null}>
        <ChatWidgetLoader />
      </Suspense>
      <LiveRefresh />
    </div>
  );
}
