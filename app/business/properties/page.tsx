import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import ArchivePropertyForm from "./ArchivePropertyForm";
import TurnoverStatus from "../components/TurnoverStatus";
import { formatDisplayName } from "@/lib/display-name";
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
      "id,nickname,address_line_1,city,postcode,property_type,bedrooms,bathrooms,status,work_items(id,status,turnover_date,access_start_at)",
    )
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("nickname", `%${q}%`);
  const { data, error } = await query;
  if (error) throw new Error(`properties_query_failed:${error.code}`);
  return (
    <div className="mx-auto max-w-[1240px]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[#2d67b2]">PORTFOLIO</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">
            Properties
          </h1>
          <p className="mt-2 text-[#657089]">
            Property-specific turnover standards, readiness and history.
          </p>
        </div>
        <Link
          href="/business/properties/new"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#071f49] px-5 font-extrabold text-white"
        >
          Add property
        </Link>
      </header>
      <form className="mt-6 grid gap-3 rounded-xl border bg-white p-3 sm:grid-cols-[1fr_180px_auto]">
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
                  !["cancelled", "ready"].includes(w.status),
              )
              .sort((a, b) =>
                a.access_start_at.localeCompare(b.access_start_at),
              )[0];
            const latest = [...(p.work_items || [])].sort((a, b) =>
              b.turnover_date.localeCompare(a.turnover_date),
            )[0];
            return (
              <article
                key={p.id}
                className={`rounded-xl border bg-white p-5 ${p.status === "archived" ? "opacity-65" : ""}`}
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
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-[#f1f3f6] px-3 py-1 capitalize">
                    {p.property_type.replaceAll("_", " ")}
                  </span>
                  <span className="rounded-full bg-[#f1f3f6] px-3 py-1">
                    {p.bedrooms ?? "—"} bed · {p.bathrooms ?? "—"} bath
                  </span>
                </div>
                <div className="mt-5 border-t pt-4">
                  <p className="text-xs font-bold text-[#748096]">
                    NEXT TURNOVER
                  </p>
                  <p className="mt-1 font-bold">
                    {upcoming
                      ? new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(upcoming.access_start_at))
                      : "None scheduled"}
                  </p>
                  {latest && (
                    <div className="mt-3">
                      <TurnoverStatus status={latest.status} />
                    </div>
                  )}
                </div>
                <div className="mt-5 flex gap-2">
                  <Link
                    href={`/business/properties/${p.id}`}
                    className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-extrabold"
                  >
                    View property
                  </Link>
                  {p.status === "active" && (
                    <Link
                      href={`/business/turnovers/new?property=${p.id}`}
                      className="inline-flex min-h-11 items-center rounded-lg bg-[#071f49] px-4 text-sm font-extrabold text-white"
                    >
                      Create turnover
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
