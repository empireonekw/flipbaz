"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signupAction } from "../actions";
import Field from "@/components/ui/Field";
import SubmitButton from "@/components/ui/SubmitButton";
import Alert from "@/components/ui/Alert";

/** Seller sign-up form wired to the `signupAction` Server Action. */
export default function SignupForm() {
  const [state, formAction] = useActionState(signupAction, {});
  const next = useSearchParams().get("next") ?? "";
  const errors = state.errors ?? {};
  const v = state.values ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {Object.keys(errors).length > 0 && (
        <Alert tone="error">Please fix the highlighted fields.</Alert>
      )}
      <input type="hidden" name="next" value={next} />
      <Field label="Full name" name="name" autoComplete="name" required defaultValue={v.name} error={errors.name} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={v.email}
        error={errors.email}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Mobile number"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="0300 1234567"
          required
          defaultValue={v.phone}
          error={errors.phone}
        />
        <Field
          label="WhatsApp (optional)"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          placeholder="Same as mobile"
          defaultValue={v.whatsapp}
          error={errors.whatsapp}
        />
      </div>
      <Field label="City" name="city" autoComplete="address-level2" required defaultValue={v.city} error={errors.city} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters"
          error={errors.password}
        />
        <Field
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword}
        />
      </div>
      <div>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            name="terms"
            required
            defaultChecked={v.terms === "on"}
            aria-invalid={errors.terms ? true : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-brand-700"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-brand-700 underline dark:text-brand-400">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-brand-700 underline dark:text-brand-400">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {errors.terms && <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{errors.terms}</p>}
      </div>
      <SubmitButton className="w-full" pendingText="Creating your account…">
        Create account
      </SubmitButton>
    </form>
  );
}
