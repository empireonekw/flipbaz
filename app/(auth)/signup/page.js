import { Suspense } from "react";
import Link from "next/link";
import SignupForm from "./SignupForm";

export const metadata = { title: "Create your seller account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Start selling with Flip Baz</h1>
      <p className="mt-2 text-muted">
        Create your account, pick a membership plan, and unlock wholesale prices on the full catalog.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-[36rem] animate-pulse rounded-2xl bg-surface-2" />}>
          <SignupForm />
        </Suspense>
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-brand-700 underline-offset-4 hover:underline dark:text-brand-400">
          Log in
        </Link>
      </p>
    </>
  );
}
