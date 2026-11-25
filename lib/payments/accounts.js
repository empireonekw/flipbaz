import "server-only";

/**
 * Where sellers send money for manual payments. Read from env so the numbers
 * can change without a code deploy. Not secret (sellers see them), but kept
 * server-side so they're only shown to signed-in sellers at checkout.
 *
 * @typedef {Object} PaymentAccount
 * @property {"JAZZCASH"|"EASYPAISA"|"BANK_TRANSFER"} method
 * @property {string} label
 * @property {{ label: string, value: string, copy?: boolean }[]} lines
 */

/** @returns {PaymentAccount[]} */
export function getPaymentAccounts() {
  const env = process.env;
  const accounts = [
    {
      method: "JAZZCASH",
      label: "JazzCash",
      lines: [
        { label: "Mobile account", value: env.PAYMENT_JAZZCASH_NUMBER, copy: true },
        { label: "Account title", value: env.PAYMENT_JAZZCASH_TITLE },
      ],
    },
    {
      method: "EASYPAISA",
      label: "EasyPaisa",
      lines: [
        { label: "Mobile account", value: env.PAYMENT_EASYPAISA_NUMBER, copy: true },
        { label: "Account title", value: env.PAYMENT_EASYPAISA_TITLE },
      ],
    },
    {
      method: "BANK_TRANSFER",
      label: "Bank transfer",
      lines: [
        { label: "Bank", value: env.PAYMENT_BANK_NAME },
        { label: "Account title", value: env.PAYMENT_BANK_TITLE },
        { label: "Account number", value: env.PAYMENT_BANK_ACCOUNT, copy: true },
        { label: "IBAN", value: env.PAYMENT_BANK_IBAN, copy: true },
      ],
    },
  ];
  // Hide a method entirely if its main number isn't configured.
  return accounts
    .map((a) => ({ ...a, lines: a.lines.filter((l) => l.value) }))
    .filter((a) => a.lines.some((l) => l.copy));
}
