"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Main image with a thumbnail strip.
 * @param {{ images: string[], title: string }} props
 */
export default function ProductGallery({ images, title }) {
  const [active, setActive] = useState(0);
  const list = images?.length ? images : [];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-2">
        {list[active] ? (
          <Image
            src={list[active]}
            alt={`${title}, image ${active + 1} of ${list.length}`}
            fill
            loading="eager"
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">No image yet</div>
        )}
      </div>
      {list.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="Choose image">
          {list.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}`}
                aria-pressed={i === active}
                className={`relative block aspect-square w-full overflow-hidden rounded-xl border-2 ${
                  i === active ? "border-brand-600 dark:border-brand-400" : "border-transparent opacity-80 hover:opacity-100"
                }`}
              >
                <Image src={src} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
