import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { destinationForAccount, getCurrentAccountContext } from "@/lib/auth/account-role";

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login?next=%2Fadmin");
  const { data: admin } = await supabase.from("admin_users").select("role,active").eq("user_id", user.id).eq("active", true).maybeSingle();
  if (!admin) redirect(destinationForAccount(await getCurrentAccountContext()) || "/");
  return { supabase, user, role: admin.role as "admin" | "operator" };
}
