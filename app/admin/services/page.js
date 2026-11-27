import { Suspense } from "react";
import Link from "next/link";
import UpdateForm from "./UpdateForm";
import { AdminHeader, EmptyState, FilterTabs, Pagination, adminCard, one, withQuery } from "@/components/admin/AdminUI";
import { requireAdmin } from "@/lib/auth/dal";
import { listApplications } from "@/lib/admin/services";
import { MANAGED_PLATFORM_LABELS, PLATFORM_ACCOUNT_LABELS, SERVICE_STATUSES, SERVICE_STATUS_LABELS } from "@/lib/models/constants";
import { whatsappLinkTo } from "@/lib/config";
import { formatDateTime, formatPKR } from "@/lib/format";

export const metadata = { title: "Services · Admin" };

/** Date → "YYYY-MM-DDTHH:mm" in Pakistan time, for <input type="datetime-local">. */
function pkLocal(date) {
  if (!date) return "";
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(date))
      .map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Only allow http(s) links from seller input to become clickable. */
const safeLink = (s) => (/^https?:\/\//i.test(s ?? "") ? s : null);

async function Queue({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = SERVICE_STATUSES.includes(one(sp.status)) ? one(sp.status) : undefined;
  const { items, counts, page, pages } = await listApplications({ status, page: one(sp.page) });
  const all = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <>
      <FilterTabs
        label="Application status"
        tabs={[
          { href: "/admin/services", label: `All (${all})`, active: !status },
          ...SERVICE_STATUSES.map((s) => ({ href: `/admin/services?status=${s}`, label: `${SERVICE_STATUS_LABELS[s]} (${counts[s] ?? 0})`, active: status === s })),
        ]}
      />
      {items.length === 0 ? (
        <div className="mt-5">
          <EmptyState>No applications here.</EmptyState>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((a) => (
            <li key={a._id} className={adminCard}>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-base font-semibold">
                      {a.contact.firstName} {a.contact.lastName}
                    </p>
                    <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold">{SERVICE_STATUS_LABELS[a.status]}</span>
                  </div>
                  <p className="mt-0.5 text-muted">
                    {a.seller ? (
                      <Link href={`/admin/members/${a.seller._id}`} className="underline">
                        {a.seller.storeName || a.seller.name}
                      </Link>
                    ) : (
                      "Deleted seller"
                    )}{" "}
                    · applied {formatDateTime(a.createdAt)}
                  </p>
                  <p className="mt-2">
                    <a href={whatsappLinkTo(a.contact.phone)} target="_blank" rel="noopener noreferrer" className="underline">
                      {a.contact.phone}
                    </a>
                    {" · "}
                    <a href={`mailto:${a.contact.email}`} className="underline">
                      {a.contact.email}
                    </a>
                    {" · "}
                    {a.contact.country} · prefers {a.contact.method}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <dt className="text-xs text-muted">Experience</dt>
                      <dd>{a.experience}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Seller type</dt>
                      <dd>{a.sellerType}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-muted">Monthly budget</dt>
                      <dd>{a.budget}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-muted">Platforms</p>
                  <ul className="mt-1 space-y-1">
                    {a.platforms.map((p) => (
                      <li key={p.platform}>
                        <span className="font-semibold">{MANAGED_PLATFORM_LABELS[p.platform]}</span> · {PLATFORM_ACCOUNT_LABELS[p.account]}
                        {p.handle &&
                          (safeLink(p.handle) ? (
                            <>
                              {" · "}
                              <a href={p.handle} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline">
                                {p.handle}
                              </a>
                            </>
                          ) : (
                            ` · ${p.handle}`
                          ))}
                      </li>
                    ))}
                  </ul>
                  {a.goals && <p className="mt-3 whitespace-pre-line rounded-lg bg-surface-2/60 p-3">{a.goals}</p>}
                  {a.meeting?.at && (
                    <p className="mt-3">
                      <span className="text-xs text-muted">Meeting: </span>
                      {formatDateTime(a.meeting.at)}
                      {a.meeting.url && (
                        <>
                          {" · "}
                          <a href={a.meeting.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline dark:text-brand-400">
                            Open Meet
                          </a>
                        </>
                      )}
                    </p>
                  )}
                  {a.quote?.amount != null && (
                    <p className="mt-1">
                      <span className="text-xs text-muted">Quote: </span>
                      {formatPKR(a.quote.amount)} / month
                    </p>
                  )}
                </div>
                <UpdateForm app={{ _id: a._id, status: a.status, meetingLocal: pkLocal(a.meeting?.at), meeting: a.meeting, quote: a.quote, adminNote: a.adminNote }} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pages={pages} hrefFor={(n) => withQuery("/admin/services", { status, page: n })} />
    </>
  );
}

export default function AdminServicesPage({ searchParams }) {
  return (
    <>
      <AdminHeader title="Store management" description="Applications to run sellers' Etsy, eBay, Walmart, TikTok Shop and Instagram stores. Book a Google Meet, then send a quote." />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <Queue searchParams={searchParams} />
      </Suspense>
    </>
  );
}
