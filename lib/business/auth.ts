import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireBusinessUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/business/sign-in");

  const { data: membership } = await supabase
    .from("business_members")
    .select("account_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/business/onboarding");
  return { supabase, user, accountId: membership.account_id as string, role: membership.role as string };
}
