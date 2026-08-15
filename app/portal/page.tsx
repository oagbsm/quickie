import { redirect } from "next/navigation";
import { getApprovedMarketplaceProvider } from "@/lib/marketplace/provider-access";

export default async function PortalPage() {
  if (await getApprovedMarketplaceProvider()) redirect("/work");
  redirect("/my-jobs");
}
