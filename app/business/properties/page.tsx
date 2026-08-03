import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import { formatDisplayName } from "@/lib/display-name";
import { formatDisplayAddress } from "@/lib/display-address";
import ArchivePropertyForm from "./ArchivePropertyForm";

const date = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" }).format(new Date(`${value}T12:00:00Z`));
const time = (value: string) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(value));

type PropertyIconName = "building" | "calendar" | "calendar-plus" | "search" | "filter" | "eye" | "check" | "warning" | "chevron";

function PropertyIcon({ name, className = "h-5 w-5" }: { name: PropertyIconName; className?: string }) {
  const paths = {
    building: <><path d="M5 21V4h10v17M15 9h4v12M8 8h2M8 12h2M8 16h2M11 8h1M11 12h1M11 16h1" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" /></>,
    "calendar-plus": <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M12 13v6M9 16h6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    filter: <path d="M3 5h18M6 12h12M10 19h4" />,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    warning: <><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5M12 17.2h.01" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
  };

  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const { supabase, accountId } = await requireBusinessUser();
  let query = supabase.from("properties").select("id,nickname,address_line_1,city,postcode,status,work_items(id,status,turnover_date,access_start_at,window_end_at,next_checkin_at,assignments(status,assigned_at,workers(display_name)))").eq("account_id", accountId).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("nickname", `%${q}%`);
  const { data, error } = await query;
  if (error) throw new Error(`properties_query_failed:${error.code}`);
  const propertyIds = (data || []).map((property) => property.id);
  const { data: connectionRows, error: connectionError } = propertyIds.length ? await supabase.from("property_calendar_connections_safe").select("property_id,sync_status,last_error_code").in("property_id", propertyIds) : { data: [], error: null };
  if (connectionError) throw new Error(`calendar_status_query_failed:${connectionError.code}`);
  const { data: issueRows, error: issueError } = propertyIds.length ? await supabase.from("reservation_sync_issues").select("property_id,issue_type").in("property_id", propertyIds).eq("issue_status", "open") : { data: [], error: null };
  if (issueError) throw new Error(`calendar_issue_query_failed:${issueError.code}`);
  const reservationStatusByProperty = (connectionRows || []).reduce((memo: Record<string, { count: number; healthy: number; attention: number; neverSynced: number; syncing: number; disabled: number; errorCodes: string[]; conflicts: number }>, connection: { property_id: string; sync_status: string; last_error_code: string | null }) => {
    const item = memo[connection.property_id] || { count: 0, healthy: 0, attention: 0, neverSynced: 0, syncing: 0, disabled: 0, errorCodes: [], conflicts: 0 };
    item.count += 1;
    if (connection.sync_status === "healthy") item.healthy += 1;
    else if (connection.sync_status === "attention_required") item.attention += 1;
    else if (connection.sync_status === "never_synced") item.neverSynced += 1;
    else if (connection.sync_status === "syncing") item.syncing += 1;
    else if (connection.sync_status === "disabled") item.disabled += 1;
    if (connection.last_error_code) item.errorCodes.push(connection.last_error_code);
    memo[connection.property_id] = item;
    return memo;
  }, {});
  for (const issue of issueRows || []) {
    const item = reservationStatusByProperty[issue.property_id] || { count: 0, healthy: 0, attention: 0, neverSynced: 0, syncing: 0, disabled: 0, errorCodes: [], conflicts: 0 };
    if (issue.issue_type === "overlap_conflict") item.conflicts += 1;
    reservationStatusByProperty[issue.property_id] = item;
  }
  const attentionCount = (data || []).filter((property) => {
    const upcoming = (property.work_items || []).filter((work) => new Date(work.access_start_at) > new Date() && work.status !== "cancelled").sort((a, b) => a.access_start_at.localeCompare(b.access_start_at))[0];
    const calendar = reservationStatusByProperty[property.id];
    return Boolean(calendar?.conflicts || calendar?.attention || calendar?.neverSynced || calendar?.syncing || upcoming && ["unassigned", "declined", "action_required"].includes(upcoming.status));
  }).length;
  const compactSummary = (data || []).length <= 3;
  const hasSearchOrFilter = Boolean(q || status);
  return <div className="portal-page">
    <header className="portal-header"><div><h1 className="portal-title">Properties</h1><p className="portal-subtitle hidden sm:block">Manage property details and clean standards.</p></div>{data?.length ? <Link href="/business/properties/new" className="portal-action"><span className="sm:hidden">+ Property</span><span className="hidden sm:inline">Add property</span></Link> : null}</header>
    <form className={`${data?.length ? "grid" : "hidden"} mt-5 grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-xl border bg-white p-3 sm:mt-6 sm:grid-cols-[1fr_180px_auto]`}>
      <label className="relative min-w-0"><span className="sr-only">Search properties</span><PropertyIcon name="search" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b899e]" /><input name="q" defaultValue={q} placeholder="Search properties" className="min-h-11 w-full rounded-lg border pl-10 pr-3"/></label>
      <details className="relative sm:contents"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-lg border px-4 font-bold sm:hidden"><PropertyIcon name="filter" />Filter</summary><div className="absolute right-0 top-12 z-10 grid w-56 gap-2 rounded-lg border bg-white p-3 shadow-xl sm:static sm:contents"><label><span className="sr-only">Property status</span><select name="status" defaultValue={status || ""} className="min-h-11 w-full rounded-lg border px-3"><option value="">All properties</option><option value="active">Active</option><option value="archived">Inactive</option></select></label><button className="min-h-11 rounded-lg border px-4 font-bold">Apply filters</button></div></details>
    </form>
    {data?.length ? compactSummary ? <section className="mt-3 rounded-xl border border-[#dfe6ef] bg-white px-3 py-2.5 text-sm sm:mt-5 sm:px-4" aria-label="Property portfolio summary"><span className="font-extrabold">{data.length} {data.length === 1 ? "property" : "properties"}</span><span className="mx-2 text-[#a0aabd]" aria-hidden="true">·</span><span className={attentionCount ? "font-bold text-[#657089]" : "text-[#657089]"}>{attentionCount} need attention</span></section> : <section className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-[#dfe6ef] bg-white p-3 sm:mt-5 sm:gap-4 sm:p-4" aria-label="Property portfolio summary"><div className="flex items-center gap-2.5"><span className="text-[#245b9d]"><PropertyIcon name="building" /></span><div><p className="text-lg font-extrabold leading-none">{data.length}</p><p className="mt-1 text-xs font-bold text-[#657089]">Total properties</p></div></div><div className="flex items-center gap-2.5"><span className={attentionCount ? "text-amber-700" : "text-[#657089]"}><PropertyIcon name="warning" /></span><div><p className="text-lg font-extrabold leading-none">{attentionCount}</p><p className="mt-1 text-xs font-bold text-[#657089]">Need attention</p></div></div></section> : null}
    <div className="mt-3 grid gap-3 md:mt-5 md:gap-4 md:grid-cols-2 xl:grid-cols-3">{data?.length ? data.map((p) => {
      const upcoming = (p.work_items || []).filter((w) => new Date(w.access_start_at) > new Date() && w.status !== "cancelled").sort((a, b) => a.access_start_at.localeCompare(b.access_start_at))[0];
      const calendar = reservationStatusByProperty[p.id];
      const cleanNeedsAttention = upcoming && ["unassigned", "declined", "action_required"].includes(upcoming.status);
      const cleanLabel = !upcoming ? "No upcoming cleans" : cleanNeedsAttention ? "Needs cleaner" : "Next clean";
      const calendarNeedsAttention = Boolean(calendar?.attention || calendar?.neverSynced || calendar?.syncing || calendar?.disabled);
      const calendarLabel = calendar?.conflicts
        ? "Booking conflict · Review"
        : !calendar || calendar.count === 0
        ? "Calendar not connected"
        : calendar.disabled
          ? "Calendar connection disabled"
          : calendar.neverSynced
            ? "Calendar not synced yet"
            : calendar.syncing
              ? "Calendar syncing"
              : calendar.attention
                ? calendar.errorCodes.length > 0
                  ? "Calendar sync failed"
                  : "Calendar issue · Review"
                : calendar.count > 1 ? "Calendars connected" : "Calendar connected";
      const calendarIcon = calendar?.conflicts || (!calendar || calendar.count === 0) ? (calendar?.conflicts ? "warning" : "calendar") : calendarNeedsAttention ? "warning" : "check";
      const calendarClass = (calendar?.conflicts || calendarNeedsAttention) && !cleanNeedsAttention ? "text-amber-800" : calendarIcon === "check" ? "text-emerald-700" : "text-[#657089]";
      return <article key={p.id} className={`portal-card relative overflow-visible ${p.status === "archived" ? "opacity-65" : ""}`}>
        <Link href={`/business/properties/${p.id}`} className="group block min-w-0 p-4 pr-16 outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#2d67b2]/25">
          <div className="flex min-w-0 items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eef3f9] text-[#245b9d]"><PropertyIcon name="building" /></span><div className="min-w-0"><h2 className="break-words text-lg font-extrabold group-hover:text-[#16467e]">{formatDisplayName(p.nickname)}</h2><p className="mt-1 break-words text-sm text-[#657089]">{formatDisplayAddress([p.address_line_1, p.city, p.postcode])}</p></div></div>
          <div className="mt-4 grid gap-2 border-t border-[#edf0f3] pt-3"><div className={`flex min-w-0 items-center gap-2 text-sm font-bold ${cleanNeedsAttention ? "text-amber-800" : upcoming ? "text-[#16467e]" : "text-[#657089]"}`}><PropertyIcon name="calendar" /><span className="min-w-0 flex-1 break-words">{cleanLabel}{upcoming ? ` · ${date(upcoming.turnover_date)}, ${time(upcoming.access_start_at)}–${time(upcoming.window_end_at)}` : ""}</span><PropertyIcon name="chevron" /></div><div className={`flex items-center gap-2 text-sm font-bold ${calendarClass}`}><PropertyIcon name={calendarIcon} /><span>{calendarLabel}</span></div></div>
        </Link>
        <details className="absolute right-3 top-3 z-10"><summary aria-label={`Property actions for ${formatDisplayName(p.nickname)}`} title="Property actions" className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-lg border bg-white text-[#526078] outline-none hover:bg-[#f4f6f9] focus-visible:ring-4 focus-visible:ring-[#2d67b2]/20">•••</summary><div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white p-2 shadow-xl"><ArchivePropertyForm id={p.id} archived={p.status === "archived"} hasActiveBookings={Boolean(upcoming)}/></div></details>
        <div className="flex gap-2 border-t border-[#edf0f3] p-3"><Link href={`/business/properties/${p.id}`} className="portal-action-secondary inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2"><PropertyIcon name="eye" />View property</Link>{p.status === "active" && <Link href={`/business/turnovers/new?property=${p.id}`} className="portal-action inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap"><PropertyIcon name="calendar-plus" />Add clean</Link>}</div>
      </article>;
    }) : <div className="col-span-full rounded-xl border bg-white p-10 text-center"><h2 className="text-xl font-extrabold">{hasSearchOrFilter ? "No properties found" : "Add your first property"}</h2><p className="mt-2 text-[#657089]">{hasSearchOrFilter ? "Try clearing your search or filters." : "Connect its booking calendar and Quickola will automatically organise cleans after checkout."}</p>{hasSearchOrFilter ? <Link href="/business/properties" className="mt-5 inline-flex min-h-11 items-center rounded-lg border px-5 font-bold">Clear search and filters</Link> : <Link href="/business/properties/new" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#071f49] px-5 font-bold text-white">Add property</Link>}</div>}</div>
  </div>;
}
