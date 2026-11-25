import Link from "next/link";
import { whatsappDisplay, whatsappLink } from "@/lib/config";
import { buttonClass } from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export const metadata = { title: "Reset your password" };

/**
 * Placeholder until email delivery is set up: sellers ask support on
 * WhatsApp, and an admin resets the password manually.
 */
export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Forgot your password?</h1>
      <p className="mt-2 text-muted">
        Automatic reset emails are coming soon. For now, our team can reset it for you, usually within
        a few hours.
      </p>
      <Alert tone="info" className="mt-8">
        Message us on WhatsApp from the number on your account, and include the email you signed up
        with. For your security we&apos;ll never ask for your old password.
      </Alert>
      <a
        href={whatsappLink("Hi Flip Baz, I need help resetting my password. My account email is: ")}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass({ variant: "primary", size: "lg", className: "mt-6 w-full" })}
      >
        Message support on WhatsApp ({whatsappDisplay()})
      </a>
      <p className="mt-8 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-brand-700 underline-offset-4 hover:underline dark:text-brand-400">
          Back to log in
        </Link>
      </p>
    </>
  );
}
