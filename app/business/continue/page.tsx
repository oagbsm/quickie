import { redirect } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";

export default async function Page() {
  const { supabase, accountId } = await requireBusinessUser();
  const [{ count }, { data: terms }] = await Promise.all([
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
  ]);
  if ((count || 0) > 0 && terms) redirect("/business/dashboard");
  redirect("/business/onboarding");
}
