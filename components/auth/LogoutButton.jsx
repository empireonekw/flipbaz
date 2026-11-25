import { logoutAction } from "@/app/(auth)/actions";
import SubmitButton from "@/components/ui/SubmitButton";

/**
 * Logout as a tiny form so it works without client JavaScript.
 * @param {{ className?: string, variant?: string, size?: string }} props
 */
export default function LogoutButton({ className = "", variant = "outline", size = "sm" }) {
  return (
    <form action={logoutAction}>
      <SubmitButton variant={variant} size={size} className={className} pendingText="Logging out…">
        Log out
      </SubmitButton>
    </form>
  );
}
