import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-muted">Log in to see prices and manage your orders.</p>
      <div className="mt-8">
        {/* LoginForm reads ?next= from the URL, so it renders at request time. */}
        <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-surface-2" />}>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        New to Flip Baz?{" "}
        <Link href="/signup" className="font-semibold text-brand-700 underline-offset-4 hover:underline dark:text-brand-400">
          Create a seller account
        </Link>
      </p>
    </>
  );
}
