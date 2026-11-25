/**
 * Pricing helpers shared by the catalog, order form and admin.
 * Kept free of DB/server imports so client components can use them too.
 */

/** Flat domestic shipping fee (PKR) charged per order unless overridden by env. */
export const DEFAULT_SHIPPING_FEE = Number(process.env.NEXT_PUBLIC_SHIPPING_FEE) || 250;

/**
 * Estimated seller profit for one unit sold at the suggested retail price.
 * profit = suggestedRetailPrice − costPrice − shipping
 *
 * @param {{ costPrice: number, suggestedRetailPrice: number }} product
 * @param {number} [shippingFee=DEFAULT_SHIPPING_FEE]
 * @returns {number}
 */
export function estimateProfit(product, shippingFee = DEFAULT_SHIPPING_FEE) {
  return (
    (Number(product.suggestedRetailPrice) || 0) -
    (Number(product.costPrice) || 0) -
    (Number(shippingFee) || 0)
  );
}

/**
 * Compute order totals from line items.
 * @param {{ unitPrice: number, qty: number }[]} items
 * @param {number} [shippingFee=DEFAULT_SHIPPING_FEE]
 * @returns {{ subtotal: number, shippingFee: number, total: number }}
 */
export function computeOrderTotals(items, shippingFee = DEFAULT_SHIPPING_FEE) {
  const subtotal = items.reduce(
    (sum, i) => sum + (Number(i.unitPrice) || 0) * (Number(i.qty) || 0),
    0
  );
  return { subtotal, shippingFee, total: subtotal + shippingFee };
}

/**
 * Percent saved per month on a plan versus the 1-month base price.
 * @param {number} pricePerMonth
 * @param {number} basePricePerMonth
 * @returns {number} whole-number percent, 0 if no saving
 */
export function planDiscountPercent(pricePerMonth, basePricePerMonth) {
  if (!basePricePerMonth || pricePerMonth >= basePricePerMonth) return 0;
  return Math.round((1 - pricePerMonth / basePricePerMonth) * 100);
}
