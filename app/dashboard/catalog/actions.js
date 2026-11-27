"use server";

import { revalidatePath } from "next/cache";
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
const REQUEST_ECHO = ["title", "details", "referenceUrl", "quantity", "targetPrice"];

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
 * Send us a request for an item that isn't in the catalog.
 * @param {Object} _prev
 * @param {FormData} formData  title, details, referenceUrl, quantity, targetPrice, photo?
 */
export async function createRequestAction(_prev, formData) {
  const seller = await requireSeller("/dashboard/catalog/requests");
  const raw = formToObject(formData);
  const values = Object.fromEntries(REQUEST_ECHO.map((k) => [k, String(raw[k] ?? "").slice(0, 1000)]));

  const parsed = productRequestSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const limited = checkLimit("product-request", seller.id, LIMITS.productRequest);
  if (limited) return { ...limited, values };

  const photo = formData.get("photo");
  try {
    await createProductRequest(seller.id, parsed.data, photo instanceof File ? photo : null);
  } catch (err) {
    if (err instanceof RequestError || err instanceof UploadError) return { message: err.message, values };
    logError("product-request", err);
    return { message: GENERIC_ERROR, values };
  }
  revalidatePath("/dashboard/catalog/requests");
  revalidatePath("/admin/requests");
  return { ok: "Request sent. We'll reply here and in your Updates, usually within 2 working days." };
}
