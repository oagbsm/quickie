import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import ArchivePropertyForm from "./ArchivePropertyForm";
import TurnoverStatus from "../components/TurnoverStatus";
import { formatDisplayName } from "@/lib/display-name";
import {
  currentAssignment,
  turnoverActionReason,
} from "@/lib/turnovers/presentation";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const { supabase, accountId } = await requireBusinessUser();
  let query = supabase
    .from("properties")
    .select(
      "id,nickname,address_line_1,city,postcode,property_type,bedrooms,bathrooms,status,work_items(id,status,turnover_date,access_start_at,next_checkin_at,ready_at,assignments(status,assigned_at,workers(display_name)))",
    )
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("nickname", `%${q}%`);
  const { data, error } = await query;
  if (error) throw new Error(`properties_query_failed:${error.code}`);
  return (
    <div className="mx-auto max-w-[1240px]">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="hidden text-sm font-extrabold text-[#2d67b2] sm:block">
            PORTFOLIO
          </p>
          <h1 className="text-[28px] font-extrabold leading-[34px] tracking-[-.03em] sm:mt-1 sm:text-4xl">
            Properties
          </h1>
          <p className="mt-2 hidden text-[#657089] sm:block">
            Property-specific turnover standards, readiness and history.
          </p>
        </div>
        <Link
          href="/business/properties/new"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#071f49] px-4 font-extrabold text-white sm:px-5"
        >
          <span className="sm:hidden">+ Add</span>
          <span className="hidden sm:inline">Add property</span>
        </Link>
      </header>
      <form
        className={`${(data?.length || 0) <= 5 && !q && !status ? "hidden sm:grid" : "grid"} mt-6 gap-3 rounded-xl border bg-white p-3 sm:grid-cols-[1fr_180px_auto]`}
      >
        <label>
          <span className="sr-only">Search properties</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search properties"
            className="min-h-11 w-full rounded-lg border px-3"
          />
        </label>
        <label>
          <span className="sr-only">Property status</span>
          <select
            name="status"
            defaultValue={status || ""}
            className="min-h-11 w-full rounded-lg border px-3"
          >
            <option value="">All properties</option>
            <option value="active">Active</option>
            <option value="archived">Inactive</option>
          </select>
        </label>
        <button className="min-h-11 rounded-lg border px-4 font-bold">
          Apply filters
        </button>
      </form>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.length ? (
          data.map((p) => {
            const upcoming = (p.work_items || [])
              .filter(
                (w) =>
                  new Date(w.access_start_at) > new Date() &&
                  w.status !== "cancelled",
              )
              .sort((a, b) =>
                a.access_start_at.localeCompare(b.access_start_at),
              )[0];
            const latest = [...(p.work_items || [])].sort((a, b) =>
              b.turnover_date.localeCompare(a.turnover_date),
            )[0];
            const lastReady = [...(p.work_items || [])]
              .filter((w) => w.status === "ready")
              .sort((a, b) =>
                (b.ready_at || "").localeCompare(a.ready_at || ""),
              )[0];
            const assignment = upcoming
              ? currentAssignment(upcoming.assignments)
              : null;
            const cleaner = (
              assignment
                ? Array.isArray(assignment.workers)
                  ? assignment.workers[0]
                  : assignment.workers
                : null
            ) as { display_name?: string } | null;
            return (
              <article
                key={p.id}
                className={`rounded-xl border bg-white p-4 sm:p-5 ${p.status === "archived" ? "opacity-65" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold">
                      {formatDisplayName(p.nickname)}
                    </h2>
                    <p className="mt-1 text-sm text-[#657089]">
                      {p.address_line_1}, {p.city}, {p.postcode}
                    </p>
                  </div>
                  <details className="relative">
                    <summary
                      aria-label="Property actions"
                      className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-lg border"
                    >
                      •••
                    </summary>
                    <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border bg-white p-2 shadow-xl">
                      <ArchivePropertyForm
                        id={p.id}
                        archived={p.status === "archived"}
                        hasActiveBookings={Boolean(upcoming)}
                      />
                    </div>
                  </details>
                </div>
                <div className="mt-5 border-t pt-4">
                  <p className="text-xs font-bold text-[#748096]">NEXT GUEST</p>
                  <p className="mt-1 text-lg font-extrabold">
                    {upcoming
                      ? new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Europe/London",
                        }).format(new Date(upcoming.next_checkin_at))
                      : "None scheduled"}
                  </p>
                  {upcoming ? (
                    <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-xs font-bold text-[#748096]">
                          CLEANER
                        </dt>
                        <dd className="mt-1 font-extrabold">
                          {formatDisplayName(cleaner?.display_name) ||
                            "Not assigned"}
                        </dd>
                        <dd className="mt-0.5 text-xs capitalize text-[#657089]">
                          {assignment?.status || "Needs assignment"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold text-[#748096]">
                          READINESS
                        </dt>
                        <dd className="mt-1">
                          <TurnoverStatus status={upcoming.status} />
                        </dd>
                        <dd className="mt-1 text-xs font-bold text-[#657089]">
                          {turnoverActionReason(upcoming)}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    latest && (
                      <div className="mt-3">
                        <TurnoverStatus status={latest.status} />
                      </div>
                    )
                  )}
                  <p className="mt-4 text-xs text-[#657089]">
                    Last ready:{" "}
                    {lastReady?.ready_at
                      ? new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "medium",
                        }).format(new Date(lastReady.ready_at))
                      : "No completed readiness yet"}
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/business/properties/${p.id}`}
                    className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg border px-4 text-sm font-extrabold"
                  >
                    View property
                  </Link>
                  {p.status === "active" && (
                    <Link
                      href={`/business/turnovers/new?property=${p.id}`}
                      className="hidden min-h-11 items-center rounded-lg bg-[#071f49] px-4 text-sm font-extrabold text-white sm:inline-flex"
                    >
                      Add arrival
                    </Link>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-full rounded-xl border bg-white p-10 text-center">
            <h2 className="text-xl font-extrabold">No properties</h2>
            <p className="mt-2 text-[#657089]">
              Add your first property to create a turnover standard.
            </p>
            <Link
              href="/business/properties/new"
              className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#071f49] px-5 font-bold text-white"
            >
              Add property
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
