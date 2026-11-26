import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import Form from "next/form";
import { AdminHeader, EmptyState, FilterTabs, Pagination, one, withQuery } from "@/components/admin/AdminUI";
import InlineAction from "@/components/admin/InlineAction";
import Alert from "@/components/ui/Alert";
import { buttonClass } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { requireAdmin } from "@/lib/auth/dal";
import { listProducts } from "@/lib/admin/products";
import { listCategoriesWithCounts } from "@/lib/admin/categories";
import { formatPKR } from "@/lib/format";
import { toggleProductAction } from "./actions";

export const metadata = { title: "Products · Admin" };

async function ProductsTable({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q) ?? "";
  const category = one(sp.category) ?? "";
  const status = ["active", "inactive"].includes(one(sp.status)) ? one(sp.status) : undefined;
  const [{ items, page, pages, total }, categories] = await Promise.all([
    listProducts({ q, category, status, page: one(sp.page) }),
    listCategoriesWithCounts(),
  ]);

  return (
    <>
      {one(sp.deleted) && (
        <Alert tone="success" className="mb-4">
          Product deleted.
        </Alert>
      )}
      <Form action="/admin/products" role="search" className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="ap-q" className="sr-only">
          Search products
        </label>
        <input id="ap-q" name="q" type="search" defaultValue={q} placeholder="Title, SKU or slug" className={inputClass} />
        <label htmlFor="ap-cat" className="sr-only">
          Category
        </label>
        <select id="ap-cat" name="category" defaultValue={category} className={inputClass}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonClass({ variant: "outline" })}>
          Filter
        </button>
      </Form>
      <FilterTabs
        label="Visibility"
        tabs={[
          { href: withQuery("/admin/products", { q, category }), label: "All", active: !status },
          { href: withQuery("/admin/products", { q, category, status: "active" }), label: "Visible", active: status === "active" },
          { href: withQuery("/admin/products", { q, category, status: "inactive" }), label: "Hidden", active: status === "inactive" },
        ]}
      />
      <p className="mt-3 text-sm text-muted">{total} products</p>

      {items.length === 0 ? (
        <div className="mt-3">
          <EmptyState>No products match.</EmptyState>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-line bg-surface-2/60 text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Product
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Cost
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Suggested
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Visibility
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((p) => (
                <tr key={p._id} className={p.active ? "" : "bg-surface-2/40"}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p._id}`} className="flex items-center gap-3 hover:underline">
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                        {p.images?.[0] && <Image src={p.images[0]} alt="" fill sizes="44px" className="object-cover" />}
                      </span>
                      <span>
                        <span className="font-semibold">{p.title}</span>
                        <span className="block text-xs text-muted">
                          {p.sku} · {p.images?.length ?? 0} photos
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPKR(p.costPrice)}</td>
                  <td className="px-4 py-3 text-right">{formatPKR(p.suggestedRetailPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={`mr-2 text-xs font-bold ${p.active ? "text-brand-700 dark:text-brand-400" : "text-muted"}`}>
                      {p.active ? "Visible" : "Hidden"}
                    </span>
                    <InlineAction action={toggleProductAction} fields={{ id: p._id }} label={p.active ? "Hide" : "Show"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} hrefFor={(n) => withQuery("/admin/products", { q, category, status, page: n })} />
    </>
  );
}

export default function AdminProductsPage({ searchParams }) {
  return (
    <>
      <AdminHeader
        title="Products"
        description="Everything sellers can list. Hidden products leave the catalog but stay in past orders."
        action={
          <Link href="/admin/products/new" className={buttonClass({ variant: "accent" })}>
            + New product
          </Link>
        }
      />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <ProductsTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}
