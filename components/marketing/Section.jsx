/**
 * Page section with consistent spacing and an optional heading block.
 * Use titleAs="h1" for the first section of a page that has no other h1.
 * @param {{ id?: string, eyebrow?: string, title?: string, titleAs?: "h1"|"h2", intro?: string, className?: string, tone?: "plain"|"tint", children: React.ReactNode }} props
 */
export default function Section({ id, eyebrow, title, titleAs = "h2", intro, className = "", tone = "plain", children }) {
  const headingId = id ? `${id}-heading` : undefined;
  const Heading = titleAs;
  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      className={`${tone === "tint" ? "bg-surface-2/60" : ""} py-16 sm:py-20 ${className}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {(eyebrow || title || intro) && (
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
            {eyebrow && (
              <p className="text-sm font-semibold uppercase tracking-wider text-accent-600 dark:text-accent-300">{eyebrow}</p>
            )}
            {title && (
              <Heading id={headingId} className="mt-2 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                {title}
              </Heading>
            )}
            {intro && <p className="mt-4 text-pretty text-muted">{intro}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
