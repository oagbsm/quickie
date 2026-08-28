import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function MessagesPage() {
  await requireAdmin(); const admin = createSupabaseAdminClient();
  const { data } = await admin.from("marketplace_conversations").select("id,job_id,customer_id,provider_id,bidder_user_id,created_at,marketplace_jobs(service,service_subtype,postcode),marketplace_customers(display_name,email)").order("created_at", { ascending: false }).limit(50);
  const conversationIds = (data || []).map((conversation) => conversation.id);
  const { data: messageRows } = conversationIds.length ? await admin.from("marketplace_messages").select("id,conversation_id,body,sender_id,created_at").in("conversation_id", conversationIds).order("created_at", { ascending: false }).limit(250) : { data: [] };
  const latestByConversation = new Map<string, { body: string; created_at: string }>();
  for (const message of messageRows || []) if (!latestByConversation.has(message.conversation_id)) latestByConversation.set(message.conversation_id, message);
  return <div><h1 className="text-3xl font-black">Support</h1><p className="mt-1 text-[#657089]">Read-only marketplace conversation overview.</p><div className="mt-6 grid gap-4">{data?.map((conversation) => { const job = Array.isArray(conversation.marketplace_jobs) ? conversation.marketplace_jobs[0] : conversation.marketplace_jobs; const customer = Array.isArray(conversation.marketplace_customers) ? conversation.marketplace_customers[0] : conversation.marketplace_customers; const latest = latestByConversation.get(conversation.id); return <article key={conversation.id} className="rounded-2xl border bg-white p-5"><h2 className="font-black capitalize">{job?.service_subtype || job?.service || "Marketplace job"}</h2><p className="mt-1 text-sm text-[#657089]">{customer?.display_name || customer?.email || "Customer"} · {job?.postcode || "No postcode"}</p><p className="mt-4 text-sm text-[#526078]">{latest?.body || "No messages yet."}</p><p className="mt-2 text-xs text-[#657089]">Latest message · Started {new Date(conversation.created_at).toLocaleDateString("en-GB")}</p></article>})}{!data?.length && <p className="rounded-2xl border border-dashed bg-white p-8 text-[#657089]">No marketplace conversations yet.</p>}</div></div>;
}
