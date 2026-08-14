import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function ActivityPage() {
  await requireAdmin(); const admin = createSupabaseAdminClient();
  const [{ data: jobs }, { data: offers }, { data: invites }, { data: bookings }] = await Promise.all([
    admin.from("marketplace_jobs").select("id,service,service_subtype,created_at,status").order("created_at", { ascending: false }).limit(80),
    admin.from("marketplace_quotes").select("id,job_id,amount_pence,created_at,status").order("created_at", { ascending: false }).limit(80),
    admin.from("marketplace_provider_invitations").select("id,invited_name,email,created_at,status,sent_at,accepted_at").order("created_at", { ascending: false }).limit(80),
    admin.from("marketplace_bookings").select("id,job_id,created_at,status").order("created_at", { ascending: false }).limit(80),
  ]);
  const events = [...(jobs || []).map((item) => ({ id: `job-${item.id}`, at: item.created_at, label: "Job created", detail: `${item.service_subtype || item.service} · ${item.status}` })), ...(offers || []).map((item) => ({ id: `offer-${item.id}`, at: item.created_at, label: "Offer created", detail: `£${Math.round(item.amount_pence / 100)} · ${item.status}` })), ...(invites || []).map((item) => ({ id: `invite-${item.id}`, at: item.accepted_at || item.sent_at || item.created_at, label: item.status === "accepted" ? "Provider joined" : "Provider invited", detail: `${item.invited_name} · ${item.email}` })), ...(bookings || []).map((item) => ({ id: `booking-${item.id}`, at: item.created_at, label: "Job status changed", detail: item.status }))].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 150);
  return <div className="mx-auto max-w-4xl"><h1 className="text-3xl font-black">Activity</h1><p className="mt-1 text-[#657089]">Recent marketplace events from live data.</p><ol className="mt-6 divide-y overflow-hidden rounded-2xl border bg-white">{events.map((event) => <li key={event.id} className="flex flex-wrap justify-between gap-3 p-5"><div><p className="font-black">{event.label}</p><p className="mt-1 text-sm text-[#526078]">{event.detail}</p></div><time className="text-sm text-[#657089]">{new Date(event.at).toLocaleString("en-GB")}</time></li>)}{!events.length && <li className="p-8 text-[#657089]">No marketplace activity yet.</li>}</ol></div>;
}
