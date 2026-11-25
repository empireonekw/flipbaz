const tones = {
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200",
  success: "border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-100",
  warning: "border-accent-200 bg-accent-50 text-accent-900 dark:border-accent-800 dark:bg-accent-900/30 dark:text-accent-100",
  info: "border-line bg-surface-2 text-ink",
};

/**
 * Inline message box. Errors are announced to screen readers immediately.
 * @param {{ tone?: keyof tones, children: React.ReactNode, className?: string }} props
 */
export default function Alert({ tone = "info", className = "", children }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]} ${className}`}
    >
      {children}
    </div>
  );
}
