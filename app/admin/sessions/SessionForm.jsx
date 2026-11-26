"use client";

import { useActionState } from "react";
import { createSessionAction } from "./actions";
import Field from "@/components/ui/Field";
import SubmitButton from "@/components/ui/SubmitButton";
import Alert from "@/components/ui/Alert";

/** Schedule a new live session (times are Pakistan time). */
export default function SessionForm() {
  const [state, formAction] = useActionState(createSessionAction, {});
  const errors = state.errors ?? {};
  const v = state.ok ? {} : state.values ?? {};
  return (
    <form action={formAction} className="space-y-4" noValidate key={state.ok ? "done" : "editing"}>
      {state.ok && <Alert tone="success">{state.ok}</Alert>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" name="title" required defaultValue={v.title} placeholder="Weekly Q&A: winning on Daraz" error={errors.title} className="sm:col-span-2" />
        <Field label="Host" name="host" defaultValue={v.host} placeholder="e.g. Sana from Flip Baz" error={errors.host} />
        <Field label="Starts (Pakistan time)" name="startsAt" type="datetime-local" required defaultValue={v.startsAt} error={errors.startsAt} />
        <Field label="Length (minutes)" name="durationMinutes" type="number" min={10} max={600} defaultValue={v.durationMinutes ?? 60} error={errors.durationMinutes} />
        <Field
          label="Meeting link"
          name="joinUrl"
          type="url"
          inputMode="url"
          required
          defaultValue={v.joinUrl}
          placeholder="https://meet.google.com/…"
          hint="Only active members get it, from 15 minutes before the start."
          error={errors.joinUrl}
        />
        <Field as="textarea" label="Description (optional)" name="description" rows={2} defaultValue={v.description} error={errors.description} className="sm:col-span-2" />
      </div>
      <SubmitButton size="md" pendingText="Scheduling…">
        Schedule session
      </SubmitButton>
    </form>
  );
}
