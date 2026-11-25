/**
 * Public site configuration. Only NEXT_PUBLIC_* values are read here, so this
 * file is safe to import from client components.
 */
export const siteConfig = {
  name: "Flip Baz",
  tagline: "Sialkot-made products for your online store",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  /** Digits only, international format, e.g. 923001234567 */
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923000000000").replace(/\D/g, ""),
  supportEmail: "support@flipbaz.pk",
  city: "Sialkot, Punjab, Pakistan",
};

/**
 * WhatsApp click-to-chat link with an optional pre-filled message.
 * @param {string} [text]
 * @returns {string}
 */
export function whatsappLink(text) {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * WhatsApp number formatted for display, e.g. "+92 300 0000000".
 * @returns {string}
 */
export function whatsappDisplay() {
  const n = siteConfig.whatsappNumber;
  return n.startsWith("92") ? `+92 ${n.slice(2, 5)} ${n.slice(5)}` : `+${n}`;
}
