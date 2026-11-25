import LegalPage from "@/components/marketing/LegalPage";

export const metadata = { title: "Refund policy" };

const sections = [
  { heading: "Membership fees", body: ["Membership fees are non-refundable once your membership has been activated. If a payment is rejected or can't be verified, we'll tell you why and return any amount we received."] },
  { heading: "Order cancellations", body: ["You can cancel an order free of charge until it enters production. Once production has started, made-to-order items can't be cancelled."] },
  { heading: "Faulty or wrong items", body: ["If your customer receives a faulty or incorrect item, tell us within 3 days of delivery with clear photos. Once confirmed, we'll repair or replace it, or refund the item price, at our cost."] },
  { heading: "Size exchanges", body: ["Size exchanges are possible for unused items in original condition. The customer or seller pays the return and re-delivery shipping."] },
  { heading: "How refunds are paid", body: ["Approved refunds are sent to the JazzCash, EasyPaisa or bank account you choose, usually within 7 working days."] },
];

export default function RefundPolicyPage() {
  return <LegalPage title="Refund policy" updated="25 November 2026" sections={sections} />;
}
