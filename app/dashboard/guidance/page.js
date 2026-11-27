import { Suspense } from "react";
import Link from "next/link";
import SessionBanner from "@/components/dashboard/home/SessionBanner";
import FaqBrowser from "@/components/dashboard/guidance/FaqBrowser";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import ShellIcon from "@/components/dashboard/shell/icons";
import { requireSeller } from "@/lib/auth/dal";
import { getGuidanceSessions } from "@/lib/guidance";
import { getMemberAccess } from "@/lib/membership";

export const metadata = { title: "Guidance" };

const one = (v) => (Array.isArray(v) ? v[0] : v);
const TZ = "Asia/Karachi";

/** "Thursday, 26 Nov · 9:00 pm PKT" */
function sessionWhen(date) {
  const d = new Date(date);
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: TZ }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }).format(d).toLowerCase();
  return `${day} · ${time} PKT`;
}
const shortDay = (d) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: TZ }).format(new Date(d));

/** One past session: a play card when the recording is up, a clock while it isn't. */
function VideoCard({ s, isMember }) {
  const ready = s.hasRecording;
  const thumb = (
    <span
      className={`relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-line ${
        ready ? "bg-gradient-to-br from-brand-800 to-brand-950" : "bg-surface-2"
      }`}
    >
      <span className="absolute left-2.5 top-2.5 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-medium text-ink">{shortDay(s.startsAt)}</span>
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${ready ? "bg-white/90 text-brand-800 transition-transform group-hover:scale-105" : "bg-surface text-muted"}`}>
        {ready ? (
          <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M8 5.5v13l10.5-6.5L8 5.5Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 2" />
          </svg>
        )}
      </span>
    </span>
  );
  const meta = (
    <>
      <span className="mt-2.5 line-clamp-2 block text-sm font-medium leading-snug">{s.title}</span>
      <span className="mt-0.5 block text-xs text-muted">
        {!ready ? "Recording coming soon" : isMember ? `Watch the recording${s.host ? ` · ${s.host}` : ""}` : "Members only"}
      </span>
    </>
  );
  if (ready && isMember) {
    return (
      <a href={`/dashboard/sessions/${s._id}/watch`} target="_blank" rel="noopener noreferrer" className="group block">
        {thumb}
        {meta}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  if (ready) {
    return (
      <Link href="/dashboard/membership" className="group block">
        {thumb}
        {meta}
      </Link>
    );
  }
  return (
    <div>
      {thumb}
      {meta}
    </div>
  );
}

async function Sessions() {
  await requireSeller("/dashboard/guidance");
  const [access, { next, past }] = await Promise.all([getMemberAccess(), getGuidanceSessions()]);
  return (
    <>
      {next ? (
        <SessionBanner session={next} isMember={access.isMember} whenLabel={sessionWhen(next.startsAt)} />
      ) : (
        <div className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-muted shadow-xs">No live session planned yet. Check back soon: they also show on your Home page.</div>
      )}

      <h2 className="mt-8 text-base font-semibold">Watch</h2>
      {past.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Recordings of past sessions will appear here.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {past.map((s) => (
            <li key={s._id}>
              <VideoCard s={s} isMember={access.isMember} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-8 text-xs text-muted">All times are Pakistan time.</p>
    </>
  );
}

const TABS = [
  { id: "sessions", label: "Sessions and videos", href: "/dashboard/guidance", icon: "video" },
  { id: "faqs", label: "FAQs", href: "/dashboard/guidance?tab=faqs", icon: "guidance" },
];

/** Tab links; the active one is only known once the URL is read. */
function TabNav({ tab }) {
  return (
    <nav aria-label="Guidance sections" className="mt-5 mb-6 flex gap-1">
      {TABS.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          aria-current={tab === t.id ? "page" : undefined}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${tab === t.id ? "bg-surface-2 font-medium text-ink" : "text-muted hover:bg-surface-2/60 hover:text-ink"}`}
        >
          <ShellIcon name={t.icon} className="h-4 w-4" />
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

const SessionsSkeleton = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading">
    <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="aspect-video animate-pulse rounded-xl bg-surface-2" />
      ))}
    </div>
  </div>
);

/**
 * Reads ?tab= (request data), so it renders inside <Suspense>: the page
 * header above stays static and shows instantly.
 */
async function TabbedContent({ searchParams }) {
  const sp = await searchParams;
  const tab = one(sp?.tab) === "faqs" ? "faqs" : "sessions";
  return (
    <>
      <TabNav tab={tab} />
      {tab === "faqs" ? (
        <>
          <h2 className="text-base font-semibold">Marketplace FAQs</h2>
          <p className="mt-1 mb-4 text-sm text-muted">Short answers for Etsy, eBay, Daraz, SKUs, shipping and everyday listing jobs.</p>
          <FaqBrowser />
        </>
      ) : (
        <Suspense fallback={<SessionsSkeleton />}>
          <Sessions />
        </Suspense>
      )}
    </>
  );
}

/** Seller Guidance: live sessions, recordings and marketplace FAQs. */
export default function GuidancePage({ searchParams }) {
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
            Guidance
          </li>
        </ol>
      </nav>
      <h1 className="text-2xl font-semibold tracking-tight">Guidance</h1>
      <p className="mt-1 text-sm text-muted">Live sessions, recordings and quick answers on selling Flip Baz products online.</p>

      <Suspense
        fallback={
          <>
            <TabNav tab={null} />
            <SessionsSkeleton />
          </>
        }
      >
        <TabbedContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
