import Link from "next/link";
import { notFound } from "next/navigation";
import ProviderHeader from "@/app/components/marketplace/ProviderHeader";
import MarketplaceMessageBubble from "@/app/components/marketplace/MarketplaceMessageBubble";
import ProviderJobActions from "@/app/work/jobs/ProviderJobActions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { canProviderOperate, requireProviderBrowseAccess } from "@/lib/marketplace/provider-access";
import { getMarketplaceBookingLifecycleState, getMarketplacePaymentState, isPartialMarketplaceRefund } from "@/lib/marketplace/customer-job-state";
import { isMarketplaceJobMatch } from "@/lib/marketplace/provider-job-matching";
import { advanceMarketplaceBooking, withdrawWorkOffer } from "@/app/work/actions";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function readableLabel(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readableValue(value: JsonValue): string {
  if (Array.isArray(value)) return value.map(readableValue).join(", ");
  if (value === null) return "Not provided";
  if (typeof value === "object") return Object.entries(value).map(([key, nested]) => `${readableLabel(key)}: ${readableValue(nested)}`).join(" · ");
  return typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
}

function answerRows(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, JsonValue>).filter(([key, item]) => !["postcode", "budget", "when", "description"].includes(key) && item !== null && item !== "");
}

function formatMoney(amount: number | null) {
  return amount == null ? "Open to quotes" : `£${Number(amount).toFixed(2).replace(/\.00$/, "")}`;
}

function formatBookingStatus(status: string, paymentStatus: string | null, lifecycle: string | null, partialRefund = false) {
  if (lifecycle === "issue_being_reviewed") return "Issue being reviewed — completion and payout are on hold";
  if (paymentStatus === "refunded") return "Customer refunded — no payout expected";
  if (status === "completed") return "Completed / settled";
  if (partialRefund || paymentStatus === "partially_refunded") return "Partial refund issued — payout on hold";
  if (status === "issue_being_reviewed") return "Issue being reviewed — Customer reported an issue. Completion and payout are temporarily on hold while Quickola reviews it.";
  if (status === "awaiting_booking_fee" && paymentStatus !== "paid") return "Awaiting customer payment";
  if (status === "awaiting_booking_fee") return "Booked";
  return status.replaceAll("_", " ");
}

