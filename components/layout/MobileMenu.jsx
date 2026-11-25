"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";

/**
 * Phone navigation: a menu button that opens a full-width panel.
 * Closes when any link inside is followed, and on Escape.
 * (Deliberately avoids usePathname so the header can prerender on every route.)
 * @param {{ links: {href: string, label: string}[], authSlot: React.ReactNode }} props
 */
export default function MobileMenu({ links, authSlot }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /** Close after following any link (including ones in authSlot). */
  function onPanelClick(e) {
    if (e.target.closest("a")) setOpen(false);
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-surface-2"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <div
        id={panelId}
        hidden={!open}
        onClick={onPanelClick}
        className="absolute inset-x-0 top-full border-b border-line bg-surface px-5 pb-6 pt-2 shadow-lg"
      >
        <nav aria-label="Mobile">
          <ul className="divide-y divide-line">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block py-3.5 text-base font-medium text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-4 flex flex-col gap-3">{authSlot}</div>
      </div>
    </div>
  );
}
