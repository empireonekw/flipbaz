"use client";

import { startTransition, useActionState, useId, useState } from "react";
import { useHydrated } from "@/components/ui/useHydrated";
import { updateOrderAction } from "../actions";
import Field, { inputClass } from "@/components/ui/Field";
import { buttonClass } from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { ORDER_STATUS_LABELS } from "@/lib/models/constants";

/** First forward step (the usual next move), else the current status. */
const defaultNext = (nextStatuses, current) => nextStatuses.find((s) => s !== "CANCELLED") ?? current;

/**
 * Move an order forward and record courier + tracking.
 * Submits via startTransition (not <form action>) so React doesn't auto-reset
 * the controlled status <select> out of sync with state.
 * @param {{ order: { _id: string, status: string, courier?: string, trackingNumber?: string }, nextStatuses: string[], couriers: string[] }} props
 */
export default function OrderUpdateForm({ order, nextStatuses, couriers }) {
  const [state, formAction, isPending] = useActionState(updateOrderAction, {});
  const hydrated = useHydrated();
  const errors = state.errors ?? {};
  const listId = useId();
  const [status, setStatus] = useState(defaultNext(nextStatuses, order.status));
  // When the saved status changes (after an update), move the default on too.
  const [seenStatus, setSeenStatus] = useState(order.status);
  if (seenStatus !== order.status) {
    setSeenStatus(order.status);
    setStatus(defaultNext(nextStatuses, order.status));
  }
  const needsShipping = status === "SHIPPED" || status === "DELIVERED";

  function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  if (nextStatuses.length === 0) {
    return <p className="text-sm text-muted">This order is {ORDER_STATUS_LABELS[order.status].toLowerCase()}. No further changes.</p>;
  }

  return (
    <form onSubmit={onSubmit} method="post" className="space-y-4" noValidate>
      {state.ok && <Alert tone="success">{state.ok}</Alert>}
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="orderId" value={order._id} />

      <div>
        <label htmlFor={`${listId}-status`} className="mb-1.5 block text-sm font-medium">
          New status
        </label>
        <select id={`${listId}-status`} name="status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          <option value={order.status}>Keep as {ORDER_STATUS_LABELS[order.status]} (edit details only)</option>
          {nextStatuses.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${listId}-courier`} className="mb-1.5 block text-sm font-medium">
            Courier {needsShipping && <span className="text-red-600">*</span>}
          </label>
          <input
            id={`${listId}-courier`}
            name="courier"
            list={`${listId}-couriers`}
            defaultValue={order.courier ?? ""}
            placeholder="e.g. TCS"
            className={inputClass}
            maxLength={60}
          />
          <datalist id={`${listId}-couriers`}>
            {couriers.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <Field
          label={`Tracking number${needsShipping ? " *" : ""}`}
          name="trackingNumber"
          defaultValue={order.trackingNumber ?? ""}
          autoComplete="off"
          maxLength={60}
          error={errors.trackingNumber}
        />
      </div>

      <Field
        key={`note-${order.status}`}
        as="textarea"
        label="Note (shown to the seller in the timeline)"
        name="note"
        rows={2}
        maxLength={500}
        placeholder={status === "CANCELLED" ? "Reason for cancelling" : "Optional"}
        error={errors.note}
      />

      <button
        type="submit"
        disabled={!hydrated || isPending}
        className={buttonClass({ size: "md", variant: status === "CANCELLED" ? "danger" : "primary" })}
      >
        {isPending
          ? "Saving…"
          : status === order.status
            ? "Save details"
            : status === "CANCELLED"
              ? "Cancel order"
              : `Mark as ${ORDER_STATUS_LABELS[status]}`}
      </button>
    </form>
  );
}
