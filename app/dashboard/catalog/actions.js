"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/auth/dal";
import { ListingError, setProductSaved } from "@/lib/listings";
import { RequestError, createProductRequest } from "@/lib/requests";
import { UploadError } from "@/lib/storage";
import { productRequestSchema } from "@/lib/validators/request";
import { fieldErrors, formToObject } from "@/lib/validators/common";
import { LIMITS } from "@/lib/security/config";
import { checkLimit } from "@/lib/security/guard";
import { GENERIC_ERROR, logError } from "@/lib/security/log";

/** Fields echoed back to the request form (never anything else from the request). */
const REQUEST_ECHO = ["title", "details", "categoryId", "variants", "shipping", "shipTo", "referenceUrl", "notes"];

/**
 * Save a product to (or remove it from) My listings.
 * @param {{ productId: string, save: boolean }} input
 * @returns {Promise<{ ok?: true, saved?: boolean, error?: string }>}
 */
export async function setSavedAction({ productId, save }) {
  const seller = await requireSeller("/dashboard/catalog");
  const limited = checkLimit("listing-save", seller.id, LIMITS.listingSave);
  if (limited) return { error: limited.error };
  try {
    await setProductSaved(seller.id, String(productId ?? ""), Boolean(save));
  } catch (err) {
    if (err instanceof ListingError) return { error: err.message };
    logError("listing-save", err);
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/dashboard/catalog", "layout");
  return { ok: true, saved: Boolean(save) };
}

/**
 * Send us a request for an item that isn't in the catalog. On success the
 * seller lands on their requests list.
 * @param {Object} _prev
 * @param {FormData} formData  title, details, categoryId, variants, shipping, shipTo, referenceUrl, notes, photos[]
 */
export async function createRequestAction(_prev, formData) {
  const seller = await requireSeller("/dashboard/catalog/requests/new");
  const raw = formToObject(formData);
  const values = Object.fromEntries(REQUEST_ECHO.map((k) => [k, String(raw[k] ?? "").slice(0, 1000)]));
  const at = Date.now(); // lets the form re-mount with the echoed values

  const parsed = productRequestSchema.safeParse(values);
  const photos = formData.getAll("photos").filter((f) => f instanceof File && f.size > 0);
  const errors = {
    ...(parsed.success ? {} : fieldErrors(parsed.error)),
    ...(photos.length ? {} : { photos: "Add at least one photo" }),
  };
  if (!parsed.success || !photos.length) return { errors, values, at };

  const limited = checkLimit("product-request", seller.id, LIMITS.productRequest);
  if (limited) return { ...limited, values, at };

  try {
    await createProductRequest(seller.id, parsed.data, photos);
  } catch (err) {
    if (err instanceof RequestError || err instanceof UploadError) return { message: err.message, values, at };
    logError("product-request", err);
    return { message: GENERIC_ERROR, values, at };
  }
  revalidatePath("/dashboard/catalog/requests");
  revalidatePath("/admin/requests");
  redirect("/dashboard/catalog/requests?sent=1");
}
