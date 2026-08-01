import "server-only";

import { redirect } from "next/navigation";
import { requirePortal } from "@/lib/portal-session";

export async function requireCleanerUser() {
  const session = await requirePortal("cleaner");
  if (!session.user || !session.cleaner)
    redirect("/auth/portal?error=resolution");
  return {
    supabase: session.supabase,
    user: session.user,
    accountId: session.cleaner.account_id,
    workerId: session.cleaner.id,
    displayName: session.cleaner.display_name,
  };
}
