import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import { formatDisplayName } from "@/lib/display-name";
import { formatDisplayAddress } from "@/lib/display-address";
import { currentAssignment } from "@/lib/turnovers/presentation";
import TurnoverStatus from "../components/TurnoverStatus";

const one = <T,>(value: T | T[] | null) => Array.isArray(value) ? value[0] : value;
const time = (value: string) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(value));
const date = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(value));
const deadline = (item: { next_checkin_at?: string | null; window_end_at?: string | null; access_start_at?: string | null }) => item.next_checkin_at || item.window_end_at || item.access_start_at || "";
const urgency = (value: string) => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "upcoming" as const;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  if (timestamp < startOfToday.getTime()) return "overdue" as const;
  if (timestamp < startOfTomorrow.getTime()) return "today" as const;
  return "upcoming" as const;
};
const iconPath = (name: string) => `/icons/dashboard/${name}.svg`;
function DashboardIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return <span aria-hidden="true" className={`inline-block shrink-0 bg-current ${className}`} style={{ maskImage: `url(${iconPath(name)})`, WebkitMaskImage: `url(${iconPath(name)})`, maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center", maskSize: "contain", WebkitMaskSize: "contain" }} />;
}
export default async function Page() {
  const { supabase, accountId } = await requireBusinessUser();
  const [{ data }, { data: properties }] = await Promise.all([
    supabase.from("work_items").select("id,property_public_name,turnover_date,guest_checkout_at,access_start_at,next_checkin_at,window_end_at,status,properties(nickname,address_line_1,city,postcode),assignments(status,assigned_at,response_due_at,workers(display_name)),operational_issues(status,blocking)").eq("account_id", accountId).order("access_start_at").limit(250),
    supabase.from("properties").select("id").eq("account_id", accountId),
  ]);
  const items = data || [];
  const active = items.filter((item) => !["ready", "cancelled"].includes(item.status));
  const readyToday = items.filter((item) => item.status === "ready" && item.turnover_date === new Date().toISOString().slice(0, 10));
  const unassigned = items.filter((item) => item.status === "unassigned");
  const openIssues = items.filter((item) => (item.operational_issues || []).some((issue: { status: string }) => !["resolved", "closed"].includes(issue.status)));
  const declined = items.filter((item) => item.status === "declined");
  const attention = [...unassigned, ...openIssues, ...declined]
    .filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((a, b) => deadline(a).localeCompare(deadline(b)));
  const attentionIds = new Set(attention.map((item) => item.id));
  const upcoming = active.filter((item) => item.turnover_date >= new Date().toISOString().slice(0, 10) && !attentionIds.has(item.id)).slice(0, 5);
  const nextClean = active.filter((item) => item.turnover_date >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.access_start_at.localeCompare(b.access_start_at))[0];
  const completed = items.filter((item) => item.status === "ready").slice(0, 5);
  const propertyIds = (properties || []).map((property) => property.id);
  const { data: calendarConnections, error: calendarError } = propertyIds.length
    ? await supabase.from("property_calendar_connections_safe").select("property_id").in("property_id", propertyIds)
    : { data: [], error: null };
  if (calendarError) {
    console.error("dashboard_calendar_state_query_failed", { operation: "business_dashboard_calendar_cta", accountId, code: calendarError.code });
    throw new Error(`dashboard_calendar_state_query_failed:${calendarError.code}`);
  }
  const setupCta = !propertyIds.length
    ? { label: "Add property", href: "/business/properties/new" }
    : !calendarConnections?.length
      ? { label: "Connect your first calendar", href: `/business/properties/${propertyIds[0]}?tab=reservations` }
      : null;
  const readyTone = readyToday.length
    ? { icon: "check-square", iconClass: "bg-[#ecfdf3] text-[#22c55e]", copy: "Property-ready status" }
    : { icon: "calendar", iconClass: "bg-[#f4f7fb] text-[#657089]", copy: "None ready yet" };
  const cleanerTone = unassigned.length
    ? { iconClass: "bg-[#fff7e8] text-[#f59e0b]", copy: "Needs attention" }
    : { iconClass: "bg-[#f4f7fb] text-[#657089]", copy: "No cleaner gaps" };
  return <div className="portal-page"><header className="portal-header"><div><h1 className="portal-title">Cleaning overview</h1><p className="portal-subtitle">See what needs attention and how each clean is progressing.</p></div>{setupCta && <Link href={setupCta.href} className="portal-action">{setupCta.label}</Link>}</header>
    <section className="mt-6 grid grid-cols-3 gap-2 sm:gap-3"><Link href="/business/turnovers" className="portal-card flex min-h-[108px] min-w-0 items-center gap-2 p-3 shadow-sm sm:min-h-[124px] sm:gap-4 sm:p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eff6ff] text-[#2563eb] sm:h-14 sm:w-14"><DashboardIcon name="calendar" className="h-5 w-5 sm:h-7 sm:w-7"/></span><span className="min-w-0"><p className="text-[11px] font-extrabold leading-4 text-[#657089] sm:text-xs">Upcoming cleans</p><strong className="mt-1 block text-2xl sm:text-3xl">{active.length}</strong>{nextClean && <span className="hidden text-xs font-semibold text-[#657089] sm:block">Next: {date(nextClean.turnover_date)}, {time(nextClean.access_start_at)}</span>}</span></Link><Link href="/business/turnovers?view=completed" className="portal-card flex min-h-[108px] min-w-0 items-center gap-2 p-3 shadow-sm sm:min-h-[124px] sm:gap-4 sm:p-5"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${readyTone.iconClass} sm:h-14 sm:w-14`}><DashboardIcon name={readyTone.icon} className="h-5 w-5 sm:h-7 sm:w-7"/></span><span className="min-w-0"><p className="text-[11px] font-extrabold leading-4 text-[#657089] sm:text-xs">Ready today</p><strong className="mt-1 block text-2xl sm:text-3xl">{readyToday.length}</strong><span className="hidden text-xs font-semibold text-[#657089] sm:block">{readyTone.copy}</span></span></Link><Link href="/business/turnovers?view=attention" className={`portal-card flex min-h-[108px] min-w-0 items-center gap-2 p-3 shadow-sm sm:min-h-[124px] sm:gap-4 sm:p-5 ${unassigned.length > 0 ? "border-amber-200 bg-amber-50/30" : ""}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${cleanerTone.iconClass} sm:h-14 sm:w-14`}><DashboardIcon name="user" className="h-5 w-5 sm:h-7 sm:w-7"/></span><span className="min-w-0"><p className="text-[11px] font-extrabold leading-4 text-[#657089] sm:text-xs">Needs cleaner</p><strong className="mt-1 block text-2xl sm:text-3xl">{unassigned.length}</strong><span className={`hidden text-xs font-semibold sm:block ${unassigned.length ? "text-[#9a6410]" : "text-[#657089]"}`}>{cleanerTone.copy}</span></span></Link></section>
    {attention.length > 0 && <section className="mt-5 rounded-xl border border-[#dfe6ef] border-l-4 border-l-amber-400 bg-white p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-extrabold text-[#071f49]"><DashboardIcon name="alert-triangle" className="h-6 w-6 text-[#f59e0b]"/>Needs attention</h2>{attention.length > 3 && <Link href="/business/turnovers?view=attention" className="shrink-0 text-sm font-extrabold text-[#16467e]">View all attention →</Link>}</div><div className="mt-3 grid gap-2">{attention.slice(0, 3).map((item) => { const property = one(item.properties); const issue = (item.operational_issues || []).find((entry: { status: string }) => !["resolved", "closed"].includes(entry.status)); const action = item.status === "unassigned" ? "Assign cleaner" : issue ? "Review issue" : "Review clean"; const statusLabel = item.status === "unassigned" ? "Needs cleaner" : issue ? "Needs attention" : "Review clean"; const itemUrgency = urgency(deadline(item)); const urgencyText = itemUrgency === "overdue" ? "Overdue" : itemUrgency === "today" ? "Due today" : "Upcoming"; const location = property?.postcode || property?.city || property?.address_line_1; return <article key={item.id} className="flex flex-col gap-3 rounded-lg border border-[#e7ebf0] p-3 sm:flex-row sm:items-center sm:gap-4"><div className="flex min-w-0 flex-1 items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f4f6f9] text-[#657089]"><DashboardIcon name="home" className="h-6 w-6"/></span><div className="min-w-0"><p className={`text-sm font-extrabold ${itemUrgency === "overdue" ? "text-red-700" : itemUrgency === "today" ? "text-amber-700" : "text-[#526078]"}`}>{urgencyText} · {date(item.turnover_date)} · before {time(deadline(item))}</p><Link href={`/business/turnovers/${item.id}`} className="mt-1 block font-extrabold text-[#071f49] hover:underline">{formatDisplayName(property?.nickname || item.property_public_name)}</Link><span className="mt-1 inline-flex rounded-full bg-[#f4f6f9] px-2 py-1 text-xs font-extrabold text-[#526078]">{statusLabel}</span>{location && <p className="mt-1 flex items-center gap-1 text-xs text-[#657089]"><DashboardIcon name="map-pin" className="h-4 w-4"/>{location}</p>}</div></div><div className="flex items-center gap-2 sm:shrink-0"><Link href={`/business/turnovers/${item.id}`} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#071f49] px-3 text-sm font-extrabold text-white sm:w-auto">{action} →</Link><DashboardIcon name="chevron-right" className="h-5 w-5 text-[#8190a5]"/></div></article>; })}</div></section>}
    {upcoming.length > 0 && <section className="mt-5 portal-panel"><div className="portal-panel-head"><h2 className="flex items-center gap-2 text-lg font-extrabold"><DashboardIcon name="calendar" className="h-5 w-5 text-[#526078]"/>Upcoming cleans</h2><Link href="/business/turnovers" className="flex items-center gap-1 text-sm font-extrabold text-[#16467e]">View all<DashboardIcon name="chevron-right" className="h-4 w-4"/></Link></div><div className="divide-y">{upcoming.map((item) => { const property = one(item.properties); return <Link href={`/business/turnovers/${item.id}`} key={item.id} className="block p-4 outline-none"><div className="flex items-center justify-between gap-3"><div><p className="font-extrabold">{formatDisplayName(property?.nickname || item.property_public_name)}</p><p className="mt-1 text-sm text-[#657089]">Clean {time(item.access_start_at)}–{time(item.window_end_at)} · Guest check-in {time(item.next_checkin_at || item.window_end_at)}</p><p className="mt-1 text-xs text-[#657089]">{formatDisplayAddress([property?.address_line_1, property?.city, property?.postcode])}</p></div><TurnoverStatus status={item.status}/></div></Link>; })}</div></section>}
    {completed.length > 0 && <section className="mt-5 portal-panel"><div className="portal-panel-head"><h2 className="text-lg font-extrabold">Recently completed</h2><Link href="/business/turnovers?view=completed" className="text-sm font-extrabold text-[#16467e]">View all</Link></div><div className="divide-y">{completed.map((item) => { const property = one(item.properties); const assignment = currentAssignment(item.assignments); const worker = one(assignment?.workers || null); return <Link href={`/business/turnovers/${item.id}`} key={item.id} className="flex items-center justify-between gap-3 p-4"><span><strong>{formatDisplayName(property?.nickname || item.property_public_name)}</strong><span className="mt-1 block text-sm text-[#657089]">Property ready · {worker?.display_name ? formatDisplayName(worker.display_name) : "Cleaner"}</span></span><TurnoverStatus status="ready"/></Link>; })}</div></section>}
  </div>;
}
