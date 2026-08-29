import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import ProviderHeader from "@/app/components/marketplace/ProviderHeader";
import MessageComposer from "@/app/messages/MessageComposer";
import { chooseMarketplaceQuote } from "@/app/jobs/actions";
import { createMarketplaceCheckout } from "@/app/jobs/payment-actions";
import { canProviderOperate, getMarketplaceProvider, requireProviderWorkspaceAccess } from "@/lib/marketplace/provider-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { destinationForAccount, getCurrentAccountContext } from "@/lib/auth/account-role";
import { formatMarketplaceAmount } from "@/lib/marketplace/customer-job-state";

export default async function MessagesPage({ params, searchParams, providerOnly = false }: { params: Promise<{ conversationId: string }>; searchParams: Promise<{ error?: string }>; providerOnly?: boolean }) {
  const { conversationId } = await params;
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const path = providerOnly ? `/work/messages/${conversationId}` : `/messages/${conversationId}`;
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(path)}`);
  const account = await getCurrentAccountContext();
  if (providerOnly && account.role !== "provider") redirect(destinationForAccount(account) || "/");
  if (!providerOnly && account.role !== "customer") redirect(destinationForAccount(account) || "/");
  const admin = createSupabaseAdminClient();
  const [{ data: conversation }, { data: customer }, provider] = await Promise.all([
    admin.from("marketplace_conversations").select("id,job_id,provider_id,bidder_user_id,customer_id").eq("id", conversationId).maybeSingle(),
    admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle(),
    providerOnly ? requireProviderWorkspaceAccess() : getMarketplaceProvider(),
  ]);
  if (!conversation) notFound();
  const isCustomer = !providerOnly && customer?.id === conversation.customer_id;
  const isProvider = Boolean(provider && canProviderOperate(provider) && (conversation.provider_id === provider.providerId || conversation.bidder_user_id === provider.providerId));
  if (!isCustomer && !isProvider) notFound();
  const [{ data: job }, { data: messages }, { data: attachments }, { data: quote }, { data: booking }] = await Promise.all([
    admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode").eq("id", conversation.job_id).maybeSingle(),
    admin.from("marketplace_messages").select("id,sender_id,body,created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
    admin.from("marketplace_message_attachments").select("id,message_id,storage_path,mime_type").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
    admin.from("marketplace_quotes").select("id,amount_pence,status,message,availability_text").eq("job_id", conversation.job_id).or(`provider_id.eq.${conversation.provider_id || conversation.bidder_user_id},bidder_user_id.eq.${conversation.provider_id || conversation.bidder_user_id}`).maybeSingle(),
    admin.from("marketplace_bookings").select("status,payment_status,amount_pence").eq("conversation_id", conversationId).maybeSingle(),
  ]);
  if (!job) notFound();
  const attachmentRows = attachments || [];
  const signed = await Promise.all(attachmentRows.map(async (attachment) => ({ ...attachment, url: (await admin.storage.from("marketplace-message-attachments").createSignedUrl(attachment.storage_path, 3600)).data?.signedUrl || null })));
  const byMessage = new Map<string, typeof signed>();
  for (const attachment of signed) byMessage.set(attachment.message_id, [...(byMessage.get(attachment.message_id) || []), attachment]);
  const title = (job.service_subtype || job.service || "Quickola job").replaceAll("-", " ");
  const isAccepted = quote?.status === "accepted" || quote?.status === "selected";
  const header = isProvider ? <ProviderHeader /> : <MarketplaceHeader />;
  const errorMessage = query.error === "attachment_invalid_type" ? "Choose a JPG, PNG or WebP image." : query.error === "attachment_too_large" ? "Choose an image smaller than 5 MB." : query.error === "attachment_upload_failed" ? "We couldn't upload that photo. Please try again." : query.error === "attachment_db_failed" ? "We couldn't save that photo. Please try again." : query.error === "attachment_empty" ? "Add a message or choose a photo." : query.error === "unauthorized" ? "You cannot access this conversation." : query.error === "send" || query.error === "attachment" ? "Message could not be sent." : null;
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]">{header}<section className="mx-auto max-w-2xl px-5 py-10 sm:px-8"><Link href={isProvider ? "/work/messages" : "/messages"} className="text-sm font-black text-[#167d3c]">← Back to messages</Link><article className="mt-5 rounded-3xl border border-[#e7ebef] bg-white p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[.14em] text-[#159548]">{title}</p><p className="mt-2 text-sm text-[#657089]">{job.postcode}</p>{quote && <section className="mt-6 rounded-2xl bg-[#f5fbf6] p-5"><p className="font-black">Quote context</p><p className="mt-2 text-2xl font-black">{formatMarketplaceAmount(quote.amount_pence)}</p>{quote.message && <p className="mt-2 text-sm">{quote.message}</p>}<p className="mt-2 text-sm font-bold text-[#526078]">{booking?.payment_status === "paid" ? "Booked and paid ✓" : quote.status}</p>{isCustomer && quote.status === "submitted" && <form action={chooseMarketplaceQuote} className="mt-4"><input type="hidden" name="token" value={job.public_token || ""} /><input type="hidden" name="quoteId" value={quote.id} /><input type="hidden" name="returnTo" value={path} /><button className="min-h-11 rounded-xl bg-[#061b3f] px-5 font-black text-white">Accept {formatMarketplaceAmount(quote.amount_pence)}</button></form>}{isCustomer && isAccepted && booking?.payment_status !== "paid" && <form action={createMarketplaceCheckout} className="mt-4"><input type="hidden" name="token" value={job.public_token || ""} /><input type="hidden" name="quoteId" value={quote.id} /><input type="hidden" name="returnTo" value={path} /><button className="min-h-11 rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">Book &amp; pay {formatMarketplaceAmount(quote.amount_pence)}</button></form>}</section>}<section className="mt-7"><h1 className="text-3xl font-black">Conversation</h1><div className="mt-5 grid gap-3">{(messages || []).map((message) => <div key={message.id} className={`max-w-[88%] rounded-2xl p-4 ${message.sender_id === user.id ? "ml-auto bg-[#061b3f] text-white" : "bg-[#eef8f1]"}`}><p className="whitespace-pre-wrap text-sm leading-6">{message.body || ""}</p>{byMessage.get(message.id)?.map((attachment) => attachment.url && <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="mt-3 block"><img src={attachment.url} alt="Conversation attachment" className="max-h-64 max-w-full rounded-xl object-contain" /></a>)}<time className="mt-2 block text-xs opacity-70">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(message.created_at))}</time></div>)}{!(messages || []).length && <p className="text-sm text-[#657089]">No messages yet.</p>}</div><MessageComposer conversationId={conversationId} returnTo={path} />{errorMessage && <p className="mt-3 text-sm font-bold text-red-700">{errorMessage}</p>}</section></article></section></main>;
}
