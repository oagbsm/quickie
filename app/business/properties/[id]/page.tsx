import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import { listReservations } from "@/lib/server/reservations";
import CalendarSources from "./CalendarSources";
import PropertyReservations from "./PropertyReservations";
import { formatDisplayAddress } from "@/lib/display-address";
import type { RejectedImportConflict } from "@/lib/reservations/conflicts";

const tabs = [
  ["overview", "Overview"],
  ["reservations", "Bookings"],
  ["checklist", "Checklist"],
  ["access", "Access"],
] as const;
const field =
  "mt-1.5 min-h-11 w-full rounded-lg border border-[#cfd7e3] bg-white px-3 py-2 outline-none focus:border-[#2d67b2] focus:ring-4 focus:ring-[#2d67b2]/15";
const display = (value?: string | null) => {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bLtd\b/i, "Ltd");
};
const detail = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  value ?
  <div>
    <dt className="text-sm font-bold text-[#657089]">{label}</dt>
    <dd className="mt-1 whitespace-pre-wrap font-medium">
      {value}
    </dd>
  </div> : null
);

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="4" r="1.2" /><circle cx="11" cy="4" r="1.2" />
      <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
      <circle cx="5" cy="12" r="1.2" /><circle cx="11" cy="12" r="1.2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h12M8 3h4l1 3H7l1-3ZM6 6l.7 10h6.6L14 6M8.5 9v4M11.5 9v4" />
    </svg>
  );
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    edit?: string;
    created?: string;
    error?: string;
    updated?: string;
  }>;
}) {
  const { id } = await params,
    { tab: requested, edit, created, error, updated } = await searchParams;
  if (requested === "standard") redirect(`/business/properties/${id}?tab=checklist`);
  if (requested === "cleaners") redirect(`/business/properties/${id}?tab=overview`);
  if (requested === "history" || requested === "activity") redirect(`/business/turnovers?view=completed&property=${id}`);
  const tab = tabs.some(([key]) => key === requested) ? requested! : "overview";
  const { supabase, accountId } = await requireBusinessUser();
  const { data: p, error: queryError } = await supabase
    .from("properties")
    .select(
      "*,checklist_templates(id,active,checklist_template_sections(id,title,position,checklist_template_tasks(id,label,position,mandatory,photo_required,note_required,blocking))),work_items(id,turnover_date,status,ready_at,assignments(workers(display_name)),operational_issues(status)),property_workers(is_default,workers(id,display_name)),activity_events(id,description,created_at)",
    )
    .eq("id", id)
    .eq("account_id", accountId)
    .maybeSingle();
  if (queryError) {
    console.error("property_query_failed", {
      operation: "business_property_detail",
      accountId,
      propertyId: id,
      code: queryError.code,
      message: queryError.message,
      details: queryError.details,
      hint: queryError.hint,
    });
    throw new Error(`property_query_failed:${queryError.code}`);
  }
  if (!p) notFound();
  const title = display(p.nickname),
    template = p.checklist_templates?.find(
      (item: { active: boolean }) => item.active,
    ),
    sections = [...(template?.checklist_template_sections || [])].sort(
      (a: { position: number }, b: { position: number }) =>
        a.position - b.position,
    );
  let calendarConnections;
  try {
    calendarConnections = await listPropertyCalendarConnections(id);
  } catch (calendarError) {
    console.error("property_calendar_connections_failed", {
      operation: "business_property_detail",
      accountId,
      propertyId: id,
      code: calendarError instanceof Error && calendarError.message.includes(":")
        ? calendarError.message.split(":").at(-1)
        : "unknown",
    });
    throw calendarError;
  }
  const hasTechnicalCalendarIssue = (connection: (typeof calendarConnections)[number]) => {
    const conflictOnly = connection.open_issues.length > 0 && connection.open_issues.every((issue) => issue.issue_type === "overlap_conflict");
    return ["attention_required", "never_synced", "syncing", "disabled"].includes(connection.sync_status) && !conflictOnly;
  };
  const overviewCalendarStatus = calendarConnections.length
    ? calendarConnections.some(hasTechnicalCalendarIssue)
      ? "attention"
      : "connected"
    : "no_source";
  const propertyReservations = tab === "reservations"
    ? await listReservations("upcoming", id)
    : [];
  const calendarsHealthy = calendarConnections.length > 0 && !calendarConnections.some(hasTechnicalCalendarIssue);
  const activeCalendarConnections = calendarConnections.filter((connection) => connection.is_active);
  const rejectedConflicts: RejectedImportConflict[] = calendarConnections.flatMap((connection) =>
    connection.open_issues
      .filter((issue) => issue.issue_type === "overlap_conflict")
      .map((issue) => {
        const metadata = issue.metadata || {};
        const conflictingId = typeof metadata.conflicting_reservation_id === "string" ? metadata.conflicting_reservation_id : null;
        const conflicting = conflictingId ? propertyReservations.find((reservation) => reservation.id === conflictingId) : null;
        return {
          issueId: issue.id,
          anchorId: `booking-conflict-${issue.id.slice(0, 8)}`,
          provider: connection.provider,
          connectionId: connection.id,
          startAt: typeof metadata.attempted_start_at === "string" ? metadata.attempted_start_at : null,
          endAt: typeof metadata.attempted_end_at === "string" ? metadata.attempted_end_at : null,
          conflictingReservation: conflicting ? {
            id: conflicting.id,
            provider: conflicting.sourceConnection?.provider || "other",
            startAt: conflicting.check_in_at,
            endAt: conflicting.check_out_at,
          } : undefined,
        };
      }),
  ).sort((a, b) => {
    if (!a.startAt && !b.startAt) return a.anchorId.localeCompare(b.anchorId);
    if (!a.startAt) return 1;
    if (!b.startAt) return -1;
    return a.startAt.localeCompare(b.startAt);
  });
  const visibleSections = sections.filter(
    (section: { checklist_template_tasks: Array<unknown> }) =>
      Array.isArray(section.checklist_template_tasks) &&
      section.checklist_template_tasks.length > 0,
  );
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
            {formatDisplayAddress([p.address_line_1, p.city, p.postcode])}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/business/reservations/new?property=${id}`}
            className="portal-action-secondary"
          >
            Add booking
          </Link>
          <details className="relative"><summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-lg border px-4 font-extrabold">More</summary><div className="absolute right-0 z-10 mt-2 w-52 rounded-lg border bg-white p-2 shadow-lg"><Link href={`/business/turnovers/new?property=${id}`} className="block rounded px-3 py-2 text-sm font-bold hover:bg-[#f4f6f9]">Create manual clean</Link></div></details>
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
      {created === "1" && (
        <section
          role="status"
          className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"
        >
          {activeCalendarConnections.length === 0 ? <>
            <h2 className="text-lg font-extrabold">Property created successfully</h2>
            <p className="mt-1 text-sm">Your property is ready. Connect a booking calendar to import bookings and create cleans automatically.</p>
            <Link href={`/business/properties/${id}?tab=reservations&created=1`} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#071f49] px-4 font-extrabold text-white">Connect booking calendar</Link>
          </> : <>
            <h2 className="text-lg font-extrabold">Property ready</h2>
            <p className="mt-1 text-sm">Your property has been created and your booking calendar is connected.</p>
            <p className="mt-2 text-sm font-bold">Calendar connected · {activeCalendarConnections[0].display_name || ({ airbnb: "Airbnb", booking_com: "Booking.com", vrbo: "Vrbo", expedia: "Expedia", other: "Other calendar" }[activeCalendarConnections[0].provider])}</p>
            {typeof activeCalendarConnections[0].last_sync_summary.imported === "number" && activeCalendarConnections[0].last_sync_summary.imported > 0 ? <p className="mt-1 text-sm">{activeCalendarConnections[0].last_sync_summary.imported} bookings imported.</p> : <p className="mt-1 text-sm">Calendar connected successfully. New bookings will appear here automatically.</p>}
            <div className="mt-4 flex flex-wrap gap-3"><Link href={`/business/properties/${id}?tab=reservations`} className="inline-flex min-h-11 items-center rounded-lg bg-[#071f49] px-4 font-extrabold text-white">View bookings</Link><Link href={`/business/properties/${id}?tab=reservations#manage-calendars`} className="inline-flex min-h-11 items-center rounded-lg border border-emerald-300 px-4 font-extrabold">Manage calendars</Link></div>
          </>}
        </section>
      )}
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
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-5 shadow-sm"><p className="text-sm font-extrabold text-[#657089]">NEXT CLEAN</p>{p.work_items?.filter((item: { status: string; turnover_date: string }) => !["ready", "cancelled"].includes(item.status)).sort((a: { turnover_date: string }, b: { turnover_date: string }) => a.turnover_date.localeCompare(b.turnover_date))[0] ? <p className="mt-2 font-extrabold">{p.work_items.filter((item: { status: string; turnover_date: string }) => !["ready", "cancelled"].includes(item.status)).sort((a: { turnover_date: string }, b: { turnover_date: string }) => a.turnover_date.localeCompare(b.turnover_date))[0].turnover_date}</p> : <p className="mt-2 text-sm text-[#657089]">No upcoming clean</p>}</div>
            <div className="rounded-xl bg-white p-5 shadow-sm"><p className="text-sm font-extrabold text-[#657089]">CLEANER</p>{p.property_workers?.find((row: { is_default: boolean }) => row.is_default)?.workers ? <><p className="mt-2 font-extrabold">{(Array.isArray(p.property_workers.find((row: { is_default: boolean }) => row.is_default).workers) ? p.property_workers.find((row: { is_default: boolean }) => row.is_default).workers[0] : p.property_workers.find((row: { is_default: boolean }) => row.is_default).workers).display_name}</p><p className="text-sm text-[#657089]">Default cleaner</p></> : <><p className="mt-2 font-extrabold">Not assigned</p><Link href="/business/cleaners" className="text-sm font-bold text-[#245b9d]">Set default cleaner</Link></>}</div>
          </section>
          <section className="mt-4 rounded-xl bg-white p-5 shadow-sm"><p className="text-sm font-extrabold text-[#657089]">PROPERTY STATUS</p><p className="mt-2 font-extrabold">{p.work_items?.flatMap((item: { operational_issues?: Array<{ status: string }> }) => item.operational_issues || []).filter((issue: { status: string }) => !["resolved", "closed"].includes(issue.status)).length ? `${p.work_items.flatMap((item: { operational_issues?: Array<{ status: string }> }) => item.operational_issues || []).filter((issue: { status: string }) => !["resolved", "closed"].includes(issue.status)).length} open issue(s)` : "No open issues"}</p></section>
          <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold text-[#2d67b2]">
                  Booking calendar
                </p>
                <h2 className="mt-1 text-xl font-extrabold">
                  {overviewCalendarStatus === "no_source"
                    ? "No calendar connected"
                    : overviewCalendarStatus === "attention"
                    ? "Calendar needs attention"
                    : calendarConnections.length > 1
                    ? `${calendarConnections.length} calendars connected`
                    : "Calendar connected"}
                </h2>
              </div>
              <Link
                href={`/business/properties/${id}?tab=reservations`}
                className="text-sm font-bold text-[#245b9d]"
              >
                Manage sources
              </Link>
            </div>
            <p className="mt-3 text-sm text-[#657089]">
              {overviewCalendarStatus === "no_source"
                ? "Connect a calendar on the Bookings tab to import bookings automatically."
                : overviewCalendarStatus === "attention"
                ? "A connected source needs attention or has not completed its first sync."
                : "Your booking calendar is connected and syncing normally."}
            </p>
          </section>
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
                value: p.default_checkout_time ? String(p.default_checkout_time).slice(0, 5) : "—",
              })}
              {detail({
                label: "Default check-in",
                value: p.default_checkin_time ? String(p.default_checkin_time).slice(0, 5) : "—",
              })}
              {detail({
                label: "Estimated clean",
                value: p.estimated_turnover_minutes == null ? "—" : `${p.estimated_turnover_minutes} minutes`,
              })}
              {detail({
                label: "Completion evidence",
                value: p.required_completion_photos == null ? "—" : `${p.required_completion_photos} photos`,
              })}
            </dl>
          </section>
          <section className="mt-6 rounded-xl bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Recent cleans</h2><Link href={`/business/turnovers?property=${id}`} className="text-sm font-bold text-[#245b9d]">View all cleans →</Link></div><div className="mt-4 divide-y">{p.work_items?.filter((item: { status: string }) => ["ready", "cancelled"].includes(item.status)).slice(0, 3).map((item: { id: string; turnover_date: string; status: string }) => <Link key={item.id} href={`/business/turnovers/${item.id}`} className="flex justify-between py-3 text-sm"><span>{item.turnover_date}</span><strong>{item.status === "ready" ? "Property ready" : "Cancelled"}</strong></Link>)}</div></section>
        </>
      )}

      {tab === "reservations" && (
        <>
          <PropertyReservations propertyId={id} reservations={propertyReservations} hasConnections={calendarConnections.length > 0} calendarsHealthy={calendarsHealthy} rejectedConflicts={rejectedConflicts} />
          <details id="manage-calendars" open={calendarConnections.length === 0} className="mt-8 rounded-xl border border-[#dfe6ef] bg-white shadow-sm">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-extrabold text-[#071f49] outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#2d67b2]/20 sm:px-6">
              <span>Calendars</span><span className="text-sm font-bold text-[#657089]">{calendarConnections.length ? `${calendarConnections.length} connected · ${calendarsHealthy ? "All healthy" : "Needs attention"}` : "No calendar connected"}</span>
            </summary>
            <div className="border-t border-[#e7ebf0] px-1 pb-2"><CalendarSources propertyId={id} connections={calendarConnections} /></div>
          </details>
        </>
      )}

      {tab === "standard" &&
        (edit ? (
          <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold">Edit clean standard</h2>
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
              <h2 className="text-xl font-extrabold">Clean standard</h2>
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
        <section className="mt-6 rounded-xl bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-extrabold">Checklist</h2><p className="mt-1 text-sm text-[#657089]">Changes apply to future turnovers only.</p></div><Link href={`/business/properties/${id}?tab=checklist&edit=1`} className="inline-flex min-h-11 shrink-0 items-center font-bold text-[#245b9d]">{edit ? "Done editing" : "Edit checklist"}</Link></div>
          <div className="mt-5 grid gap-4">
            {visibleSections.map(
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
              }) => {
                const tasks = [...(section.checklist_template_tasks || [])].sort((a, b) => a.position - b.position);
                return <section key={section.id} className="overflow-visible rounded-xl border border-[#e1e7ef] bg-[#fbfcfe]">
                  <div className="flex items-center justify-between gap-3 border-b border-[#e7ebf1] px-4 py-3"><h3 className="font-extrabold text-[#071f49]">{section.title}</h3><span className="shrink-0 rounded-full bg-[#eef2f7] px-2.5 py-1 text-xs font-bold text-[#657089]">{tasks.length} {tasks.length === 1 ? "item" : "items"}</span></div>
                  <div className="divide-y divide-[#e7ebf1] px-3">
                    {tasks.map((task) => (
                      <div key={task.id} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2.5 py-3 sm:gap-3">
                        {edit ? <details className="relative mt-0.5">
                          <summary aria-label={`Reorder checklist item: ${task.label}`} className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-lg text-[#8190a5] outline-none hover:bg-[#eef2f7] hover:text-[#526078] focus-visible:ring-4 focus-visible:ring-[#2d67b2]/20"><GripIcon /></summary>
                          <div className="absolute left-0 top-12 z-10 grid min-w-32 gap-1 rounded-lg border border-[#dfe5ed] bg-white p-1.5 shadow-lg">
                            <form action={moveChecklistTask}><input type="hidden" name="propertyId" value={id} /><input type="hidden" name="taskId" value={task.id} /><button name="direction" value="up" aria-label={`Move ${task.label} up`} className="min-h-10 rounded-md px-3 text-left text-sm font-bold hover:bg-[#f4f6f9]">Move up</button></form>
                            <form action={moveChecklistTask}><input type="hidden" name="propertyId" value={id} /><input type="hidden" name="taskId" value={task.id} /><button name="direction" value="down" aria-label={`Move ${task.label} down`} className="min-h-10 rounded-md px-3 text-left text-sm font-bold hover:bg-[#f4f6f9]">Move down</button></form>
                          </div>
                        </details> : <span className="h-11 w-11" aria-hidden="true" />}
                        <div className="min-w-0 pt-1"><p className="break-words font-bold leading-5 text-[#071f49]">{task.label}</p>{edit && <p className="mt-1 text-xs font-semibold text-[#657089]">{task.mandatory ? "Required" : "Optional"}{task.photo_required ? " · Photo required" : ""}</p>}</div>
                        {edit ? <form action={deleteChecklistTask} className="mt-0.5"><input type="hidden" name="propertyId" value={id} /><button type="submit" name="taskId" value={task.id} aria-label="Remove checklist item" title="Remove checklist item" className="grid h-11 w-11 place-items-center rounded-lg text-[#9aa6b7] outline-none hover:bg-red-50 hover:text-red-700 focus-visible:ring-4 focus-visible:ring-red-200"><TrashIcon /></button></form> : <span className="h-11 w-11" aria-hidden="true" />}
                      </div>
                    ))}
                  </div>
                </section>;
              },
            )}
          </div>
          {edit && <form action={addChecklistTask} className="mt-5 grid gap-3 rounded-xl border border-[#e1e7ef] bg-[#f7f9fc] p-4 sm:grid-cols-2"><input type="hidden" name="propertyId" value={id} /><label className="font-bold">Section<input name="sectionTitle" required className={field} /></label><label className="font-bold">Task<input name="label" required className={field} /></label><label className="flex items-center gap-2 font-bold"><input type="checkbox" name="mandatory" className="h-5 w-5" />Required</label><label className="flex items-center gap-2 font-bold"><input type="checkbox" name="photoRequired" className="h-5 w-5" />Photo required</label><button className="min-h-11 rounded-lg bg-[#071f49] px-4 font-bold text-white sm:col-span-2">Add task</button></form>}
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
                        )?.display_name,
                      ),
                  )
                  .join(", ")
              : "No default cleaner assigned."}
          </p>
        </section>
      )}
      {tab === "history" && (
        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold">Clean history</h2>
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
              <p className="py-3 text-[#657089]">No clean history yet.</p>
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
