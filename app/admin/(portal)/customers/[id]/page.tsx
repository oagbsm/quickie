import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatBusinessDateTime } from "@/lib/business/time";
import { getBookingStatus } from "@/lib/business/booking-status";

export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; await requireAdmin(); const db=createSupabaseAdminClient();
  const [{data:a},{data:properties},{data:bookings},{data:member}]=await Promise.all([
    db.from("business_accounts").select("*").eq("id",id).maybeSingle(),
    db.from("properties").select("*").eq("account_id",id).order("created_at"),
    db.from("business_bookings").select("id,property_id,service,scheduled_start,status").eq("account_id",id).order("scheduled_start",{ascending:false}),
    db.from("business_members").select("user_id,full_name,role").eq("account_id",id).eq("role","owner").maybeSingle(),
  ]); if(!a) notFound();
  const user=member ? (await db.auth.admin.getUserById(member.user_id)).data.user : null;
  return <div className="mx-auto max-w-6xl"><Link href="/admin/customers" className="text-sm font-black text-[#657089]">← Customers</Link>
    <div className="mt-4 flex flex-wrap justify-between gap-3"><div><h1 className="text-3xl font-black">{a.name}</h1><p className="text-[#657089]">{a.customer_type.replaceAll("_"," ")} · created {new Date(a.created_at).toLocaleDateString("en-GB")}</p></div><span className="h-fit rounded-full bg-[#edf7f1] px-3 py-1 text-sm font-black">{a.status}</span></div>
    <section className="mt-6 rounded-2xl border bg-white p-5"><h2 className="text-lg font-black">Primary contact</h2><dl className="mt-4 grid gap-3 sm:grid-cols-3"><Info l="Name" v={member?.full_name}/><Info l="Email" v={user?.email}/><Info l="Phone" v={a.phone}/></dl></section>
    <section className="mt-6"><div className="flex justify-between"><h2 className="text-xl font-black">Properties</h2><Link href={`/admin/bookings?customer=${id}`} className="font-black text-[#08783f]">View all bookings →</Link></div><div className="mt-3 grid gap-3 md:grid-cols-2">{properties?.length?properties.map(p=>{const own=bookings?.filter(b=>b.property_id===p.id)||[],next=own.filter(b=>!['completed','cancelled','unable_to_fulfil'].includes(b.status)).sort((x,y)=>x.scheduled_start.localeCompare(y.scheduled_start))[0];return <Link href={`/admin/properties/${p.id}`} key={p.id} className="rounded-2xl border bg-white p-5"><div className="flex justify-between gap-2"><h3 className="font-black">{p.nickname}</h3><span className="text-xs font-black">{p.status}</span></div><p className="mt-1 text-sm text-[#657089]">{[p.address_line_1,p.city,p.postcode].join(", ")}</p><p className="mt-3 text-sm">{p.property_type.replaceAll("_"," ")} · {p.bedrooms??"—"} bed · {p.bathrooms??"—"} bath</p><p className="mt-2 text-sm font-bold">Coverage: {p.service_area_status.replaceAll("_"," ")}</p><p className="mt-2 text-sm">Next clean: {next?formatBusinessDateTime(next.scheduled_start):"None scheduled"} · Previous: {own.filter(b=>b.status==='completed').length}</p></Link>}):<p className="rounded-2xl border border-dashed p-8 text-[#657089]">No properties.</p>}</div></section>
    <section className="mt-7"><h2 className="text-xl font-black">Booking history</h2><div className="mt-3 grid gap-2">{bookings?.length?bookings.map(b=><Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex justify-between rounded-xl border bg-white p-4"><span className="font-bold">{b.id.slice(0,8).toUpperCase()} · {b.service.replaceAll("_"," ")}</span><span>{getBookingStatus(b.status).adminLabel}</span></Link>):<p className="rounded-2xl border border-dashed p-8 text-[#657089]">No bookings.</p>}</div></section>
  </div>;
}
function Info({l,v}:{l:string;v:unknown}){return <div><dt className="text-xs font-bold uppercase text-[#788398]">{l}</dt><dd className="mt-1 font-semibold">{String(v||"—")}</dd></div>}
