"use client";

import { startTransition, useActionState, useId, useMemo, useState } from "react";
import { useHydrated } from "@/components/ui/useHydrated";
import Image from "next/image";
import { placeOrderAction } from "../actions";
import Field, { inputClass } from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import { buttonClass } from "@/components/ui/Button";
import PaymentProofFields from "@/components/dashboard/PaymentProofFields";
import { formatPKR } from "@/lib/format";
import { DEFAULT_SHIPPING_FEE, computeOrderTotals } from "@/lib/pricing";
import { MARKETPLACES } from "@/lib/models/constants";

let lineSeq = 0;
const newLine = (product) => ({
  key: `l${++lineSeq}`,
  productId: product?._id ?? "",
  size: product?.sizes?.[0] ?? "",
  color: product?.colors?.[0] ?? "",
  qty: 1,
});

/**
 * Place an order for an end customer.
 *
 * Submits through onSubmit + startTransition instead of <form action>, so
 * React 19 doesn't auto-reset the form after a failed attempt (the item lines
 * and selects are React state and must survive validation errors).
 *
 * @param {{ products: Object[], accounts: Object[], initialProductSlug?: string }} props
 */
export default function OrderForm({ products, accounts, initialProductSlug }) {
  const [state, formAction, isPending] = useActionState(placeOrderAction, {});
  const hydrated = useHydrated();
  const errors = state.errors ?? {};
  const values = state.values ?? {};
  const byId = useMemo(() => new Map(products.map((p) => [p._id, p])), [products]);
  const [lines, setLines] = useState(() => {
    const start = products.find((p) => p.slug === initialProductSlug);
    return [newLine(start)];
  });
  const idBase = useId();
  // Optional sale figures, kept in state only for the live profit preview.
  const [sale, setSale] = useState({ price: values.salePrice ?? "", fees: values.marketplaceFees ?? "" });
  const rupees = (v) => Number(String(v).replace(/[^\d]/g, "")) || 0;

  // Group products by category for the <select>.
  const groups = useMemo(() => {
    const m = new Map();
    for (const p of products) {
      const name = p.category?.name ?? "Other";
      if (!m.has(name)) m.set(name, []);
      m.get(name).push(p);
    }
    return [...m.entries()];
  }, [products]);

  const priced = lines
    .map((l) => ({ ...l, product: byId.get(l.productId) }))
    .filter((l) => l.product);
  const totals = computeOrderTotals(
    priced.map((l) => ({ unitPrice: l.product.costPrice, qty: l.qty })),
    DEFAULT_SHIPPING_FEE
  );
  const payload = JSON.stringify(lines.map(({ productId, qty, size, color }) => ({ productId, qty, size, color })));

  const update = (key, patch) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const changeProduct = (key, productId) => {
    const p = byId.get(productId);
    update(key, { productId, size: p?.sizes?.[0] ?? "", color: p?.colors?.[0] ?? "" });
  };

  function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return (
    <form onSubmit={onSubmit} method="post" className="space-y-8" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}
      {Object.keys(errors).length > 0 && !state.message && <Alert tone="error">Please fix the highlighted fields.</Alert>}
      <input type="hidden" name="lines" value={payload} />

      {/* 1. Items */}
      <section aria-labelledby={`${idBase}-items`} className="rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:p-6">
        <h2 id={`${idBase}-items`} className="text-base font-semibold">
          1. What did your customer order?
        </h2>
        {errors.lines && <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{errors.lines}</p>}
        <ul className="mt-4 space-y-4">
          {lines.map((line, i) => {
            const p = byId.get(line.productId);
            const lineErr = errors[`lines.${i}.productId`] || errors[`lines.${i}.qty`];
            return (
              <li key={line.key} className="rounded-2xl border border-line p-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    {p?.images?.[0] && <Image src={p.images[0]} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`${line.key}-product`} className="mb-1 block text-sm font-medium">
                      Product {lines.length > 1 ? i + 1 : ""}
                    </label>
                    <select
                      id={`${line.key}-product`}
                      value={line.productId}
                      onChange={(e) => changeProduct(line.key, e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Choose a product…</option>
                      {groups.map(([cat, ps]) => (
                        <optgroup key={cat} label={cat}>
                          {ps.map((op) => (
                            <option key={op._id} value={op._id}>
                              {op.title} · {formatPKR(op.costPrice)}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                {p && (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {p.sizes?.length > 0 && (
                      <div>
                        <label htmlFor={`${line.key}-size`} className="mb-1 block text-sm font-medium">
                          Size
                        </label>
                        <select id={`${line.key}-size`} value={line.size} onChange={(e) => update(line.key, { size: e.target.value })} className={inputClass}>
                          {p.sizes.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {p.colors?.length > 0 && (
                      <div>
                        <label htmlFor={`${line.key}-color`} className="mb-1 block text-sm font-medium">
                          Colour
                        </label>
                        <select id={`${line.key}-color`} value={line.color} onChange={(e) => update(line.key, { color: e.target.value })} className={inputClass}>
                          {p.colors.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label htmlFor={`${line.key}-qty`} className="mb-1 block text-sm font-medium">
                        Qty
                      </label>
                      <input
                        id={`${line.key}-qty`}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={50}
                        value={line.qty}
                        onChange={(e) => update(line.key, { qty: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <p className="text-xs text-muted">Line total</p>
                      <p className="text-base font-semibold">{formatPKR(p.costPrice * line.qty)}</p>
                    </div>
                  </div>
                )}
                {lineErr && <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{lineErr}</p>}
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLines((ls) => ls.filter((l) => l.key !== line.key))}
                    className="mt-3 text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
                  >
                    Remove item
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {lines.length < 20 && (
          <button type="button" onClick={() => setLines((ls) => [...ls, newLine()])} className={buttonClass({ variant: "outline", size: "sm", className: "mt-4" })}>
            + Add another item
          </button>
        )}
      </section>

      {/* 2. Customer */}
      <section aria-labelledby={`${idBase}-customer`} className="rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:p-6">
        <h2 id={`${idBase}-customer`} className="text-base font-semibold">
          2. Who are we delivering to?
        </h2>
        <p className="mt-1 text-sm text-muted">Your customer&apos;s details. We ship directly to them.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Customer name" name="customerName" autoComplete="off" required defaultValue={values.customerName} error={errors.customerName} />
          <Field
            label="Customer phone"
            name="customerPhone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="0300 1234567"
            required
            defaultValue={values.customerPhone}
            error={errors.customerPhone}
          />
          <Field
            as="textarea"
            label="Delivery address"
            name="address"
            rows={2}
            required
            className="sm:col-span-2"
            placeholder="House, street, area"
            defaultValue={values.address}
            error={errors.address}
          />
          <Field label="City" name="city" autoComplete="off" required defaultValue={values.city} error={errors.city} />
          <Field as="select" label="Where did you sell it?" name="marketplace" defaultValue={values.marketplace || "Daraz"} error={errors.marketplace}>
            {MARKETPLACES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Field>
          <Field
            label="Marketplace order number (optional)"
            name="marketplaceOrderRef"
            autoComplete="off"
            defaultValue={values.marketplaceOrderRef}
            error={errors.marketplaceOrderRef}
          />
          <Field as="textarea" label="Notes for us (optional)" name="notes" rows={2} defaultValue={values.notes} error={errors.notes} />
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-line p-4">
          <p className="text-sm font-medium">
            Your sale <span className="font-normal text-muted">(optional, only you see this)</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">Add what your customer paid and what the marketplace kept, and Analytics shows your real profit. You can also add it later on the order page.</p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Your customer paid (Rs)"
              name="salePrice"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 4500"
              defaultValue={values.salePrice}
              error={errors.salePrice}
              onChange={(e) => setSale((s) => ({ ...s, price: e.target.value }))}
            />
            <Field
              label="Marketplace fees (Rs)"
              name="marketplaceFees"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Commission, payment fees…"
              defaultValue={values.marketplaceFees}
              error={errors.marketplaceFees}
              onChange={(e) => setSale((s) => ({ ...s, fees: e.target.value }))}
            />
          </div>
          {rupees(sale.price) > 0 && totals.total > 0 && (
            <p className="mt-3 text-sm" aria-live="polite">
              Your profit on this order:{" "}
              <strong className={rupees(sale.price) - rupees(sale.fees) - totals.total >= 0 ? "text-brand-700 dark:text-brand-400" : "text-red-600 dark:text-red-400"}>
                {formatPKR(rupees(sale.price) - rupees(sale.fees) - totals.total)}
              </strong>{" "}
              <span className="text-muted">
                ({formatPKR(rupees(sale.price))} − {formatPKR(rupees(sale.fees))} fees − {formatPKR(totals.total)} to Flip Baz)
              </span>
            </p>
          )}
        </div>
      </section>

      {/* 3. Total + payment */}
      <section aria-labelledby={`${idBase}-pay`} className="rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:p-6">
        <h2 id={`${idBase}-pay`} className="text-base font-semibold">
          3. Pay for this order
        </h2>
        <dl className="mt-4 space-y-2 rounded-2xl bg-surface-2/70 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Items ({priced.reduce((n, l) => n + l.qty, 0)})</dt>
            <dd className="font-medium">{formatPKR(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping to your customer</dt>
            <dd className="font-medium">{formatPKR(totals.shippingFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base">
            <dt className="font-semibold">Total to pay</dt>
            <dd className="font-semibold">{formatPKR(totals.total)}</dd>
          </div>
        </dl>
        <div className="mt-6">
          <PaymentProofFields accounts={accounts} amount={totals.total} errors={errors} values={values} />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">We&apos;ll confirm your payment, then start production.</p>
        <button
          type="submit"
          disabled={!hydrated || isPending || priced.length === 0 || !accounts.length}
          aria-disabled={!hydrated || isPending || priced.length === 0 || !accounts.length}
          className={buttonClass({ variant: "accent", size: "lg" })}
        >
          {isPending ? "Placing order…" : `Place order · ${formatPKR(totals.total)}`}
        </button>
      </div>
    </form>
  );
}
