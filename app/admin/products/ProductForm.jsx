"use client";

import { startTransition, useActionState } from "react";
import { useHydrated } from "@/components/ui/useHydrated";
import { saveProductAction } from "./actions";
import Field from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import { buttonClass } from "@/components/ui/Button";
import ImageManager from "@/components/admin/ImageManager";
import { estimateProfit } from "@/lib/pricing";
import { formatPKR } from "@/lib/format";

/**
 * Create / edit a product. Submits via startTransition so a validation error
 * doesn't wipe chosen photos or edits (React 19 resets <form action> forms).
 *
 * @param {{ product?: Object, categories: {_id: string, name: string}[], maxImages: number }} props
 */
export default function ProductForm({ product, categories, maxImages }) {
  const [state, formAction, isPending] = useActionState(saveProductAction, {});
  const hydrated = useHydrated();
  const errors = state.errors ?? {};
  const v = state.values ?? {};
  const p = product ?? {};
  const val = (k, fallback = "") => v[k] ?? fallback;

  function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  const profit = estimateProfit({
    costPrice: Number(val("costPrice", p.costPrice ?? 0)),
    suggestedRetailPrice: Number(val("suggestedRetailPrice", p.suggestedRetailPrice ?? 0)),
  });

  return (
    <form onSubmit={onSubmit} method="post" className="space-y-6" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {Object.keys(errors).length > 0 && <Alert tone="error">Please fix the highlighted fields.</Alert>}
      {p._id && <input type="hidden" name="id" value={p._id} />}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Title" name="title" required defaultValue={val("title", p.title)} error={errors.title} className="sm:col-span-2" />
        <Field label="SKU" name="sku" required defaultValue={val("sku", p.sku)} placeholder="FB-LG-010" error={errors.sku} />
        <Field label="URL slug" name="slug" defaultValue={val("slug", p.slug)} hint="Leave empty to generate from the title" error={errors.slug} />
        <Field as="select" label="Category" name="category" required defaultValue={val("category", p.category ?? "")} error={errors.category}>
          <option value="">Choose…</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </Field>
        <Field
          label="Processing days"
          name="processingDays"
          type="number"
          min={0}
          max={60}
          inputMode="numeric"
          defaultValue={val("processingDays", p.processingDays ?? 3)}
          error={errors.processingDays}
        />
        <Field
          label="Cost price (what sellers pay), Rs"
          name="costPrice"
          type="number"
          min={0}
          inputMode="numeric"
          required
          defaultValue={val("costPrice", p.costPrice)}
          error={errors.costPrice}
        />
        <Field
          label="Suggested retail price, Rs"
          name="suggestedRetailPrice"
          type="number"
          min={0}
          inputMode="numeric"
          required
          defaultValue={val("suggestedRetailPrice", p.suggestedRetailPrice)}
          hint={p._id ? `Current profit estimate: ${formatPKR(profit)}` : undefined}
          error={errors.suggestedRetailPrice}
        />
        <Field
          as="textarea"
          label="Sizes"
          name="sizes"
          rows={2}
          defaultValue={val("sizes", (p.sizes ?? []).join(", "))}
          hint="Comma or line separated, e.g. S, M, L. Leave empty if one size."
          error={errors.sizes}
        />
        <Field
          as="textarea"
          label="Colours"
          name="colors"
          rows={2}
          defaultValue={val("colors", (p.colors ?? []).join(", "))}
          hint="Comma or line separated. Leave empty if one colour."
          error={errors.colors}
        />
        <Field
          as="textarea"
          label="Description"
          name="description"
          rows={6}
          required
          defaultValue={val("description", p.description)}
          error={errors.description}
          className="sm:col-span-2"
        />
      </div>

      <ImageManager initial={p.images ?? []} max={maxImages} />

      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          name="active"
          defaultChecked={v.active !== undefined ? v.active === "on" : p.active ?? true}
          className="h-5 w-5 rounded accent-brand-700"
        />
        Visible in the catalog
      </label>

      <div className="flex gap-3 border-t border-line pt-5">
        <button type="submit" disabled={!hydrated || isPending} className={buttonClass({ size: "lg" })}>
          {isPending ? "Saving…" : p._id ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
