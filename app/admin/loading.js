/** Suspense fallback for the admin panel while the session and data load. */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-surface-2" />
      <div className="h-32 animate-pulse rounded-2xl bg-surface-2" />
      <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
    </div>
  );
}
