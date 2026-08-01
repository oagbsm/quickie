import "server-only";

import { redirect } from "next/navigation";
import { requirePortal } from "@/lib/portal-session";

export async function requireBusinessUser() {
  const session = await requirePortal("business");
  if (!session.user || !session.business)
    redirect("/auth/portal?error=resolution");
  return {
    supabase: session.supabase,
    user: session.user,
    accountId: session.business.account_id,
    role: session.business.role,
  };
}
