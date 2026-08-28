import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function MarketplaceBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(); const { id } = await params; const db = createSupabaseAdminClient();
  const { data: booking } = await db.from("marketplace_bookings").select("*").eq("id", id).maybeSingle();
  if (!booking) notFound();
  const [jobResult, customerResult, providerResult, quoteResult] = await Promise.all([
    db.from("marketplace_jobs").select("*").eq("id", booking.job_id).maybeSingle(),
    db.from("marketplace_customers").select("*").eq("id", booking.customer_id).maybeSingle(),
    db.from("cleaner_profiles").select("*").eq("user_id", booking.provider_id).maybeSingle(),
    db.from("marketplace_quotes").select("*").eq("id", booking.quote_id).maybeSingle(),
  ]);
  const actualJob = jobResult.data; const actualCustomer = customerResult.data; const actualProvider = providerResult.data; const actualQuote = quoteResult.data;
  const stage = [{ label: "Job posted", at: actualJob?.created_at, shown: Boolean(actualJob) }, { label: "Offer submitted", at: actualQuote?.created_at, shown: Boolean(actualQuote) }, { label: "Offer accepted / booking created", at: booking.created_at, shown: true }, { label: "Payment completed", at: booking.paid_at, shown: booking.payment_status === "paid" }, { label: "Job completed", at: booking.customer_completed_at, shown: booking.status === "completed" }].filter((item) => item.shown);
  return <div className="mx-auto max-w-[1100px]"><Link href="/admin/marketplace-bookings" className="text-sm font-black text-[#167d3c]">← Marketplace bookings</Link><div className="mt-4 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.12em] text-[#159548]">MARKETPLACE BOOKING</p><h1 className="mt-1 text-3xl font-black">{actualJob?.service_subtype || actualJob?.service || "Booking"}</h1><p className="mt-1 text-[#657089]">{actualJob?.postcode || "No postcode"}</p></div><span className="rounded-full bg-[#f1f3f6] px-3 py-2 text-sm font-black capitalize">{booking.status.replaceAll("_", " ")}</span></div><div className="mt-6 grid gap-5 lg:grid-cols-2"><Panel title="People"><Info label="Customer" value={actualCustomer?.display_name || actualCustomer?.email} /><Info label="Provider" value={actualProvider?.display_name || actualProvider?.business_name} /><Info label="Agreed price" value={booking.amount_pence == null ? "Awaiting price" : `£${(Number(booking.amount_pence) / 100).toFixed(2)}`} /><Info label="Payment" value={booking.payment_status?.replaceAll("_", " ")} /></Panel><Panel title="Lifecycle"><ol className="grid gap-4">{stage.map((item) => <li key={item.label} className="border-l-2 border-[#23a955] pl-4"><p className="font-black">{item.label}</p><p className="text-sm text-[#657089]">{item.at ? new Date(item.at).toLocaleString("en-GB") : "Recorded"}</p></li>)}</ol></Panel></div>{actualJob?.optional_note && <Panel title="Customer request"><p className="whitespace-pre-wrap leading-7 text-[#526078]">{actualJob.optional_note}</p></Panel>}</div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mt-5 rounded-2xl border bg-white p-5"><h2 className="text-lg font-black">{title}</h2><div className="mt-4 grid gap-4">{children}</div></section>; }
function Info({ label, value }: { label: string; value: unknown }) { return <div><p className="text-xs font-bold uppercase tracking-wide text-[#788398]">{label}</p><p className="mt-1 font-black">{String(value || "—")}</p></div>; }
