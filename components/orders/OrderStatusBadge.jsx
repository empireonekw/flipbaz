import { ORDER_STATUS_LABELS } from "@/lib/models/constants";

const styles = {
  PENDING_PAYMENT: "bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-200",
  CONFIRMED: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200",
  IN_PRODUCTION: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200",
  QC_PASSED: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200",
  SHIPPED: "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300",
  DELIVERED: "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950",
  CANCELLED: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

/**
 * Coloured pill for an order status (text label, so colour isn't the only cue).
 * @param {{ status: string, className?: string }} props
 */
export default function OrderStatusBadge({ status, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? styles.CANCELLED} ${className}`}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
