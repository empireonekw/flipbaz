import Image from "next/image";

/**
 * Square product image. SVG placeholders are served as-is (next/image skips
 * optimisation for .svg automatically); uploaded photos are optimised.
 * @param {{ src?: string, alt: string, priority?: boolean, sizes?: string, className?: string }} props
 */
export default function ProductImage({ src, alt, priority = false, sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw", className = "" }) {
  return (
    <div className={`relative aspect-square overflow-hidden bg-surface-2 ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} loading={priority ? "eager" : undefined} className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted">No image</div>
      )}
    </div>
  );
}
