import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { formatDisplayName } from "@/lib/display-name";
const systemTypes = [
  "account_suspended",
  "account_reactivated",
  "turnover_cancelled",
  "access_revealed",
  "cleaner_invitation_revoked_by_admin",
];
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const { view = "operations", q } = await searchParams,
    { supabase } = await requireAdmin();
  let query = supabase
    .from("activity_events")
    .select(
      "id,event_type,description,created_at,work_item_id,business_accounts(name),properties(nickname),workers(display_name)",
    )
    .order("created_at", { ascending: false })
    .limit(250);
  query =
    view === "system"
      ? query.in("event_type", systemTypes)
      : query.not("event_type", "in", `(${systemTypes.join(",")})`);
  const { data, error } = await query;
  if (error) throw new Error(`admin_activity_failed:${error.code}`);
  const rows = (data || []).filter(
    (event) =>
      !q ||
      `${event.description} ${(Array.isArray(event.business_accounts) ? event.business_accounts[0] : event.business_accounts)?.name || ""}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-extrabold">Activity</h1>
      <p className="mt-2 text-[#59677d]">
        Operational events are separated from administrative, security and
        data-correction records.
      </p>
      <nav className="mt-5 flex border-b">
        <Link
          href="/admin/activity"
          className={`border-b-2 px-4 py-3 text-sm font-extrabold ${view === "operations" ? "border-[#16467e] text-[#16467e]" : "border-transparent"}`}
        >
          Operational activity
        </Link>
        <Link
          href="/admin/activity?view=system"
          className={`border-b-2 px-4 py-3 text-sm font-extrabold ${view === "system" ? "border-[#16467e] text-[#16467e]" : "border-transparent"}`}
        >
          System & security
        </Link>
      </nav>
      <form className="mt-4 flex gap-2">
        <input type="hidden" name="view" value={view} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Filter by customer or event"
          className="min-h-11 flex-1 rounded-lg border bg-white px-3"
        />
        <button className="rounded-lg border bg-white px-4 font-bold">
          Filter
        </button>
      </form>
      <ol className="mt-5 divide-y overflow-hidden rounded-xl border bg-white">
        {rows.length ? (
          rows.map((event) => {
            const account = Array.isArray(event.business_accounts)
                ? event.business_accounts[0]
                : event.business_accounts,
              property = Array.isArray(event.properties)
                ? event.properties[0]
                : event.properties;
            const inner = (
              <>
                <div>
                  <p className="font-extrabold">{event.description}</p>
                  <p className="mt-1 text-sm text-[#657089]">
                    {formatDisplayName(account?.name)}
                    {property?.nickname
                      ? ` · ${formatDisplayName(property.nickname)}`
                      : ""}{" "}
                    ·{" "}
                    <span className="capitalize">
                      {event.event_type.replaceAll("_", " ")}
                    </span>
                  </p>
                </div>
                <time className="shrink-0 text-xs font-bold text-[#657089]">
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(event.created_at))}
                </time>
              </>
            );
            return (
              <li key={event.id}>
                {event.work_item_id ? (
                  <Link
                    href={`/admin/turnovers/${event.work_item_id}`}
                    className="flex min-h-16 justify-between gap-4 p-4 hover:bg-[#f8fafc]"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex min-h-16 justify-between gap-4 p-4">
                    {inner}
                  </div>
                )}
              </li>
            );
          })
        ) : (
          <li className="p-10 text-center text-[#657089]">
            No activity matches this view.
          </li>
        )}
      </ol>
    </div>
  );
}
