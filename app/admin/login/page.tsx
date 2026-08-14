import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminLoginForm from "./AdminLoginForm";

export const metadata = { title: "Admin sign in | Quickola" };

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).eq("active", true).maybeSingle();
    if (admin) redirect("/admin");
  }
  return <main className="grid min-h-screen place-items-center bg-[#eef2f5] p-5"><div className="w-full max-w-md"><AdminLoginForm /></div></main>;
}
