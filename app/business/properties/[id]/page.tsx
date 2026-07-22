import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";
import { formatServiceLabel } from "@/lib/business/booking-status";
import { formatBusinessDateTime } from "@/lib/business/time";
import { BookingStatusBadge } from "@/app/business/components/BookingPresentation";
import PropertyForm from "../../components/PropertyForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, accountId } = await requireBusinessUser();
  const [{ data: property }, { data: bookings }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).eq("account_id", accountId).maybeSingle(),
    supabase.from("business_bookings").select("id,service,scheduled_start,status").eq("property_id", id).eq("account_id", accountId).order("scheduled_start", { ascending: false }).limit(6),
  ]);
  if (!property) notFound();
  return <div>
    <Link href="/business/properties" className="text-sm font-black text-[#657089]">← Properties</Link>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-black">{property.nickname}</h1><p className="text-[#657089]">{property.address_line_1}, {property.city}, {property.postcode}</p></div><Link href={`/business/bookings/new?property=${property.id}`} className="rounded-xl bg-[#079448] px-5 py-3 font-black text-white">Request a clean</Link></div>
    <section className="mt-7"><h2 className="mb-3 text-xl font-black">Service history</h2><div className="overflow-hidden rounded-2xl border bg-white">{bookings?.length ? bookings.map((booking) => <Link key={booking.id} href={`/business/bookings/${booking.id}`} className="grid gap-2 border-b p-4 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-bold">{formatServiceLabel(booking.service)}</p><p className="mt-1 text-sm text-[#657089]">{formatBusinessDateTime(booking.scheduled_start)}</p></div><BookingStatusBadge status={booking.status}/></Link>) : <p className="p-6 text-sm text-[#657089]">No service history yet.</p>}</div></section>
    <section className="mt-7"><h2 className="mb-3 text-xl font-black">Property details</h2><PropertyForm property={property} onboarding={false}/></section>
  </div>;
}
