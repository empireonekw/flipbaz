import { Suspense } from "react";
import Link from "next/link";
import WithdrawButton from "./WithdrawButton";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import ShellIcon from "@/components/dashboard/shell/icons";
import Alert from "@/components/ui/Alert";
import { requireSeller } from "@/lib/auth/dal";
import { listSellerApplications } from "@/lib/services";
import {
  MANAGED_PLATFORMS,
  MANAGED_PLATFORM_LABELS,
  PLATFORM_ACCOUNT_LABELS,
  SERVICE_OPEN_STATUSES,
  SERVICE_STATUS_LABELS,
} from "@/lib/models/constants";
import { formatDate, formatDateTime, formatPKR } from "@/lib/format";

export const metadata = { title: "Store management" };

const card = "rounded-2xl border border-line bg-surface shadow-xs";
const primary =
  "inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-700 px-4 text-[13px] font-medium text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400";
const secondary = "inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-[13px] font-medium shadow-xs hover:bg-surface-2";

const BADGE = {
  SUBMITTED: "bg-surface-2 text-ink",
  MEETING_SCHEDULED: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200",
  QUOTE_READY: "bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200",
  ACTIVE: "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300",
  DECLINED: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  WITHDRAWN: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

const FLOW = [
  { id: "SUBMITTED", label: "Reviewing" },
  { id: "MEETING_SCHEDULED", label: "Google Meet call" },
  { id: "QUOTE_READY", label: "Quote" },
  { id: "ACTIVE", label: "We run your stores" },
];

/** Four-step progress for an application. */
function Progress({ status }) {
  const at = FLOW.findIndex((f) => f.id === status);
  if (at < 0) return null;
  return (
    <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {FLOW.map((f, i) => (
        <li key={f.id} className="flex items-center gap-2 text-xs">
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
              i < at ? "bg-brand-600 text-white dark:bg-brand-500 dark:text-brand-950" : i === at ? "border-2 border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300" : "border border-line text-muted"
            }`}
            aria-hidden="true"
          >
            {i < at ? "✓" : i + 1}
          </span>
          <span className={i <= at ? "text-ink" : "text-muted"}>
            {f.label}
            <span className="sr-only">{i < at ? " (done)" : i === at ? " (current)" : ""}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** One application with its meeting, quote and our latest note. */
function Application({ a }) {
  const open = SERVICE_OPEN_STATUSES.includes(a.status);
  return (
    <li className={`${card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">Store management for {a.platforms.map((p) => MANAGED_PLATFORM_LABELS[p.platform]).join(", ")}</p>
          <p className="mt-0.5 text-xs text-muted">Applied {formatDate(a.createdAt)} · budget {a.budget}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[a.status]}`}>{SERVICE_STATUS_LABELS[a.status]}</span>
      </div>

      <Progress status={a.status} />

      {a.meeting?.url && a.meeting?.at && (a.status === "MEETING_SCHEDULED" || a.meetingUpcoming) && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50/60 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-sky-900 dark:bg-sky-950/30">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-sky-700 dark:text-sky-300">
              <ShellIcon name="video" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium">Google Meet call</p>
              <p className="text-sm">{formatDateTime(a.meeting.at)} (Pakistan time)</p>
              {a.meeting.note && <p className="mt-0.5 text-xs text-muted">{a.meeting.note}</p>}
            </div>
          </div>
          <a href={a.meeting.url} target="_blank" rel="noopener noreferrer" className={primary}>
            Join Google Meet
          </a>
        </div>
      )}

      {a.quote?.amount != null && ["QUOTE_READY", "ACTIVE"].includes(a.status) && (
        <div className="mt-4 rounded-xl bg-surface-2/70 p-4">
          <p className="text-xs text-muted">{a.status === "ACTIVE" ? "Your plan" : "Your quote"}</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums">
            {formatPKR(a.quote.amount)} <span className="text-sm font-normal text-muted">per month</span>
          </p>
          {a.quote.details && <p className="mt-1 whitespace-pre-line text-sm text-muted">{a.quote.details}</p>}
          {a.status === "QUOTE_READY" && <p className="mt-2 text-sm">Happy with it? Reply on WhatsApp or in chat and we&apos;ll get your stores started.</p>}
        </div>
      )}

      {a.adminNote && (
        <p className="mt-4 rounded-xl border border-line px-4 py-3 text-sm">
          <span className="block text-xs text-muted">Note from Flip Baz</span>
          {a.adminNote}
        </p>
      )}

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-muted hover:text-ink">Your details</summary>
        <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Contact</dt>
            <dd>
              {a.contact.firstName} {a.contact.lastName} · {a.contact.phone} · {a.contact.method}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Background</dt>
            <dd>
              {a.sellerType} · {a.experience}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted">Platforms</dt>
            <dd>
              {a.platforms.map((p) => (
                <span key={p.platform} className="block">
                  {MANAGED_PLATFORM_LABELS[p.platform]}: {PLATFORM_ACCOUNT_LABELS[p.account]}
                  {p.handle ? ` · ${p.handle}` : ""}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </details>

      {open && (
        <div className="mt-3 border-t border-line pt-3">
          <WithdrawButton id={a._id} />
        </div>
      )}
    </li>
  );
}

async function Applications({ searchParams }) {
  const seller = await requireSeller("/dashboard/services");
  const [items, sp] = await Promise.all([listSellerApplications(seller.id), searchParams]);
  const hasOpen = items.some((a) => SERVICE_OPEN_STATUSES.includes(a.status));

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {hasOpen ? (
          <span className={`${secondary} cursor-default text-muted`}>Application in progress</span>
        ) : (
          <Link href="/dashboard/services/apply" className={primary}>
            Request a quote <ShellIcon name="arrow" className="h-4 w-4" />
          </Link>
        )}
        <a href="#how-it-works" className={secondary}>
          Learn more
        </a>
      </div>

      {sp?.sent === "1" && (
        <Alert tone="success" className="mb-5">
          Application sent. We&apos;ll review it and book a Google Meet call with you, usually within 2 working days.
        </Alert>
      )}

      {items.length === 0 ? (
        <div className={`${card} p-6`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-muted">
            <ShellIcon name="bag" className="h-5 w-5" />
          </span>
          <p className="mt-3 font-medium">No applications yet</p>
          <p className="mt-1 max-w-lg text-sm text-muted">
            When you apply for store management, you&apos;ll see each step here: our review, your Google Meet call, your quote, and when we go live.
          </p>
          <Link href="/dashboard/services/apply" className={`${primary} mt-4`}>
            Start your application
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((a) => (
            <Application key={a._id} a={a} />
          ))}
        </ul>
      )}
    </>
  );
}

/** Services: we run the seller's marketplace stores for a monthly fee. */
export default function ServicesPage({ searchParams }) {
  const steps = [
    { t: "Apply", d: "Three short steps: you, your stores, review." },
    { t: "Google Meet call", d: "A short call to understand your stores and goals." },
    { t: "Get a quote", d: "A clear monthly fee. Nothing starts until you agree." },
    { t: "We run your stores", d: "Listings, orders, messages and growth, handled." },
  ];
  return (
    <>
      <DashboardBanner />
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/dashboard" className="hover:text-ink hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-ink">
            Store management
          </li>
        </ol>
      </nav>
      <h1 className="text-2xl font-semibold tracking-tight">Store management</h1>
      <p className="mt-1 mb-5 text-sm text-muted">We run your Etsy, eBay, Walmart, TikTok Shop and Instagram stores for you. Apply, talk to us on Google Meet, then get a quote.</p>

      <Suspense fallback={<div className="h-56 animate-pulse rounded-2xl bg-surface-2" />}>
        <Applications searchParams={searchParams} />
      </Suspense>

      <section id="how-it-works" aria-labelledby="how-heading" className={`${card} mt-6 scroll-mt-6 p-5`}>
        <h2 id="how-heading" className="text-base font-semibold">
          How store management works
        </h2>
        <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.t} className="rounded-xl bg-surface-2/60 p-4">
              <span className="text-xs font-medium text-muted">Step {i + 1}</span>
              <p className="mt-1 text-sm font-medium">{s.t}</p>
              <p className="mt-0.5 text-xs text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm font-medium">Platforms we manage</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {MANAGED_PLATFORMS.map((p) => (
            <li key={p} className="rounded-full border border-line px-3 py-1 text-sm">
              {MANAGED_PLATFORM_LABELS[p]}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
