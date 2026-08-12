import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendMarketplaceMessage } from "@/app/messages/actions";

export default async function MessagesPage({ params, searchParams }: { params: Promise<{ conversationId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { conversationId } = await params; const query = await searchParams; const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/messages/${conversationId}`)}`);
  const { data: conversation } = await supabase.from("marketplace_conversations").select("id,job_id,provider_id,customer_id,marketplace_jobs(public_token,service_subtype,postcode)").eq("id", conversationId).maybeSingle();
  if (!conversation) notFound();
  const { data: messages } = await supabase.from("marketplace_messages").select("id,sender_id,body,created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true });
  const job = conversation.marketplace_jobs as { public_token?: string; service_subtype?: string; postcode?: string } | null;
  return <main className="mx-auto max-w-2xl px-5 py-10"><Link href={job?.public_token ? `/jobs/${job.public_token}` : "/my-jobs"} className="text-sm font-bold text-[#167d3c]">← Back to job</Link><h1 className="mt-5 text-3xl font-black text-[#061b3f]">Messages</h1><p className="mt-2 text-sm text-[#657089]">{job?.service_subtype?.replaceAll("-", " ") || "Quickola job"} · {job?.postcode || "Approximate area"}</p><div className="mt-6 grid gap-3 rounded-3xl bg-white p-5 shadow-sm">{messages?.length ? messages.map((message) => <div key={message.id} className={`max-w-[85%] rounded-2xl p-4 text-sm leading-6 ${message.sender_id === user.id ? "ml-auto bg-[#061b3f] text-white" : "bg-[#eef8f1] text-[#061b3f]"}`}>{message.body}</div>) : <p className="py-8 text-center text-sm text-[#657089]">Messaging is open for this selected professional.</p>}</div><form action={sendMarketplaceMessage} className="relative mt-4 flex gap-2"><input type="hidden" name="conversationId" value={conversationId} /><input type="hidden" name="jobToken" value={job?.public_token || ""} /><input name="body" required maxLength={4000} placeholder="Write a message…" className="min-h-12 flex-1 rounded-xl border border-[#dbe1ea] px-4" /><button className="min-h-12 rounded-xl bg-[#23dc63] px-5 font-black text-[#061b3f]">Send</button>{query.error && <p className="absolute left-0 top-14 text-sm font-bold text-red-700">Message could not be sent.</p>}</form></main>;
}
