"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createRequestAction } from "../../actions";
import PhotoPicker from "@/components/catalog/PhotoPicker";
import Alert from "@/components/ui/Alert";
import SubmitButton from "@/components/ui/SubmitButton";
import { MAX_REQUEST_PHOTOS, REQUEST_SHIPPING_LABELS, REQUEST_SHIPPING_MODES, SHIP_TO_COUNTRIES } from "@/lib/models/constants";

const card = "rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6";
const control =
  "block w-full border border-line bg-surface text-sm text-ink placeholder:text-muted/80 shadow-xs transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 aria-[invalid=true]:border-red-500";
const input = `${control} h-10 rounded-full px-4`;
const select = `${control} h-10 appearance-none rounded-full pl-4 pr-10`;

const Req = () => (
  <span className="ml-0.5 text-red-600 dark:text-red-400" aria-hidden="true">
    *
  </span>
);

/** Label + control + error, wired for screen readers. */
function Row({ id, label, required, error, hint, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <Req />}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

const Chevron = () => (
  <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/**
 * "New custom request" form. Photos live in component state (see
 * PhotoPicker) and are appended to the FormData on submit; the rest of the
 * fields are echoed back by the server on errors, and the form re-mounts
 * (key = state.at) so selects and radios show those values.
 *
 * @param {{ categories: { _id: string, name: string }[] }} props
 */
export default function RequestForm({ categories }) {
  const [state, formAction] = useActionState(createRequestAction, {});
  const [photos, setPhotos] = useState([]);
  const v = state.values ?? { shipping: "FLIPBAZ", shipTo: "", categoryId: "" };
  const e = state.errors ?? {};
  const aria = (name) => (e[name] ? { "aria-invalid": true, "aria-describedby": `rq-${name}-error` } : {});

  function submit(fd) {
    fd.delete("photos");
    photos.forEach((f) => fd.append("photos", f, f.name));
    return formAction(fd);
  }

  return (
    <form key={state.at ?? 0} action={submit} noValidate className="space-y-5">
      {(state.message || Object.keys(e).length > 0) && (
        <Alert tone="error">{state.message ?? "Please check the highlighted fields."}</Alert>
      )}

      <section aria-label="What you need" className={`${card} space-y-5`}>
        <div>
          <p className="mb-2 text-sm font-medium">
            Photos
            <Req />
          </p>
          <PhotoPicker label="Photos" files={photos} onChange={setPhotos} max={MAX_REQUEST_PHOTOS} error={e.photos} />
        </div>

        <Row id="rq-title" label="Title" required error={e.title}>
          <input id="rq-title" name="title" required maxLength={120} defaultValue={v.title} placeholder="e.g. Brown suede jacket with fringe, men's" className={input} {...aria("title")} />
        </Row>

        <Row id="rq-details" label="Description" error={e.details}>
          <textarea
            id="rq-details"
            name="details"
            rows={5}
            maxLength={1000}
            defaultValue={v.details}
            placeholder="Material, colour, lining, stitching, logo or packaging. Anything our makers should know."
            className={`${control} rounded-2xl px-4 py-3`}
            {...aria("details")}
          />
        </Row>
      </section>

      <section aria-label="Details and delivery" className={`${card} grid grid-cols-1 gap-5 sm:grid-cols-2`}>
        <Row id="rq-category" label="Category" error={e.categoryId}>
          <div className="relative">
            <select id="rq-category" name="categoryId" defaultValue={v.categoryId} className={select} {...aria("categoryId")}>
              <option value="">Not sure</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Chevron />
          </div>
        </Row>

        <Row id="rq-variants" label="Sizes / colours needed" error={e.variants}>
          <input id="rq-variants" name="variants" maxLength={200} defaultValue={v.variants} placeholder="e.g. M to XXL, black and tan" className={input} {...aria("variants")} />
        </Row>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">
            Shipping
            <Req />
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {REQUEST_SHIPPING_MODES.map((m) => (
              <label
                key={m}
                className="cursor-pointer rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:text-ink has-[:checked]:bg-surface-2 has-[:checked]:font-medium has-[:checked]:text-ink has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/20"
              >
                <input type="radio" name="shipping" value={m} defaultChecked={v.shipping === m} className="sr-only" />
                {REQUEST_SHIPPING_LABELS[m]}
              </label>
            ))}
          </div>
          {e.shipping && <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{e.shipping}</p>}
        </fieldset>

        <Row id="rq-shipTo" label="Ship to" required error={e.shipTo}>
          <div className="relative">
            <select id="rq-shipTo" name="shipTo" required defaultValue={v.shipTo} className={select} {...aria("shipTo")}>
              <option value="" disabled>
                Where are your buyers?
              </option>
              {SHIP_TO_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Chevron />
          </div>
        </Row>

        <Row id="rq-referenceUrl" label="Reference link" error={e.referenceUrl}>
          <input id="rq-referenceUrl" name="referenceUrl" type="url" maxLength={500} defaultValue={v.referenceUrl} placeholder="A similar listing, optional" className={input} {...aria("referenceUrl")} />
        </Row>

        <Row id="rq-notes" label="Notes for the team" error={e.notes}>
          <input id="rq-notes" name="notes" maxLength={500} defaultValue={v.notes} placeholder="Pieces per month, deadline… optional" className={input} {...aria("notes")} />
        </Row>
      </section>

      <p className="text-sm text-muted">Our team adds the price, making time and shipping cost. Nothing gets made until you accept the quote.</p>

      <div className="flex items-center justify-end gap-2">
        <Link href="/dashboard/catalog/requests" className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
          Cancel
        </Link>
        <SubmitButton size="md" pendingText="Sending…" className="h-10! rounded-full! px-5!">
          Send request
        </SubmitButton>
      </div>
    </form>
  );
}
