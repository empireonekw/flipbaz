"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "../actions";
import Field from "@/components/ui/Field";
import SubmitButton from "@/components/ui/SubmitButton";
import Alert from "@/components/ui/Alert";

/** Email + password login form wired to the `loginAction` Server Action. */
export default function LoginForm() {
  const [state, formAction] = useActionState(loginAction, {});
  const next = useSearchParams().get("next") ?? "";
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && <Alert tone="error">{state.message}</Alert>}
      <input type="hidden" name="next" value={next} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={errors.email}
      />
      <div>
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={errors.password}
        />
        <div className="mt-2 text-right">
          <Link href="/forgot-password" className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline dark:text-brand-400">
            Forgot password?
          </Link>
        </div>
      </div>
      <SubmitButton className="w-full" pendingText="Logging in…">
        Log in
      </SubmitButton>
    </form>
  );
}
