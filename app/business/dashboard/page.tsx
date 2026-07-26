import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import TurnoverStatus from "../components/TurnoverStatus";
import { formatDisplayName } from "@/lib/display-name";
type Item = {
  id: string;
  turnover_date: string;
  access_start_at: string;
  next_checkin_at: string;
  estimated_duration_minutes: number;
  cleaning_type: string;
  status: string;
  properties:
    | { nickname: string; postcode: string; bedrooms: number | null }
    | { nickname: string; postcode: string; bedrooms: number | null }[]
    | null;
  assignments: Array<{
    status: string;
    workers: { display_name: string } | { display_name: string }[] | null;
  }>;
};
const one = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] : v);
export default async function Page() {
  const { supabase, accountId, user } = await requireBusinessUser();
  const now = new Date(),
    today = now.toISOString().slice(0, 10);
  const results = await Promise.all([
    supabase
      .from("business_members")
      .select("full_name")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("work_items")
      .select(
        "id,turnover_date,access_start_at,next_checkin_at,estimated_duration_minutes,cleaning_type,status,properties(nickname,postcode,bedrooms),assignments(status,workers(display_name))",
      )
      .eq("account_id", accountId)
      .gte("turnover_date", today)
      .not("status", "eq", "cancelled")
      .order("access_start_at")
      .limit(8),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("account_id", accountId)
      .eq("status", "active"),
    supabase
      .from("operational_issues")
      .select("id,work_item_id,issue_type,severity,description,blocking")
      .eq("account_id", accountId)
      .in("status", ["open", "acknowledged", "waiting_for_owner"])
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("activity_events")
      .select("id,description,created_at")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const failed = results.find((result) => result.error);
  if (failed?.error)
    throw new Error(`dashboard_query_failed:${failed.error.code}`);
  const member = results[0].data;
  const items = results[1].data;
  const propertyCount = results[2].count;
  const issues = results[3].data;
  const activity = results[4].data;
  const rows = (items || []) as Item[];
  const counts = {
    today: rows.filter((i) => i.turnover_date === today).length,
    pending: rows.filter((i) => i.status === "awaiting_response").length,
    attention: rows.filter((i) =>
      ["unassigned", "declined", "action_required"].includes(i.status),
    ).length,
    ready: rows.filter((i) => i.turnover_date === today && i.status === "ready")
      .length,
  };
  const name = member?.full_name?.split(" ")[0] || "there";
  return (
    <div className="mx-auto max-w-[1320px]">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[#2d67b2]">
            {new Intl.DateTimeFormat("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(now)}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-.035em] sm:text-4xl">
            Good{" "}
            {now.getHours() < 12
              ? "morning"
              : now.getHours() < 18
                ? "afternoon"
                : "evening"}
            , {name}
          </h1>
          <p className="mt-2 text-[#657089]">
            Here is what needs attention across your properties.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/business/properties/new"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border bg-white px-5 font-extrabold"
          >
            Add property
          </Link>
          <Link
            href="/business/turnovers/new"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#071f49] px-5 font-extrabold text-white"
          >
            Create turnover
          </Link>
        </div>
      </header>
      <section
        aria-label="Operational summary"
        className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          [
            "Today’s turnovers",
            counts.today,
            "Scheduled today",
            "/business/turnovers",
          ],
          [
            "Awaiting cleaner response",
            counts.pending,
            "Assignments waiting",
            "/business/turnovers?status=awaiting_response",
          ],
          [
            "Action required",
            counts.attention,
            "Unassigned or blocked",
            "/business/turnovers?status=action_required",
          ],
          [
            "Properties ready today",
            counts.ready,
            "Evidence requirements passed",
            "/business/turnovers?status=ready",
          ],
        ].map(([label, value, detail, href]) => (
          <Link
            key={String(label)}
            href={String(href)}
            className="rounded-xl border border-[#dfe4eb] bg-white p-5 outline-none transition hover:-translate-y-0.5 hover:border-[#9aacc4] focus-visible:ring-4 focus-visible:ring-[#2d67b2]/20 active:translate-y-0"
          >
            <p className="text-sm font-bold text-[#657089]">{label}</p>
            <p className="mt-3 text-3xl font-extrabold">{value}</p>
            <p className="mt-2 text-xs font-bold text-[#748096]">
              {detail} <span aria-hidden="true">→</span>
            </p>
          </Link>
        ))}
      </section>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-xl border border-[#dfe4eb] bg-white">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="text-lg font-extrabold">Upcoming turnovers</h2>
              <p className="mt-1 text-sm text-[#657089]">
                Schedule, assignment and readiness risk
              </p>
            </div>
            <Link
              href="/business/turnovers"
              className="text-sm font-extrabold text-[#245b9d]"
            >
              View all
            </Link>
          </div>
          {rows.length ? (
            <div className="divide-y">
              {rows.map((row) => {
                const p = one(row.properties);
                const a = row.assignments?.find((x) =>
                  ["pending", "accepted"].includes(x.status),
                );
                const w = one(a?.workers || null);
                return (
                  <Link
                    href={`/business/turnovers/${row.id}`}
                    key={row.id}
                    className="grid gap-3 p-4 hover:bg-[#f8fafc] sm:grid-cols-[95px_minmax(170px,1fr)_150px_150px_20px] sm:items-center sm:px-5"
                  >
                    <div>
                      <p className="font-extrabold">
                        {new Intl.DateTimeFormat("en-GB", {
                          day: "numeric",
                          month: "short",
                        }).format(new Date(row.turnover_date))}
                      </p>
                      <p className="text-sm text-[#657089]">
                        {new Intl.DateTimeFormat("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(row.access_start_at))}
                      </p>
                    </div>
                    <div>
                      <p className="font-extrabold">
                        {formatDisplayName(p?.nickname)}
                      </p>
                      <p className="mt-1 text-xs text-[#657089]">
                        {p?.postcode} · {p?.bedrooms ?? "—"} bed ·{" "}
                        {row.cleaning_type.replaceAll("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#748096]">
                        CLEANER
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        {w?.display_name || "Not assigned"}
                      </p>
                    </div>
                    <TurnoverStatus status={row.status} />
                    <span aria-hidden="true">›</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center">
              <h3 className="font-extrabold">No upcoming turnovers</h3>
              <p className="mt-2 text-sm text-[#657089]">
                Create a turnover to coordinate the next guest changeover.
              </p>
            </div>
          )}
        </section>
        <aside className="grid content-start gap-5">
          <section className="rounded-xl border border-[#dfe4eb] bg-white p-5">
            <div className="flex justify-between">
              <h2 className="font-extrabold">Open issues</h2>
              <Link
                href="/business/issues"
                className="text-sm font-bold text-[#245b9d]"
              >
                View all
              </Link>
            </div>
            <div className="mt-3 divide-y">
              {issues?.length ? (
                issues.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/business/turnovers/${issue.work_item_id}`}
                    className="block py-3"
                  >
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-extrabold">
                        {issue.issue_type}
                      </p>
                      {issue.blocking && (
                        <span className="text-[10px] font-extrabold text-red-700">
                          BLOCKING
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-[#657089]">
                      {issue.description}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="py-4 text-sm text-[#657089]">No open issues.</p>
              )}
            </div>
          </section>
          <section className="rounded-xl border border-[#dfe4eb] bg-white p-5">
            <div className="flex justify-between">
              <h2 className="font-extrabold">Recent activity</h2>
              <Link
                href="/business/activity"
                className="text-sm font-bold text-[#245b9d]"
              >
                View all
              </Link>
            </div>
            <ol className="mt-3 border-l pl-4">
              {activity?.length ? (
                activity.map((e) => (
                  <li key={e.id} className="pb-4">
                    <p className="text-sm font-bold">{e.description}</p>
                    <p className="mt-1 text-xs text-[#748096]">
                      {new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(e.created_at))}
                    </p>
                  </li>
                ))
              ) : (
                <li className="text-sm text-[#657089]">No activity yet.</li>
              )}
            </ol>
          </section>
          {!propertyCount && (
            <section className="rounded-xl bg-[#071f49] p-5 text-white">
              <h2 className="font-extrabold">Set up your first turnover</h2>
              <ol className="mt-3 grid gap-2 text-sm text-white/80">
                <li>1. Add a property</li>
                <li>2. Add your cleaner</li>
                <li>3. Create a turnover</li>
              </ol>
              <Link
                href="/business/properties/new"
                className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-white px-4 font-extrabold text-[#071f49]"
              >
                Add property
              </Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
