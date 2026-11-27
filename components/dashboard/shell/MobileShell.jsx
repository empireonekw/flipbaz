"use client";

import { Suspense, useEffect, useState } from "react";
import { LogoImage } from "@/components/ui/Logo";
import Link from "next/link";
import ShellIcon from "./icons";
import SidebarNav, { SidebarNavFallback } from "./SidebarNav";

/**
 * Phone/tablet top bar with a slide-in drawer holding the same sidebar.
 * @param {{ userSlot: React.ReactNode }} props  server-rendered user card
 */
export default function MobileShell({ userSlot }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#0f1714] px-4 text-white">
        <Link href="/dashboard" aria-label="FlipBaz seller home" className="flex items-center">
          <LogoImage tone="dark" className="h-7 w-auto" priority />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10"
        >
          <ShellIcon name="menu" className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-[#0f1714] px-4 pb-4 pt-3 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <LogoImage tone="dark" className="h-7 w-auto" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10">
                <ShellIcon name="close" />
              </button>
            </div>
            <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
              <Suspense fallback={<SidebarNavFallback />}>
                <SidebarNav onNavigate={() => setOpen(false)} />
              </Suspense>
            </div>
            <div className="mt-3 border-t border-white/10 pt-3" onClick={(e) => e.target.closest("a") && setOpen(false)}>
              {userSlot}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
