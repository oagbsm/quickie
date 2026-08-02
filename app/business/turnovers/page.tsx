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
          <span className="sm:hidden">+ Add</span>
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
      <div className="portal-panel mt-4">
        {rows.length ? (
          <div className="divide-y divide-[#e7ebf0]">
            <div className="hidden grid-cols-[112px_minmax(170px,1fr)_156px_minmax(190px,1fr)_20px] gap-4 bg-[#f7f9fb] px-5 py-3 text-xs font-extrabold text-[#657089] lg:grid">
              <span>When</span>
              <span>Property</span>
              <span>Checkout / Check-in</span>
              <span>What’s happening</span>
              <span />
            </div>
            {rows.map((row) => {
              const property = related(row.properties);
              const assignment = currentAssignment(row.assignments);
              const worker = related(assignment?.workers || null);
              return (
                <Link
                  href={`/business/turnovers/${row.id}`}
                  key={row.id}
                  className="portal-list-row grid gap-2 p-4 outline-none lg:grid-cols-[112px_minmax(170px,1fr)_156px_minmax(190px,1fr)_20px] lg:items-center lg:gap-4 lg:px-5 lg:py-5"
                >
                  <div>
                    <p className="font-extrabold">{date(row.turnover_date)}</p>
                    <p className="mt-0.5 text-sm font-bold text-[#273752]">{time(row.guest_checkout_at)}</p>
                  </div>
                  <div>
                    <p className="font-extrabold">
                      {formatDisplayName(property?.nickname)}
                    </p>
                    <p className="mt-0.5 text-xs text-[#657089]">
                      {property?.postcode}{property?.bedrooms!=null?` · ${property.bedrooms} bed`:""} ·{" "}
                      {row.cleaning_type.replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="hidden text-xs lg:block"><p className="text-[#718096]">Checkout <strong className="text-[#12213c]">{time(row.guest_checkout_at)}</strong></p><p className="mt-1 text-[#718096]">{row.next_checkin_at ? "Check-in" : "Deadline"} <strong className="text-[#12213c]">{time(row.next_checkin_at || row.window_end_at)}</strong></p></div>
                  <div className="lg:hidden">
                    <TurnoverStatus status={row.status} />
                    <p className="text-xs font-bold text-[#9a4f17]">
                      {assignment?.status === "pending" &&
                      assignment.response_due_at
                        ? `${new Date(assignment.response_due_at) < new Date() ? "Response overdue" : "Reply due"} ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(assignment.response_due_at))}`
                        : turnoverActionReason(row, today)}
                    </p>
                  </div>
                  <div className="hidden lg:block">
                    <TurnoverStatus status={row.status} />
                    <p className="mt-2 text-xs leading-5 text-[#657089]">
                      {assignment?.status === "pending" &&
                      assignment.response_due_at
                        ? `${new Date(assignment.response_due_at) < new Date() ? "Response overdue" : "Reply due"} ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(assignment.response_due_at))}`
                        : turnoverActionReason(row, today)}{worker?.display_name&&["accepted","en_route","arrived","in_progress"].includes(row.status)?` · ${formatDisplayName(worker.display_name)}`:""}
                    </p>
                  </div>
                  <span aria-hidden="true" className="hidden text-xl lg:block">
                    ›
                  </span>
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
      </div>
    </div>
  );
}
