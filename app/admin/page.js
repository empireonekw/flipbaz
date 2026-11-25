import { requireAdmin } from "@/lib/auth/dal";
import LogoutButton from "@/components/auth/LogoutButton";
import Logo from "@/components/ui/Logo";

export const metadata = { title: "Admin" };

/**
 * Admin home (phase 2 placeholder: proves the ADMIN-only guard works).
 * Stats and management screens arrive in phase 6.
 */
export default async function AdminPage() {
  const user = await requireAdmin();
  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <div className="flex items-center justify-between">
        <Logo href="/admin" />
        <LogoutButton />
      </div>
      <h1 className="mt-10 text-3xl font-extrabold tracking-tight">Admin panel</h1>
      <p className="mt-2 text-muted">Signed in as {user.email} ({user.role}).</p>
    </main>
  );
}
