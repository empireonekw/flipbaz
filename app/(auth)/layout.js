import Logo from "@/components/ui/Logo";
import CurrentYear from "@/components/ui/CurrentYear";

/**
 * Shared shell for login / signup / forgot-password: a brand panel on wide
 * screens and a single centred column on phones.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-accent-500/25 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-100">
            Made in Sialkot · Shipped across Pakistan
          </span>
        </div>
        <div className="relative max-w-md">
          <p className="text-3xl font-extrabold leading-tight">
            Your store. Our workshop.
            <span className="block text-accent-300">Zero stock on your shelf.</span>
          </p>
          <p className="mt-4 text-brand-100">
            List leather goods, sportswear and boxing gear today. When a customer orders, we make it,
            check it and deliver it under your name.
          </p>
        </div>
        <p className="relative text-sm text-brand-200">© <CurrentYear /> Flip Baz</p>
      </aside>

      <main className="flex flex-col px-5 py-8 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
