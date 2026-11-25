import { useId } from "react";

export const inputClass =
  "block w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted/70 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-500/20";

/**
 * Labelled form input with hint and error text wired up for screen readers.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.name
 * @param {string} [props.error]   validation message
 * @param {string} [props.hint]    helper text under the input
 * @param {"input"|"textarea"|"select"} [props.as]
 */
export default function Field({ label, name, error, hint, as = "input", className = "", children, ...rest }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const Tag = as;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <Tag
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClass}
        {...rest}
      >
        {children}
      </Tag>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
