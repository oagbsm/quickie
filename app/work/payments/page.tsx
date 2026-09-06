import Link from "next/link";
import ProviderHeader from "@/app/components/marketplace/ProviderHeader";
import { requireProviderWorkspaceAccess } from "@/lib/marketplace/provider-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveMarketplacePaymentState, type MarketplacePaymentAllocation, type MarketplacePaymentBooking } from "@/lib/marketplace/payment-state";

type Booking = MarketplacePaymentBooking & { id: string; job_id: string; paid_at: string | null; created_at: string; marketplace_jobs?: { service?: string | null; service_subtype?: string | null } | Array<{ service?: string | null; service_subtype?: string | null }> | null };
type Allocation = MarketplacePaymentAllocation & { booking_id: string };
const money = (pence: number | null) => pence == null ? "Unavailable" : `£${(Math.max(0, Number(pence)) / 100).toFixed(2)}`;
const date = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value)) : "—";

export default async function ProviderPaymentsPage() {
  const provider = await requireProviderWorkspaceAccess();
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("marketplace_bookings").select("id,job_id,amount_pence,payment_status,payment_flow,status,refunded_amount_pence,provider_transfer_status,provider_transfer_amount_pence,payout_hold_status,paid_at,created_at,marketplace_jobs(service,service_subtype)").eq("provider_id", provider.providerId).order("created_at", { ascending: false });
  const bookings = (data || []) as Booking[];
  const bookingIds = bookings.map((booking) => booking.id);
  const { data: allocations } = bookingIds.length ? await admin.from("marketplace_payout_allocations").select("booking_id,gross_amount_pence,quickola_fee_pence,stripe_fee_pence,provider_net_pence,payout_status,stripe_payout_id").in("booking_id", bookingIds) : { data: [] as Allocation[] };
  const allocationByBooking = new Map((allocations || []).map((allocation) => [allocation.booking_id, allocation as Allocation]));
  const rows = bookings.filter((booking) => ["paid", "partially_refunded"].includes(booking.payment_status || "")).map((booking) => ({ booking, state: resolveMarketplacePaymentState(booking, allocationByBooking.get(booking.id)) }));
  const totalCustomerPaid = rows.reduce((sum, row) => sum + row.state.customerPaid, 0);
  const totalEarnings = rows.reduce((sum, row) => sum + (row.state.providerNet || 0), 0);
  const pendingPayout = rows.filter(({ state }) => state.payoutLabel === "Pending payout" || state.payoutLabel === "Awaiting completion").reduce((sum, row) => sum + (row.state.providerNet || 0), 0);
  const paidOut = rows.filter(({ state }) => state.payoutLabel === "Paid out").reduce((sum, row) => sum + (row.state.providerNet || 0), 0);
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><ProviderHeader /><section className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10"><p className="text-sm font-black uppercase tracking-[.12em] text-[#159548]">PROVIDER PAYMENTS</p><h1 className="mt-2 text-4xl font-black">Payments</h1><p className="mt-2 max-w-2xl text-[#657089]">A clear record of what customers paid and what you earned.</p><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Total customer-paid jobs" value={money(totalCustomerPaid)} /><Metric label="Provider earnings" value={money(totalEarnings)} /><Metric label="Pending payout" value={money(pendingPayout)} /><Metric label="Paid out" value={money(paidOut)} /></div><section className="mt-8"><h2 className="text-2xl font-black">Payment history</h2><div className="mt-4 grid gap-4">{rows.map(({ booking, state }) => { const job = Array.isArray(booking.marketplace_jobs) ? booking.marketplace_jobs[0] : booking.marketplace_jobs; return <article key={booking.id} className="rounded-2xl border border-[#e7ebef] bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><Link href={`/work/jobs/${booking.job_id}`} className="text-lg font-black text-[#167d3c]">{job?.service_subtype || job?.service || "Marketplace job"}</Link><p className="mt-1 text-sm text-[#657089]">{date(booking.paid_at || booking.created_at)}</p></div><span className="rounded-full bg-[#eef3f7] px-3 py-1.5 text-sm font-black">{state.payoutLabel}</span></div><dl className="mt-5 grid gap-3 border-t border-[#edf0f3] pt-4 sm:grid-cols-2 lg:grid-cols-3"><Amount label="Customer paid" value={money(state.customerPaid)} /><Amount label="Quickola fee" value={money(state.quickolaFee)} /><Amount label="Stripe fee" value={money(state.stripeFee)} /><Amount label="Your net" value={money(state.providerNet)} /><Amount label="Flow" value={state.flow === "direct_charge" ? "Direct charge" : "Platform transfer"} /><Amount label="Status" value={state.payoutLabel} /></dl></article>; })}{!rows.length && <div className="rounded-2xl border border-dashed border-[#cfd8d2] bg-white p-8 text-center text-[#657089]">No verified paid marketplace bookings yet.</div>}</div></section></section></main>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#e7ebef] bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-[#657089]">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>; }
function Amount({ label, value }: { label: string; value: string }) { return <div><dt className="text-sm text-[#657089]">{label}</dt><dd className="mt-1 font-black">{value}</dd></div>; }
