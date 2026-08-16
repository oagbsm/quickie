import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import ProviderHeader from "@/app/components/marketplace/ProviderHeader";
import { chooseMarketplaceQuote } from "@/app/jobs/actions";
import { sendMarketplaceMessage } from "@/app/messages/actions";
import { getApprovedMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MessagesPage({ params, searchParams }: { params: Promise<{ conversationId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { conversationId } = await params;
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/messages/${conversationId}`)}`);

  const admin = createSupabaseAdminClient();
  const [{ data: conversation }, { data: customer }, provider] = await Promise.all([
    admin.from("marketplace_conversations").select("id,job_id,provider_id,bidder_user_id,customer_id").eq("id", conversationId).maybeSingle(),
    admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle(),
    getApprovedMarketplaceProvider(),
  ]);
  if (!conversation) notFound();
  const isCustomer = customer?.id === conversation.customer_id;
  const isProvider = Boolean(provider && (conversation.provider_id === provider.providerId || conversation.bidder_user_id === provider.providerId));
  if (!isCustomer && !isProvider) notFound();

  const [{ data: job }, { data: messages }, { data: quotes }, { data: profile }] = await Promise.all([
    admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode,status").eq("id", conversation.job_id).maybeSingle(),
    admin.from("marketplace_messages").select("id,sender_id,body,created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
    admin.from("marketplace_quotes").select("id,amount_pence,status,availability_text,message,provider_id,bidder_user_id").eq("job_id", conversation.job_id),
    admin.from("cleaner_profiles").select("display_name,business_name").eq("user_id", conversation.provider_id || conversation.bidder_user_id).maybeSingle(),
  ]);
  if (!job) notFound();
  const providerId = conversation.provider_id || conversation.bidder_user_id;
  const quote = (quotes || []).find((item) => (item.provider_id || item.bidder_user_id) === providerId);
  const title = (job.service_subtype || job.service || "Quickola job").replaceAll("-", " ");
  const location = isCustomer ? job.postcode : String(job.postcode || "").trim().split(/\s+/)[0] || "Approximate area";
  const offerState = quote?.status === "accepted" || quote?.status === "selected" ? "booked" : quote?.status === "declined" || quote?.status === "expired" ? "declined" : quote?.status === "withdrawn" ? "withdrawn" : "pending";
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]">{isProvider && !isCustomer ? <ProviderHeader /> : <MarketplaceHeader />}<section className="mx-auto max-w-2xl px-5 py-10"><Link href={isCustomer && job.public_token ? `/jobs/${job.public_token}` : "/work"} className="text-sm font-bold text-[#167d3c]">← Back to job</Link><div className="mt-5 rounded-3xl border border-[#e7ebef] bg-white p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[.14em] text-[#159548]">{title}</p><p className="mt-2 text-sm text-[#657089]">{location}</p><div className="mt-5"><h1 className="text-3xl font-black">Messages</h1><p className="mt-2 text-[#657089]">{profile?.business_name || profile?.display_name || "Local person"} · Provider</p></div><section className="mt-6 rounded-2xl border border-[#dce7df] bg-[#f5fbf6] p-5"><p className="text-xs font-black uppercase tracking-[.14em] text-[#167d3c]">{isCustomer ? "Offer from" : "Your offer"} {profile?.business_name || profile?.display_name || "local person"}</p>{quote ? <><p className="mt-3 text-3xl font-black">£{Math.round(quote.amount_pence / 100)}</p><p className="mt-2 text-sm text-[#526078]">{quote.availability_text || "Flexible timing"}</p>{quote.message && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#39465b]">{quote.message}</p>}{offerState === "booked" ? <p className="mt-4 rounded-xl bg-[#dff4e4] p-3 font-black text-[#167d3c]">✓ {isCustomer ? `Booked · £${Math.round(quote.amount_pence / 100)} agreed` : `Your offer was accepted · £${Math.round(quote.amount_pence / 100)} agreed`}</p> : offerState === "declined" ? <p className="mt-4 font-bold text-[#657089]">Offer not selected</p> : offerState === "withdrawn" ? <p className="mt-4 font-bold text-[#657089]">Offer withdrawn</p> : isCustomer ? <form action={chooseMarketplaceQuote} className="mt-4"><input type="hidden" name="token" value={job.public_token || ""} /><input type="hidden" name="quoteId" value={quote.id} /><input type="hidden" name="returnTo" value={`/messages/${conversationId}`} /><button className="min-h-11 rounded-xl bg-[#061b3f] px-5 font-black text-white">Accept £{Math.round(quote.amount_pence / 100)}</button></form> : <p className="mt-4 font-bold text-[#657089]">Pending</p>}</> : <p className="mt-3 text-sm text-[#657089]">No offer yet. Messages are open.</p>}</section><section className="mt-7 border-t border-[#e9edf1] pt-6"><h2 className="text-xl font-black">Messages</h2><div className="mt-4 grid gap-3">{messages?.length ? messages.map((message) => <div key={message.id} className={`max-w-[88%] rounded-2xl p-4 text-sm leading-6 ${message.sender_id === user.id ? "ml-auto bg-[#061b3f] text-white" : "bg-[#eef8f1]"}`}><p>{message.body}</p><time className="mt-2 block text-xs opacity-70">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(message.created_at))}</time></div>) : <p className="text-sm text-[#657089]">No messages yet.</p>}</div><form action={sendMarketplaceMessage} className="mt-4 flex gap-2"><input type="hidden" name="conversationId" value={conversationId} /><input type="hidden" name="returnTo" value={`/messages/${conversationId}`} /><input name="body" required maxLength={4000} placeholder="Write a message…" className="min-h-12 flex-1 rounded-xl border border-[#dbe1ea] px-4" /><button className="min-h-12 rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">Send</button></form>{query.error && <p className="mt-3 text-sm font-bold text-red-700">Message could not be sent.</p>}</section></div></section></main>;
}
