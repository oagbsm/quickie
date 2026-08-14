import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { acceptProviderInvitation } from "@/lib/server/provider-invitations";

export default async function AcceptProviderInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!token || !user) redirect(token ? `/provider/invite/${encodeURIComponent(token)}` : "/pro/login");
  const result = await acceptProviderInvitation(token, user);
  if (result.ok) redirect("/work");
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fa] p-5"><section className="max-w-md rounded-3xl bg-white p-7"><h1 className="text-2xl font-black">Invitation unavailable</h1><p className="mt-3 text-[#657089]">This invitation is {result.error === "email_mismatch" ? "for a different email address" : result.error}.</p><Link href="/my-jobs" className="mt-5 inline-block font-black text-[#167d3c]">Go to My Jobs</Link></section></main>;
}
