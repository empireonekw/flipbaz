import { requireSeller } from "@/lib/auth/dal";
import LogoutButton from "@/components/auth/LogoutButton";
import Logo from "@/components/ui/Logo";

export const metadata = { title: "Dashboard" };

/**
 * Seller dashboard (phase 2 placeholder: proves the auth guard works).
 * Membership, orders and profile arrive in phases 4–5.
 */
export default async function DashboardPage() {
  const user = await requireSeller();
  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <div className="flex items-center justify-between">
        <Logo />
        <LogoutButton />
      </div>
      <h1 className="mt-10 text-3xl font-extrabold tracking-tight">Assalam-o-Alaikum, {user.name.split(" ")[0]}</h1>
      <p className="mt-2 text-muted">Signed in as {user.email}. Your seller dashboard is being built.</p>
    </main>
  );
}
