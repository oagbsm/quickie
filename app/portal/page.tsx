import { redirect } from "next/navigation";
import { getMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { getCurrentAccountRole } from "@/lib/auth/account-role";

export default async function PortalPage() {
  const role = await getCurrentAccountRole();
  if (role === "admin") redirect("/admin");
  if (role === "provider") redirect((await getMarketplaceProvider())?.providerStatus === "approved" ? "/work" : "/work/onboarding");
  redirect("/my-jobs");
}
