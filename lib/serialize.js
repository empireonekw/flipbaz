/**
 * Turn a Mongoose document / lean object (or array of them) into plain JSON
 * that is safe to pass from Server Components to Client Components.
 *
 * - ObjectIds become hex strings (via their toJSON)
 * - Dates become ISO strings
 * - Mongoose internals and `undefined` values are dropped
 *
 * @template T
 * @param {T} value lean document(s), ideally from `.lean()`
 * @returns {any} plain JSON-compatible copy
 */
export function serialize(value) {
  if (value === null || value === undefined) return value ?? null;
  return JSON.parse(JSON.stringify(value));
}
