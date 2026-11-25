import Link from "next/link";
import Section from "@/components/marketing/Section";
import FaqList from "@/components/marketing/FaqList";
import { ContactBlock } from "@/components/marketing/Blocks";
import { faqs } from "@/lib/content";

export const metadata = {
  title: "Help & FAQ",
  description: "Answers about Flip Baz membership, payments, orders, delivery and returns.",
};

export default function HelpPage() {
  return (
    <>
      <Section
        titleAs="h1"
        eyebrow="Help centre"
        title="Frequently asked questions"
        intro="Can't find what you need? Message us on WhatsApp. A real person will reply."
      >
        <FaqList items={faqs} />
        <p className="mt-8 text-center text-sm text-muted">
          Looking for policies? Read our{" "}
          <Link href="/refund-policy" className="font-semibold text-brand-700 underline dark:text-brand-400">refund policy</Link>,{" "}
          <Link href="/terms" className="font-semibold text-brand-700 underline dark:text-brand-400">terms</Link> and{" "}
          <Link href="/privacy" className="font-semibold text-brand-700 underline dark:text-brand-400">privacy policy</Link>.
        </p>
      </Section>
      <Section>
        <ContactBlock />
      </Section>
    </>
  );
}
