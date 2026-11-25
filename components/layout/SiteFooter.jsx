import Link from "next/link";
import Logo from "@/components/ui/Logo";
import CurrentYear from "@/components/ui/CurrentYear";
import { siteConfig, whatsappDisplay, whatsappLink } from "@/lib/config";

const columns = [
  {
    title: "Platform",
    links: [
      { href: "/catalog", label: "Catalog" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/signup", label: "Become a member" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help & FAQ" },
      { href: "/contact", label: "Contact us" },
      { href: "/login", label: "Member login" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/refund-policy", label: "Refund policy" },
    ],
  },
];

/** Public site footer. */
export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">
            Sialkot-made leather goods, sportswear and boxing gear, made to order and delivered to your
            customers across Pakistan.
          </p>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400"
          >
            WhatsApp {whatsappDisplay()}
          </a>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-semibold text-ink">{col.title}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
          © <CurrentYear /> {siteConfig.name} · {siteConfig.city}
        </p>
      </div>
    </footer>
  );
}
