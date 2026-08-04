import { redirect } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";

export default async function Page() {
  const { supabase, accountId } = await requireBusinessUser();
  const [{ count }, { data: terms }, { data: account, error: accountError }] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("account_id", accountId),
    supabase
      .from("terms_acceptances")
      .select("id")
      .eq("account_id", accountId)
      .eq("terms_version", "business-pilot-2026-07-22")
      .maybeSingle(),
    supabase
      .from("business_accounts")
      .select("onboarding_step,onboarding_completed_at")
      .eq("id", accountId)
      .maybeSingle(),
  ]);
  if (accountError) throw new Error(`onboarding_state_query_failed:${accountError.code}`);
  if (account?.onboarding_step === "complete" || account?.onboarding_completed_at) {
    redirect((count || 0) === 0 ? "/business/properties/new?first=1" : "/business/dashboard");
  }
  if ((count || 0) > 0 && terms) redirect("/business/dashboard");
  redirect("/business/onboarding");
}
