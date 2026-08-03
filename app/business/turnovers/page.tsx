import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import { formatDisplayName } from "@/lib/display-name";
import {
  currentAssignment,
  turnoverActionReason,
} from "@/lib/turnovers/presentation";
import TurnoverStatus from "../components/TurnoverStatus";

type Row = {
  id: string;
  turnover_date: string;
  access_start_at: string;
  guest_checkout_at: string;
  next_checkin_at: string | null;
  window_end_at: string;
  cleaning_type: string;
  status: string;
  readiness_result: { blocking_reasons?: string[] } | null;
  properties:
    | { nickname: string; postcode: string; bedrooms:number|null }
    | { nickname: string; postcode: string; bedrooms:number|null }[]
    | null;
  assignments: Array<{
    status: string;
    assigned_at: string;
    response_due_at: string | null;
    workers: { display_name: string } | { display_name: string }[] | null;
  }>;
};
const related = <T,>(value: T | T[] | null) =>
  Array.isArray(value) ? value[0] : value;
const date = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
const time = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(new Date(value));
const actionReason = (row: Row, today: string) => {
  const reason = turnoverActionReason(row, today);
  return reason === "Turnover overdue" ? "Clean overdue" : reason;
};

function CleanIcon({ name }: { name: "calendar" | "clock" | "building" | "warning" | "chevron" }) {
  const paths = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    building: <path d="M5 21V4h10v17M15 9h4v12M8 8h2M8 12h2M8 16h2M11 8h1M11 12h1M11 16h1" />,
    warning: <><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5M12 17.2h.01" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
  };
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    view?: string;
    q?: string;
    date?: string;
    property?: string;
  }>;
}) {
  const { supabase, accountId } = await requireBusinessUser();
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("work_items")
    .select(
      "id,turnover_date,guest_checkout_at,access_start_at,window_end_at,next_checkin_at,cleaning_type,status,readiness_result,properties(nickname,postcode,bedrooms),assignments(status,assigned_at,response_due_at,workers(display_name))",
    )
    .eq("account_id", accountId)
    .order("access_start_at");
  if (params.status) query = query.eq("status", params.status);
  if (params.date) query = query.eq("turnover_date", params.date);
  if (params.property) query = query.eq("property_id", params.property);
  const { data, error } = await query;
  if (error) throw new Error(`turnovers_query_failed:${error.code}`);
  const view = params.view || "upcoming";
  const search = params.q?.trim().toLowerCase() || "";
  const rows = ((data || []) as Row[]).filter((row) => {
    const property = related(row.properties);
    if (
      search &&
      !`${property?.nickname || ""} ${property?.postcode || ""}`
        .toLowerCase()
        .includes(search)
    )
      return false;
    const completed = ["ready", "cancelled"].includes(row.status);
    const attention =
      row.turnover_date < today ||
      ["unassigned", "declined", "action_required"].includes(row.status);
    if (params.status) return true;
    if (view === "completed") return completed;
    if (view === "attention") return !completed && attention;
    return !completed && row.turnover_date >= today;
  });
  const href = (nextView: string) => `/business/turnovers?view=${nextView}`;
  const featured = view === "upcoming" ? rows[0] : null;
  const listRows = featured ? rows.slice(1) : rows;
  const featuredProperty = featured ? related(featured.properties) : null;
  return (
    <div className="portal-page">
      <header className="portal-header">
        <div>
          <h1 className="portal-title">
            Cleans
          </h1>
          <p className="portal-subtitle hidden sm:block">
            Track every clean from checkout to property ready.
          </p>
        </div>
        <Link
          href="/business/turnovers/new"
          className="portal-action"
        >
          <span className="sm:hidden">+ Clean</span>
          <span className="hidden sm:inline">Add clean</span>
        </Link>
      </header>
      <nav
        aria-label="Clean views"
        className="mt-5 grid grid-cols-3 border-b"
      >
        {[
          ["Upcoming", "upcoming"],
          ["Attention", "attention"],
          ["Completed", "completed"],
        ].map(([label, value]) => (
          <Link
            key={value}
            href={href(value)}
            aria-current={view === value ? "page" : undefined}
            className={`min-h-12 border-b-2 px-2 text-center text-sm font-extrabold leading-[46px] ${view === value ? "border-[#16467e] text-[#16467e]" : "border-transparent text-[#657089]"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <form className={`${rows.length ? "mt-4 hidden sm:grid" : "hidden"} grid-cols-[1fr_180px_auto] gap-2`}>
        <input type="hidden" name="view" value={view} />
        <label>
          <span className="sr-only">Search properties</span>
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search property or postcode"
            className="min-h-11 w-full rounded-lg border px-3"
          />
        </label>
        <label>
          <span className="sr-only">Clean date</span>
          <input
            type="date"
            name="date"
            defaultValue={params.date}
            className="min-h-11 w-full rounded-lg border px-3"
          />
        </label>
        <button className="rounded-lg border bg-white px-4 font-bold">
          Filter
        </button>
      </form>
      {featured && (
        <section className="mt-4 grid gap-3" aria-labelledby="next-clean-title">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#16467e]"><CleanIcon name="calendar" /><h2 id="next-clean-title">Next clean</h2><span className="ml-auto text-sm font-bold text-[#657089]">{date(featured.turnover_date)}</span></div>
          <Link href={`/business/turnovers/${featured.id}`} className="portal-card border-l-4 border-l-[#2d67b2] p-5 outline-none focus-visible:ring-4 focus-visible:ring-[#2d67b2]/20">
            <div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="text-lg font-extrabold break-words">{formatDisplayName(featuredProperty?.nickname)}</p><p className="mt-1 text-sm text-[#657089]">{featuredProperty?.postcode}</p></div><span className="shrink-0 rounded-full bg-[#eef5ff] px-2.5 py-1 text-xs font-extrabold text-[#16467e]">{time(featured.access_start_at)}</span></div>
            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-[#edf0f3] pt-4 text-sm font-bold"><span className="flex items-center gap-2"><CleanIcon name="clock" />{time(featured.access_start_at)} → {time(featured.window_end_at)}</span><TurnoverStatus status={featured.status} /></div>
          </Link>
          {listRows.length ? <p className="text-sm font-extrabold text-[#657089]">Upcoming</p> : null}
        </section>
      )}
      {(listRows.length || !rows.length) && <div className="portal-panel mt-4">
        {listRows.length ? (
          <div className="divide-y divide-[#e7ebf0]">
            <div className="hidden grid-cols-[112px_minmax(190px,1fr)_190px_minmax(170px,1fr)_20px] gap-4 bg-[#f7f9fb] px-5 py-3 text-xs font-extrabold text-[#657089] lg:grid">
              <span>When</span>
              <span>Property</span>
              <span>Cleaning window</span>
              <span>Status</span>
              <span />
            </div>
            {listRows.map((row) => {
              const property = related(row.properties);
              const assignment = currentAssignment(row.assignments);
              const worker = related(assignment?.workers || null);
              return (
                <Link
                  href={`/business/turnovers/${row.id}`}
                  key={row.id}
                  className="portal-list-row grid grid-cols-[52px_minmax(0,1fr)_20px] items-center gap-3 p-4 outline-none lg:grid-cols-[112px_minmax(190px,1fr)_190px_minmax(170px,1fr)_20px] lg:items-center lg:gap-4 lg:px-5 lg:py-5"
                >
                  <div className="hidden lg:block">
                    <p className="font-extrabold">{date(row.turnover_date)}</p>
                  </div>
                  <div className="hidden lg:block">
                    <p className="font-extrabold">
                      {formatDisplayName(property?.nickname)}
                    </p>
                    <p className="mt-0.5 text-xs text-[#657089]">
                      {property?.postcode}
                    </p>
                  </div>
                  <div className="hidden text-sm lg:block"><p className="font-bold">{time(row.access_start_at)} → {time(row.window_end_at)}</p>{row.next_checkin_at && <p className="mt-1 text-xs text-[#657089]">Guest check-in {time(row.next_checkin_at)}</p>}</div>
                  <div className="hidden lg:block">
                    <TurnoverStatus status={row.status} />
                    {row.status !== "unassigned" && <p className="mt-2 text-xs leading-5 text-[#657089]">
                      {assignment?.status === "pending" &&
                      assignment.response_due_at
                        ? `${new Date(assignment.response_due_at) < new Date() ? "Response overdue" : "Reply due"} ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(assignment.response_due_at))}`
                        : actionReason(row, today)}{worker?.display_name&&["accepted","en_route","arrived","in_progress"].includes(row.status)?` · ${formatDisplayName(worker.display_name)}`:""}
                    </p>}
                  </div>
                  <span aria-hidden="true" className="hidden text-xl lg:block">
                    ›
                  </span>
                  <div className="flex h-full flex-col justify-center text-center lg:hidden"><span className="text-xs font-extrabold uppercase text-[#657089]">{new Intl.DateTimeFormat("en-GB", { month: "short" }).format(new Date(`${row.turnover_date}T12:00:00Z`))}</span><span className="text-xl font-extrabold text-[#16467e]">{new Intl.DateTimeFormat("en-GB", { day: "numeric" }).format(new Date(`${row.turnover_date}T12:00:00Z`))}</span></div>
                  <div className="min-w-0 lg:hidden"><p className="break-words font-extrabold">{formatDisplayName(property?.nickname)}</p><p className="mt-1 text-xs text-[#657089]">{time(row.access_start_at)} → {time(row.window_end_at)}</p><div className="mt-2"><TurnoverStatus status={row.status} /></div></div>
                  <span aria-hidden="true" className="text-xl text-[#657089] lg:hidden"><CleanIcon name="chevron" /></span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <h2 className="text-lg font-extrabold">{view === "upcoming" ? "No upcoming cleans" : view === "attention" ? "No cleans need attention" : "No completed cleans"}</h2>
            <p className="mt-2 text-sm text-[#657089]">
              {view === "upcoming" ? "Cleans will appear here automatically when bookings are added or imported." : view === "attention" ? "Any clean that needs action will appear here." : "Completed cleans will appear here."}
            </p>
          </div>
        )}
      </div>}
    </div>
  );
}
