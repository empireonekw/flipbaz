/**
 * Safe server-side error logging.
 *
 * Logs only the error's name, code and message (plus the stack in
 * development), never the whole object: Mongoose/driver errors can carry
 * query values, documents or request data that don't belong in logs.
 * Nothing here is ever sent to the client.
 */

const dev = process.env.NODE_ENV !== "production";

/** Message shown to users for unexpected failures. */
export const GENERIC_ERROR = "Something went wrong. Please try again.";

/**
 * @param {string} scope  where it happened, e.g. "place-order"
 * @param {unknown} err
 */
export function logError(scope, err) {
  const e = /** @type {any} */ (err);
  const parts = [`[${scope}]`, e?.name ?? "Error"];
  if (e?.code !== undefined) parts.push(`code=${e.code}`);
  parts.push(String(e?.message ?? e).slice(0, 300));
  console.error(parts.join(" "));
  if (dev && e?.stack) console.error(e.stack.split("\n").slice(1, 6).join("\n"));
}
