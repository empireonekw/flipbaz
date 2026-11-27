"use client";

import { useActionState } from "react";
import { replyRequestAction } from "./actions";
import Alert from "@/components/ui/Alert";
import { inputClass } from "@/components/ui/Field";
import SubmitButton from "@/components/ui/SubmitButton";
import { PRODUCT_REQUEST_STATUSES, PRODUCT_REQUEST_STATUS_LABELS } from "@/lib/models/constants";

/**
 * Status + reply controls for one custom request.
 * @param {{ request: { _id: string, status: string, adminReply?: string, product?: { slug: string } } }} props
 */
export default function ReplyForm({ request }) {
  const [state, formAction] = useActionState(replyRequestAction, {});
  const id = request._id;
  // After an error, keep what the admin typed (React resets forms to their defaults).
  const v = state.values ?? {
    status: request.status === "OPEN" ? "REVIEWING" : request.status,
    adminReply: request.adminReply ?? "",
    productSlug: request.product?.slug ?? "",
  };
  return (
    // Re-mount after every submit: React's automatic form reset puts a <select>
    // back on its first default, so a fresh form picks up the echoed values.
    <form key={state.at ?? 0} action={formAction} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}
      <input type="hidden" name="id" value={id} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`status-${id}`} className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select id={`status-${id}`} name="status" defaultValue={v.status} className={inputClass}>
            {PRODUCT_REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PRODUCT_REQUEST_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`slug-${id}`} className="mb-1 block text-sm font-medium">
            Catalog product slug <span className="font-normal text-muted">(when added)</span>
          </label>
          <input id={`slug-${id}`} name="productSlug" defaultValue={v.productSlug} maxLength={120} placeholder="suede-fringe-jacket" className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor={`reply-${id}`} className="mb-1 block text-sm font-medium">
          Reply to seller
        </label>
        <textarea id={`reply-${id}`} name="adminReply" rows={2} maxLength={500} defaultValue={v.adminReply} className={inputClass} />
      </div>
      <SubmitButton size="md" pendingText="Saving…">
        Save &amp; notify seller
      </SubmitButton>
    </form>
  );
}
