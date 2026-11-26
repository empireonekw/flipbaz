import { Suspense } from "react";
import SessionForm from "./SessionForm";
import { deleteSessionAction } from "./actions";
import { AdminHeader, EmptyState, adminCard } from "@/components/admin/AdminUI";
import InlineAction from "@/components/admin/InlineAction";
import { requireAdmin } from "@/lib/auth/dal";
import { listSessions } from "@/lib/admin/sessions";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Live sessions · Admin" };

async function Sessions() {
  await requireAdmin();
  const sessions = await listSessions();
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
      <section aria-labelledby="new-session" className={adminCard}>
        <h2 id="new-session" className="mb-4 text-lg font-bold">
          Schedule a session
        </h2>
        <SessionForm />
      </section>
      <section aria-labelledby="list-session" className={adminCard}>
        <h2 id="list-session" className="mb-4 text-lg font-bold">
          Upcoming and recent
        </h2>
        {sessions.length === 0 ? (
          <EmptyState>No sessions scheduled.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {sessions.map((s) => {
              const past = s.ended;
              return (
                <li key={s._id} className={`flex flex-wrap items-start justify-between gap-3 py-3 ${past ? "opacity-60" : ""}`}>
                  <div className="min-w-0">
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-sm text-muted">
                      {formatDateTime(s.startsAt)} PKT · {s.durationMinutes} min{s.host ? ` · ${s.host}` : ""}
                      {past ? " · ended" : ""}
                    </p>
                  </div>
                  <InlineAction action={deleteSessionAction} fields={{ id: s._id }} label="Delete" confirm="Delete?" variant="danger" />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function AdminSessionsPage() {
  return (
    <>
      <AdminHeader title="Live sessions" description="Training calls and Q&As shown on sellers' Home page with a countdown." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <Sessions />
      </Suspense>
    </>
  );
}
