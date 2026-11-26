import { Suspense } from "react";
import { PasswordForm, ProfileForm } from "./ProfileForms";
import { DashboardBanner } from "@/components/dashboard/MembershipBanner";
import { requireSeller } from "@/lib/auth/dal";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";

export const metadata = { title: "Profile" };

async function Profile() {
  const seller = await requireSeller("/dashboard/profile");
  await connectDB();
  const extra = await User.findById(seller.id).select("storeName sellingPlatforms").lean();
  const user = { ...seller, storeName: extra?.storeName ?? "", sellingPlatforms: extra?.sellingPlatforms ?? [] };
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ProfileForm
        user={{ name: user.name, email: user.email, phone: user.phone, whatsapp: user.whatsapp, city: user.city, storeName: user.storeName, sellingPlatforms: user.sellingPlatforms }}
      />
      <PasswordForm />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <>
      <DashboardBanner />
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Profile</h1>
      <p className="mt-1 mb-6 text-muted">How we reach you about your orders.</p>
      <Suspense fallback={<div className="h-80 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />}>
        <Profile />
      </Suspense>
    </>
  );
}
