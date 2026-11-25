import Link from "next/link";

/**
 * Flip Baz mark: two arrows chasing each other inside a rounded tile,
 * representing a product "flipping" from our workshop to your customer.
 * @param {{ className?: string }} props
 */
export function LogoMark({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" className="fill-brand-700 dark:fill-brand-500" />
      <path
        d="M11 17a9 9 0 0 1 15.5-5.2"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path d="M28.5 7.5v6.3h-6.3" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M29 23a9 9 0 0 1-15.5 5.2"
        fill="none"
        className="stroke-accent-300"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M11.5 32.5v-6.3h6.3"
        fill="none"
        className="stroke-accent-300"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Full logo: mark + "flip baz" wordmark, linking home.
 * @param {{ className?: string, href?: string }} props
 */
export default function Logo({ className = "", href = "/" }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-lg ${className}`}
      aria-label="Flip Baz home"
    >
      <LogoMark />
      <span className="text-xl font-extrabold tracking-tight text-ink">
        flip<span className="text-brand-700 dark:text-brand-400">baz</span>
      </span>
    </Link>
  );
}
