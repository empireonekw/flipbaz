/**
 * Safety check for the seed script.
 *
 * The seed empties Flip Baz's collections (users, products, orders, …). Those
 * names are common, so if the target database is shared with another app the
 * seed would destroy that app's data. This guard refuses to continue when the
 * database holds ANY collection Flip Baz doesn't own. There is deliberately no
 * override flag: point MONGODB_DB at a dedicated database instead.
 */

/**
 * List collections in `db` that Flip Baz does not own.
 * @param {import("mongodb").Db} db             native driver Db
 * @param {Iterable<string>} ownedCollections   Flip Baz collection names
 * @returns {Promise<string[]>} foreign collection names (empty = safe)
 */
export async function findForeignCollections(db, ownedCollections) {
  const owned = new Set(ownedCollections);
  const existing = await db.listCollections({}, { nameOnly: true }).toArray();
  return existing
    .map((c) => c.name)
    .filter((name) => !name.startsWith("system.") && !owned.has(name))
    .sort();
}
