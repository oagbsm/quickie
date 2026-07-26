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
  next_checkin_at: string;
  cleaning_type: string;
  status: string;
  readiness_result: { blocking_reasons?: string[] } | null;
  properties:
    | { nickname: string; postcode: string }
    | { nickname: string; postcode: string }[]
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
  }>;
}) {
  const { supabase, accountId } = await requireBusinessUser();
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("work_items")
    .select(
      "id,turnover_date,access_start_at,next_checkin_at,cleaning_type,status,readiness_result,properties(nickname,postcode),assignments(status,assigned_at,response_due_at,workers(display_name))",
    )
    .eq("account_id", accountId)
    .order("access_start_at");
  if (params.status) query = query.eq("status", params.status);
  if (params.date) query = query.eq("turnover_date", params.date);
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
    <div className="mx-auto max-w-[1240px]">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="hidden text-sm font-extrabold text-[#2d67b2] sm:block">
            OPERATIONS
          </p>
          <h1 className="text-2xl font-extrabold tracking-[-.03em] sm:mt-1 sm:text-4xl">
            Arrivals
          </h1>
          <p className="mt-1 hidden text-[#657089] sm:block">
            Every upcoming guest arrival and its readiness decision.
          </p>
        </div>
        <Link
          href="/business/turnovers/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#071f49] px-4 font-extrabold text-white"
        >
          <span className="sm:hidden">+ Create</span>
          <span className="hidden sm:inline">Add arrival</span>
        </Link>
      </header>
      <nav
        aria-label="Turnover views"
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
      <form className="mt-4 hidden grid-cols-[1fr_180px_auto] gap-2 sm:grid">
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
          <span className="sr-only">Turnover date</span>
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
      <div className="mt-4 overflow-hidden rounded-xl border border-[#dfe4eb] bg-white">
        {rows.length ? (
          <div className="divide-y divide-[#e7ebf0]">
            <div className="hidden grid-cols-[130px_minmax(180px,1fr)_150px_170px_150px_24px] gap-3 bg-[#f7f9fb] px-5 py-3 text-xs font-extrabold text-[#657089] lg:grid">
              <span>Date</span>
              <span>Property</span>
              <span>Window</span>
              <span>Cleaner</span>
              <span>Status</span>
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
                  className="grid gap-2 p-4 outline-none hover:bg-[#f8fafc] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#2d67b2]/25 lg:grid-cols-[130px_minmax(180px,1fr)_150px_170px_150px_24px] lg:items-center lg:gap-3 lg:px-5"
                >
                  <div className="flex items-start justify-between gap-3 lg:block">
                    <div>
                      <p className="font-extrabold">
                        {date(row.turnover_date)}
                      </p>
                      <p className="text-xs text-[#657089] lg:hidden">
                        {time(row.access_start_at)}–{time(row.next_checkin_at)}
                      </p>
                    </div>
                    <TurnoverStatus status={row.status} />
                  </div>
                  <div>
                    <p className="font-extrabold">
                      {formatDisplayName(property?.nickname)}
                    </p>
                    <p className="mt-0.5 text-xs text-[#657089]">
                      {property?.postcode} ·{" "}
                      {row.cleaning_type.replaceAll("_", " ")}
                    </p>
                  </div>
                  <p className="hidden text-sm font-bold lg:block">
                    {time(row.access_start_at)}–{time(row.next_checkin_at)}
                  </p>
                  <div className="flex justify-between gap-2 text-sm lg:block">
                    <span className="text-[#657089] lg:hidden">Cleaner</span>
                    <span className="font-bold">
                      {formatDisplayName(worker?.display_name) ||
                        "Not assigned"}
                    </span>
                  </div>
                  <div className="lg:hidden">
                    <p className="text-xs font-bold text-[#9a4f17]">
                      {assignment?.status === "pending" &&
                      assignment.response_due_at
                        ? `${new Date(assignment.response_due_at) < new Date() ? "Response overdue" : "Reply due"} ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(assignment.response_due_at))}`
                        : turnoverActionReason(row, today)}
                    </p>
                  </div>
                  <div className="hidden lg:block">
                    <TurnoverStatus status={row.status} />
                    <p className="mt-1 text-xs text-[#657089]">
                      {assignment?.status === "pending" &&
                      assignment.response_due_at
                        ? `${new Date(assignment.response_due_at) < new Date() ? "Response overdue" : "Reply due"} ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(assignment.response_due_at))}`
                        : turnoverActionReason(row, today)}
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
            <h2 className="text-lg font-extrabold">Nothing in this view</h2>
            <p className="mt-2 text-sm text-[#657089]">
              Turnovers matching this date or status will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
