import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const one = <T,>(value: T | T[] | null | undefined) => Array.isArray(value) ? value[0] : value;
const money = (pence: number | null | undefined) => pence == null ? "Open to offers" : `£${(Number(pence) / 100).toFixed(2)}`;
const label = (value: string | null | undefined) => (value || "—").replaceAll("_", " ");
const shortId = (value: string | null | undefined) => value ? `${value.slice(0, 12)}…` : "—";

type Provider = { user_id: string; display_name: string | null; business_name: string | null; provider_status: string | null; stripe_status: string | null; marketplace_active: boolean | null };

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const [{ data: job }, { data: offers }, { data: bookings }, { data: jobReviews }, { data: jobPhotos }] = await Promise.all([
    admin.from("marketplace_jobs").select("*,marketplace_customers(display_name,email,mobile)").eq("id", id).maybeSingle(),
    admin.from("marketplace_quotes").select("id,provider_id,bidder_user_id,amount_pence,availability_type,availability_text,message,status,created_at,updated_at").eq("job_id", id).order("created_at", { ascending: true }),
    admin.from("marketplace_bookings").select("*").eq("job_id", id).order("created_at", { ascending: false }),
    admin.from("marketplace_reviews").select("id,booking_id,customer_id,provider_id,rating,review_text,created_at").eq("job_id", id).order("created_at", { ascending: false }),
    admin.from("marketplace_job_photos").select("id,storage_path,created_at").eq("job_id", id).order("created_at", { ascending: true }),
  ]);
  if (!job) notFound();

  const customer = one(job.marketplace_customers);
  const selectedBooking = bookings?.[0];
  const [{ data: disputes }, { data: refunds }] = selectedBooking ? await Promise.all([
    admin.from("marketplace_disputes").select("id,booking_id,opened_by_type,reason_code,description,status,opened_at,resolved_at,resolution_code,resolution_notes").eq("booking_id", selectedBooking.id),
    admin.from("marketplace_refunds").select("id,booking_id,amount_pence,refund_type,reason,status,stripe_refund_id,created_at,confirmed_at").eq("booking_id", selectedBooking.id),
  ]) : [{ data: [] }, { data: [] }];
  const bidderIds = Array.from(new Set((offers || []).map((offer) => offer.provider_id || offer.bidder_user_id).filter(Boolean)));
  const [{ data: providers }, { data: services }, { data: areas }, { data: bidderReviews }, { data: bidderBookings }] = bidderIds.length ? await Promise.all([
    admin.from("marketplace_providers").select("user_id,display_name,business_name,provider_status,stripe_status,marketplace_active").in("user_id", bidderIds),
    admin.from("marketplace_provider_services").select("provider_id,category_slug,job_type_slug,active,qualification_verified").in("provider_id", bidderIds),
    admin.from("marketplace_provider_service_areas").select("provider_id,postcode_district,active").in("provider_id", bidderIds),
    admin.from("marketplace_reviews").select("id,booking_id,job_id,provider_id,rating,review_text,created_at").in("provider_id", bidderIds).order("created_at", { ascending: false }),
    admin.from("marketplace_bookings").select("id,provider_id,status").in("provider_id", bidderIds),
  ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];
  const providerById = new Map((providers || []).map((provider: Provider) => [provider.user_id, provider]));
  const servicesByProvider = new Map<string, typeof services>();
  (services || []).forEach((service) => servicesByProvider.set(service.provider_id, [...(servicesByProvider.get(service.provider_id) || []), service]));
  const areasByProvider = new Map<string, typeof areas>();
  (areas || []).forEach((area) => areasByProvider.set(area.provider_id, [...(areasByProvider.get(area.provider_id) || []), area]));
  const reviewsByProvider = new Map<string, typeof bidderReviews>();
  (bidderReviews || []).forEach((review) => reviewsByProvider.set(review.provider_id, [...(reviewsByProvider.get(review.provider_id) || []), review]));
  const completedByProvider = new Map<string, number>();
  (bidderBookings || []).filter((booking) => booking.status === "completed").forEach((booking) => completedByProvider.set(booking.provider_id, (completedByProvider.get(booking.provider_id) || 0) + 1));

  return <div className="mx-auto max-w-5xl">
    <Link href="/admin/jobs" className="text-sm font-black text-[#167d3c]">← Jobs</Link>
    <div className="mt-4 rounded-2xl border bg-white p-6">
      <div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wide text-[#159548]">{job.service}</p><h1 className="mt-2 text-3xl font-black capitalize">{(job.service_subtype || job.service).replaceAll("-", " ")}</h1><p className="mt-2 text-[#657089]">{job.postcode} · {job.requested_timing || "Flexible timing"}</p></div><span className="rounded-full bg-[#eef8f1] px-3 py-1 text-sm font-black capitalize text-[#167d3c]">{label(job.status)}</span></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3"><Info label="Customer" value={customer?.display_name || customer?.email || job.contact_name || "Customer"} /><Info label="Customer email" value={customer?.email || job.contact_value || "—"} /><Info label="Customer mobile" value={customer?.mobile || "—"} /><Info label="Created" value={new Date(job.created_at).toLocaleString("en-GB")} /><Info label="Job ID" value={job.id} /><Info label="Public token" value={job.public_token} /><Info label="Budget" value={job.budget_amount == null ? "Open budget" : `£${Number(job.budget_amount).toFixed(2).replace(/\.00$/, "")}`} /><Info label="Job photos" value={jobPhotos?.length || 0} /></div>
      {job.optional_note && <p className="mt-6 whitespace-pre-wrap leading-7 text-[#39465b]">{job.optional_note}</p>}
    </div>

    <section className="mt-6 rounded-2xl border bg-white p-6"><h2 className="text-2xl font-black">Offers ({offers?.length || 0})</h2><p className="mt-1 text-sm text-[#657089]">Every bid is shown with the provider state and marketplace history available to admins.</p><div className="mt-4 grid gap-4">{offers?.map((offer) => { const providerId = offer.provider_id || offer.bidder_user_id; const provider = providerById.get(providerId); const providerHistory = reviewsByProvider.get(providerId) || []; const providerServices = servicesByProvider.get(providerId) || []; const providerAreas = areasByProvider.get(providerId) || []; return <article key={offer.id} className="rounded-xl border border-[#e5eaf0] p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{provider?.display_name || provider?.business_name || "Unknown provider"}</p><p className="mt-1 text-xs text-[#657089]">Provider <Link className="text-[#167d3c]" href={`/admin/providers/${providerId}`}>{shortId(providerId)}</Link> · {label(offer.status)} · {new Date(offer.created_at).toLocaleString("en-GB")}</p></div><p className="text-2xl font-black">{money(offer.amount_pence)}</p></div><p className="mt-3 text-sm text-[#526078]">{offer.message || "No offer message"}</p><div className="mt-4 grid gap-2 text-xs text-[#526078] sm:grid-cols-2"><span>Availability: {offer.availability_text || label(offer.availability_type)}</span><span>Marketplace status: {label(provider?.provider_status)}</span><span>Stripe status: {label(provider?.stripe_status)}</span><span>Marketplace active: {provider?.marketplace_active ? "Yes" : "No"}</span><span>Services: {providerServices.filter((service) => service.active).map((service) => service.job_type_slug).join(", ") || "None recorded"}</span><span>Areas: {providerAreas.filter((area) => area.active).map((area) => area.postcode_district).join(", ") || "None recorded"}</span><span>Completed bookings: {completedByProvider.get(providerId) || 0}</span><span>Provider reviews: {providerHistory.length} · Average {providerHistory.length ? (providerHistory.reduce((sum, review) => sum + review.rating, 0) / providerHistory.length).toFixed(1) : "—"}</span></div>{providerHistory.length > 0 && <div className="mt-4 border-t pt-3"><p className="text-xs font-black uppercase tracking-wide text-[#707b8d]">Provider review history</p>{providerHistory.slice(0, 5).map((review) => <p key={review.id} className="mt-2 text-xs text-[#526078]">★ {review.rating}/5 · {review.review_text || "No written comment"} · {new Date(review.created_at).toLocaleDateString("en-GB")}</p>)}</div>}</article> })}{!offers?.length && <p className="text-[#657089]">No offers yet.</p>}</div></section>

    <section className="mt-6 rounded-2xl border bg-white p-6"><h2 className="text-2xl font-black">Booking, payment and completion</h2>{selectedBooking ? <div className="mt-4 grid gap-3 sm:grid-cols-3"><Info label="Selected provider" value={shortId(selectedBooking.provider_id)} /><Info label="Booking status" value={label(selectedBooking.status)} /><Info label="Payment" value={label(selectedBooking.payment_status)} /><Info label="Completion" value={label(selectedBooking.completion_status)} /><Info label="Paid at" value={selectedBooking.paid_at || "—"} /><Info label="Customer completed" value={selectedBooking.customer_completed_at || "—"} /><Info label="Completed at" value={selectedBooking.completed_at || "—"} /><Info label="Payout" value={label(selectedBooking.provider_transfer_status)} /><Info label="Transfer amount" value={money(selectedBooking.provider_transfer_amount_pence)} /><Info label="Transfer" value={shortId(selectedBooking.stripe_transfer_id)} /><Info label="Checkout session" value={shortId(selectedBooking.stripe_checkout_session_id)} /><Info label="Payment intent" value={shortId(selectedBooking.stripe_payment_intent_id)} /><Info label="Refunded" value={money(selectedBooking.refunded_amount_pence)} /></div> : <p className="mt-3 text-[#657089]">No booking created.</p>}{selectedBooking?.cancelled_at && <p className="mt-4 text-sm text-[#8f3030]">Cancelled {selectedBooking.cancelled_at}: {selectedBooking.cancellation_reason_text || label(selectedBooking.cancellation_reason_code)}</p>}</section>

    <section className="mt-6 rounded-2xl border bg-white p-6"><h2 className="text-2xl font-black">Job review</h2>{jobReviews?.length ? jobReviews.map((review) => <article key={review.id} className="mt-4 rounded-xl bg-[#f5fbf6] p-4"><p className="font-black text-[#b77900]">{"★".repeat(review.rating)} <span className="ml-2 text-[#1d304c]">{review.rating}/5</span></p><p className="mt-2 whitespace-pre-wrap">{review.review_text || "No written comment"}</p><p className="mt-2 text-xs text-[#657089]">{new Date(review.created_at).toLocaleString("en-GB")} · Customer {shortId(review.customer_id)} · Provider {shortId(review.provider_id)}</p></article>) : <p className="mt-3 text-[#657089]">No review submitted.</p>}</section>
    {(disputes?.length || refunds?.length) ? <section className="mt-6 rounded-2xl border bg-white p-6"><h2 className="text-2xl font-black">Disputes and refunds</h2>{disputes?.map((dispute) => <div key={dispute.id} className="mt-3 text-sm"><b>Dispute:</b> {label(dispute.status)} · {dispute.reason_code} · {dispute.description}</div>)}{refunds?.map((refund) => <div key={refund.id} className="mt-3 text-sm"><b>Refund:</b> {money(refund.amount_pence)} · {label(refund.status)} · {refund.reason} · {shortId(refund.stripe_refund_id)}</div>)}</section> : null}
  </div>;
}

function Info({ label, value }: { label: string; value: string | number | null | undefined }) { return <div className="rounded-xl bg-[#f7f8fa] p-4"><p className="text-xs font-black uppercase tracking-wide text-[#707b8d]">{label}</p><p className="mt-2 break-words font-black">{value || "—"}</p></div>; }
