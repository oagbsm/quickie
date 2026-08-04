import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCleanerUser } from "@/lib/cleaner/auth";
import CleanerStatus from "@/app/cleaner/CleanerStatus";
import PendingButton from "@/app/components/PendingButton";
import { getCleanerLifecycle } from "@/lib/cleaner/lifecycle";
import { completeTestTurnover, reportIssue, transitionTurnover, updateChecklistTask, uploadEvidence } from "@/app/business/str-actions";
import { formatDisplayAddress } from "@/lib/display-address";

const imageAccept = "image/jpeg,image/png,image/webp,image/heic";
const time = (value: string) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(value));
const date = (value: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "Europe/London" }).format(new Date(value));
const related = <T,>(value: T | T[] | null) => Array.isArray(value) ? value[0] : value;

type CleanerTask = {
  id: string;
  label: string;
  section_title: string;
  mandatory: boolean;
  completed: boolean;
  response_type: string;
  response: string | null;
  photo_required: boolean;
  note_required: boolean;
  note: string | null;
};

type DetailItem = {
  id: string;
  property_public_name: string;
  property_general_area: string;
  turnover_date: string;
  access_start_at: string;
  window_end_at: string;
  status: string;
  ready_at: string | null;
  actual_completed_at: string | null;
  required_evidence_count: number;
  properties: unknown;
  checklist_tasks: CleanerTask[];
  evidence_submissions: Array<{ id: string; evidence_type: string; checklist_task_id: string | null }>;
  operational_issues: Array<{ id: string; status: string; blocking: boolean }>;
};

const journey = [
  ["accepted", "Accepted"],
  ["en_route", "En route"],
  ["arrived", "Arrived"],
  ["in_progress", "Cleaning"],
  ["ready", "Done"],
] as const;

