import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveBusinessWorkspace } from "@/lib/business/workspace";

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/business/sign-in");
  const workspace = await resolveBusinessWorkspace();
  if (!workspace.ok && workspace.reason === "cleaner_account")
    redirect("/cleaner/today");
  if (!workspace.ok)
    redirect(
      `/business/setup-error?ref=${encodeURIComponent(workspace.reference)}`,
    );
  const [{ count }, { data: terms }] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("account_id", workspace.accountId),
    supabase
      .from("terms_acceptances")
      .select("id")
      .eq("account_id", workspace.accountId)
      .eq("terms_version", "business-pilot-2026-07-22")
      .maybeSingle(),
  ]);
  if ((count || 0) > 0 && terms) redirect("/business/dashboard");
  redirect("/business/onboarding");
}
