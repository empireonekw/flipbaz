import Link from "next/link";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400",
  accent: "bg-accent-500 text-white hover:bg-accent-600 dark:bg-accent-400 dark:text-accent-900 dark:hover:bg-accent-300",
  outline: "border border-line bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

/**
 * Class string for a button-styled element.
 * @param {{ variant?: keyof variants, size?: keyof sizes, className?: string }} opts
 * @returns {string}
 */
export function buttonClass({ variant = "primary", size = "md", className = "" } = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

/**
 * Button, or a Link styled as a button when `href` is given.
 * @param {Object} props
 * @param {string} [props.href]
 * @param {keyof variants} [props.variant]
 * @param {keyof sizes} [props.size]
 */
export default function Button({ href, variant, size, className, children, ...rest }) {
  const cls = buttonClass({ variant, size, className });
  if (href) {
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
