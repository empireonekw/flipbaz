"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Section tabs for the seller dashboard; scrolls sideways on phones.
 * Uses usePathname, so the layout renders it inside <Suspense>.
 * @param {{ links: { href: string, label: string, exact?: boolean, notPrefix?: string }[] }} props
 *   notPrefix: a sub-path that belongs to another tab (e.g. Orders vs New order)
 */
export default function DashboardNav({ links }) {
  const pathname = usePathname();
  const isActive = (l) =>
    l.exact ? pathname === l.href : pathname.startsWith(l.href) && !(l.notPrefix && pathname.startsWith(l.notPrefix));
  return <NavList links={links} isActive={isActive} />;
}

/**
 * Static version (no active state) used as the Suspense fallback.
 * @param {{ links: { href: string, label: string }[], isActive?: (l: Object) => boolean }} props
 */
export function NavList({ links, isActive = () => false }) {
  return (
    <nav aria-label="Dashboard" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1 border-b border-line">
        {links.map((l) => {
          const active = isActive(l);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px block whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold ${
                  active
                    ? "border-brand-700 text-brand-800 dark:border-brand-400 dark:text-brand-300"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
