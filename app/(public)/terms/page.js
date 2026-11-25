import LegalPage from "@/components/marketing/LegalPage";

export const metadata = { title: "Terms of service" };

const sections = [
  { heading: "About these terms", body: ["These terms apply when you use the Flip Baz website and services. By creating an account you agree to them. If you don't agree, please don't use the service."] },
  { heading: "Your account", body: ["You must give accurate details and keep your password private. You're responsible for activity on your account. Tell us straight away if you think someone else has accessed it."] },
  { heading: "Membership", body: ["Membership gives access to member prices, listing materials and order fulfilment for the period you paid for. It starts when we confirm your payment and ends on the date shown in your dashboard. Membership fees are not refundable once access has been granted, except where the law requires."] },
  { heading: "Orders and payment", body: ["You place orders on behalf of your own customers and pay us the member price plus shipping. We start work only after confirming payment. You set your own selling price and are responsible for your dealings with your customers, including any marketplace rules."] },
  { heading: "Listing materials", body: ["Product photos and descriptions are provided for you to list our products while your membership is active. Please don't use them for products you don't source from Flip Baz."] },
  { heading: "Our responsibility", body: ["We make products with care and inspect them before dispatch. Delivery times are estimates. To the extent the law allows, our liability for any order is limited to the amount you paid for it."] },
  { heading: "Changes and contact", body: ["We may update these terms and will show the new date at the top. Questions? Contact us through the contact page or WhatsApp."] },
];

export default function TermsPage() {
  return <LegalPage title="Terms of service" updated="25 November 2026" sections={sections} />;
}
