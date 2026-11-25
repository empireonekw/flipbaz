/**
 * FAQ accordion built on <details>/<summary>: keyboard and screen-reader
 * friendly with no client JavaScript.
 * @param {{ items: {q: string, a: string}[], className?: string }} props
 */
export default function FaqList({ items, className = "" }) {
  return (
    <div className={`mx-auto max-w-3xl divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface ${className}`}>
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-ink hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
            {item.q}
            <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-muted transition group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M10 4v12M4 10h12" />
            </svg>
          </summary>
          <p className="px-5 pb-5 text-pretty text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