export default async function WorkJobPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const provider = await requireProviderBrowseAccess();
  const admin = createSupabaseAdminClient();
  const { data: job } = await admin.from("marketplace_jobs").select("id,service,service_subtype,postcode,approximate_area,pricing_answers,requested_timing,optional_note,budget_amount,status,created_at").eq("id", id).maybeSingle();
  if (!job) notFound();
  const { data: ownOffer } = await admin.from("marketplace_quotes").select("id,status,amount_pence").eq("job_id", id).or(`provider_id.eq.${provider.providerId},bidder_user_id.eq.${provider.providerId}`).maybeSingle();
  const { data: booking } = await admin.from("marketplace_bookings").select("id,status,payment_status,amount_pence,refunded_amount_pence,scheduled_date,arrival_window_start,arrival_window_end,provider_id,completion_status,payout_hold_status,payout_hold_reason,provider_transfer_status").eq("job_id", id).eq("provider_id", provider.providerId).maybeSingle();
  if (!ownOffer) {
    const [{ data: providerServices }, { data: providerAreas }] = await Promise.all([
      admin.from("marketplace_provider_services").select("category_slug,job_type_slug,active").eq("provider_id", provider.providerId),
      admin.from("marketplace_provider_service_areas").select("postcode_district,active").eq("provider_id", provider.providerId),
    ]);
    if (!isMarketplaceJobMatch(job, providerServices || [], providerAreas || [])) notFound();
  }
  const { data: conversation } = await admin.from("marketplace_conversations").select("id").eq("job_id", id).or(`provider_id.eq.${provider.providerId},bidder_user_id.eq.${provider.providerId}`).maybeSingle();
  const { data: messages } = conversation?.id ? await admin.from("marketplace_messages").select("id,sender_id,body,created_at").eq("conversation_id", conversation.id).order("created_at", { ascending: true }) : { data: [] };
  const { data: messageAttachments } = conversation?.id ? await admin.from("marketplace_message_attachments").select("id,message_id,storage_path").eq("conversation_id", conversation.id).order("created_at", { ascending: true }) : { data: [] };
  const signedMessageAttachments = await Promise.all((messageAttachments || []).map(async (attachment) => ({ id: attachment.id, messageId: attachment.message_id, url: (await admin.storage.from("marketplace-message-attachments").createSignedUrl(attachment.storage_path, 3600)).data?.signedUrl || null })));
  const attachmentsByMessage = new Map<string, typeof signedMessageAttachments>();
  for (const attachment of signedMessageAttachments) attachmentsByMessage.set(attachment.messageId, [...(attachmentsByMessage.get(attachment.messageId) || []), attachment]);
  const { data: photoRows } = await admin.from("marketplace_job_photos").select("id,storage_path,created_at").eq("job_id", id).order("created_at", { ascending: true });
  const photos = await Promise.all((photoRows || []).map(async (photo) => ({ id: photo.id, url: (await admin.storage.from("marketplace-job-photos").createSignedUrl(photo.storage_path, 3600)).data?.signedUrl || null })));
  const title = (job.service_subtype || job.service).replaceAll("-", " ");
  const answerDetails = answerRows(job.pricing_answers);
  const accepted = ownOffer && ["selected", "accepted"].includes(ownOffer.status);
  const { data: activeDispute } = booking ? await admin.from("marketplace_disputes").select("id").eq("booking_id", booking.id).in("status", ["open", "in_review"]).maybeSingle() : { data: null };
  const bookingLifecycle = booking ? getMarketplaceBookingLifecycleState(booking, Boolean(activeDispute)) : null;
  if (booking && isPartialMarketplaceRefund(booking)) booking.payment_status = "partially_refunded";
  const issueBeingReviewed = bookingLifecycle === "issue_being_reviewed";
  const nextAction = !issueBeingReviewed && booking?.status === "booked" ? ["en_route", "On my way"] : !issueBeingReviewed && booking?.status === "en_route" ? ["arrived", "I’ve arrived"] : !issueBeingReviewed && booking && ["arrived", "in_progress"].includes(booking.status) ? ["awaiting_customer_completion", "Mark work complete"] : null;
  if (issueBeingReviewed && booking) booking.status = "issue_being_reviewed";
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><ProviderHeader /><section className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><Link href="/work" className="text-sm font-black text-[#167d3c]">← Jobs near you</Link><article className="mt-5 rounded-3xl border border-[#e7ebef] bg-white p-5 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#159548]">{job.service}</p><h1 className="mt-2 text-3xl font-black capitalize sm:text-4xl">{title}</h1></div><span className="rounded-full bg-[#eef8f1] px-4 py-2 text-sm font-black text-[#167d3c]">{formatMoney(job.budget_amount)}</span></div><dl className="mt-6 grid gap-4 border-y border-[#edf0f3] py-5 sm:grid-cols-3"><div><dt className="text-xs font-black uppercase tracking-[.12em] text-[#8390a1]">Location</dt><dd className="mt-1 font-bold">{job.approximate_area || String(job.postcode).split(/\s+/)[0]}</dd></div><div><dt className="text-xs font-black uppercase tracking-[.12em]">When?</dt><dd className="mt-1 font-bold">{job.requested_timing || "Flexible timing"}</dd></div><div><dt className="text-xs font-black uppercase tracking-[.12em]">Posted</dt><dd className="mt-1 font-bold">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(job.created_at))}</dd></div></dl>{answerDetails.length > 0 && <section className="mt-7"><h2 className="text-xl font-black">Job details</h2><dl className="mt-4 grid gap-3 sm:grid-cols-2">{answerDetails.map(([key, value]) => <div key={key} className="rounded-xl bg-[#f7f8fa] p-4"><dt className="text-xs font-black uppercase tracking-[.1em] text-[#8390a1]">{readableLabel(key)}</dt><dd className="mt-1 font-bold">{readableValue(value)}</dd></div>)}</dl></section>}{job.optional_note && <section className="mt-7"><h2 className="text-xl font-black">Customer note</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-[#39465b]">{job.optional_note}</p></section>}{photos.some((photo) => photo.url) && <section className="mt-7"><h2 className="text-xl font-black">Photos</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.filter((photo): photo is { id: string; url: string } => !!photo.url).map((photo) => <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer"><img src={photo.url} alt="Customer job" className="aspect-square w-full rounded-2xl object-cover" /></a>)}</div></section>}{booking && <section className="mt-7 rounded-2xl bg-[#eef8f1] p-5"><p className="text-xs font-black uppercase tracking-[.14em] text-[#167d3c]">Booked marketplace job</p><p className="mt-2 text-2xl font-black">{booking.scheduled_date ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(`${booking.scheduled_date}T12:00:00`)) : "Schedule confirmed"}</p><p className="mt-1 font-bold text-[#526078]">{booking.arrival_window_start || "Time"}{booking.arrival_window_end ? `–${booking.arrival_window_end}` : ""} · {getMarketplacePaymentState(booking) === "paid" ? "Paid" : "Payment not confirmed"}</p><p className="mt-2 font-black capitalize text-[#167d3c]">Status · {formatBookingStatus(booking.status, booking.payment_status, bookingLifecycle)}</p>{bookingLifecycle === "issue_being_reviewed" && <p className="mt-3 font-bold text-[#795b13]">Partial refunds or customer issues are under review. Payout remains blocked.</p>}{booking.status === "awaiting_customer_completion" && bookingLifecycle !== "issue_being_reviewed" && <p className="mt-3 font-bold text-[#526078]">Waiting for the customer to confirm completion.</p>}{booking.status === "completed" && <p className="mt-3 font-bold text-[#167d3c]">{booking.provider_transfer_status === "paid" ? "Completed · Payment sent" : booking.provider_transfer_status === "failed" ? "Completed · Payment needs attention" : "Completed · Payment processing"}</p>}{nextAction && getMarketplacePaymentState(booking) === "paid" && <form action={advanceMarketplaceBooking} className="mt-4"><input type="hidden" name="bookingId" value={booking.id} /><input type="hidden" name="jobId" value={id} /><input type="hidden" name="nextStatus" value={nextAction[0]} /><button className="min-h-11 rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">{nextAction[1]}</button></form>}</section>}<ProviderJobActions jobId={id} offer={ownOffer} error={query.error} canOperate={canProviderOperate(provider)} />{query.sent && <p className="mt-4 rounded-xl bg-[#eef8f1] p-3 text-sm font-bold text-[#167d3c]">Your quote was sent to the customer.</p>}<section className="mt-7 border-t border-[#e9edf1] pt-6"><h2 className="text-xl font-black">Conversation</h2><p className="mt-2 text-sm text-[#657089]">Messages stay in this same conversation before and after a quote.</p><div className="mt-4 grid gap-3">{messages?.length ? messages.map((message) => <MarketplaceMessageBubble key={message.id} body={message.body} isMine={message.sender_id === provider.user.id} attachments={attachmentsByMessage.get(message.id)} createdAt={message.created_at} />) : <p className="text-sm text-[#657089]">No messages yet.</p>}</div></section>{ownOffer && !accepted && <form action={withdrawWorkOffer} className="mt-5"><input type="hidden" name="jobId" value={id} /><button className="text-sm font-black text-red-700">Withdraw quote</button></form>}</article></section></main>;
}
