import { Suspense } from "react";
import Image from "next/image";
import Section from "@/components/marketing/Section";
import FaqList from "@/components/marketing/FaqList";
import Icon from "@/components/marketing/Icon";
import { AudienceGrid, BenefitsGrid, ComparisonTable, ContactBlock, StepsList } from "@/components/marketing/Blocks";
import { CatalogPreview, GridSkeleton, PricingPlans } from "@/components/marketing/DataSections";
import Button from "@/components/ui/Button";
import { faqs } from "@/lib/content";

const heroImages = [
  { src: "/seed/products/classic-biker-leather-jacket-1.svg", alt: "Leather biker jacket" },
  { src: "/seed/products/pro-training-boxing-gloves-1.svg", alt: "Boxing gloves" },
  { src: "/seed/products/sublimated-football-kit-1.svg", alt: "Football kit" },
  { src: "/seed/products/leather-driving-gloves-1.svg", alt: "Leather driving gloves" },
];

/**
 * Landing page. Static sections prerender; catalog preview and plans stream
 * in from the database at request time.
 */
export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-0 h-[32rem] w-[32rem] rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-700/20" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-accent-300/25 blur-3xl dark:bg-accent-700/10" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-2 lg:pb-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
              <span className="h-2 w-2 rounded-full bg-accent-500" aria-hidden="true" />
              Made to order in Sialkot
            </p>
            <h1 className="mt-5 text-balance text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Sell world-class gear.{" "}
              <span className="text-brand-700 dark:text-brand-400">Keep zero stock.</span>
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg text-muted">
              List Sialkot-made leather goods, sportswear and boxing equipment on your own store. When a
              customer orders, our workshop makes it, checks it and ships it to their door. You keep the
              difference.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/pricing" variant="accent" size="lg">
                See membership plans
                <Icon name="arrow" className="h-5 w-5" />
              </Button>
              <Button href="/catalog" variant="outline" size="lg">
                Browse the catalog
              </Button>
            </div>
            <ul className="mt-8 grid grid-cols-1 gap-3 text-sm text-muted sm:grid-cols-3">
              {["No minimum orders", "Ships across Pakistan", "Every item quality-checked"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Icon name="check" className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {heroImages.map((img, i) => (
              <div
                key={img.src}
                className={`relative aspect-square overflow-hidden rounded-[var(--radius-card)] shadow-lg ${i % 2 === 1 ? "translate-y-6" : ""}`}
              >
                <Image src={img.src} alt={img.alt} fill loading={i < 2 ? "eager" : undefined} sizes="(min-width: 1024px) 280px, 45vw" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section
        id="catalog-preview"
        tone="tint"
        eyebrow="The catalog"
        title="Products your customers already search for"
        intro="A taste of what members can list today. Prices, profit estimates and listing photos unlock with membership."
      >
        <Suspense fallback={<GridSkeleton />}>
          <CatalogPreview />
        </Suspense>
      </Section>

      <Section id="who" eyebrow="Who it's for" title="Built for people who sell online" intro="Whether you're starting out or adding a new line to an existing business.">
        <AudienceGrid />
      </Section>

      <Section id="how" tone="tint" eyebrow="How it works" title="From your listing to their doorstep in four steps">
        <StepsList />
      </Section>

      <Section id="benefits" eyebrow="Member benefits" title="Everything you need to start selling this week">
        <BenefitsGrid />
      </Section>

      <Section id="compare" tone="tint" eyebrow="Why Flip Baz" title="The hard parts, handled" intro="Compare what it takes to source and ship on your own with selling through Flip Baz.">
        <ComparisonTable />
      </Section>

      <Section id="pricing" eyebrow="Pricing" title="One membership. The whole catalog." intro="Pay once for your plan. Longer plans cost less per month. No hidden fees on top.">
        <Suspense fallback={<GridSkeleton count={4} tall />}>
          <PricingPlans />
        </Suspense>
      </Section>

      <Section id="faq" tone="tint" eyebrow="FAQ" title="Questions sellers ask us">
        <FaqList items={faqs.slice(0, 6)} />
      </Section>

      <Section id="contact">
        <ContactBlock />
      </Section>
    </>
  );
}
