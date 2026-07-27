import Link from "next/link";
import { notFound } from "next/navigation";
import AccessReveal from "../../components/AccessReveal";
import TurnoverStatus from "../../components/TurnoverStatus";
import { requireBusinessUser } from "@/lib/business/auth";
import { updatePropertySection } from "../../actions";
import {
  addChecklistTask,
  deleteChecklistTask,
  moveChecklistTask,
} from "../../str-actions";
import { listPropertyCalendarConnections } from "@/lib/server/property-calendars";
import CalendarSources from "./CalendarSources";

const tabs = [
  ["overview", "Overview"],
  ["reservations", "Reservations"],
  ["standard", "Standard"],
  ["checklist", "Checklist"],
  ["access", "Access"],
  ["cleaners", "Cleaners"],
  ["history", "History"],
  ["activity", "Activity"],
] as const;
const field =
  "mt-1.5 min-h-11 w-full rounded-lg border border-[#cfd7e3] bg-white px-3 py-2 outline-none focus:border-[#2d67b2] focus:ring-4 focus:ring-[#2d67b2]/15";
const display = (value: string) =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bLtd\b/i, "Ltd");
const detail = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <dt className="text-sm font-bold text-[#657089]">{label}</dt>
    <dd className="mt-1 whitespace-pre-wrap font-medium">
      {value || "Not set"}
    </dd>
  </div>
);

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    edit?: string;
    error?: string;
    updated?: string;
  }>;
}) {
  const { id } = await params,
    { tab: requested, edit, error, updated } = await searchParams;
  const tab = tabs.some(([key]) => key === requested) ? requested! : "overview";
  const { supabase, accountId } = await requireBusinessUser();
  const { data: p, error: queryError } = await supabase
    .from("properties")
    .select(
      "*,checklist_templates(id,active,checklist_template_sections(id,title,position,checklist_template_tasks(id,label,position,mandatory,photo_required,note_required,blocking))),work_items(id,turnover_date,status),property_workers(workers(id,display_name)),activity_events(id,description,created_at)",
    )
    .eq("id", id)
    .eq("account_id", accountId)
    .maybeSingle();
  if (queryError) throw new Error(`property_query_failed:${queryError.code}`);
  if (!p) notFound();
  const title = display(p.nickname),
    template = p.checklist_templates?.find(
      (item: { active: boolean }) => item.active,
    ),
    sections = [...(template?.checklist_template_sections || [])].sort(
      (a: { position: number }, b: { position: number }) =>
        a.position - b.position,
    );
  const calendarConnections =
    tab === "reservations" ? await listPropertyCalendarConnections(id) : [];
  return (
    <div className="mx-auto max-w-[1180px]">
      <Link
        href="/business/properties"
        className="text-sm font-bold text-[#526078]"
      >
        ← Properties
      </Link>
      <header className="mt-4 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-extrabold text-[#2d67b2]">PROPERTY</p>
          <h1 className="mt-1 text-3xl font-extrabold">{title}</h1>
          <p className="mt-2 text-[#657089]">
            {p.address_line_1}, {p.city}, {p.postcode}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/business/reservations/new?property=${id}`}
            className="portal-action-secondary"
          >
            Add reservation
          </Link>
          <Link
            href={`/business/turnovers/new?property=${id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#071f49] px-4 font-extrabold text-white"
          >
            Create turnover
          </Link>
        </div>
      </header>
      <nav
        aria-label="Property sections"
        className="sticky top-0 z-20 -mx-4 mt-1 flex gap-1 overflow-x-auto border-b bg-[#f7f8fa]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0"
      >
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={`/business/properties/${id}?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={`min-h-11 shrink-0 border-b-2 px-4 py-2 text-sm font-extrabold outline-none focus-visible:ring-4 focus-visible:ring-[#2d67b2]/20 ${tab === key ? "border-[#2d67b2] text-[#071f49]" : "border-transparent text-[#657089] hover:text-[#071f49]"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      {updated && (
        <p
          role="status"
          className="mt-5 rounded-lg bg-emerald-50 p-3 font-bold text-emerald-800"
        >
          Property details updated.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg bg-red-50 p-3 font-bold text-red-800"
        >
          Changes could not be saved. Review the fields and try again.
        </p>
      )}

      {tab === "overview" && (
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex justify-between">
            <h2 className="text-xl font-extrabold">Overview</h2>
            <Link
              href={`/business/properties/new?duplicate=${id}`}
              className="text-sm font-bold text-[#245b9d]"
            >
              Duplicate property
            </Link>
          </div>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {detail({
              label: "Property type",
              value: display(p.property_type),
            })}
            {detail({ label: "Bedrooms", value: p.bedrooms })}
            {detail({ label: "Bathrooms", value: p.bathrooms })}
            {detail({ label: "Status", value: display(p.status) })}
            {detail({
              label: "Default checkout",
              value: String(p.default_checkout_time).slice(0, 5),
            })}
            {detail({
              label: "Default check-in",
              value: String(p.default_checkin_time).slice(0, 5),
            })}
            {detail({
              label: "Estimated turnover",
              value: `${p.estimated_turnover_minutes} minutes`,
            })}
            {detail({
              label: "Completion evidence",
              value: `${p.required_completion_photos} photos`,
            })}
          </dl>
        </section>
      )}

      {tab === "reservations" && (
        <CalendarSources propertyId={id} connections={calendarConnections} />
      )}

      {tab === "standard" &&
        (edit ? (
          <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold">Edit turnover standard</h2>
            <form action={updatePropertySection} className="mt-5 grid gap-5">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="section" value="standard" />
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="font-bold">
                  Checkout
                  <input
                    name="defaultCheckoutTime"
                    type="time"
                    defaultValue={String(p.default_checkout_time).slice(0, 5)}
                    className={field}
                  />
                </label>
                <label className="font-bold">
                  Check-in
                  <input
                    name="defaultCheckinTime"
                    type="time"
                    defaultValue={String(p.default_checkin_time).slice(0, 5)}
                    className={field}
                  />
                </label>
                <label className="font-bold">
                  Estimated minutes
                  <input
                    name="estimatedTurnoverMinutes"
                    type="number"
                    min="15"
                    step="15"
                    defaultValue={p.estimated_turnover_minutes}
                    className={field}
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="font-bold">
                  Bed setup
                  <textarea
                    name="bedConfiguration"
                    defaultValue={p.bed_configuration || ""}
                    className={field}
                  />
                </label>
                <label className="font-bold">
                  Linen
                  <textarea
                    name="linenRequirements"
                    defaultValue={p.linen_requirements || ""}
                    className={field}
                  />
                </label>
                <label className="font-bold">
                  Towels
                  <textarea
                    name="towelRequirements"
                    defaultValue={p.towel_requirements || ""}
                    className={field}
                  />
                </label>
                <label className="font-bold">
                  Waste
                  <textarea
                    name="wasteInstructions"
                    defaultValue={p.waste_instructions || ""}
                    className={field}
                  />
                </label>
                <label className="font-bold">
                  Consumables
                  <textarea
                    name="consumablesInstructions"
                    defaultValue={p.consumables_instructions || ""}
                    className={field}
                  />
                </label>
                <label className="font-bold">
                  Guest-ready notes
                  <textarea
                    name="cleaningNotes"
                    defaultValue={p.cleaning_notes || ""}
                    className={field}
                  />
                </label>
              </div>
              <label className="flex items-center gap-3 font-bold">
                <input
                  name="sofaBedRequired"
                  type="checkbox"
                  defaultChecked={p.sofa_bed_required}
                  className="h-5 w-5"
                />
                Prepare sofa bed
              </label>
              <label className="max-w-xs font-bold">
                Required photos
                <input
                  name="requiredCompletionPhotos"
                  type="number"
                  min="0"
                  max="50"
                  defaultValue={p.required_completion_photos}
                  className={field}
                />
              </label>
              <div className="flex justify-end gap-2">
                <Link
                  href={`?tab=standard`}
                  className="inline-flex min-h-11 items-center rounded-lg border px-4 font-bold"
                >
                  Cancel
                </Link>
                <button className="min-h-11 rounded-lg bg-[#071f49] px-5 font-extrabold text-white">
                  Save standard
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex justify-between">
              <h2 className="text-xl font-extrabold">Turnover standard</h2>
              <Link
                href="?tab=standard&edit=1"
                className="text-sm font-bold text-[#245b9d]"
              >
                Edit standard
              </Link>
            </div>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              {detail({ label: "Bed setup", value: p.bed_configuration })}
              {detail({ label: "Linen", value: p.linen_requirements })}
              {detail({ label: "Towels", value: p.towel_requirements })}
              {detail({ label: "Waste", value: p.waste_instructions })}
              {detail({
                label: "Consumables",
                value: p.consumables_instructions,
              })}
              {detail({
                label: "Sofa bed",
                value: p.sofa_bed_required ? "Required" : "Not required",
              })}
              {detail({ label: "Guest-ready notes", value: p.cleaning_notes })}
              {detail({
                label: "Required evidence",
                value: `${p.required_completion_photos} completion photos`,
              })}
            </dl>
          </section>
        ))}

      {tab === "access" &&
        (edit ? (
          <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold">
              Edit access and property notes
            </h2>
            <form action={updatePropertySection} className="mt-5 grid gap-5">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="section" value="access" />
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Access instructions", "accessNotes", p.access_notes],
                  ["Key or lockbox", "keyInstructions", p.key_instructions],
                  [
                    "Key return",
                    "keyReturnInstructions",
                    p.key_return_instructions,
                  ],
                  ["Parking", "parkingNotes", p.parking_notes],
                  ["Floor or lift", "floorLiftNotes", p.floor_lift_notes],
                  ["Heating", "heatingInstructions", p.heating_instructions],
                  ["Lighting", "lightingInstructions", p.lighting_instructions],
                  [
                    "Emergency contact",
                    "emergencyContact",
                    p.emergency_contact,
                  ],
                  ["Internal notes", "internalNotes", p.internal_notes],
                ].map(([label, name, value]) => (
                  <label key={name} className="font-bold">
                    {label}
                    <textarea
                      name={name}
                      defaultValue={value || ""}
                      className={field}
                    />
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Link
                  href="?tab=access"
                  className="inline-flex min-h-11 items-center rounded-lg border px-4 font-bold"
                >
                  Cancel
                </Link>
                <button className="min-h-11 rounded-lg bg-[#071f49] px-5 font-extrabold text-white">
                  Save access
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-extrabold">Access</h2>
                <p className="mt-1 text-sm text-[#657089]">
                  Sensitive instructions are masked and every reveal is
                  recorded.
                </p>
              </div>
              <Link
                href="?tab=access&edit=1"
                className="text-sm font-bold text-[#245b9d]"
              >
                Edit access
              </Link>
            </div>
            <AccessReveal propertyId={id} />
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              {detail({ label: "Heating", value: p.heating_instructions })}
              {detail({ label: "Lighting", value: p.lighting_instructions })}
              {detail({
                label: "Emergency contact",
                value: p.emergency_contact,
              })}
              {detail({ label: "Internal notes", value: p.internal_notes })}
            </dl>
          </section>
        ))}

      {tab === "checklist" && (
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold">Checklist</h2>
          <p className="mt-1 text-sm text-[#657089]">
            Changes apply to future turnovers only.
          </p>
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
                }>;
              }) => (
                <div key={section.id}>
                  <h3 className="border-b pb-2 font-extrabold">
                    {section.title}
                  </h3>
                  {[...(section.checklist_template_tasks || [])]
                    .sort((a, b) => a.position - b.position)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-3 border-b py-3"
                      >
                        <div>
                          <p className="font-bold">{task.label}</p>
                          <p className="text-xs text-[#657089]">
                            {task.mandatory ? "Required" : "Optional"}
                            {task.photo_required ? " · Photo required" : ""}
                          </p>
                        </div>
                        <div className="flex">
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
                              className="min-h-10 min-w-10"
                            >
                              ↑
                            </button>
                            <button
                              name="direction"
                              value="down"
                              aria-label={`Move ${task.label} down`}
                              className="min-h-10 min-w-10"
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
              ),
            )}
          </div>
          <form
            action={addChecklistTask}
            className="mt-6 grid gap-3 rounded-lg bg-[#f4f6f9] p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="propertyId" value={id} />
            <label className="font-bold">
              Section
              <input name="sectionTitle" required className={field} />
            </label>
            <label className="font-bold">
              Task
              <input name="label" required className={field} />
            </label>
            <label className="flex items-center gap-2 font-bold">
              <input type="checkbox" name="mandatory" className="h-5 w-5" />
              Required
            </label>
            <label className="flex items-center gap-2 font-bold">
              <input type="checkbox" name="photoRequired" className="h-5 w-5" />
              Photo required
            </label>
            <button className="min-h-11 rounded-lg bg-[#071f49] px-4 font-bold text-white sm:col-span-2">
              Add task
            </button>
          </form>
        </section>
      )}

      {tab === "cleaners" && (
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex justify-between">
            <h2 className="text-xl font-extrabold">Cleaners</h2>
            <Link
              href={`/business/properties/${id}/cleaners`}
              className="text-sm font-bold text-[#245b9d]"
            >
              Manage cleaners
            </Link>
          </div>
          <p className="mt-5">
            {p.property_workers?.length
              ? p.property_workers
                  .map(
                    (row: {
                      workers:
                        { display_name: string } | { display_name: string }[];
                    }) =>
                      display(
                        (Array.isArray(row.workers)
                          ? row.workers[0]
                          : row.workers
                        ).display_name,
                      ),
                  )
                  .join(", ")
              : "No default cleaner assigned."}
          </p>
        </section>
      )}
      {tab === "history" && (
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold">Turnover history</h2>
          <div className="mt-4 divide-y">
            {p.work_items?.length ? (
              p.work_items
                .sort(
                  (
                    a: { turnover_date: string },
                    b: { turnover_date: string },
                  ) => b.turnover_date.localeCompare(a.turnover_date),
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
                      className="flex min-h-14 items-center justify-between py-3"
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
              <p className="py-3 text-[#657089]">No turnover history yet.</p>
            )}
          </div>
        </section>
      )}
      {tab === "activity" && (
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold">Activity</h2>
          <div className="mt-4 divide-y">
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
                      <time className="text-sm text-[#657089]">
                        {new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(event.created_at))}
                      </time>
                    </div>
                  ),
                )
            ) : (
              <p className="py-3 text-[#657089]">No activity yet.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
