import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";
import PropertyForm from "../../components/PropertyForm";
import TurnoverStatus from "../../components/TurnoverStatus";
import {
  addChecklistTask,
  deleteChecklistTask,
  moveChecklistTask,
} from "../../str-actions";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, accountId } = await requireBusinessUser();
  const { data: p } = await supabase
    .from("properties")
    .select(
      "*,checklist_templates(id,name,active,checklist_template_sections(id,title,position,checklist_template_tasks(id,label,position,response_type,mandatory,photo_required,note_required,blocking))),work_items(id,turnover_date,status,access_start_at),property_workers(workers(id,display_name)),activity_events(id,event_type,description,created_at)",
    )
    .eq("id", id)
    .eq("account_id", accountId)
    .maybeSingle();
  if (!p) notFound();
  const template = p.checklist_templates?.find(
    (t: { active: boolean }) => t.active,
  );
  const sections = [...(template?.checklist_template_sections || [])].sort(
    (a: { position: number }, b: { position: number }) =>
      a.position - b.position,
  );
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/business/properties"
        className="text-sm font-bold text-[#526078]"
      >
        ← Properties
      </Link>
      <header className="mt-4 border-b pb-6">
        <p className="text-sm font-extrabold text-[#2d67b2]">PROPERTY</p>
        <h1 className="mt-1 text-3xl font-extrabold">{p.nickname}</h1>
        <p className="mt-2 text-[#657089]">
          {p.address_line_1}, {p.city}, {p.postcode}
        </p>
      </header>
      <nav
        aria-label="Property sections"
        className="mt-5 flex gap-2 overflow-x-auto pb-2"
      >
        {[
          "Overview",
          "Turnover standard",
          "Checklist",
          "Access",
          "Cleaners",
          "Turnover history",
          "Activity",
        ].map((x) => (
          <a
            key={x}
            href={`#${x.toLowerCase().replaceAll(" ", "-")}`}
            className="min-h-10 shrink-0 rounded-lg border bg-white px-3 py-2 text-sm font-bold"
          >
            {x}
          </a>
        ))}
      </nav>
      <section id="overview" className="mt-5 rounded-xl border bg-white p-5">
        <h2 className="text-xl font-extrabold">Overview</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-sm font-bold text-[#748096]">Type</dt>
            <dd className="capitalize">
              {p.property_type.replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-[#748096]">Bedrooms</dt>
            <dd>{p.bedrooms}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-[#748096]">Bathrooms</dt>
            <dd>{p.bathrooms}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-[#748096]">Status</dt>
            <dd className="capitalize">{p.status}</dd>
          </div>
        </dl>
      </section>
      <section id="turnover-standard" className="mt-5">
        <h2 className="mb-4 text-xl font-extrabold">Turnover standard</h2>
        <PropertyForm property={p} onboarding={false} />
      </section>
      <section
        id="checklist"
        className="mt-5 rounded-xl border bg-white p-5 sm:p-6"
      >
        <div>
          <h2 className="text-xl font-extrabold">Checklist</h2>
          <p className="mt-1 text-sm text-[#657089]">
            Tasks are copied into each new turnover, preserving its permanent
            record.
          </p>
        </div>
        <div className="mt-5 grid gap-5">
          {sections.map(
            (section: {
              id: string;
              title: string;
              checklist_template_tasks: Array<{
                id: string;
                label: string;
                position: number;
                mandatory: boolean;
                photo_required: boolean;
                note_required: boolean;
                blocking: boolean;
              }>;
            }) => (
              <div key={section.id}>
                <h3 className="border-b pb-2 font-extrabold">
                  {section.title}
                </h3>
                <div className="divide-y">
                  {[...(section.checklist_template_tasks || [])]
                    .sort((a, b) => a.position - b.position)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between gap-4 py-3"
                      >
                        <div>
                          <p className="font-bold">{task.label}</p>
                          <p className="mt-1 text-xs text-[#657089]">
                            {[
                              task.mandatory && "Required",
                              task.photo_required && "Photo",
                              task.note_required && "Note",
                              task.blocking && "Blocking",
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Optional"}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <form action={moveChecklistTask}>
                            <input type="hidden" name="propertyId" value={id} />
                            <input
                              type="hidden"
                              name="taskId"
                              value={task.id}
                            />
                            <button
                              name="direction"
                              value="up"
                              aria-label={`Move ${task.label} up`}
                              className="min-h-10 min-w-10 rounded-lg text-sm font-bold hover:bg-[#f1f3f6]"
                            >
                              ↑
                            </button>
                            <button
                              name="direction"
                              value="down"
                              aria-label={`Move ${task.label} down`}
                              className="min-h-10 min-w-10 rounded-lg text-sm font-bold hover:bg-[#f1f3f6]"
                            >
                              ↓
                            </button>
                          </form>
                          <form action={deleteChecklistTask}>
                            <input type="hidden" name="propertyId" value={id} />
                            <button
                              name="taskId"
                              value={task.id}
                              className="min-h-10 px-2 text-sm font-bold text-red-700"
                            >
                              Remove
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ),
          )}
        </div>
        <form
          action={addChecklistTask}
          className="mt-6 grid gap-3 rounded-lg bg-[#f4f6f9] p-4 sm:grid-cols-2"
        >
          <h3 className="font-extrabold sm:col-span-2">Add checklist task</h3>
          <input type="hidden" name="propertyId" value={id} />
          <label className="font-bold">
            Section
            <input
              name="sectionTitle"
              required
              className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3"
              placeholder="e.g. Bedrooms"
            />
          </label>
          <label className="font-bold">
            Task
            <input
              name="label"
              required
              className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3"
              placeholder="Describe the required outcome"
            />
          </label>
          <label className="font-bold">
            Response
            <select
              name="responseType"
              className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3"
            >
              <option value="checkbox">Checkbox</option>
              <option value="yes_no">Yes / no</option>
              <option value="pass_fail">Pass / fail</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2 text-sm font-bold">
            {[
              ["mandatory", "Required"],
              ["photoRequired", "Photo required"],
              ["noteRequired", "Note required"],
              ["blocking", "Blocking"],
            ].map(([name, label]) => (
              <label key={name} className="flex min-h-11 items-center gap-2">
                <input type="checkbox" name={name} className="h-5 w-5" />
                {label}
              </label>
            ))}
          </div>
          <button className="min-h-11 rounded-lg bg-[#071f49] px-4 font-bold text-white sm:col-span-2">
            Add task
          </button>
        </form>
      </section>
      <section id="access" className="mt-5 rounded-xl border bg-white p-5">
        <h2 className="text-xl font-extrabold">Access</h2>
        <p className="mt-3 whitespace-pre-wrap text-[#526078]">
          {p.access_notes || "No access instructions saved."}
        </p>
        <p className="mt-3 text-sm font-bold text-[#657089]">
          Only visible to the assigned cleaner after acceptance.
        </p>
      </section>
      <section id="cleaners" className="mt-5 rounded-xl border bg-white p-5">
        <h2 className="text-xl font-extrabold">Cleaners</h2>
        <p className="mt-3 text-[#657089]">
          {p.property_workers?.length
            ? p.property_workers
                .map(
                  (row: {
                    workers:
                      { display_name: string } | { display_name: string }[];
                  }) => {
                    const w = Array.isArray(row.workers)
                      ? row.workers[0]
                      : row.workers;
                    return w.display_name;
                  },
                )
                .join(", ")
            : "No default cleaner assigned."}
        </p>
      </section>
      <section
        id="turnover-history"
        className="mt-5 rounded-xl border bg-white p-5"
      >
        <h2 className="text-xl font-extrabold">Turnover history</h2>
        <div className="mt-3 divide-y">
          {p.work_items?.length ? (
            p.work_items
              .sort(
                (a: { turnover_date: string }, b: { turnover_date: string }) =>
                  b.turnover_date.localeCompare(a.turnover_date),
              )
              .map(
                (item: {
                  id: string;
                  turnover_date: string;
                  status: string;
                }) => (
                  <Link
                    href={`/business/turnovers/${item.id}`}
                    key={item.id}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="font-bold">
                      {new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                      }).format(new Date(item.turnover_date))}
                    </span>
                    <TurnoverStatus status={item.status} />
                  </Link>
                ),
              )
          ) : (
            <p className="py-3 text-[#657089]">No turnovers yet.</p>
          )}
        </div>
      </section>
      <section id="activity" className="mt-5 rounded-xl border bg-white p-5">
        <h2 className="text-xl font-extrabold">Activity</h2>
        <div className="mt-3 divide-y">
          {p.activity_events?.length ? (
            [...p.activity_events]
              .sort((a: { created_at: string }, b: { created_at: string }) =>
                b.created_at.localeCompare(a.created_at),
              )
              .map(
                (event: {
                  id: string;
                  description: string;
                  created_at: string;
                }) => (
                  <div key={event.id} className="py-3">
                    <p className="font-bold">{event.description}</p>
                    <time
                      className="text-sm text-[#657089]"
                      dateTime={event.created_at}
                    >
                      {new Intl.DateTimeFormat("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(event.created_at))}
                    </time>
                  </div>
                ),
              )
          ) : (
            <p className="py-3 text-[#657089]">No property activity yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
