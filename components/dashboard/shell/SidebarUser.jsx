import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { connectDB } from "@/lib/db";
import { unreadNotificationCount } from "@/lib/notifications";
import { logoutAction } from "@/app/(auth)/actions";
import ThemeToggle from "@/components/layout/ThemeToggle";
import ShellIcon from "./icons";

/** Two-letter initials for the avatar. */
const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

/**
 * Signed-in user card at the bottom of the sidebar: avatar, name, updates
 * bell with unread count, theme toggle and logout. Reads the session, so it
 * renders inside <Suspense>.
 */
export default async function SidebarUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  await connectDB();
  const unread = await unreadNotificationCount(user.id);

  return (
    <div className="space-y-2 text-white">
      <div className="flex items-center gap-3 px-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold" aria-hidden="true">
          {initials(user.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{user.name}</span>
          <span className="block truncate text-xs text-white/50">{user.email}</span>
        </span>
      </div>
      <div className="flex items-center gap-1 px-1">
      <Link
        href="/dashboard/updates"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
        aria-label={unread ? `Updates, ${unread} unread` : "Updates"}
      >
        <ShellIcon name="bell" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-accent-500 px-1 text-center text-[11px] font-bold leading-5 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
      <ThemeToggle className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white" />
      <form action={logoutAction}>
        <button type="submit" aria-label="Log out" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white">
          <ShellIcon name="logout" />
        </button>
      </form>
      </div>
    </div>
  );
}
