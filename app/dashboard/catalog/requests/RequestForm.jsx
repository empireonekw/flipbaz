"use client";

import { useActionState, useState } from "react";
import { createRequestAction } from "../actions";
import Alert from "@/components/ui/Alert";
import Field from "@/components/ui/Field";
import SubmitButton from "@/components/ui/SubmitButton";

/**
 * "Request an item" form. Values are echoed back from the server on errors,
 * so nothing typed is lost when React resets the form after the action.
 */
export default function RequestForm() {
  const [state, formAction] = useActionState(createRequestAction, {});
  const [preview, setPreview] = useState(null);
  const v = state.values ?? {};
  const e = state.errors ?? {};

  function onFile(ev) {
    const file = ev.target.files?.[0];
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    });
  }

  return (
    <form action={formAction} className="space-y-4" onSubmit={() => setPreview(null)}>
      {state.ok && <Alert tone="success">{state.ok}</Alert>}
      {state.message && <Alert tone="error">{state.message}</Alert>}

      <Field label="What are you looking for?" name="title" required maxLength={120} defaultValue={v.title} error={e.title} placeholder="e.g. Suede fringe jacket, brown, men's" />
      <Field
        as="textarea"
        label="Details"
        name="details"
        rows={3}
        maxLength={1000}
        defaultValue={v.details}
        error={e.details}
        hint="Material, sizes, colours, logo or packaging, anything that matters."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Pieces per month (estimate)" name="quantity" inputMode="numeric" defaultValue={v.quantity} error={e.quantity} placeholder="20" />
        <Field label="Target cost per piece (Rs)" name="targetPrice" inputMode="numeric" defaultValue={v.targetPrice} error={e.targetPrice} placeholder="2500" />
      </div>
      <Field label="Link to a similar product" name="referenceUrl" type="url" maxLength={500} defaultValue={v.referenceUrl} error={e.referenceUrl} placeholder="https://" hint="Optional. A listing on Daraz, Etsy, Instagram…" />

      <div>
        <label htmlFor="request-photo" className="mb-1.5 block text-sm font-medium">
          Photo <span className="font-normal text-muted">(optional)</span>
        </label>
        <div className="flex items-center gap-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Selected photo" className="h-14 w-14 rounded-lg border border-line object-cover" />
          )}
          <input
            id="request-photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onFile}
            className="block w-full text-sm text-muted file:mr-3 file:h-9 file:rounded-full file:border file:border-line file:bg-surface file:px-4 file:text-[13px] file:font-medium file:text-ink hover:file:bg-surface-2"
          />
        </div>
        <p className="mt-1.5 text-xs text-muted">JPG, PNG, WebP or GIF, up to 5 MB. Only you and our team can see it.</p>
      </div>

      <SubmitButton size="md" pendingText="Sending…" className="rounded-full!">
        Send request
      </SubmitButton>
    </form>
  );
}
