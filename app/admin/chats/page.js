import { Suspense } from "react";
import AdminChat from "./AdminChat";
import { AdminHeader } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/auth/dal";
import { connectDB } from "@/lib/db";
import { listConversations } from "@/lib/chat";

export const metadata = { title: "Chats · Admin" };

async function Inbox() {
  const admin = await requireAdmin();
  await connectDB();
  const initial = await listConversations({ id: admin.id, role: "ADMIN" });
  return <AdminChat initial={initial} />;
}

export default function AdminChatsPage() {
  return (
    <>
      <AdminHeader title="Chats" description="Live support conversations with sellers." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <Inbox />
      </Suspense>
    </>
  );
}
