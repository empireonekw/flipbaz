import LegalPage from "@/components/marketing/LegalPage";

export const metadata = { title: "Privacy policy" };

const sections = [
  { heading: "What we collect", body: ["Your name, email, phone/WhatsApp number and city when you sign up; payment references and screenshots you upload; and the delivery details of your customers when you place an order."] },
  { heading: "How we use it", body: ["To run your account, verify payments, make and deliver orders, and contact you about them. We use your customers' details only to deliver their parcels."] },
  { heading: "Who we share it with", body: ["Courier companies receive the name, phone and address needed for delivery. We don't sell personal data, and we don't share it for advertising."] },
  { heading: "How we protect it", body: ["Passwords are stored as one-way hashes. Sessions use secure, http-only cookies. Payment screenshots are visible only to you and our admin team."] },
  { heading: "How long we keep it", body: ["We keep account and order records while your account is open and for as long as tax and accounting rules require afterwards."] },
  { heading: "Your choices", body: ["You can update your profile from your dashboard, or ask us to correct or delete your data by contacting support."] },
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy policy" updated="25 November 2026" sections={sections} />;
}
