import { redirect } from "next/navigation";
import { getCurrentAccountContext, destinationForAccount } from "@/lib/auth/account-role";

export default async function PortalPage() {
  const destination = destinationForAccount(await getCurrentAccountContext());
  redirect(destination || "/my-jobs");
}
