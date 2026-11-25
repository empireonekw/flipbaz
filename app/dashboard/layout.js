import { Suspense } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LogoutButton from "@/components/auth/LogoutButton";
import DashboardNav, { NavList } from "@/components/dashboard/DashboardNav";

const LINKS = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/orders/new", label: "New order", exact: true },
  { href: "/dashboard/orders", label: "Orders", exact: false, notPrefix: "/dashboard/orders/new" },
  { href: "/dashboard/membership", label: "Membership" },
  { href: "/dashboard/profile", label: "Profile" },
];

/**
 * Seller area shell (static). Layouts aren't re-rendered when moving between
 * sibling pages, so anything that must stay fresh, like the membership
 * banner, is rendered by each page via <DashboardBanner />.
 */
export default function DashboardLayout({ children }) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/catalog" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink sm:block">
              Browse catalog
            </Link>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
        <div className="pt-4">
          <Suspense fallback={<NavList links={LINKS} />}>
            <DashboardNav links={LINKS} />
          </Suspense>
        </div>
        <main id="main" className="pt-6">
          {children}
        </main>
      </div>
    </>
  );
}
