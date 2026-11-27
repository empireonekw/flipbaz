import Image from "next/image";
import Link from "next/link";

/** Logo artwork: original colours (purple + teal), and a version for dark backgrounds. */
const SRC = { light: "/brand/flipbaz-logo.png", onDark: "/brand/flipbaz-logo-on-dark.png" };
const W = 414;
const H = 160;

/**
 * The FlipBaz logo image (no link).
 *
 * - tone "auto": original colours in light mode, the on-dark version in dark mode
 * - tone "dark": always the on-dark version (for the always-dark sidebars and top bars)
 *
 * Height comes from `className` (default h-8); the width follows the logo's shape.
 * @param {{ tone?: "auto"|"dark", className?: string, priority?: boolean }} props
 */
export function LogoImage({ tone = "auto", className = "h-8 w-auto", priority = false }) {
  if (tone === "dark") {
    return <Image src={SRC.onDark} alt="FlipBaz" width={W} height={H} priority={priority} className={className} />;
  }
  return (
    <>
      <Image src={SRC.light} alt="FlipBaz" width={W} height={H} priority={priority} className={`${className} dark:hidden`} />
      <Image src={SRC.onDark} alt="FlipBaz" width={W} height={H} priority={priority} className={`${className} hidden dark:block`} />
    </>
  );
}

/**
 * Full logo linking home (public header, footer, login and sign-up pages).
 * @param {{ className?: string, href?: string, tone?: "auto"|"dark", imgClassName?: string }} props
 */
export default function Logo({ className = "", href = "/", tone = "auto", imgClassName = "h-8 w-auto" }) {
  return (
    <Link href={href} className={`inline-flex items-center rounded-lg ${className}`} aria-label="FlipBaz home">
      <LogoImage tone={tone} className={imgClassName} priority />
    </Link>
  );
}
