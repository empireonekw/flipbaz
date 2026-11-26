"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Manage a product's photos: reorder or remove existing ones and pick new
 * uploads (with previews). Existing photos are sent as a JSON list in the
 * hidden `keepImages` field (order = display order, first = cover); new files
 * go in the `newImages` file input.
 *
 * @param {{ initial: string[], max: number }} props
 */
export default function ImageManager({ initial, max }) {
  const [kept, setKept] = useState(initial);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef(null);
  const room = max - kept.length;

  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  function move(i, dir) {
    setKept((list) => {
      const next = [...list];
      const j = i + dir;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function onFiles(e) {
    const files = [...(e.target.files ?? [])];
    setPreviews(files.map((f) => ({ name: f.name, url: URL.createObjectURL(f), tooBig: f.size > 5 * 1024 * 1024 })));
  }

  function clearNew() {
    if (fileRef.current) fileRef.current.value = "";
    setPreviews([]);
  }

  const over = kept.length + previews.length > max;

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Photos (first one is the cover, up to {max})</legend>
      <input type="hidden" name="keepImages" value={JSON.stringify(kept)} />

      {kept.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {kept.map((src, i) => (
            <li key={src} className="overflow-hidden rounded-xl border border-line bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of stored image */}
              <img src={src} alt={`Photo ${i + 1}`} className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between gap-1 p-1.5 text-xs">
                <span className="font-semibold text-muted">{i === 0 ? "Cover" : `#${i + 1}`}</span>
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move photo ${i + 1} earlier`} className="rounded px-1.5 py-0.5 hover:bg-surface-2 disabled:opacity-30">
                    ←
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === kept.length - 1} aria-label={`Move photo ${i + 1} later`} className="rounded px-1.5 py-0.5 hover:bg-surface-2 disabled:opacity-30">
                    →
                  </button>
                  <button type="button" onClick={() => setKept((l) => l.filter((x) => x !== src))} aria-label={`Remove photo ${i + 1}`} className="rounded px-1.5 py-0.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">
                    ✕
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label htmlFor="newImages" className="mb-1 block text-sm text-muted">
        Add photos {room > 0 ? `(${room} more allowed)` : "(remove one to add more)"}
      </label>
      <input
        ref={fileRef}
        id="newImages"
        name="newImages"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={room <= 0}
        onChange={onFiles}
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-800 dark:file:bg-brand-950 dark:file:text-brand-300"
      />
      {previews.length > 0 && (
        <>
          <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {previews.map((p) => (
              <li key={p.url} className={`overflow-hidden rounded-xl border ${p.tooBig ? "border-red-500" : "border-dashed border-brand-400"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={p.url} alt={`New: ${p.name}`} className="aspect-square w-full object-cover" />
                <p className="truncate p-1.5 text-xs">{p.tooBig ? "Over 5 MB" : "New"}</p>
              </li>
            ))}
          </ul>
          <button type="button" onClick={clearNew} className="mt-2 text-sm font-semibold text-muted underline">
            Clear new photos
          </button>
        </>
      )}
      {over && <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">That&apos;s more than {max} photos. Remove some first.</p>}
    </fieldset>
  );
}
