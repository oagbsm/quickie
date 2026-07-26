import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import { formatDisplayName } from "@/lib/display-name";

type Event = {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
  work_item_id: string | null;
  properties: { nickname: string } | { nickname: string }[] | null;
  workers: { display_name: string } | { display_name: string }[] | null;
};
const one = <T,>(value: T | T[] | null) =>
  Array.isArray(value) ? value[0] : value;
const friendly = (event: Event) => {
  const property = one(event.properties);
  const worker = one(event.workers);
  const names = [formatDisplayName(property?.nickname), formatDisplayName(worker?.display_name)]
    .filter(Boolean)
    .join(" · ");
  const label: Record<string, string> = {
    assignment_created: "Cleaner invited to turnover",
    assignment_accepted: "Cleaner accepted the assignment",
    assignment_declined: "Cleaner declined the assignment",
    assignment_cancelled: "Cleaner assignment cancelled",
    issue_reported: "Cleaner reported an issue",
    issue_resolved: "Issue resolved",
    evidence_submitted: "Completion evidence submitted",
    turnover_ready: "Property marked ready",
    access_revealed: "Sensitive access details revealed",
  };
  return {
    title: label[event.event_type] || event.description,
    context: names,
  };
};

export default async function Page() {
  const { supabase, accountId } = await requireBusinessUser();
  const { data, error } = await supabase
    .from("activity_events")
    .select(
      "id,event_type,description,created_at,work_item_id,properties(nickname),workers(display_name)",
    )
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`activity_query_failed:${error.code}`);
  const events = ((data || []) as Event[]).filter((event, index, all) => {
    const previous = all[index - 1];
    return !(
      previous &&
      previous.event_type === event.event_type &&
      previous.work_item_id === event.work_item_id &&
      new Date(previous.created_at).getTime() -
        new Date(event.created_at).getTime() <
        60_000
    );
  });
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);
  const groups = [
    ["Today", events.filter((event) => event.created_at.slice(0, 10) === today)],
    ["Yesterday", events.filter((event) => event.created_at.slice(0, 10) === yesterday)],
    ["Earlier", events.filter((event) => event.created_at.slice(0, 10) < yesterday)],
  ] as const;
  return (
    <div className="mx-auto max-w-4xl">
      <p className="hidden text-sm font-extrabold text-[#2d67b2] sm:block">
        AUDIT TRAIL
      </p>
      <h1 className="text-2xl font-extrabold tracking-[-.03em] sm:mt-1 sm:text-4xl">
        Activity
      </h1>
      <p className="mt-2 text-sm text-[#657089] sm:text-base">
        A clear history of operational changes across your workspace.
      </p>
      {events.length ? (
        <div className="mt-6 grid gap-7">
          {groups.map(([label, group]) =>
            group.length ? (
              <section key={label}>
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#657089]">
                  {label}
                </h2>
                <ol className="mt-2 divide-y overflow-hidden rounded-xl border bg-white">
                  {group.map((event) => {
                    const text = friendly(event);
                    const content = (
                      <>
                        <div className="min-w-0">
                          <p className="font-extrabold">{text.title}</p>
                          {text.context && (
                            <p className="mt-1 truncate text-sm text-[#657089]">
                              {text.context}
                            </p>
                          )}
                        </div>
                        <time className="shrink-0 text-xs font-bold text-[#748096]">
                          {new Intl.DateTimeFormat("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: label === "Earlier" ? "numeric" : undefined,
                            month: label === "Earlier" ? "short" : undefined,
                          }).format(new Date(event.created_at))}
                        </time>
                      </>
                    );
                    return (
                      <li key={event.id}>
                        {event.work_item_id ? (
                          <Link
                            href={`/business/turnovers/${event.work_item_id}`}
                            className="flex min-h-16 items-start justify-between gap-3 p-4 hover:bg-[#f8fafc]"
                          >
                            {content}
                          </Link>
                        ) : (
                          <div className="flex min-h-16 items-start justify-between gap-3 p-4">
                            {content}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            ) : null,
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border bg-white p-8 text-center text-[#657089]">
          Activity will appear as you add properties and coordinate turnovers.
        </div>
      )}
    </div>
  );
}
