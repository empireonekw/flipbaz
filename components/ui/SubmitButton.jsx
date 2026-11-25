"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "./Button";

/**
 * Submit button that disables itself and shows a spinner while the parent
 * form's Server Action is running.
 * @param {{ pendingText?: string, variant?: string, size?: string, className?: string, children: React.ReactNode }} props
 */
export default function SubmitButton({ children, pendingText = "Please wait…", variant, size = "lg", className = "", disabled = false, ...rest }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      className={buttonClass({ variant, size, className })}
      {...rest}
    >
      {pending && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" fill="none" />
        </svg>
      )}
      {pending ? pendingText : children}
    </button>
  );
}
