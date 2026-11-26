import { Suspense } from "react";
import { deleteMessageAction, setReadAction } from "./actions";
import { AdminHeader, EmptyState, FilterTabs, Pagination, adminCard, one, withQuery } from "@/components/admin/AdminUI";
import InlineAction from "@/components/admin/InlineAction";
import { requireAdmin } from "@/lib/auth/dal";
import { listMessages } from "@/lib/admin/messages";
import { whatsappLinkTo } from "@/lib/config";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Messages · Admin" };

async function Inbox({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = one(sp.filter) === "unread" ? "unread" : "all";
  const { items, unread, page, pages } = await listMessages({ filter, page: one(sp.page) });

  return (
    <>
      <FilterTabs
        label="Messages"
        tabs={[
          { href: "/admin/messages", label: "All", active: filter === "all" },
          { href: "/admin/messages?filter=unread", label: `Unread (${unread})`, active: filter === "unread" },
        ]}
      />
      {items.length === 0 ? (
        <div className="mt-5">
          <EmptyState>{filter === "unread" ? "No unread messages." : "No messages yet."}</EmptyState>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((m) => (
            <li key={m._id} className={`${adminCard} ${m.read ? "" : "border-brand-300 dark:border-brand-700"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">
                    {!m.read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-accent-500 align-middle" aria-label="Unread" />}
                    {m.name}
                  </p>
                  <p className="text-sm text-muted">
                    <a href={`mailto:${m.email}`} className="underline">
                      {m.email}
                    </a>
                    {m.phone && (
                      <>
                        {" · "}
                        <a href={whatsappLinkTo(m.phone)} target="_blank" rel="noopener noreferrer" className="underline">
                          {m.phone} (WhatsApp)
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <p className="text-xs text-muted">{formatDateTime(m.createdAt)}</p>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <InlineAction action={setReadAction} fields={{ id: m._id, read: m.read ? "false" : "true" }} label={m.read ? "Mark unread" : "Mark read"} />
                <InlineAction action={deleteMessageAction} fields={{ id: m._id }} label="Delete" confirm="Delete message?" variant="danger" />
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pages={pages} hrefFor={(n) => withQuery("/admin/messages", { filter: filter === "unread" ? "unread" : undefined, page: n })} />
    </>
  );
}

export default function AdminMessagesPage({ searchParams }) {
  return (
    <>
      <AdminHeader title="Messages" description="From the contact form. Reply by email or WhatsApp." />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <Inbox searchParams={searchParams} />
      </Suspense>
    </>
  );
}
