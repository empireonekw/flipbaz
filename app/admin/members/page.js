import { Suspense } from "react";
import Link from "next/link";
import Form from "next/form";
import { AdminHeader, EmptyState, FilterTabs, Pagination, one, withQuery } from "@/components/admin/AdminUI";
import { buttonClass } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { requireAdmin } from "@/lib/auth/dal";
import { MEMBER_STATES, listSellers } from "@/lib/admin/members";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Members · Admin" };

const stateLabel = { ACTIVE: "Active", PENDING: "Pending", EXPIRED: "Expired", NONE: "No plan" };
const stateCls = {
  ACTIVE: "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300",
  PENDING: "bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200",
  EXPIRED: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200",
  NONE: "bg-surface-2 text-muted",
};

async function Members({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q) ?? "";
  const state = MEMBER_STATES.includes(one(sp.state)) ? one(sp.state) : undefined;
  const { items, total, page, pages } = await listSellers({ q, state, page: one(sp.page) });

  return (
    <>
      <Form action="/admin/members" role="search" className="mb-4 flex gap-2 sm:max-w-lg">
        {state && <input type="hidden" name="state" value={state} />}
        <label htmlFor="am-q" className="sr-only">
          Search sellers
        </label>
        <input id="am-q" name="q" type="search" defaultValue={q} placeholder="Name, email, phone or city" className={inputClass} />
        <button type="submit" className={buttonClass({ variant: "outline" })}>
          Search
        </button>
      </Form>
      <FilterTabs
        label="Membership state"
        tabs={[undefined, ...MEMBER_STATES].map((s) => ({
          href: withQuery("/admin/members", { q, state: s }),
          label: s ? stateLabel[s] : "All",
          active: s === state,
        }))}
      />
      <p className="mt-3 text-sm text-muted">{total} sellers</p>

      {items.length === 0 ? (
        <div className="mt-3">
          <EmptyState>No sellers found.</EmptyState>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-line bg-surface-2/60 text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Seller
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Phone / city
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Membership
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Orders
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((u) => (
                <tr key={u._id} className={u.isActive === false ? "bg-red-50/50 dark:bg-red-950/20" : ""}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/members/${u._id}`} className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
                      {u.name}
                    </Link>
                    <span className="block text-xs text-muted">{u.email}</span>
                    {u.isActive === false && <span className="text-xs font-bold text-red-600 dark:text-red-400">Account disabled</span>}
                  </td>
                  <td className="px-4 py-3">
                    {u.phone ?? "—"}
                    <span className="block text-xs text-muted">{u.city}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${stateCls[u.state]}`}>{stateLabel[u.state]}</span>
                    {u.endsAt && <span className="block pt-1 text-xs text-muted">until {formatDate(u.endsAt)}</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{u.orderCount}</td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} hrefFor={(n) => withQuery("/admin/members", { q, state, page: n })} />
    </>
  );
}

export default function AdminMembersPage({ searchParams }) {
  return (
    <>
      <AdminHeader title="Members" description="Sellers, their memberships and orders." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <Members searchParams={searchParams} />
      </Suspense>
    </>
  );
}
