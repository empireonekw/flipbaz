import Alert from "@/components/ui/Alert";

/**
 * Layout for placeholder legal pages.
 * @param {{ title: string, updated: string, sections: {heading: string, body: string[]}[] }} props
 */
export default function LegalPage({ title, updated, sections }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>
      <Alert tone="warning" className="mt-6">
        Placeholder text for the MVP. Have this reviewed by a qualified lawyer before launch.
      </Alert>
      <div className="mt-8 space-y-8">
        {sections.map((s, i) => (
          <section key={s.heading}>
            <h2 className="text-xl font-bold">
              {i + 1}. {s.heading}
            </h2>
            {s.body.map((p) => (
              <p key={p.slice(0, 40)} className="mt-3 text-pretty leading-relaxed text-muted">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
