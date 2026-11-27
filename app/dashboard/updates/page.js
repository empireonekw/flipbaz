import { Suspense } from "react";
import Link from "next/link";
import { markUpdatesReadAction } from "../actions";
import InlineAction from "@/components/admin/InlineAction";
import ShellIcon from "@/components/dashboard/shell/icons";
import { requireSeller } from "@/lib/auth/dal";
import { connectDB } from "@/lib/db";
import { listNotifications, unreadNotificationCount } from "@/lib/notifications";
import { serialize } from "@/lib/serialize";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Updates" };

async function UpdatesList() {
  const seller = await requireSeller("/dashboard/updates");
  await connectDB();
  const [items, unread] = await Promise.all([listNotifications(seller.id, 100), unreadNotificationCount(seller.id)]);
  const list = serialize(items);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{unread ? `${unread} unread` : "All caught up"}</p>
        {unread > 0 && <InlineAction action={markUpdatesReadAction} fields={{}} label="Mark all read" />}
      </div>
      {list.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line p-10 text-center text-muted">No updates yet.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          {list.map((n) => (
            <li key={n._id} className={`flex gap-3 p-4 ${n.readAt ? "" : "bg-brand-50/40 dark:bg-brand-950/30"}`}>
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.readAt ? "bg-surface-2 text-muted" : "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300"}`}>
                <ShellIcon name="bell" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">
                    {!n.readAt && <span className="sr-only">Unread: </span>}
                    {n.title}
                  </p>
                  <span className="text-xs text-muted">{formatDateTime(n.updatedAt ?? n.createdAt)}</span>
                </div>
                {n.body && <p className="text-sm text-muted">{n.body}</p>}
                {n.href && (
                  <Link href={n.href} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
                    Open <ShellIcon name="arrow" className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function UpdatesPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Updates</h1>
      <p className="mt-1 mb-6 text-muted">Payments, order progress and replies from our team.</p>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <UpdatesList />
      </Suspense>
    </>
  );
}
