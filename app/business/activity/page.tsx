import Link from "next/link";
import { requireBusinessUser } from "@/lib/business/auth";
import { collapseActivityEvents, formatActivityEvent } from "@/lib/activity-presentation";

type Event = {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
  work_item_id: string | null;
  metadata: Record<string, unknown> | null;
  properties: { nickname: string } | { nickname: string }[] | null;
  workers: { display_name: string } | { display_name: string }[] | null;
  work_items: { properties:{nickname:string}|{nickname:string}[]|null; assignments:Array<{status:string;workers:{display_name:string}|{display_name:string}[]|null}> } | Array<{ properties:{nickname:string}|{nickname:string}[]|null; assignments:Array<{status:string;workers:{display_name:string}|{display_name:string}[]|null}> }> | null;
};

export default async function Page() {
  const { supabase, accountId } = await requireBusinessUser();
  const { data, error } = await supabase
    .from("activity_events")
    .select(
      "id,event_type,description,created_at,work_item_id,metadata,properties(nickname),workers(display_name),work_items(properties(nickname),assignments(status,workers(display_name)))",
    )
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`activity_query_failed:${error.code}`);
  const events = collapseActivityEvents((data || []) as Event[]);
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
    <div className="portal-page max-w-4xl">
      <h1 className="portal-title">
        Activity
      </h1>
      <p className="portal-subtitle">
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
                <ol className="portal-panel mt-2 divide-y">
                  {group.map((event) => {
                    const text = formatActivityEvent(event);
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
