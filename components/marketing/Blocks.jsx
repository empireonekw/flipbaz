import Link from "next/link";
import Icon from "./Icon";
import { buttonClass } from "@/components/ui/Button";
import { audiences, benefits, comparison, steps } from "@/lib/content";
import { siteConfig, whatsappDisplay, whatsappLink } from "@/lib/config";

/**
 * Static marketing blocks reused by the landing page and inner pages.
 * None of these touch the database, so they prerender into the static shell.
 */

/** "Who it's for" cards. */
export function AudienceGrid() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {audiences.map((a) => (
        <li key={a.title} className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-sm">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            <Icon name={a.icon} />
          </span>
          <h3 className="mt-4 font-bold">{a.title}</h3>
          <p className="mt-2 text-sm text-muted">{a.body}</p>
        </li>
      ))}
    </ul>
  );
}

/** Numbered 4-step process. */
export function StepsList() {
  return (
    <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title} className="relative rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-lg font-extrabold text-white dark:bg-brand-500 dark:text-brand-950">
            {i + 1}
          </span>
          <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
          <p className="mt-2 text-sm text-muted">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

const benefitIcons = ["box", "tag", "image", "shield", "truck", "chat", "chart", "star"];

/** Member benefits grid. */
export function BenefitsGrid() {
  return (
    <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      {benefits.map((b, i) => (
        <li key={b.title} className="flex gap-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-200">
            <Icon name={benefitIcons[i % benefitIcons.length]} className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-bold">{b.title}</h3>
            <p className="mt-1 text-sm text-muted">{b.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** "On your own vs. with Flip Baz" table; scrolls sideways on narrow phones. */
export function ComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface shadow-sm">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <caption className="sr-only">Selling on your own compared with selling through Flip Baz</caption>
        <thead>
          <tr className="border-b border-line bg-surface-2/60">
            <th scope="col" className="px-5 py-4 font-semibold text-muted">
              What it takes
            </th>
            <th scope="col" className="px-5 py-4 font-semibold">
              Doing it yourself
            </th>
            <th scope="col" className="px-5 py-4 font-semibold text-brand-700 dark:text-brand-400">
              With Flip Baz
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {comparison.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="px-5 py-4 font-medium">
                {row.label}
              </th>
              <td className="px-5 py-4 text-muted">
                <span className="inline-flex items-start gap-2">
                  <Icon name="cross" className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  {row.diy}
                </span>
              </td>
              <td className="px-5 py-4 font-medium">
                <span className="inline-flex items-start gap-2">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                  {row.flipbaz}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Contact strip with WhatsApp + contact form link. */
export function ContactBlock() {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-brand-900 px-6 py-12 text-white sm:px-12">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent-500/30 blur-3xl" />
      <div className="relative grid items-center gap-8 md:grid-cols-[1.5fr_1fr]">
        <div>
          <h2 className="text-balance text-3xl font-extrabold tracking-tight">Questions before you join?</h2>
          <p className="mt-3 max-w-xl text-brand-100">
            Talk to a real person on our team. We&apos;ll help you choose products for your audience and
            explain exactly how ordering works.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
          <a
            href={whatsappLink("Hi Flip Baz! I'd like to know more about membership.")}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ variant: "accent", size: "lg", className: "w-full" })}
          >
            <Icon name="whatsapp" className="h-5 w-5" />
            WhatsApp {whatsappDisplay()}
          </a>
          <Link
            href="/contact"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/30 px-6 font-semibold text-white hover:bg-white/10"
          >
            Send us a message
          </Link>
        </div>
      </div>
      <p className="relative mt-6 text-sm text-brand-200">Based in {siteConfig.city}</p>
    </div>
  );
}
