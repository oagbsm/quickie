import { redirect } from "next/navigation";
import { getMarketplaceProvider } from "@/lib/marketplace/provider-access";

export default async function ProviderProfilePage() {
  const provider = await getMarketplaceProvider();
  if (!provider) redirect("/pro/login");
  if (provider.providerStatus === "pending_review") redirect("/work");
  redirect("/work/onboarding?edit=1");
}
