"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction } from "./actions";
import Field from "@/components/ui/Field";
import SubmitButton from "@/components/ui/SubmitButton";
import Alert from "@/components/ui/Alert";

const card = "rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-sm sm:p-6";

/**
 * Contact details form.
 * @param {{ user: { name: string, email: string, phone: string, whatsapp: string, city: string } }} props
 */
export function ProfileForm({ user }) {
  const [state, formAction] = useActionState(updateProfileAction, {});
  const errors = state.errors ?? {};
  const v = state.values ?? user;

  return (
    <form action={formAction} className={`${card} space-y-5`} noValidate aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="text-lg font-bold">
        Your details
      </h2>
      {state.ok && <Alert tone="success">{state.ok}</Alert>}
      <Field label="Email (used to log in)" name="emailDisplay" value={user.email} readOnly disabled hint="Contact support to change your email." />
      <Field label="Full name" name="name" autoComplete="name" required defaultValue={v.name} error={errors.name} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Mobile number" name="phone" type="tel" inputMode="tel" autoComplete="tel" required defaultValue={v.phone} error={errors.phone} />
        <Field label="WhatsApp" name="whatsapp" type="tel" inputMode="tel" defaultValue={v.whatsapp} placeholder="Same as mobile" error={errors.whatsapp} />
      </div>
      <Field label="City" name="city" autoComplete="address-level2" required defaultValue={v.city} error={errors.city} />
      <SubmitButton size="md" pendingText="Saving…">
        Save details
      </SubmitButton>
    </form>
  );
}

/** Change-password form. */
export function PasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, {});
  const errors = state.errors ?? {};
  return (
    <form action={formAction} className={`${card} space-y-5`} noValidate aria-labelledby="password-heading">
      <h2 id="password-heading" className="text-lg font-bold">
        Change password
      </h2>
      {state.ok && <Alert tone="success">{state.ok}</Alert>}
      <Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" required error={errors.currentPassword} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="New password" name="newPassword" type="password" autoComplete="new-password" required hint="At least 8 characters" error={errors.newPassword} />
        <Field label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" required error={errors.confirmPassword} />
      </div>
      <SubmitButton size="md" variant="outline" pendingText="Updating…">
        Update password
      </SubmitButton>
    </form>
  );
}
