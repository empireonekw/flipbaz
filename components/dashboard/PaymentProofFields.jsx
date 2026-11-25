"use client";

import { useState } from "react";
import Field, { inputClass } from "@/components/ui/Field";
import CopyText from "./CopyText";
import { formatPKR } from "@/lib/format";

/**
 * Shared "how to pay + upload proof" fields, used for memberships now and
 * for orders in the seller dashboard.
 *
 * @param {Object} props
 * @param {{ method: string, label: string, lines: {label: string, value: string, copy?: boolean}[] }[]} props.accounts
 * @param {number} props.amount              PKR to pay
 * @param {Record<string,string>} props.errors
 * @param {Record<string,string>} [props.values]
 */
export default function PaymentProofFields({ accounts, amount, errors, values = {} }) {
  // Uncontrolled radios + defaultChecked from echoed values survive React 19's
  // automatic form reset (see CheckoutForm).
  const initialMethod = values.method || accounts[0]?.method || "";
  const [method, setMethod] = useState(initialMethod);
  const [preview, setPreview] = useState(null);
  const account = accounts.find((a) => a.method === method);

  function onFile(e) {
    const file = e.target.files?.[0];
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    });
  }

  if (!accounts.length) {
    return (
      <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
        Payment details aren&apos;t set up yet. Please contact support on WhatsApp to pay.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">How will you pay?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {accounts.map((a) => (
            <label
              key={a.method}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium has-[:checked]:border-brand-600 has-[:checked]:ring-2 has-[:checked]:ring-brand-600/30 dark:has-[:checked]:border-brand-400"
            >
              <input
                type="radio"
                name="method"
                value={a.method}
                defaultChecked={initialMethod === a.method}
                onChange={() => setMethod(a.method)}
                className="accent-brand-700"
              />
              {a.label}
            </label>
          ))}
        </div>
        {errors.method && <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{errors.method}</p>}
      </fieldset>

      {account && (
        <div className="rounded-2xl border border-accent-200 bg-accent-50/70 p-4 dark:border-accent-800 dark:bg-accent-900/20">
          <p className="text-sm">
            Send <strong className="text-base">{formatPKR(amount)}</strong> to our {account.label} account:
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            {account.lines.map((l) => (
              <div key={l.label} className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-muted">{l.label}</dt>
                <dd className="flex items-center gap-2 font-semibold">
                  <span className="font-mono">{l.value}</span>
                  {l.copy && <CopyText value={l.value} label={`${account.label} ${l.label}`} />}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted">
            Then enter the transaction ID from your receipt and attach a screenshot below.
          </p>
        </div>
      )}

      <Field
        label="Transaction ID"
        name="transactionId"
        autoComplete="off"
        required
        placeholder="e.g. 8741236590"
        hint="Shown on your JazzCash/EasyPaisa receipt or bank transfer slip"
        defaultValue={values.transactionId}
        error={errors.transactionId}
      />

      <div>
        <label htmlFor="screenshot" className="mb-1.5 block text-sm font-medium">
          Payment screenshot
        </label>
        <input
          id="screenshot"
          name="screenshot"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required
          onChange={onFile}
          aria-invalid={errors.screenshot ? true : undefined}
          aria-describedby="screenshot-hint"
          className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-800 dark:file:bg-brand-950 dark:file:text-brand-300`}
        />
        <p id="screenshot-hint" className="mt-1.5 text-xs text-muted">
          JPG, PNG or WebP, up to 5 MB. Only you and our team can see it.
        </p>
        {errors.screenshot && <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{errors.screenshot}</p>}
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimisable
          <img src={preview} alt="Selected screenshot preview" className="mt-3 max-h-56 rounded-xl border border-line" />
        )}
      </div>
    </div>
  );
}
