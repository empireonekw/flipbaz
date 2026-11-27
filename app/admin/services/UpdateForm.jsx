"use client";

import { useActionState, useState } from "react";
import { updateServiceAction } from "./actions";
import Alert from "@/components/ui/Alert";
import { inputClass } from "@/components/ui/Field";
import SubmitButton from "@/components/ui/SubmitButton";
import { SERVICE_STATUSES, SERVICE_STATUS_LABELS } from "@/lib/models/constants";

function Row({ id, label, hint, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label} {hint && <span className="font-normal text-muted">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Admin controls for one application: status, Google Meet meeting, quote,
 * note to the seller. Fields for the meeting/quote show for the statuses that
 * need them. Re-mounts after each save (key = state.at) so selects show the
 * saved or echoed values.
 *
 * @param {{ app: { _id: string, status: string, meetingLocal: string, meeting?: { url?: string, note?: string }, quote?: { amount?: number, details?: string }, adminNote?: string } }} props
 */
export default function UpdateForm({ app }) {
  const [state, formAction] = useActionState(updateServiceAction, {});
  return <Inner key={state.at ?? 0} app={app} state={state} formAction={formAction} />;
}

function Inner({ app, state, formAction }) {
  const v = state.values ?? {
    status: app.status === "SUBMITTED" ? "MEETING_SCHEDULED" : app.status,
    meetingAt: app.meetingLocal,
    meetingUrl: app.meeting?.url ?? "",
    meetingNote: app.meeting?.note ?? "",
    quoteAmount: app.quote?.amount ?? "",
    quoteDetails: app.quote?.details ?? "",
    note: "",
  };
  const e = state.errors ?? {};
  const [status, setStatus] = useState(v.status);
  const id = app._id;
  const showMeeting = status === "MEETING_SCHEDULED" || !!v.meetingUrl;
  const showQuote = ["QUOTE_READY", "ACTIVE"].includes(status) || !!v.quoteAmount;

  return (
    <form action={formAction} className="space-y-3">
      {state.message && <Alert tone="error">{state.message}</Alert>}
      {state.ok && <Alert tone="success">{state.ok}</Alert>}
      <input type="hidden" name="id" value={id} />

      <Row id={`st-${id}`} label="Status" error={e.status}>
        <select id={`st-${id}`} name="status" value={status} onChange={(ev) => setStatus(ev.target.value)} className={inputClass}>
          {SERVICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {SERVICE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Row>

      {showMeeting && (
        <fieldset className="space-y-3 rounded-xl border border-line p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">Google Meet call</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Row id={`ma-${id}`} label="Date & time" hint="(Pakistan time)" error={e.meetingAt}>
              <input id={`ma-${id}`} name="meetingAt" type="datetime-local" defaultValue={v.meetingAt} className={inputClass} />
            </Row>
            <Row id={`mu-${id}`} label="Meet link" error={e.meetingUrl}>
              <input id={`mu-${id}`} name="meetingUrl" type="url" placeholder="https://meet.google.com/abc-defg-hij" defaultValue={v.meetingUrl} className={inputClass} />
            </Row>
          </div>
          <Row id={`mn-${id}`} label="Note for the call" hint="(optional)" error={e.meetingNote}>
            <input id={`mn-${id}`} name="meetingNote" maxLength={300} placeholder="e.g. 20 minutes with our Etsy lead" defaultValue={v.meetingNote} className={inputClass} />
          </Row>
        </fieldset>
      )}

      {showQuote && (
        <fieldset className="space-y-3 rounded-xl border border-line p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">Quote</legend>
          <Row id={`qa-${id}`} label="Monthly fee (Rs)" error={e.quoteAmount}>
            <input id={`qa-${id}`} name="quoteAmount" inputMode="numeric" placeholder="e.g. 45000" defaultValue={v.quoteAmount} className={inputClass} />
          </Row>
          <Row id={`qd-${id}`} label="What's included" hint="(optional)" error={e.quoteDetails}>
            <textarea id={`qd-${id}`} name="quoteDetails" rows={3} maxLength={1000} defaultValue={v.quoteDetails} className={inputClass} />
          </Row>
        </fieldset>
      )}

      <Row id={`no-${id}`} label="Note to the seller" hint={status === "DECLINED" ? "(required)" : "(optional)"} error={e.note}>
        <textarea id={`no-${id}`} name="note" rows={2} maxLength={500} defaultValue={v.note} className={inputClass} />
      </Row>

      <SubmitButton size="md" pendingText="Saving…">
        Save &amp; notify seller
      </SubmitButton>
    </form>
  );
}
