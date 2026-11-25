import Section from "@/components/marketing/Section";
import { AudienceGrid, ComparisonTable, ContactBlock, StepsList } from "@/components/marketing/Blocks";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "How it works",
  description: "Join, list our products on your store, send us your orders, and we make and deliver them to your customers.",
};

const orderJourney = [
  { status: "Awaiting payment", body: "You place the order and upload proof of payment for the item and shipping." },
  { status: "Confirmed", body: "We verify your payment and queue the order with the workshop." },
  { status: "In production", body: "Skilled craftspeople in Sialkot cut, stitch and finish the item." },
  { status: "Quality checked", body: "We inspect stitching, sizing and finish before anything leaves." },
  { status: "Shipped", body: "The parcel goes to your customer by courier. You get the tracking number." },
  { status: "Delivered", body: "Your customer receives it. You keep the profit and the happy review." },
];

export default function HowItWorksPage() {
  return (
    <>
      <Section
        titleAs="h1"
        eyebrow="How it works"
        title="You sell. We make, check and ship."
        intro="Flip Baz connects your online store to Sialkot's workshops, so you can offer quality products without investing in stock."
      >
        <StepsList />
      </Section>

      <Section tone="tint" eyebrow="After you place an order" title="Every order, step by step" intro="Follow each stage live from your dashboard.">
        <ol className="mx-auto max-w-3xl space-y-4">
          {orderJourney.map((s, i) => (
            <li key={s.status} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-100 text-sm font-bold text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold">{s.status}</h3>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="Who it's for" title="Made for every kind of online seller">
        <AudienceGrid />
      </Section>

      <Section tone="tint" title="Doing it yourself vs. with Flip Baz">
        <ComparisonTable />
        <div className="mt-10 text-center">
          <Button href="/pricing" variant="accent" size="lg">
            Pick a plan and start
          </Button>
        </div>
      </Section>

      <Section>
        <ContactBlock />
      </Section>
    </>
  );
}
