"use client";

import { startTransition, useActionState } from "react";
import { useHydrated } from "@/components/ui/useHydrated";
import { saveCategoryAction } from "./actions";
import Field from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import { buttonClass } from "@/components/ui/Button";

/**
 * Create / edit a category.
 * @param {{ category?: Object }} props
 */
export default function CategoryForm({ category }) {
  const [state, formAction, isPending] = useActionState(saveCategoryAction, {});
  const hydrated = useHydrated();
  const errors = state.errors ?? {};
  const v = state.values ?? {};
  const c = category ?? {};

  function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return (
    <form onSubmit={onSubmit} method="post" className="space-y-5" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {c._id && <input type="hidden" name="id" value={c._id} />}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" required defaultValue={v.name ?? c.name} error={errors.name} />
        <Field label="URL slug" name="slug" defaultValue={v.slug ?? c.slug} hint="Leave empty to generate from the name" error={errors.slug} />
        <Field
          as="textarea"
          label="Short description"
          name="description"
          rows={2}
          defaultValue={v.description ?? c.description}
          error={errors.description}
          className="sm:col-span-2"
        />
        <Field
          label="Display order"
          name="sortOrder"
          type="number"
          min={0}
          max={999}
          inputMode="numeric"
          defaultValue={v.sortOrder ?? c.sortOrder ?? 0}
          hint="Lower numbers show first"
          error={errors.sortOrder}
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium">Image</p>
        {c.image && (
          <div className="mb-3 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
            <img src={c.image} alt="Current category image" className="h-20 w-20 rounded-xl border border-line object-cover" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="removeImage" className="h-4 w-4 accent-red-600" /> Remove image
            </label>
          </div>
        )}
        <label htmlFor="category-image" className="sr-only">
          Upload image
        </label>
        <input
          id="category-image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-800 dark:file:bg-brand-950 dark:file:text-brand-300"
        />
        <p className="mt-1 text-xs text-muted">{c.image ? "Choose a file to replace the current image." : "Optional. JPG, PNG or WebP up to 5 MB."}</p>
      </div>

      <button type="submit" disabled={!hydrated || isPending} className={buttonClass({ size: "lg" })}>
        {isPending ? "Saving…" : c._id ? "Save changes" : "Create category"}
      </button>
    </form>
  );
}
