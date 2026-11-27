import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { getAdminBadges } from "@/lib/admin/badges";
import { logoutAction } from "@/app/(auth)/actions";
import ThemeToggle from "@/components/layout/ThemeToggle";
import ShellIcon from "@/components/dashboard/shell/icons";
import { formatPKR } from "@/lib/format";
import AdminNav from "./AdminNav";

const TZ = "Asia/Karachi";

/** "Thursday 27 November" in Pakistan time. */
const todayLabel = () => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(new Date());

/**
 * Greeting card at the top of the admin sidebar: today's date (Pakistan
 * time), the admin's first name and the theme switch. Reads the session, so
 * the layout renders it inside <Suspense>.
 */
export async function AdminWelcome() {
  const user = await requireAdmin();
  const today = todayLabel();
  const initials = (user?.name ?? "A")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold" aria-hidden="true">
          {initials}
        </span>
        <ThemeToggle className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white" />
      </div>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-white/50">{today}</p>
      <p className="mt-0.5 text-lg font-semibold leading-snug">Welcome back, {user?.name?.split(/\s+/)[0] ?? "Admin"}!</p>
    </div>
  );
}

/** The live nav with waiting-item badges. */
export async function AdminNavWithBadges() {
  await requireAdmin();
  const badges = await getAdminBadges();
  return <AdminNav badges={badges} />;
}

/** Bottom card: the most urgent queue, or "all caught up", plus log out. */
export async function AdminFooterCard() {
  await requireAdmin();
  const b = await getAdminBadges();
  return (
    <div className="space-y-2">
      {b.payments > 0 ? (
        <Link
          href="/admin/payments"
          className="block rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 p-4 text-white shadow-lg shadow-brand-950/40 hover:from-brand-400"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShellIcon name="sparkle" className="h-4 w-4" />
            {b.payments} {b.payments === 1 ? "payment" : "payments"} to review
          </span>
          <span className="mt-0.5 block text-xs text-white/80">{formatPKR(b.paymentsAmount)} waiting · review now</span>
        </Link>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShellIcon name="check" className="h-4 w-4 text-brand-300" />
            All caught up
          </span>
          <span className="mt-0.5 block text-xs text-white/60">No payments waiting for review.</span>
        </div>
      )}
      <form action={logoutAction}>
        <button type="submit" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-white/65 hover:bg-white/6 hover:text-white">
          <ShellIcon name="logout" className="h-[18px] w-[18px]" />
          Log out
        </button>
      </form>
    </div>
  );
}
