import { Suspense } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import ThemeToggle from "./ThemeToggle";
import MobileMenu from "./MobileMenu";
import { getCurrentUser, homeForRole } from "@/lib/auth/dal";

const NAV = [
  { href: "/catalog", label: "Catalog" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/help", label: "Help" },
  { href: "/contact", label: "Contact" },
];

/**
 * Auth-aware buttons. Reads the session, so it streams in behind Suspense and
 * the rest of the header stays in the static shell.
 * @param {{ stacked?: boolean }} props
 */
async function AuthButtons({ stacked = false }) {
  const user = await getCurrentUser();
  const full = stacked ? "w-full" : "";
  if (user) {
    return (
      <Button href={homeForRole(user.role)} size={stacked ? "lg" : "sm"} className={full}>
        {user.role === "ADMIN" ? "Admin panel" : "My dashboard"}
      </Button>
    );
  }
  return (
    <>
      <Button href="/login" variant="outline" size={stacked ? "lg" : "sm"} className={full}>
        Log in
      </Button>
      <Button href="/signup" variant="accent" size={stacked ? "lg" : "sm"} className={full}>
        Join now
      </Button>
    </>
  );
}

const AuthFallback = () => <div className="h-9 w-40 animate-pulse rounded-xl bg-surface-2" aria-hidden="true" />;

/** Sticky public site header with desktop nav and a phone menu. */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/85 backdrop-blur supports-backdrop-filter:bg-page/70">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo imgClassName="h-9 w-auto sm:h-10" />
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-2 md:flex">
            <Suspense fallback={<AuthFallback />}>
              <AuthButtons />
            </Suspense>
          </div>
          <MobileMenu
            links={NAV}
            authSlot={
              <Suspense fallback={<AuthFallback />}>
                <AuthButtons stacked />
              </Suspense>
            }
          />
        </div>
      </div>
    </header>
  );
}
