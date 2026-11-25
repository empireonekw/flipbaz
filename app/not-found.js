import Link from "next/link";

/** 404 page. */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-6xl font-extrabold text-brand-700 dark:text-brand-400">404</p>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted">The page you&apos;re looking for has moved or never existed.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/catalog" className="inline-flex h-11 items-center rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950">
          Browse the catalog
        </Link>
        <Link href="/" className="inline-flex h-11 items-center rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface-2">
          Go home
        </Link>
      </div>
    </div>
  );
}
