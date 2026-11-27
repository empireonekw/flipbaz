"use client";

import { useActionState } from "react";
import { setRecordingAction } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";

/**
 * Inline "recording link" box for a finished session. Members open it from
 * Guidance → Sessions and videos; an empty link removes it.
 * @param {{ id: string, recordingUrl?: string }} props
 */
export default function RecordingForm({ id, recordingUrl }) {
  const [state, formAction] = useActionState(setRecordingAction, {});
  return (
    <form action={formAction} className="mt-2 flex w-full flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <label htmlFor={`rec-${id}`} className="sr-only">
        Recording link
      </label>
      <input
        id={`rec-${id}`}
        name="recordingUrl"
        type="url"
        defaultValue={recordingUrl ?? ""}
        placeholder="Recording link (YouTube, Google Drive…)"
        className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
      />
      <SubmitButton size="sm" variant="outline" pendingText="Saving…">
        {recordingUrl ? "Update" : "Add recording"}
      </SubmitButton>
      {state.error && (
        <p role="alert" className="w-full text-xs font-medium text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="w-full text-xs text-brand-700 dark:text-brand-400">
          {state.ok}
        </p>
      )}
    </form>
  );
}
