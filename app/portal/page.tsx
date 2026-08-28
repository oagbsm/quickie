import { redirect } from "next/navigation";
import { getMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { getCurrentAccountRole } from "@/lib/auth/account-role";

export default async function PortalPage() {
  const role = await getCurrentAccountRole();
  if (role === "admin") redirect("/admin");
  if (role === "provider") { const status = (await getMarketplaceProvider())?.providerStatus; redirect(status === "approved" || status === "pending_review" ? "/work" : status === "suspended" ? "/work" : "/work/onboarding"); }
  redirect("/my-jobs");
}
