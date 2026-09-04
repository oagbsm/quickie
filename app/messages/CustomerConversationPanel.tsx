import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import MarketplaceMessageBubble from "@/app/components/marketplace/MarketplaceMessageBubble";
import MessageComposer from "@/app/messages/MessageComposer";
import { chooseMarketplaceQuote } from "@/app/jobs/actions";
import { createMarketplaceCheckout } from "@/app/jobs/payment-actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMarketplaceAmount, getCustomerJobLifecycleState } from "@/lib/marketplace/customer-job-state";
import { resolveProviderPhotoUrl } from "@/lib/marketplace/provider-photo";
import { isMarketplaceConversationReadOnly } from "@/lib/marketplace/conversations";
import { getMarketplaceJobDisplayTitle } from "@/app/data/marketplace";

export default async function CustomerConversationPanel({ conversationId }: { conversationId: string }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/messages/${conversationId}`)}`);
  const admin = createSupabaseAdminClient();
  const { data: customer } = await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  const { data: conversation } = customer ? await admin.from("marketplace_conversations").select("id,job_id,provider_id,bidder_user_id,customer_id").eq("id", conversationId).eq("customer_id", customer.id).maybeSingle() : { data: null };
  if (!conversation) notFound();
  const { error: readError } = await supabase.rpc("mark_marketplace_conversation_read", { target_conversation: conversationId });
  if (readError) console.error("[marketplace-message] read-state update failed", { conversationId, userId: user.id, code: readError.code });
  const providerId = conversation.provider_id || conversation.bidder_user_id;
  const [{ data: provider }, { data: job }, { data: messages }, { data: attachments }, { data: quote }, { data: booking }] = await Promise.all([
    providerId ? admin.from("marketplace_providers").select("user_id,display_name,business_name,profile_photo_url").eq("user_id", providerId).maybeSingle() : Promise.resolve({ data: null }),
    admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode").eq("id", conversation.job_id).maybeSingle(),
    admin.from("marketplace_messages").select("id,sender_id,body,created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
    admin.from("marketplace_message_attachments").select("id,message_id,storage_path").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
    providerId ? admin.from("marketplace_quotes").select("id,amount_pence,status,message").eq("job_id", conversation.job_id).or(`provider_id.eq.${providerId},bidder_user_id.eq.${providerId}`).maybeSingle() : Promise.resolve({ data: null }),
    admin.from("marketplace_bookings").select("payment_status,status,completion_status,amount_pence").eq("conversation_id", conversationId).maybeSingle(),
  ]);
  const providerPhoto = await resolveProviderPhotoUrl(admin, provider?.profile_photo_url);
  const [{ data: promotedDetails }, { data: promotedPhotos }] = await Promise.all([
    admin.from("marketplace_job_detail_promotions").select("source_message_id").eq("job_id", conversation.job_id),
    admin.from("marketplace_job_photos").select("source_message_attachment_id").eq("job_id", conversation.job_id),
  ]);
  const promotedMessageIds = (promotedDetails || []).map((item) => item.source_message_id);
  const promotedAttachmentIds = (promotedPhotos || []).map((item) => item.source_message_attachment_id).filter(Boolean);
  const conversationReadOnly = await isMarketplaceConversationReadOnly(admin, conversationId);
  if (!job) notFound();
  const signedAttachments = await Promise.all((attachments || []).map(async (attachment) => ({ ...attachment, url: (await admin.storage.from("marketplace-message-attachments").createSignedUrl(attachment.storage_path, 3600)).data?.signedUrl || null })));
  const byMessage = new Map<string, typeof signedAttachments>();
  for (const attachment of signedAttachments) byMessage.set(attachment.message_id, [...(byMessage.get(attachment.message_id) || []), attachment]);
  const providerName = provider?.business_name || provider?.display_name || "Your provider";
  const title = getMarketplaceJobDisplayTitle(job.service, job.service_subtype, job.service_subtype || job.service);
  const profileHref = providerId ? `/providers/${providerId}?job=${job.id}&offer=${quote?.id || ""}&returnTo=/messages?conversation=${conversationId}` : null;
  const returnTo = `/messages?conversation=${conversationId}`;
  const isAccepted = quote?.status === "accepted" || quote?.status === "selected";
  const bookingState = getCustomerJobLifecycleState({ offerCount: quote ? 1 : 0, acceptedQuote: isAccepted ? quote : null, booking });
  const bookingCompleted = bookingState === "completed";
  return <section className="flex min-h-0 flex-1 flex-col"><div className="flex items-center gap-3 border-b border-[#e7ebef] px-5 py-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eef8f1] text-lg font-black text-[#167d3c]" aria-hidden="true">{providerPhoto ? <img src={providerPhoto} alt="" className="h-full w-full object-cover" /> : providerName.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate font-black">{providerName}</p><p className="truncate text-sm font-bold text-[#526078]">{title} · {job.postcode}</p></div>{profileHref && <Link href={profileHref} className="ml-auto shrink-0 text-sm font-black text-[#167d3c]">View profile →</Link>}</div>{quote && <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#edf0f3] bg-[#f5fbf6] px-5 py-3 text-sm"><span className="font-black">{bookingCompleted ? "Booking completed" : `Quote ${formatMarketplaceAmount(quote.amount_pence)}`}</span><span className="font-bold text-[#526078]">{bookingCompleted ? `${formatMarketplaceAmount(booking?.amount_pence || quote.amount_pence)} paid` : booking?.payment_status === "paid" ? "Booked and paid ✓" : quote.status}</span>{!bookingCompleted && quote.status === "submitted" && <form action={chooseMarketplaceQuote}><input type="hidden" name="token" value={job.public_token || ""} /><input type="hidden" name="quoteId" value={quote.id} /><input type="hidden" name="returnTo" value={returnTo} /><button className="font-black text-[#167d3c]">Accept quote</button></form>}{!bookingCompleted && isAccepted && bookingState === "provider_selected_unpaid" && <form action={createMarketplaceCheckout}><input type="hidden" name="token" value={job.public_token || ""} /><input type="hidden" name="quoteId" value={quote.id} /><input type="hidden" name="returnTo" value={returnTo} /><button className="rounded-lg bg-[#23a955] px-3 py-1.5 font-black text-[#061b3f]">Book &amp; pay</button></form>}</div>}<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5"><div className="grid gap-3">{(messages || []).map((message) => <MarketplaceMessageBubble key={message.id} messageId={message.id} body={message.body} isMine={message.sender_id === user.id} canPromote={message.sender_id === user.id} promotedMessage={promotedMessageIds.includes(message.id)} promotedAttachments={promotedAttachmentIds} attachments={byMessage.get(message.id)?.map((attachment) => ({ id: attachment.id, url: attachment.url, fileName: null }))} createdAt={message.created_at} />)}{!(messages || []).length && <p className="text-sm text-[#526078]">No messages yet.</p>}</div></div><div className="border-t border-[#e7ebef] px-5 py-4"><MessageComposer conversationId={conversationId} returnTo={returnTo} readOnly={conversationReadOnly} /></div></section>;
}
