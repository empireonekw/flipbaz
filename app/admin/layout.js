import { Suspense } from "react";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LogoutButton from "@/components/auth/LogoutButton";
import DashboardNav, { NavList } from "@/components/dashboard/DashboardNav";

const LINKS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/chats", label: "Chats" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/messages", label: "Messages" },
];

/** Admin shell. Every admin page also calls requireAdmin() itself. */
export default function AdminLayout({ children }) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <span className="rounded-md bg-accent-100 px-2 py-0.5 text-xs font-bold text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
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
