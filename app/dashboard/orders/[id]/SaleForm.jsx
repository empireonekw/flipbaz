"use client";

import { useActionState, useState } from "react";
import { updateOrderSaleAction } from "../actions";
import Field from "@/components/ui/Field";
import SubmitButton from "@/components/ui/SubmitButton";
import { formatPKR } from "@/lib/format";

const rupees = (v) => Number(String(v ?? "").replace(/[^\d]/g, "")) || 0;

/**
 * "Your sale" card on an order: what the customer paid and the marketplace
 * fees, with the resulting profit. Feeds the seller's Analytics.
 *
 * @param {{ orderId: string, orderTotal: number, salePrice?: number, marketplaceFees?: number }} props
 */
export default function SaleForm({ orderId, orderTotal, salePrice, marketplaceFees }) {
  const [state, formAction] = useActionState(updateOrderSaleAction, {});
  const v = state.values ?? { salePrice: salePrice ?? "", marketplaceFees: marketplaceFees ?? "" };
  const e = state.errors ?? {};
  const [live, setLive] = useState({ price: v.salePrice, fees: v.marketplaceFees });
  const profit = rupees(live.price) - rupees(live.fees) - orderTotal;

  return (
    <form key={state.at ?? 0} action={formAction} className="mt-3 space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <Field
        label="Your customer paid (Rs)"
        name="salePrice"
        inputMode="numeric"
        autoComplete="off"
        placeholder="e.g. 4500"
        defaultValue={v.salePrice}
        error={e.salePrice}
        onChange={(ev) => setLive((s) => ({ ...s, price: ev.target.value }))}
      />
      <Field
        label="Marketplace fees (Rs)"
        name="marketplaceFees"
        inputMode="numeric"
        autoComplete="off"
        placeholder="Commission, payment fees…"
        defaultValue={v.marketplaceFees}
        error={e.marketplaceFees}
        onChange={(ev) => setLive((s) => ({ ...s, fees: ev.target.value }))}
      />
      {rupees(live.price) > 0 && (
        <p className="text-sm" aria-live="polite">
          Profit:{" "}
          <strong className={profit >= 0 ? "text-brand-700 dark:text-brand-400" : "text-red-600 dark:text-red-400"}>{formatPKR(profit)}</strong>
          <span className="text-muted"> after {formatPKR(orderTotal)} to Flip Baz</span>
        </p>
      )}
      <div className="flex items-center gap-3">
        <SubmitButton size="sm" pendingText="Saving…" className="rounded-full!">
          Save
        </SubmitButton>
        {state.ok && (
          <span role="status" className="text-sm text-brand-700 dark:text-brand-400">
            {state.ok}
          </span>
        )}
        {state.message && (
          <span role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
