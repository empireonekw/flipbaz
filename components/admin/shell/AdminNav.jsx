"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ShellIcon from "@/components/dashboard/shell/icons";
import { ADMIN_NAV } from "./nav";

/**
 * Grouped admin links. Pure (pathname comes in), so it also serves as the
 * static Suspense fallback with `pathname={null}`.
 * @param {{ pathname: string|null, badges?: Record<string, number>, onNavigate?: () => void }} props
 */
export function AdminNavList({ pathname, badges = {}, onNavigate }) {
  const active = (it) => pathname != null && (it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(`${it.href}/`));
  return (
    <nav aria-label="Admin" className="space-y-5">
      {ADMIN_NAV.map((g) => (
        <div key={g.title}>
          <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const on = active(it);
              const n = it.badge ? badges[it.badge] ?? 0 : 0;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    aria-current={on ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                      on ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "text-white/65 hover:bg-white/6 hover:text-white"
                    }`}
                  >
                    <ShellIcon name={it.icon} className={`h-[18px] w-[18px] ${on ? "text-brand-300" : ""}`} />
                    <span className="flex-1">{it.label}</span>
                    {n > 0 && (
                      <span className="min-w-5 rounded-full bg-accent-500 px-1.5 text-center text-[11px] font-semibold leading-5 text-white">
                        {n > 99 ? "99+" : n}
                        <span className="sr-only"> waiting</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Live version: reads the pathname for the active item. */
export default function AdminNav({ badges, onNavigate }) {
  const pathname = usePathname();
  return <AdminNavList pathname={pathname} badges={badges} onNavigate={onNavigate} />;
}
