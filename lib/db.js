import mongoose from "mongoose";

/**
 * Cached Mongoose connection.
 *
 * Next.js hot reloads in development and serverless platforms reuse warm
 * instances, so we keep a single connection promise on `globalThis` instead of
 * opening a new connection on every request.
 *
 * The connection string is read ONLY from `process.env.MONGODB_URI`. It is never
 * logged or returned.
 *
 * Database: the one named in MONGODB_URI (e.g. ".../FlipBaz?..."). Set
 * MONGODB_DB only to override it. If neither names one, "flipbaz" is used
 * rather than MongoDB's catch-all "test". The database must belong to Flip Baz
 * alone: collection names like "users" and "products" are common, so a shared
 * database would mix data with another app (the seed refuses to run on one).
 */

/**
 * Database name from the URI path, if any.
 * @param {string} uri
 * @returns {string|undefined}
 */
function dbNameFromUri(uri) {
  const m = String(uri || "").match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
}

/** Database name Flip Baz reads and writes. */
export const DB_NAME = process.env.MONGODB_DB || dbNameFromUri(process.env.MONGODB_URI) || "flipbaz";
const globalCache = globalThis.__flipBazMongoose ?? { conn: null, promise: null };
globalThis.__flipBazMongoose = globalCache;

/**
 * Connect to MongoDB (or reuse the existing connection).
 * @returns {Promise<typeof mongoose>} the connected mongoose instance
 * @throws {Error} when MONGODB_URI is missing
 */
export async function connectDB() {
  if (globalCache.conn) return globalCache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example)."
    );
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose
      .connect(uri, {
        dbName: DB_NAME,
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => m)
      .catch((err) => {
        // Reset so the next call can retry instead of reusing a rejected promise.
        globalCache.promise = null;
        // Strip anything that could echo the URI back.
        throw new Error(`MongoDB connection failed: ${err.codeName || err.name}`);
      });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}

/**
 * Close the cached connection (used by scripts such as the seed).
 * @returns {Promise<void>}
 */
export async function disconnectDB() {
  if (globalCache.conn) {
    await globalCache.conn.disconnect();
    globalCache.conn = null;
    globalCache.promise = null;
  }
}