function journeyIndex(status: string) {
  if (status === "action_required") return 3;
  return Math.max(0, journey.findIndex(([key]) => key === status));
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, workerId } = await requireCleanerUser();
  const base = "id,property_public_name,property_general_area,turnover_date,access_start_at,window_end_at,status,ready_at,actual_completed_at,required_evidence_count,assignments!inner(status,worker_id),checklist_tasks(id,label,section_title,mandatory,completed,response_type,response,photo_required,note_required,note),evidence_submissions(id,evidence_type,checklist_task_id),operational_issues(id,status,blocking)";
  const { data: summary } = await supabase
    .from("work_items")
    .select(`${base},properties(nickname,address_line_1,city,postcode)`)
    .eq("id", id)
    .eq("assignments.worker_id", workerId)
    .maybeSingle();
  if (!summary) notFound();

  const acceptedStatuses = ["accepted", "en_route", "arrived", "in_progress", "action_required", "evidence_submitted", "ready"];
  const accepted = acceptedStatuses.includes(summary.status);
  let item = summary as unknown as DetailItem;
  if (accepted) {
    const { data: full } = await supabase
      .from("work_items")
      .select(`${base},properties(nickname,address_line_1,city,postcode,access_notes,key_instructions,key_return_instructions,parking_notes,floor_lift_notes,cleaning_notes,linen_requirements,towel_requirements,bed_configuration,consumables_instructions,waste_instructions)`)
      .eq("id", id)
      .eq("assignments.worker_id", workerId)
      .maybeSingle();
    if (full) item = full as unknown as DetailItem;
  }

  const property = related(item.properties) as {
    nickname?: string;
    address_line_1?: string;
    city?: string;
    postcode?: string;
    access_notes?: string | null;
    key_instructions?: string | null;
    cleaning_notes?: string | null;
    key_return_instructions?: string | null;
    parking_notes?: string | null;
    floor_lift_notes?: string | null;
    linen_requirements?: string | null;
    towel_requirements?: string | null;
    bed_configuration?: string | null;
    consumables_instructions?: string | null;
    waste_instructions?: string | null;
  } | null;
  const address = formatDisplayAddress([property?.address_line_1, property?.city, property?.postcode], item.property_general_area || "");
  const mapsUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;
  const tasks = item.checklist_tasks || [];
  const completedCount = tasks.filter((task) => task.completed).length;
  const completionPhotos = (item.evidence_submissions || []).filter((entry) => entry.evidence_type === "completion_photo").length;
  const activeWork = ["in_progress", "action_required"].includes(item.status);
  const blockingIssues = (item.operational_issues || []).filter((issue) => issue.blocking && !["resolved", "closed"].includes(issue.status)).length;
  const blockers = activeWork ? [
    ...tasks.filter((task) => task.mandatory && !task.completed).map((task) => `${task.label} is incomplete`),
    ...tasks.filter((task) => task.note_required && !task.note?.trim()).map((task) => `${task.label} needs a note`),
    ...(completionPhotos < item.required_evidence_count ? [`${item.required_evidence_count - completionPhotos} completion photo${item.required_evidence_count - completionPhotos === 1 ? "" : "s"} still needed`] : []),
    ...(blockingIssues ? [`${blockingIssues} blocking issue${blockingIssues === 1 ? "" : "s"} remain${blockingIssues === 1 ? "s" : ""}`] : []),
  ] : [];
  const grouped = new Map<string, CleanerTask[]>();
  for (const task of tasks) grouped.set(task.section_title, [...(grouped.get(task.section_title) || []), task]);
  const canComplete = item.status === "in_progress" && blockers.length === 0;
  const errorText: Record<string, string> = {
    invalid_file: "That photo is not supported. Use a JPG, PNG, WebP or HEIC image under 10 MB.",
    storage: "The photo could not be stored. Try again.",
    evidence: "The photo could not be linked. Try again.",
    task_photo_required: "Take the required task photo before completing this task.",
    task_requirements: "Complete the required result and note before completing this task.",
    task_save: "We could not save that task. Try again.",
    update: "We could not update the clean. Try again.",
    action_required: "The clean was saved, but some completion requirements still need attention.",
  };

  if (item.status === "ready") {
    return <div className="mx-auto max-w-5xl">
      <Link href="/cleaner/today" className="text-sm font-bold text-[#526078]">← Today</Link>
      <section className="mt-5 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-extrabold text-emerald-700">Clean completed ✓</p>
        <h1 className="mt-1 text-3xl font-extrabold">{property?.nickname || item.property_public_name}</h1>
        <p className="mt-1 text-[#657089]">Your checklist and evidence have been submitted.</p>
        <div className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-3">
          <div><p className="text-xs font-bold text-[#748096]">CHECKLIST</p><p className="mt-1 font-extrabold">{completedCount}/{tasks.length} tasks completed</p></div>
          <div><p className="text-xs font-bold text-[#748096]">EVIDENCE</p><p className="mt-1 font-extrabold">{item.evidence_submissions.length} photos submitted</p></div>
          <div><p className="text-xs font-bold text-[#748096]">COMPLETED</p><p className="mt-1 font-extrabold">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(item.ready_at || item.actual_completed_at || item.window_end_at))}</p></div>
        </div>
        <Link href="/cleaner/today" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#071f49] px-4 font-extrabold text-white">Back to Today</Link>
      </section>
    </div>;
  }

  const currentJourney = journeyIndex(item.status);
  const accessContent = [property?.access_notes, property?.key_instructions, property?.key_return_instructions, property?.parking_notes, property?.floor_lift_notes].some(Boolean);
  const linenContent = [property?.linen_requirements, property?.towel_requirements, property?.bed_configuration, property?.consumables_instructions, property?.waste_instructions].some(Boolean);
  const propertyNotes = property?.cleaning_notes;
  const currentAction = getCleanerLifecycle(item.status).primaryAction;
  return <div className="mx-auto max-w-6xl pb-24 lg:pb-8">
    <div className="mb-4 flex items-center justify-between gap-3">
      <Link href="/cleaner/today" className="text-sm font-bold text-[#526078]">← Back to today</Link>
      <span className="text-sm font-extrabold text-[#071f49]">Quickola</span>
    </div>
    {error && errorText[error] && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-800">{errorText[error]}</p>}
    {process.env.NODE_ENV === "development" && <section className="mb-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4"><p className="text-xs font-extrabold uppercase tracking-wide text-amber-900">Development only</p><form action={completeTestTurnover} className="mt-2"><input type="hidden" name="turnoverId" value={id} /><PendingButton idle="Complete test clean" pending="Completing test clean…" className="min-h-11 rounded-lg bg-amber-700 px-4 text-sm font-extrabold text-white" /></form></section>}

    <header className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[#2d67b2]">{date(item.turnover_date)}</p>
          <h1 className="mt-1 truncate text-2xl font-extrabold sm:text-3xl">{property?.nickname || item.property_public_name}</h1>
          <p className="mt-1 break-words text-sm text-[#657089]">{address || "Address unavailable"}</p>
        </div>
        <CleanerStatus status={item.status} />
      </div>
      <div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-3">
        <div><p className="text-xs font-bold uppercase tracking-wide text-[#748096]">Clean window</p><p className="mt-1 font-extrabold">{time(item.access_start_at)}–{time(item.window_end_at)}</p></div>
        <div><p className="text-xs font-bold uppercase tracking-wide text-[#748096]">Ready by</p><p className="mt-1 font-extrabold">{time(item.window_end_at)}</p></div>
        {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-lg border px-3 text-sm font-extrabold text-[#071f49]">Open in Maps ↗</a>}
      </div>
    </header>

    {accepted && <section aria-label="Clean journey" className="mt-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-extrabold">Your clean</h2><span className="text-sm font-bold text-[#657089]">{item.status === "action_required" ? "Needs attention" : journey[currentJourney]?.[1]}</span></div>
      <ol className="mt-4 grid grid-cols-5 gap-1" aria-label="Clean progress">
        {journey.map(([key, label], index) => <li key={key} className="text-center text-[11px] font-bold text-[#657089]"><span className={`mx-auto mb-1 block h-2 rounded-full ${index <= currentJourney ? "bg-[#2d67b2]" : "bg-[#e8edf3]"}`} /><span>{label}</span></li>)}
      </ol>
    </section>}

    {item.status === "awaiting_response" && <section className="mt-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
      <p className="text-lg font-extrabold">Your response is needed</p>
      <p className="mt-1 text-sm text-[#657089]">Let the operator know if you can take this clean.</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <form action={transitionTurnover}><input type="hidden" name="turnoverId" value={id} /><button name="nextStatus" value="declined" className="min-h-12 w-full rounded-lg border font-extrabold">Decline</button></form>
        <form action={transitionTurnover}><input type="hidden" name="turnoverId" value={id} /><input type="hidden" name="nextStatus" value="accepted" /><PendingButton idle="Accept" pending="Saving…" className="min-h-12 w-full rounded-lg bg-[#071f49] font-extrabold text-white" /></form>
      </div>
    </section>}

    {accepted && <>
      {accessContent && <section className="mt-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-extrabold">Access</h2><span className="text-xs font-bold uppercase tracking-wide text-emerald-700">Available after acceptance</span></div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {property?.access_notes && <div><dt className="text-sm font-bold text-[#748096]">Entry</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{property.access_notes}</dd></div>}
          {property?.key_instructions && <div><dt className="text-sm font-bold text-[#748096]">Keys / lockbox</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{property.key_instructions}</dd></div>}
          {property?.key_return_instructions && <div><dt className="text-sm font-bold text-[#748096]">Key return</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{property.key_return_instructions}</dd></div>}
          {property?.parking_notes && <div><dt className="text-sm font-bold text-[#748096]">Parking</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{property.parking_notes}</dd></div>}
          {property?.floor_lift_notes && <div><dt className="text-sm font-bold text-[#748096]">Floor / lift</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{property.floor_lift_notes}</dd></div>}
        </dl>
      </section>}

      {currentAction && ["accepted", "en_route", "arrived"].includes(item.status) && <section className="mt-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-extrabold">Next step</h2>
        <form action={transitionTurnover} className="mt-3"><input type="hidden" name="turnoverId" value={id} /><input type="hidden" name="nextStatus" value={currentAction.nextStatus} /><PendingButton idle={currentAction.label} pending="Saving…" className="min-h-12 w-full rounded-lg bg-[#071f49] px-4 font-extrabold text-white" /></form>
      </section>}

      {linenContent && <section className="mt-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-extrabold">Linen &amp; supplies</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {property?.linen_requirements && <div><dt className="text-sm font-bold text-[#748096]">Linen</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{property.linen_requirements}</dd></div>}
        {property?.towel_requirements && <div><dt className="text-sm font-bold text-[#748096]">Towels</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{property.towel_requirements}</dd></div>}
        {property?.bed_configuration && <div><dt className="text-sm font-bold text-[#748096]">Bed setup</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{property.bed_configuration}</dd></div>}
        {property?.consumables_instructions && <div><dt className="text-sm font-bold text-[#748096]">Consumables</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{property.consumables_instructions}</dd></div>}
        {property?.waste_instructions && <div><dt className="text-sm font-bold text-[#748096]">Waste</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{property.waste_instructions}</dd></div>}
      </dl></section>}

      {propertyNotes && <section className="mt-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-extrabold">Property notes</h2><p className="mt-3 whitespace-pre-wrap text-sm">{propertyNotes}</p></section>}

      {accepted && tasks.length > 0 && <section className="mt-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-extrabold">Cleaning checklist</h2><span className="font-extrabold">{completedCount}/{tasks.length}</span></div>
        <p className="mt-1 text-sm text-[#657089]">{completedCount} of {tasks.length} tasks complete</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8edf3]"><div className="h-full rounded-full bg-[#079448]" style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }} /></div>
        <div className="mt-5 grid gap-2">{Array.from(grouped.entries()).map(([section, sectionTasks]) => <details key={section} open={activeWork && sectionTasks.some((task) => !task.completed)} className="rounded-lg border">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 py-3 text-sm font-extrabold"><span>{section}</span><span>{sectionTasks.filter((task) => task.completed).length}/{sectionTasks.length}</span></summary>
          <div className="divide-y border-t">{sectionTasks.map((task) => <div key={task.id} className="p-3 text-sm">
            <p className={task.completed ? "font-bold text-emerald-700" : "font-bold"}>{task.completed ? "✓" : "○"} {task.label}</p>
            {!task.completed && <p className="mt-1 text-xs text-[#657089]">{task.photo_required ? "Photo required" : task.note_required ? "Note required" : "Ready to complete when finished"}</p>}
            {activeWork && !task.completed && (task.photo_required || /key.*return/i.test(task.label)) ? <form action={uploadEvidence} className="mt-3 grid gap-2">
              <input type="hidden" name="turnoverId" value={id} /><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="evidenceType" value={/key.*return/i.test(task.label) ? "key_return" : "completion_photo"} />
              {task.response_type !== "checkbox" && <select name="response" defaultValue={task.response || ""} required className="min-h-10 rounded-lg border px-2"><option value="" disabled>Select result</option><option value={task.response_type === "yes_no" ? "yes" : "pass"}>{task.response_type === "yes_no" ? "Yes" : "Pass"}</option><option value={task.response_type === "yes_no" ? "no" : "fail"}>{task.response_type === "yes_no" ? "No" : "Fail"}</option></select>}
              {task.note_required && <textarea name="note" defaultValue={task.note || ""} required placeholder="Required note" className="rounded-lg border p-2" />}
              <label className="cursor-pointer rounded-lg border px-3 py-2 text-center font-bold">Add photo<input name="file" type="file" accept={imageAccept} capture="environment" className="sr-only" required /></label>
              <PendingButton idle="Complete with photo" pending="Saving…" className="min-h-10 rounded-lg bg-[#071f49] px-3 font-extrabold text-white" />
            </form> : activeWork && !task.completed ? <form action={updateChecklistTask} className="mt-3 grid gap-2">
              <input type="hidden" name="turnoverId" value={id} /><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="completed" value="on" />
              {task.response_type !== "checkbox" && <select name="response" defaultValue={task.response || ""} required className="min-h-10 rounded-lg border px-2"><option value="" disabled>Select result</option><option value={task.response_type === "yes_no" ? "yes" : "pass"}>{task.response_type === "yes_no" ? "Yes" : "Pass"}</option><option value={task.response_type === "yes_no" ? "no" : "fail"}>{task.response_type === "yes_no" ? "No" : "Fail"}</option></select>}
              {task.note_required && <textarea name="note" defaultValue={task.note || ""} required placeholder="Required note" className="rounded-lg border p-2" />}
              <PendingButton idle="Complete task" pending="Saving…" className="min-h-10 rounded-lg bg-[#071f49] px-3 font-extrabold text-white" />
            </form> : null}
          </div>)}</div>
        </details>)}</div>
      </section>}

      {activeWork && <section className="mt-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-extrabold">Finish clean</h2>
        {canComplete ? <form action={transitionTurnover} className="mt-3"><input type="hidden" name="turnoverId" value={id} /><input type="hidden" name="nextStatus" value="evidence_submitted" /><PendingButton idle="Mark as done" pending="Saving…" className="min-h-12 w-full rounded-lg bg-[#071f49] px-4 font-extrabold text-white" /></form> : <p className="mt-1 text-sm text-[#657089]">Complete all required tasks and evidence before finishing.</p>}
      </section>}

      {activeWork && <details className="mt-5 rounded-2xl border bg-white p-5 shadow-sm"><summary className="cursor-pointer text-lg font-extrabold">Report an issue</summary><form action={reportIssue} className="mt-4 grid gap-3">
        <input type="hidden" name="turnoverId" value={id} /><select name="issueType" required className="min-h-11 rounded-lg border px-3"><option value="">Choose an issue</option><option>Access problem</option><option>Damage</option><option>Missing item</option><option>Cleaning problem</option><option>Linen/supplies</option><option>Other</option></select><textarea name="description" required placeholder="What needs attention?" className="rounded-lg border p-3" /><button className="min-h-11 rounded-lg border px-4 font-extrabold">Report issue</button>
      </form></details>}
    </>}
  </div>;
}
