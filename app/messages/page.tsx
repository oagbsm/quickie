import Link from "next/link";
import { redirect } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import MobileBottomNav from "@/app/components/marketplace/MobileBottomNav";
import ProviderHeader from "@/app/components/marketplace/ProviderHeader";
import { canProviderOperate, requireProviderWorkspaceAccess } from "@/lib/marketplace/provider-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { destinationForAccount, getCurrentAccountContext } from "@/lib/auth/account-role";
import CustomerMessagesList from "./CustomerMessagesList";

export default async function MessagesIndex({ providerOnly = false }: { providerOnly?: boolean }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(providerOnly ? "/work/messages" : "/messages")}`);
  const account = await getCurrentAccountContext();
  if (account.role === "admin") redirect("/admin");
  if (!providerOnly && account.role === "provider") redirect(destinationForAccount(account) || "/work");

  const admin = createSupabaseAdminClient();
  const { data: customer } = await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  const provider = providerOnly ? await requireProviderWorkspaceAccess() : null;
  if (!providerOnly && provider?.providerStatus === "pending_review") redirect("/work");
  const isCustomer = !providerOnly && Boolean(customer);
  const isProvider = Boolean(provider && (providerOnly || canProviderOperate(provider)));

  let conversations: Array<{
    id: string;
    job_id: string;
    provider_id: string | null;
    bidder_user_id: string | null;
    customer_id: string;
    created_at: string;
  }> = [];
  if (isCustomer) {
    const result = await admin
      .from("marketplace_conversations")
      .select("id,job_id,provider_id,bidder_user_id,customer_id,created_at")
      .eq("customer_id", customer!.id)
      .order("created_at", { ascending: false });
    conversations = result.data || [];
  } else if (isProvider) {
    const result = await admin
      .from("marketplace_conversations")
      .select("id,job_id,provider_id,bidder_user_id,customer_id,created_at")
      .or(`provider_id.eq.${provider!.providerId},bidder_user_id.eq.${provider!.providerId}`)
      .order("created_at", { ascending: false });
    conversations = result.data || [];
  }

  const jobIds = conversations.map((conversation) => conversation.job_id);
  const providerIds = conversations.map((conversation) => conversation.provider_id || conversation.bidder_user_id).filter(Boolean);
  const [{ data: jobs }, { data: profiles }, { data: quotes }, { data: messages }, { data: bookings }] = await Promise.all([
    jobIds.length ? admin.from("marketplace_jobs").select("id,service,service_subtype,postcode").in("id", jobIds) : Promise.resolve({ data: [] }),
    providerIds.length ? admin.from("cleaner_profiles").select("user_id,display_name,business_name,profile_photo_url").in("user_id", providerIds) : Promise.resolve({ data: [] }),
    jobIds.length ? admin.from("marketplace_quotes").select("job_id,provider_id,bidder_user_id,amount_pence,status").in("job_id", jobIds).in("status", ["pending", "submitted", "selected", "accepted"]) : Promise.resolve({ data: [] }),
    conversations.length ? admin.from("marketplace_messages").select("conversation_id,body,created_at,sender_id").in("conversation_id", conversations.map((conversation) => conversation.id)).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    conversations.length ? admin.from("marketplace_bookings").select("conversation_id,payment_status,status").in("conversation_id", conversations.map((conversation) => conversation.id)) : Promise.resolve({ data: [] }),
  ]);
  const jobRows = (jobs || []) as Array<{ id: string; service?: string; service_subtype?: string; postcode?: string }>;
  const profileRows = (profiles || []) as Array<{ user_id: string; display_name?: string; business_name?: string; profile_photo_url?: string | null }>;
  const messageRows = (messages || []) as Array<{ conversation_id: string; body: string; created_at: string; sender_id: string }>;
  const jobsById = new Map(jobRows.map((job) => [job.id, job]));
  const profilesById = new Map(profileRows.map((profile) => [profile.user_id, profile]));
  const latestMessageByConversation = new Map<string, (typeof messageRows)[number]>();
  for (const message of messageRows) if (!latestMessageByConversation.has(message.conversation_id)) latestMessageByConversation.set(message.conversation_id, message);
  const bookingByConversation = new Map((bookings || []).map((booking) => [booking.conversation_id, booking]));

  if (isCustomer) return <CustomerMessagesList conversations={conversations} jobs={jobRows} profiles={profileRows} quotes={(quotes || []) as Array<{ job_id: string; provider_id?: string | null; bidder_user_id?: string | null; amount_pence: number; status: string }>} messages={messageRows} bookings={(bookings || []) as Array<{ conversation_id: string; payment_status?: string | null }>} />;

  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]">{isProvider && !isCustomer ? <ProviderHeader /> : <MarketplaceHeader />}<section className="mx-auto max-w-3xl px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] py-10 sm:px-8 md:pb-10"><p className="text-sm font-black uppercase tracking-[.14em] text-[#159548]">MESSAGES</p><h1 className="mt-2 text-4xl font-black">Messages</h1><p className="mt-2 text-[#657089]">{isCustomer ? "Conversations about your Quickola jobs." : "Messages with customers about their marketplace work."}</p><div className="mt-7 grid gap-3">{conversations.map((conversation) => { const job = jobsById.get(conversation.job_id); const providerId = conversation.provider_id || conversation.bidder_user_id; const profile = providerId ? profilesById.get(providerId) : undefined; const quote = (quotes || []).find((item) => item.job_id === conversation.job_id && (item.provider_id || item.bidder_user_id) === providerId); const booking = bookingByConversation.get(conversation.id); const booked = booking?.payment_status === "paid"; const latest = latestMessageByConversation.get(conversation.id); const title = (job?.service_subtype || job?.service || "Quickola job").replaceAll("-", " "); return <Link key={conversation.id} href={isProvider ? `/work/messages/${conversation.id}` : `/messages/${conversation.id}`} className="rounded-2xl border border-[#e7ebef] bg-white p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-black capitalize">{title}</h2><p className="mt-2 text-sm text-[#657089]">{isCustomer ? profile?.business_name || profile?.display_name || "Local person" : job?.postcode || "Approximate area"}</p></div><div className="text-right">{quote && <span className="font-black">£{Math.round(quote.amount_pence / 100)}</span>}{booked && <span className="mt-2 block text-xs font-black text-[#167d3c]">Booked ✓</span>}</div></div><p className="mt-3 line-clamp-2 text-sm text-[#526078]">{latest?.body || (quote ? "Discussing your job" : "No messages yet")}</p><span className="mt-3 inline-block font-black text-[#167d3c]">Open conversation →</span></Link>; })}{!conversations.length && <p className="rounded-2xl border border-dashed bg-white p-8 text-[#657089]">{isCustomer || !isProvider ? "No messages yet. When someone contacts you, you’ll see it here." : "No customer messages yet."}</p>}</div></section><div className="md:hidden"><MobileBottomNav active="messages" /></div></main>;
}
