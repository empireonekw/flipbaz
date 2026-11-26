import ChatWidget from "./ChatWidget";
import { getCurrentUser } from "@/lib/auth/dal";

/**
 * Renders the support chat bubble for signed-in sellers only. Reads the
 * session, so the layout wraps it in <Suspense>.
 */
export default async function ChatWidgetLoader() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SELLER") return null;
  return <ChatWidget firstName={user.name.split(" ")[0]} />;
}
