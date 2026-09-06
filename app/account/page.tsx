import Link from "next/link";
import { redirect } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import MobileBottomNav from "@/app/components/marketplace/MobileBottomNav";
import { customerSignOut } from "@/app/components/marketplace/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { destinationForAccount, getCurrentAccountContext } from "@/lib/auth/account-role";

export default async function CustomerAccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/account");
  const account = await getCurrentAccountContext();
  if (account.role !== "customer") redirect(destinationForAccount(account) || "/");
  const admin = createSupabaseAdminClient();
  const { data: customer } = await admin.from("marketplace_customers").select("display_name,email,mobile").eq("auth_user_id", user.id).maybeSingle();
  if (!customer) redirect("/sign-in?next=/account");
  const name = customer.display_name || user.user_metadata?.full_name || user.user_metadata?.name;
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><MarketplaceHeader /><section className="mx-auto max-w-2xl px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:pb-12 sm:pt-10"><p className="text-sm font-black uppercase tracking-[.14em] text-[#159548]">YOUR QUICKOLA ACCOUNT</p><h1 className="mt-2 text-[clamp(2rem,7vw,3rem)] font-black tracking-[-.06em]">Account</h1><section className="mt-6 rounded-3xl border border-[#e7ebef] bg-white p-5 sm:p-7"><div className="flex items-center gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#061b3f] text-xl font-black text-white">{(name || user.email || "Q").slice(0, 1).toUpperCase()}</span><div className="min-w-0"><h2 className="text-xl font-black">{name || "Your account"}</h2><p className="mt-1 truncate text-sm text-[#526078]">{customer.email || user.email}</p>{customer.mobile && <p className="mt-1 text-sm text-[#526078]">{customer.mobile}</p>}</div></div></section><section className="mt-4 rounded-3xl border border-[#e7ebef] bg-white p-5 sm:p-7"><h2 className="text-xl font-black">Your Quickola</h2><div className="mt-4 grid gap-2"><Link href="/my-jobs" className="flex min-h-12 items-center justify-between rounded-xl bg-[#f7f8fa] px-4 font-black">My jobs <span aria-hidden="true">→</span></Link><Link href="/messages" className="flex min-h-12 items-center justify-between rounded-xl bg-[#f7f8fa] px-4 font-black">Messages <span aria-hidden="true">→</span></Link><Link href="/#job-composer" className="flex min-h-12 items-center justify-between rounded-xl bg-[#eef8f1] px-4 font-black text-[#167d3c]">Post a job <span aria-hidden="true">→</span></Link></div></section><section className="mt-4 rounded-3xl border border-[#e7ebef] bg-white p-5 sm:p-7"><h2 className="text-xl font-black">Support</h2><div className="mt-4 grid gap-3 text-sm font-black text-[#167d3c]"><Link href="/help">Help →</Link><Link href="/terms">Terms →</Link><Link href="/privacy-policy">Privacy →</Link></div></section><form action={customerSignOut} className="mt-5"><button className="min-h-12 w-full rounded-xl border border-[#d8dee7] bg-white px-4 font-black text-[#061b3f]">Sign out</button></form></section><div className="md:hidden"><MobileBottomNav active="account" /></div></main>;
}
