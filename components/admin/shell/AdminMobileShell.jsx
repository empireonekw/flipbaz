"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";
import ShellIcon from "@/components/dashboard/shell/icons";

/**
 * Phone/tablet top bar for the admin panel with a slide-in drawer. The drawer
 * shows the same server-rendered sidebar (passed in as `sidebar`) and closes
 * when any link in it is followed.
 * @param {{ sidebar: React.ReactNode }} props
 */
export default function AdminMobileShell({ sidebar }) {
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
        <Link href="/admin" className="flex items-center gap-2 font-sans font-extrabold tracking-tight">
          <LogoMark className="h-7 w-7" />
          <span>
            flip<span className="text-brand-300">baz</span>
          </span>
          <span className="rounded-md bg-accent-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-200">Admin</span>
        </Link>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10">
          <ShellIcon name="menu" className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50" />
          <div
            className="absolute inset-y-0 left-0 flex w-[min(19rem,88vw)] flex-col overflow-y-auto bg-[#0f1714] px-3 pb-4 pt-3 text-white shadow-2xl"
            onClick={(e) => e.target.closest("a") && setOpen(false)}
          >
            <div className="mb-3 flex justify-end">
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10">
                <ShellIcon name="close" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}
    </div>
  );
}
