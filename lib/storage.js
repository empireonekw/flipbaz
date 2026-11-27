import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * File storage helper. Everything that saves, reads or deletes uploaded files
 * goes through here, so switching to Cloudinary or S3 later means changing
 * only this module (keep the same function signatures and return URLs).
 *
 * Current driver: local disk under <project>/storage/uploads, served through
 * the /uploads/[...path] route handler. (We don't write into /public because
 * `next start` only serves files that existed in /public at build time.)
 *
 * NOTE: serverless hosts such as Vercel don't keep files written at runtime,
 * so swap this driver for S3/Cloudinary before relying on uploads there.
 */

/** Upload problem whose message is safe to show the user. */
export class UploadError extends Error {}

/** Upload folders. `payments` and `requests` are private (owner + admins only). */
export const UPLOAD_FOLDERS = Object.freeze(["products", "categories", "payments", "requests"]);
export const PRIVATE_FOLDERS = Object.freeze(["payments", "requests"]);

/** Max upload size in bytes (5 MB). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Allowed image types, detected from file bytes (not the client's claim). */
const SIGNATURES = [
  { ext: "jpg", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { ext: "webp", mime: "image/webp", test: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
  { ext: "gif", mime: "image/gif", test: (b) => b.toString("ascii", 0, 3) === "GIF" },
];

const MIME_BY_EXT = Object.fromEntries(SIGNATURES.map((s) => [s.ext, s.mime]));
const SAFE_NAME = /^[a-z0-9-]+\.(jpg|png|webp|gif)$/;

/** Absolute disk path for folder/name (statically scoped to storage/uploads). */
function diskPath(folder, name) {
  return path.join(process.cwd(), "storage", "uploads", folder, name);
}

/**
 * Split an /uploads/<folder>/<name> URL, validating both parts.
 * @param {string} url
 * @returns {{ folder: string, name: string } | null}
 */
export function parseUploadUrl(url) {
  if (typeof url !== "string") return null;
  const m = url.match(/^\/uploads\/([a-z]+)\/([^/]+)$/);
  if (!m || !UPLOAD_FOLDERS.includes(m[1]) || !SAFE_NAME.test(m[2])) return null;
  return { folder: m[1], name: m[2] };
}

/**
 * Save an uploaded image.
 * @param {File} file          from FormData
 * @param {Object} opts
 * @param {"products"|"categories"|"payments"|"requests"} opts.folder
 * @returns {Promise<string>}  URL, e.g. "/uploads/payments/mf3k2-ab12….jpg"
 * @throws {UploadError} with a user-friendly message for bad files
 */
export async function saveImage(file, { folder }) {
  if (!UPLOAD_FOLDERS.includes(folder)) throw new Error("Invalid upload folder");
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    throw new UploadError("Please choose an image to upload.");
  }
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Images must be 5 MB or smaller.");

  const bytes = Buffer.from(await file.arrayBuffer());
  const type = SIGNATURES.find((s) => s.test(bytes));
  if (!type) throw new UploadError("Only JPG, PNG, WebP or GIF images are allowed.");

  const name = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString("hex")}.${type.ext}`;
  await mkdir(path.dirname(diskPath(folder, name)), { recursive: true });
  await writeFile(diskPath(folder, name), bytes);
  return `/uploads/${folder}/${name}`;
}

/**
 * Read an uploaded file for serving.
 * @param {string} folder
 * @param {string} name
 * @returns {Promise<{ bytes: Buffer, contentType: string } | null>}
 */
export async function readUpload(folder, name) {
  if (!UPLOAD_FOLDERS.includes(folder) || !SAFE_NAME.test(name)) return null;
  try {
    const bytes = await readFile(diskPath(folder, name));
    return { bytes, contentType: MIME_BY_EXT[name.split(".").pop()] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

/**
 * Delete an uploaded file. Anything that isn't an /uploads/ URL (e.g. seeded
 * /seed/ images) is ignored.
 * @param {string} url
 * @returns {Promise<void>}
 */
export async function deleteStoredFile(url) {
  const parsed = parseUploadUrl(url);
  if (parsed) await unlink(diskPath(parsed.folder, parsed.name)).catch(() => {});
}
