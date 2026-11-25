import ContactForm from "./ContactForm";
import Icon from "@/components/marketing/Icon";
import { buttonClass } from "@/components/ui/Button";
import { siteConfig, whatsappDisplay, whatsappLink } from "@/lib/config";

export const metadata = {
  title: "Contact us",
  description: "Get in touch with the Flip Baz team by WhatsApp or the contact form.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:py-16">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Talk to us</h1>
        <p className="mt-3 text-muted">
          Questions about membership, a product, or an order? Our team is in Sialkot, working Monday to
          Saturday, 10am–7pm.
        </p>
        <a
          href={whatsappLink("Hi Flip Baz! I have a question.")}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass({ variant: "accent", size: "lg", className: "mt-8 w-full sm:w-auto" })}
        >
          <Icon name="whatsapp" className="h-5 w-5" />
          Chat on WhatsApp
        </a>
        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="font-semibold">WhatsApp</dt>
            <dd className="text-muted">{whatsappDisplay()}</dd>
          </div>
          <div>
            <dt className="font-semibold">Email</dt>
            <dd>
              <a href={`mailto:${siteConfig.supportEmail}`} className="text-brand-700 underline dark:text-brand-400">
                {siteConfig.supportEmail}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Workshop</dt>
            <dd className="text-muted">{siteConfig.city}</dd>
          </div>
        </dl>
      </div>
      <div className="relative rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-sm sm:p-8">
        <h2 className="mb-6 text-xl font-bold">Send a message</h2>
        <ContactForm />
      </div>
    </div>
  );
}
