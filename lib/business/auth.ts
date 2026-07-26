import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveBusinessWorkspace } from "@/lib/business/workspace";

export async function requireBusinessUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/business/sign-in");

  const workspace = await resolveBusinessWorkspace();
  if (!workspace.ok && workspace.reason === "suspended")
    redirect("/business/suspended");
  if (!workspace.ok)
    redirect(
      `/business/setup-error?ref=${encodeURIComponent(workspace.reference)}`,
    );
  return {
    supabase,
    user,
    accountId: workspace.accountId,
    role: workspace.role,
  };
}
