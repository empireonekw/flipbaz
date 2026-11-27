"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ShellIcon from "./icons";
import { SELLER_NAV, SELLER_NAV_BOTTOM } from "./nav";

/** @param {{ item: Object, pathname: string | null, onNavigate?: () => void }} props */
function NavItem({ item, pathname, onNavigate }) {
  const inside = (path) => pathname === path || pathname.startsWith(`${path}/`);
  // Sub-items only show while their section is open.
  if (item.parent && (pathname == null || !inside(item.parent))) return null;
  const active =
    pathname != null && (item.exact ? pathname === item.href : inside(item.href) && !item.not?.some((p) => inside(p)));
  const base = `group flex items-center gap-2.5 rounded-lg py-2 text-sm font-medium transition-colors ${item.parent ? "pl-8 pr-2.5" : "px-2.5"}`;

  if (item.soon) {
    return (
      <li>
        <span aria-disabled="true" className={`${base} cursor-default text-white/40`}>
          <ShellIcon name={item.icon} className="h-[18px] w-[18px]" />
          {item.label}
          <span className="ml-auto rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">Soon</span>
        </span>
      </li>
    );
  }
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`${base} ${active ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "text-white/70 hover:bg-white/6 hover:text-white"}`}
      >
        <ShellIcon name={item.icon} className={`${item.parent ? "h-4 w-4" : "h-[18px] w-[18px]"} ${active ? "text-brand-300" : ""}`} />
        {item.label}
      </Link>
    </li>
  );
}

/**
 * Sidebar link lists. Reads the pathname for the active state, so the layout
 * renders it inside <Suspense> with `pathname={null}` as the fallback.
 * @param {{ onNavigate?: () => void }} props
 */
export default function SidebarNav({ onNavigate }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-1 flex-col">
      <nav aria-label="Seller" className="flex-1">
        <ul className="space-y-0.5">
          {SELLER_NAV.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </ul>
      </nav>
      <ul className="mt-4 space-y-0.5 border-t border-white/10 pt-3">
        {SELLER_NAV_BOTTOM.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </ul>
    </div>
  );
}

/** Static fallback (no active highlight) while the pathname is unknown. */
export function SidebarNavFallback() {
  return (
    <div className="flex flex-1 flex-col">
      <nav aria-label="Seller" className="flex-1">
        <ul className="space-y-0.5">
          {SELLER_NAV.map((item) => (
            <NavItem key={item.href} item={item} pathname={null} />
          ))}
        </ul>
      </nav>
      <ul className="mt-4 space-y-0.5 border-t border-white/10 pt-3">
        {SELLER_NAV_BOTTOM.map((item) => (
          <NavItem key={item.href} item={item} pathname={null} />
        ))}
      </ul>
    </div>
  );
}
