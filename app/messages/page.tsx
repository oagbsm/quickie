import { redirect } from "next/navigation";
import Link from "next/link";
import ProviderHeader from "@/app/components/marketplace/ProviderHeader";
import { getApprovedMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MessagesIndex() {
  const provider = await getApprovedMarketplaceProvider();
  if (!provider) redirect("/my-jobs");
  const supabase = await createSupabaseServerClient();
  const { data: conversations } = await supabase
    .from("marketplace_conversations")
    .select("id,job_id,marketplace_jobs(service,service_subtype,postcode)")
    .or(`provider_id.eq.${provider.providerId},bidder_user_id.eq.${provider.user.id}`)
    .order("id", { ascending: false });
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><ProviderHeader /><section className="mx-auto max-w-3xl px-5 py-10 sm:px-8"><h1 className="text-4xl font-black">Messages</h1><p className="mt-2 text-[#657089]">Messages with customers about your marketplace work.</p><div className="mt-7 grid gap-3">{conversations?.map((conversation) => { const job = Array.isArray(conversation.marketplace_jobs) ? conversation.marketplace_jobs[0] : conversation.marketplace_jobs; return <Link key={conversation.id} href={`/messages/${conversation.id}`} className="rounded-2xl border border-[#e7ebef] bg-white p-5"><h2 className="font-black capitalize">{(job?.service_subtype || job?.service || "Quickola job").replaceAll("-", " ")}</h2><p className="mt-2 text-sm text-[#657089]">{job?.postcode || "Approximate area"}</p><span className="mt-3 inline-block font-black text-[#167d3c]">Open messages →</span></Link>; })}{!conversations?.length && <p className="rounded-2xl border border-dashed bg-white p-8 text-[#657089]">No customer messages yet.</p>}</div></section></main>;
}
