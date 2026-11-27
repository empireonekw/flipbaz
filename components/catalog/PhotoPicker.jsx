"use client";

import { useId, useState } from "react";

/** Longest side photos are scaled down to before upload. */
const MAX_SIDE = 1600;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

/** One preview URL per File, made on first use and revoked when it's removed. */
const previews = new WeakMap();
function previewUrl(file) {
  if (!previews.has(file)) previews.set(file, URL.createObjectURL(file));
  return previews.get(file);
}
function dropPreview(file) {
  const url = previews.get(file);
  if (url) URL.revokeObjectURL(url);
  previews.delete(file);
}

/**
 * Shrink big photos in the browser (phone cameras make 4–8 MB files) so a
 * request with several photos stays small on mobile data. GIFs and photos
 * that are already small are left alone.
 * @param {File} file
 * @returns {Promise<File>}
 */
async function shrink(file) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size < 700 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/**
 * Photo tiles with an "Add photo" tile. Keeps the chosen files in the
 * parent's state (not in a named <input>), so they survive React's form reset
 * after a failed submit; the parent appends them to the FormData itself.
 *
 * @param {{ files: File[], onChange: (files: File[]) => void, max: number, error?: string, label: string }} props
 */
export default function PhotoPicker({ files, onChange, max, error, label }) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function onPick(e) {
    const picked = [...(e.target.files ?? [])].filter((f) => ACCEPT.split(",").includes(f.type));
    e.target.value = "";
    if (!picked.length) return setNote("Choose JPG, PNG, WebP or GIF images.");
    const room = max - files.length;
    setNote(picked.length > room ? `Only ${max} photos fit, so the extra ones were left out.` : "");
    setBusy(true);
    const ready = await Promise.all(picked.slice(0, room).map(shrink));
    setBusy(false);
    const tooBig = ready.filter((f) => f.size > 5 * 1024 * 1024);
    if (tooBig.length) setNote("Photos must be 5 MB or smaller.");
    onChange([...files, ...ready.filter((f) => f.size <= 5 * 1024 * 1024)]);
  }

  const remove = (i) => {
    dropPreview(files[i]);
    onChange(files.filter((_, j) => j !== i));
  };
  const tile = "relative aspect-square w-[calc(50%-0.375rem)] overflow-hidden rounded-2xl sm:w-40";

  return (
    <div>
      <ul className="flex flex-wrap gap-3" aria-label={`${label}: ${files.length} of ${max} added`}>
        {files.map((f, i) => (
          <li key={`${f.name}-${f.size}-${i}`} className={`${tile} border border-line bg-surface-2`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl(f)} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">Main</span>}
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </li>
        ))}
        {files.length < max && (
          <li className={tile}>
            <label
              htmlFor={inputId}
              className={`flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed text-sm text-muted transition-colors hover:border-brand-500 hover:text-ink has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-500/20 ${
                error ? "border-red-400" : "border-stone-300 dark:border-white/20"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {busy ? "Preparing…" : files.length ? "Add another" : "Add photo"}
              <input
                id={inputId}
                type="file"
                accept={ACCEPT}
                multiple
                onChange={onPick}
                aria-invalid={error ? true : undefined}
                className="sr-only"
              />
            </label>
          </li>
        )}
      </ul>
      <p className="mt-2 text-xs text-muted">
        Up to {max} photos, JPG, PNG, WebP or GIF. A screenshot of a listing works too. Only you and our team can see them.
      </p>
      {(error || note) && (
        <p role={error ? "alert" : "status"} className={`mt-1 text-sm ${error ? "font-medium text-red-600 dark:text-red-400" : "text-muted"}`}>
          {error || note}
        </p>
      )}
    </div>
  );
}
