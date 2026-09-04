import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import MarketplaceMessageBubble from "@/app/components/marketplace/MarketplaceMessageBubble";
import ProviderHeader from "@/app/components/marketplace/ProviderHeader";
import MessageComposer from "@/app/messages/MessageComposer";
import { chooseMarketplaceQuote } from "@/app/jobs/actions";
import { createMarketplaceCheckout } from "@/app/jobs/payment-actions";
import { canProviderOperate, getMarketplaceProvider, requireProviderWorkspaceAccess } from "@/lib/marketplace/provider-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { destinationForAccount, getCurrentAccountContext } from "@/lib/auth/account-role";
import { formatMarketplaceAmount, getCustomerJobLifecycleState } from "@/lib/marketplace/customer-job-state";
import { formatMarketplaceProviderName } from "@/lib/marketplace/presentation";
import { resolveProviderPhotoUrl } from "@/lib/marketplace/provider-photo";
import { isMarketplaceConversationReadOnly } from "@/lib/marketplace/conversations";
import { getMarketplaceJobDisplayTitle } from "@/app/data/marketplace";

type Attachment = { id: string; message_id: string; storage_path: string; url: string | null };

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
  const { error: readError } = await supabase.rpc("mark_marketplace_conversation_read", { target_conversation: conversationId });
  if (readError) console.error("[marketplace-message] read-state update failed", { conversationId, userId: user.id, code: readError.code });

  const conversationProviderId = conversation.provider_id || conversation.bidder_user_id;
  const { data: providerProfile } = isCustomer && conversationProviderId
    ? await admin.from("marketplace_providers").select("user_id,display_name,business_name,profile_photo_url").eq("user_id", conversationProviderId).maybeSingle()
    : { data: null };
  const providerPhoto = isCustomer ? await resolveProviderPhotoUrl(admin, providerProfile?.profile_photo_url) : null;

  const [{ data: job }, { data: messages }, { data: attachments }, { data: quote }, { data: booking }] = await Promise.all([
    admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode").eq("id", conversation.job_id).maybeSingle(),
    admin.from("marketplace_messages").select("id,sender_id,body,created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
    admin.from("marketplace_message_attachments").select("id,message_id,storage_path,mime_type").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
    admin.from("marketplace_quotes").select("id,amount_pence,status,message,availability_text").eq("job_id", conversation.job_id).or(`provider_id.eq.${conversation.provider_id || conversation.bidder_user_id},bidder_user_id.eq.${conversation.provider_id || conversation.bidder_user_id}`).maybeSingle(),
    admin.from("marketplace_bookings").select("status,payment_status,amount_pence,completion_status").eq("conversation_id", conversationId).maybeSingle(),
  ]);
  if (!job) notFound();
  const [{ data: promotedDetails }, { data: promotedPhotos }] = isCustomer ? await Promise.all([
    admin.from("marketplace_job_detail_promotions").select("source_message_id").eq("job_id", job.id),
    admin.from("marketplace_job_photos").select("source_message_attachment_id").eq("job_id", job.id),
  ]) : [{ data: [] }, { data: [] }];
  const promotedMessageIds = (promotedDetails || []).map((item) => item.source_message_id);
  const promotedAttachmentIds = (promotedPhotos || []).map((item) => item.source_message_attachment_id).filter(Boolean);
  const conversationReadOnly = await isMarketplaceConversationReadOnly(admin, conversationId);
  const signed: Attachment[] = await Promise.all((attachments || []).map(async (attachment) => ({ ...attachment, url: (await admin.storage.from("marketplace-message-attachments").createSignedUrl(attachment.storage_path, 3600)).data?.signedUrl || null })));
  const byMessage = new Map<string, Attachment[]>();
  for (const attachment of signed) byMessage.set(attachment.message_id, [...(byMessage.get(attachment.message_id) || []), attachment]);
  const title = getMarketplaceJobDisplayTitle(job.service, job.service_subtype, job.service_subtype || job.service);
  const isAccepted = quote?.status === "accepted" || quote?.status === "selected";
  const bookingState = getCustomerJobLifecycleState({ offerCount: quote ? 1 : 0, acceptedQuote: isAccepted ? quote : null, booking });
  const bookingCompleted = bookingState === "completed";
  const providerName = formatMarketplaceProviderName(providerProfile?.business_name || providerProfile?.display_name);
  const providerProfileHref = conversationProviderId ? `/providers/${conversationProviderId}?job=${conversation.job_id}&offer=${quote?.id || ""}&returnTo=/messages/${conversationId}` : null;
  const header = isProvider ? <ProviderHeader /> : <MarketplaceHeader />;
  const errorMessage = query.error === "attachment_invalid_type" ? "Choose a JPG, PNG or WebP image." : query.error === "attachment_too_large" ? "Choose an image smaller than 5 MB." : query.error === "attachment_upload_failed" ? "We couldn't upload that photo. Please try again." : query.error === "attachment_db_failed" ? "We couldn't save that photo. Please try again." : query.error === "message_db_failed" ? "We couldn't send that message. Please try again." : query.error === "attachment_empty" ? "Add a message or choose a photo." : query.error === "unauthorized" ? "You cannot access this conversation." : query.error === "send" || query.error === "attachment" ? "Message could not be sent." : null;
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]">{header}<section className="mx-auto max-w-2xl px-5 py-10 sm:px-8"><Link href={isProvider ? "/work/messages" : "/messages"} className="text-sm font-black text-[#167d3c]">← Back to messages</Link><article className="mt-5 rounded-3xl border border-[#e7ebef] bg-white p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[.14em] text-[#159548]">{title}</p><p className="mt-2 text-sm text-[#657089]">{job.postcode}</p>{isCustomer && providerProfile && <section className="mt-6 flex items-center gap-4 rounded-2xl border border-[#e7ebef] bg-[#fbfcfd] p-4"><div className="shrink-0">{providerPhoto ? <img src={providerPhoto} alt="" className="h-14 w-14 rounded-full object-cover" /> : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef8f1] text-xl font-black text-[#167d3c]" aria-hidden="true">{providerName.slice(0, 1).toUpperCase()}</span>}</div><div className="min-w-0"><p className="text-xs font-black uppercase tracking-[.12em] text-[#8390a1]">Provider</p><p className="truncate text-lg font-black">{providerName}</p>{providerProfileHref && <Link href={providerProfileHref} className="mt-1 inline-flex font-black text-[#167d3c]">View profile →</Link>}</div></section>}{quote && <section className="mt-6 rounded-2xl bg-[#f5fbf6] p-5"><p className="font-black">{bookingCompleted ? "Booking completed" : "Quote context"}</p><p className="mt-2 text-2xl font-black">{formatMarketplaceAmount(quote.amount_pence)}{bookingCompleted ? " paid" : ""}</p>{quote.message && <p className="mt-2 text-sm">{quote.message}</p>}{!bookingCompleted && <p className="mt-2 text-sm font-bold text-[#526078]">{booking?.payment_status === "paid" ? "Booked and paid ✓" : quote.status}</p>}{!bookingCompleted && isCustomer && quote.status === "submitted" && <form action={chooseMarketplaceQuote} className="mt-4"><input type="hidden" name="token" value={job.public_token || ""} /><input type="hidden" name="quoteId" value={quote.id} /><input type="hidden" name="returnTo" value={path} /><button className="min-h-11 rounded-xl bg-[#061b3f] px-5 font-black text-white">Accept {formatMarketplaceAmount(quote.amount_pence)}</button></form>}{!bookingCompleted && isCustomer && isAccepted && bookingState === "provider_selected_unpaid" && <form action={createMarketplaceCheckout} className="mt-4"><input type="hidden" name="token" value={job.public_token || ""} /><input type="hidden" name="quoteId" value={quote.id} /><input type="hidden" name="returnTo" value={path} /><button className="min-h-11 rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">Book &amp; pay {formatMarketplaceAmount(quote.amount_pence)}</button></form>}</section>}<section className="mt-7"><h1 className="text-3xl font-black">Conversation</h1><div className="mt-5 grid gap-3">{(messages || []).map((message) => <MarketplaceMessageBubble key={message.id} messageId={message.id} canPromote={isCustomer && message.sender_id === user.id} promotedMessage={promotedMessageIds.includes(message.id)} promotedAttachments={promotedAttachmentIds} body={message.body} isMine={message.sender_id === user.id} attachments={byMessage.get(message.id)?.map((attachment) => ({ id: attachment.id, url: attachment.url, fileName: null }))} createdAt={message.created_at} />)}{!(messages || []).length && <p className="text-sm text-[#657089]">No messages yet.</p>}</div><MessageComposer conversationId={conversationId} returnTo={path} readOnly={conversationReadOnly} />{errorMessage && <p className="mt-3 text-sm font-bold text-red-700">{errorMessage}</p>}</section></article></section></main>;
}
