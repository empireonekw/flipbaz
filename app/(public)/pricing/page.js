import { Suspense } from "react";
import Section from "@/components/marketing/Section";
import FaqList from "@/components/marketing/FaqList";
import { BenefitsGrid } from "@/components/marketing/Blocks";
import { GridSkeleton, PricingPlans } from "@/components/marketing/DataSections";
import { faqs } from "@/lib/content";

export const metadata = {
  title: "Pricing",
  description: "Membership plans for Flip Baz sellers. Pay monthly, or save with 3, 6 and 12-month plans.",
};

const pricingFaqs = faqs.filter((f) => /membership|pay|ends/i.test(f.q));

export default function PricingPage() {
  return (
    <>
      <Section
        titleAs="h1"
        eyebrow="Pricing"
        title="Choose how long you want to sell with us"
        intro="Every plan unlocks the full catalog, wholesale prices and order fulfilment. Longer plans simply cost less per month."
      >
        <Suspense fallback={<GridSkeleton count={4} tall />}>
          <PricingPlans />
        </Suspense>
        <p className="mt-8 text-center text-sm text-muted">
          Pay by JazzCash, EasyPaisa or bank transfer. Your membership starts the moment we confirm payment.
        </p>
      </Section>
      <Section tone="tint" title="Included with every plan">
        <BenefitsGrid />
      </Section>
      <Section title="Billing questions">
        <FaqList items={pricingFaqs} />
      </Section>
    </>
  );
}
