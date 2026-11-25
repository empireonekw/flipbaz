"use client";

import { useActionState } from "react";
import { sendContactMessage } from "./actions";
import Field from "@/components/ui/Field";
import SubmitButton from "@/components/ui/SubmitButton";
import Alert from "@/components/ui/Alert";

/** Contact form wired to the `sendContactMessage` Server Action. */
export default function ContactForm() {
  const [state, formAction] = useActionState(sendContactMessage, {});
  const errors = state.errors ?? {};
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <Alert tone="success">
        <p className="font-semibold">Thanks, your message is on its way.</p>
        <p className="mt-1">We usually reply within one working day. For anything urgent, WhatsApp is fastest.</p>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" autoComplete="name" required defaultValue={v.name} error={errors.name} />
        <Field
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={v.email}
          error={errors.email}
        />
      </div>
      <Field
        label="Phone (optional)"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0300 1234567"
        defaultValue={v.phone}
        error={errors.phone}
      />
      <Field
        as="textarea"
        label="How can we help?"
        name="message"
        rows={5}
        required
        defaultValue={v.message}
        error={errors.message}
      />
      {/* Honeypot: hidden from people and screen readers, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <SubmitButton className="w-full sm:w-auto" pendingText="Sending…">
        Send message
      </SubmitButton>
    </form>
  );
}
