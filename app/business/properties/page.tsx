import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import { formatDisplayName } from "@/lib/display-name";
import { formatDisplayAddress } from "@/lib/display-address";
import ArchivePropertyForm from "./ArchivePropertyForm";
import TurnoverStatus from "../components/TurnoverStatus";

const date = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" }).format(new Date(`${value}T12:00:00Z`));
const time = (value: string) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(value));

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const { supabase, accountId } = await requireBusinessUser();
  let query = supabase.from("properties").select("id,nickname,address_line_1,city,postcode,status,work_items(id,status,turnover_date,access_start_at,window_end_at,next_checkin_at,assignments(status,assigned_at,workers(display_name)))").eq("account_id", accountId).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("nickname", `%${q}%`);
  const { data, error } = await query;
  if (error) throw new Error(`properties_query_failed:${error.code}`);
  const propertyIds = (data || []).map((property) => property.id);
  const { data: connectionRows, error: connectionError } = propertyIds.length ? await supabase.from("property_calendar_connections_safe").select("property_id,sync_status").in("property_id", propertyIds) : { data: [], error: null };
  if (connectionError) throw new Error(`calendar_status_query_failed:${connectionError.code}`);
  const reservationStatusByProperty = (connectionRows || []).reduce((memo: Record<string, { count: number; healthy: number; attention: number; neverSynced: number; syncing: number }>, connection: { property_id: string; sync_status: string }) => {
    const item = memo[connection.property_id] || { count: 0, healthy: 0, attention: 0, neverSynced: 0, syncing: 0 };
    item.count += 1;
    if (connection.sync_status === "healthy") item.healthy += 1;
    else if (connection.sync_status === "attention_required") item.attention += 1;
    else if (connection.sync_status === "never_synced") item.neverSynced += 1;
    else if (connection.sync_status === "syncing") item.syncing += 1;
    memo[connection.property_id] = item;
    return memo;
  }, {});
  return <div className="portal-page">
    <header className="portal-header"><div><h1 className="portal-title">Properties</h1><p className="portal-subtitle hidden sm:block">Manage property details and clean standards.</p></div>{data?.length ? <Link href="/business/properties/new" className="portal-action"><span className="sm:hidden">+ Property</span><span className="hidden sm:inline">Add property</span></Link> : null}</header>
    <form className={`${data?.length ? "grid" : "hidden"} mt-6 grid-cols-[1fr_auto] gap-3 rounded-xl border bg-white p-3 sm:grid-cols-[1fr_180px_auto]`}>
      <label><span className="sr-only">Search properties</span><input name="q" defaultValue={q} placeholder="Search properties" className="min-h-11 w-full rounded-lg border px-3"/></label>
      <details className="relative sm:contents"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-center rounded-lg border px-4 font-bold sm:hidden">Filter</summary><div className="absolute right-0 top-12 z-10 grid w-56 gap-2 rounded-lg border bg-white p-3 shadow-xl sm:static sm:contents"><label><span className="sr-only">Property status</span><select name="status" defaultValue={status || ""} className="min-h-11 w-full rounded-lg border px-3"><option value="">All properties</option><option value="active">Active</option><option value="archived">Inactive</option></select></label><button className="min-h-11 rounded-lg border px-4 font-bold">Apply filters</button></div></details>
    </form>
    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data?.length ? data.map((p) => {
      const upcoming = (p.work_items || []).filter((w) => new Date(w.access_start_at) > new Date() && w.status !== "cancelled").sort((a, b) => a.access_start_at.localeCompare(b.access_start_at))[0];
      return <article key={p.id} className={`portal-card p-4 ${p.status === "archived" ? "opacity-65" : ""}`}>
        <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold">{formatDisplayName(p.nickname)}</h2><p className="mt-1 text-sm text-[#657089]">{formatDisplayAddress([p.address_line_1, p.city, p.postcode])}</p></div><details className="relative"><summary aria-label="Property actions" className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-lg border">•••</summary><div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border bg-white p-2 shadow-xl"><ArchivePropertyForm id={p.id} archived={p.status === "archived"} hasActiveBookings={Boolean(upcoming)}/></div></details></div>
        <div className="mt-4 border-t pt-4"><p className="portal-label">Next clean</p>{upcoming ? <div className="mt-1"><p className="font-extrabold">{date(upcoming.turnover_date)} · {time(upcoming.access_start_at)}–{time(upcoming.window_end_at)}</p>{upcoming.next_checkin_at && <p className="mt-1 text-xs text-[#657089]">Guest check-in {time(upcoming.next_checkin_at)}</p>}<div className="mt-2"><TurnoverStatus status={upcoming.status}/></div></div> : <p className="mt-1 font-extrabold">No upcoming clean</p>}<Link href={`/business/properties/${p.id}?tab=reservations`} className="mt-4 flex min-h-11 items-center justify-between border-t pt-3 text-sm font-bold"><span>Booking calendar</span><span className="text-[#657089]">{(() => { const calendar = reservationStatusByProperty[p.id]; if (!calendar || calendar.count === 0) return "Connect →"; if (calendar.attention || calendar.neverSynced || calendar.syncing) return "Needs attention →"; return "Connected →"; })()}</span></Link></div>
        <div className="mt-4 flex gap-2"><Link href={`/business/properties/${p.id}`} className="portal-action-secondary flex-1">View property</Link>{p.status === "active" && <Link href={`/business/turnovers/new?property=${p.id}`} className="portal-action">Add clean</Link>}</div>
      </article>;
    }) : <div className="col-span-full rounded-xl border bg-white p-10 text-center"><h2 className="text-xl font-extrabold">Add your first property</h2><p className="mt-2 text-[#657089]">Connect its booking calendar and Quickola will automatically organise cleans after checkout.</p><Link href="/business/properties/new" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#071f49] px-5 font-bold text-white">Add property</Link></div>}</div>
  </div>;
}
