/**
 * Build copy-ready listing text a seller can paste into Daraz, Shopify,
 * Instagram, etc. Contains no Flip Baz prices.
 * @param {{ title: string, description: string, sizes?: string[], colors?: string[], processingDays?: number }} p
 * @returns {string}
 */
export function buildListingText(p) {
  const lines = [p.title, "", p.description, ""];
  if (p.sizes?.length) lines.push(`Sizes: ${p.sizes.join(", ")}`);
  if (p.colors?.length) lines.push(`Colours: ${p.colors.join(", ")}`);
  lines.push("Handmade in Sialkot, Pakistan. Quality-checked before dispatch.");
  if (p.processingDays) {
    lines.push(`Made to order: ships in ${p.processingDays}–${p.processingDays + 2} working days, cash on delivery available.`);
  }
  return lines.join("\n").trim();
}
