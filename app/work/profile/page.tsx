import { redirect } from "next/navigation";
import { getMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { destinationForAccount, getCurrentAccountContext } from "@/lib/auth/account-role";

export default async function ProviderProfilePage() {
  const account = await getCurrentAccountContext();
  if (account.role !== "provider") redirect(destinationForAccount(account) || "/");
  const provider = await getMarketplaceProvider();
  if (!provider) redirect("/pro/login");
  if (["pending_review", "suspended"].includes(provider.providerStatus)) redirect("/work");
  redirect("/work/onboarding?edit=1");
}
