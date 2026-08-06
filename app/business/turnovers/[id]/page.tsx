import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";
import TurnoverStatus from "../../components/TurnoverStatus";
import { assignWorker, cancelAssignment, resendWorkerInvitation, resolveIssue, updateIssue } from "../../str-actions";
import { currentAssignment } from "@/lib/turnovers/presentation";
import { getOperatorState } from "@/lib/turnovers/operator-lifecycle";
import { formatDisplayName } from "@/lib/display-name";
import { formatDisplayAddress } from "@/lib/display-address";
import { collapseActivityEvents, formatActivityEvent } from "@/lib/activity-presentation";
import ReassignCleanerForm from "./ReassignCleanerForm";
import CleanerCreationDialog from "./CleanerCreationDialog";
import ChecklistTaskDialog from "./ChecklistTaskDialog";

const related = <T,>(value: T | T[] | null) => Array.isArray(value) ? value[0] : value;
const clock = (value: string) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(value));
const dateLabel = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00Z`));
const issueCategoryLabels: Record<string, string> = {
  missing_item: "Missing item",
  damage: "Damage",
  access_issue: "Access issue",
  cleaning_issue: "Cleaning issue",
  maintenance: "Maintenance",
};
const issueCategory = (value: string) => issueCategoryLabels[value] || value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const issueStatus = (value: string) => ({ open: "Open", acknowledged: "Acknowledged", waiting_for_owner: "Waiting for owner", resolved: "Resolved", closed: "Closed" }[value] || "Open");
const issuePriority = (value: string) => `${value.slice(0, 1).toUpperCase()}${value.slice(1)} priority`;
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ workerAdded?: string; workerId?: string; taskAdded?: string; testData?: string; error?: string }> }) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const { supabase, accountId } = await requireBusinessUser();
  const [{ data: item }, { data: availableWorkers }] = await Promise.all([
    supabase.from("work_items").select("*,properties(nickname,address_line_1,city,postcode),assignments(status,assigned_at,response_due_at,workers(id,display_name,company_name)),checklist_tasks(id,label,section_title,mandatory,completed,photo_required,note_required),evidence_submissions(id,work_item_id,evidence_type,checklist_task_id,storage_path,caption,created_at),operational_issues(id,issue_type,severity,description,status,blocking,owner_response,created_at),activity_events(id,event_type,description,created_at,metadata,work_item_id,properties(nickname),workers(display_name))").eq("id", id).eq("account_id", accountId).maybeSingle(),
    supabase.from("workers").select("id,display_name,company_name").eq("account_id", accountId).eq("status", "active").order("display_name"),
  ]);
  if (!item) notFound();
  const property = related(item.properties);
  const assignment = currentAssignment(item.assignments);
  const dueAt = (assignment as { response_due_at?: string } | undefined)?.response_due_at;
  const worker = related(assignment?.workers || null) as { id?: string; display_name?: string; company_name?: string | null } | null;
  const workerName = formatDisplayName(worker?.display_name) || "—";
  const propertyName = formatDisplayName(property?.nickname || item.property_public_name) || "—";
  const state = getOperatorState(item.status);
  const tasks = item.checklist_tasks || [];
  const completed = tasks.filter((t: { completed: boolean }) => t.completed).length;
  const progressPercent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const issues = item.operational_issues || [];
  const evidence = (item.evidence_submissions || []).filter((entry: { work_item_id?: string; storage_path?: string | null }) => entry.work_item_id === item.id && entry.storage_path?.trim());
  const evidencePaths = evidence.map((entry: { storage_path: string }) => entry.storage_path);
  const { data: signedEvidence, error: signedEvidenceError } = evidencePaths.length
    ? await supabase.storage.from("turnover-evidence").createSignedUrls(evidencePaths, 600)
    : { data: [], error: null };
  if (item.status === "ready") {
    console.info("business_completed_clean_debug", {
      workItemId: item.id,
      workItemStatus: item.status,
      checklistTaskCount: tasks.length,
      evidenceRowCount: evidence.length,
      signedEvidenceCount: (signedEvidence || []).filter((entry) => Boolean(entry?.signedUrl)).length,
    });
  }
  if (signedEvidenceError || (evidence.length > 0 && (signedEvidence || []).length !== evidence.length)) {
    console.error("business_completed_clean_debug", {
      workItemId: item.id,
      workItemStatus: item.status,
      checklistTaskCount: tasks.length,
      evidenceRowCount: evidence.length,
      signedEvidenceCount: (signedEvidence || []).filter((entry) => Boolean(entry?.signedUrl)).length,
      errorCode: signedEvidenceError?.statusCode,
      errorMessage: signedEvidenceError?.message,
    });
  }
  const taskLabels = new Map<string, string>((item.checklist_tasks || []).map((task: { id: string; label: string }) => [task.id, task.label] as [string, string]));
  const openIssues = issues.filter((i: { status: string }) => !["resolved", "closed"].includes(i.status));
  const readyWithOpenIssues = item.status === "ready" && openIssues.length > 0;
  const readyIssueCopy = openIssues.every((issue: { blocking: boolean }) => !issue.blocking)
    ? `${openIssues.length} non-blocking issue${openIssues.length === 1 ? "" : "s"} remains for review.`
    : `${openIssues.length} open issue${openIssues.length === 1 ? "" : "s"} remains for review.`;
  const active = !["ready", "cancelled"].includes(item.status);
  const address = formatDisplayAddress([property?.address_line_1, property?.city, property?.postcode], item.property_general_area || "—");
  const activityEvents = collapseActivityEvents(item.activity_events || []).filter((e) => ["turnover_accepted", "turnover_arrived", "turnover_in_progress", "turnover_evidence_submitted", "evidence_submitted", "action_required", "property_ready", "turnover_ready", "readiness_evaluated", "issue_reported"].some((key) => e.event_type.includes(key)));
  const completionEvent = activityEvents.find((event) => ["property_ready", "turnover_ready"].includes(event.event_type) || (event.event_type === "readiness_evaluated" && Boolean(event.metadata?.ready)));
  const fallbackCompletionEvent = item.status === "ready" && !completionEvent && (item.ready_at || item.actual_completed_at)
    ? { id: `${item.id}-completed`, event_type: "turnover_ready", description: "Clean completed", created_at: item.ready_at || item.actual_completed_at!, work_item_id: item.id }
    : null;
  const events = item.status === "ready"
    ? [...activityEvents.filter((event) => event !== completionEvent && event.event_type !== "turnover_ready").slice(0, 3), completionEvent || fallbackCompletionEvent].filter((event): event is NonNullable<typeof event> => Boolean(event))
    : activityEvents.slice(0, 3);
  const sections = new Map<string, { done: number; total: number; tasks: typeof tasks }>();
  for (const task of tasks as Array<{ section_title: string; completed: boolean }>) {
    const current = sections.get(task.section_title) || { done: 0, total: 0, tasks: [] as typeof tasks };
    current.total += 1;
    if (task.completed) current.done += 1;
    current.tasks.push(task);
    sections.set(task.section_title, current);
  }
  const requestedWorkerId = query.workerAdded === "1" ? query.workerId : "";
  const newWorkerId = availableWorkers?.some((candidate) => candidate.id === requestedWorkerId) ? requestedWorkerId : "";
  return <div className="portal-page max-w-6xl">
    <Link href="/business/turnovers" className="text-sm font-bold text-[#526078]">← Cleans</Link>
    {query.error === "assignment_locked" && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-900">This cleaner has already accepted this clean and can no longer be removed.</p>}
    <header className="mt-4 rounded-xl border bg-white p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h1 className="text-2xl font-extrabold sm:text-3xl">{propertyName}</h1><p className="mt-2 text-sm text-[#657089]">{dateLabel(item.turnover_date)} · Clean {clock(item.access_start_at)}–{clock(item.window_end_at)} · Guest check-in {clock(item.next_checkin_at || item.window_end_at)}</p><p className="mt-1 text-sm text-[#657089]">{address}</p></div><TurnoverStatus status={item.status}/></div><div className={`mt-5 grid grid-cols-2 gap-4 border-t pt-4 ${item.status === "unassigned" ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}><div><p className="text-xs font-bold text-[#748096]">CLEANER</p><p className="mt-1 font-extrabold">{item.status === "unassigned" ? "Not assigned" : workerName}</p></div>{item.status !== "unassigned" && <div><p className="text-xs font-bold text-[#748096]">STATUS</p><p className="mt-1 font-extrabold">{state.label}</p></div>}<div><p className="text-xs font-bold text-[#748096]">CHECKLIST</p><p className="mt-1 font-extrabold">{completed}/{tasks.length}</p></div><div><p className="text-xs font-bold text-[#748096]">ISSUES</p><p className="mt-1 font-extrabold">{openIssues.length ? `${openIssues.length} open` : "None"}</p></div></div>{readyWithOpenIssues && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-900">Property ready · {readyIssueCopy}</p>}</header>
    {!assignment && active && <section className="mt-4 rounded-xl border bg-white p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-extrabold text-[#071f49]">Assign a cleaner</h2><p className="mt-1 text-sm text-[#657089]">Choose who will complete this clean.</p></div></div>{newWorkerId && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-900">Cleaner added. Select them below to assign this clean.</p>}{availableWorkers?.length ? <form action={assignWorker} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"><input type="hidden" name="turnoverId" value={id}/><label className="w-full font-bold text-[#071f49] sm:max-w-[400px]">Select cleaner<select name="workerId" required defaultValue={newWorkerId} className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3"><option value="" disabled>Select cleaner</option>{availableWorkers.map((candidate) => <option key={candidate.id} value={candidate.id}>{formatDisplayName(candidate.display_name)}</option>)}</select></label><div className="flex flex-wrap items-center gap-3"><button className="min-h-11 w-full rounded-lg bg-[#071f49] px-4 font-extrabold text-white sm:w-auto">Assign cleaner</button><CleanerCreationDialog turnoverId={id} compact/></div></form> : <div className="mt-4 flex flex-col items-start gap-3"><p className="text-sm font-bold text-[#071f49]">No cleaners added yet</p><p className="text-sm text-[#657089]">Add your first cleaner to assign this clean.</p><CleanerCreationDialog turnoverId={id}/></div>}</section>}
    {assignment && active && <section className="mt-5 rounded-xl border bg-white p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-extrabold">Cleaner assigned</h2><p className="mt-1 font-extrabold">{workerName}</p><p className="mt-1 text-sm text-[#657089]">{item.status === "awaiting_response" && dueAt ? `${state.label} · Reply due ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(dueAt))}` : state.label}</p></div>{item.status === "awaiting_response" && worker?.id && <ReassignCleanerForm turnoverId={id} currentWorkerId={worker.id} workers={availableWorkers || []}/>}</div>{item.status === "awaiting_response" && worker?.id && <form action={resendWorkerInvitation} className="mt-4"><button name="workerId" value={worker.id} className="min-h-11 rounded-lg bg-[#071f49] px-4 font-extrabold text-white">Resend invitation</button></form>}</section>}
    {active && <section className="mt-5 rounded-xl border bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-extrabold">Cleaning progress</h2><div className="flex items-center gap-3"><span className="font-extrabold">{completed}/{tasks.length}</span><ChecklistTaskDialog turnoverId={id} sections={Array.from(sections.keys())}/></div></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e8edf3]" role="progressbar" aria-label="Checklist progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><div className="h-full rounded-full bg-[#2d67b2]" style={{ width: `${progressPercent}%` }}/></div>{sections.size > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2">{Array.from(sections.entries()).map(([section, result]) => <details key={section} className="group rounded-lg bg-[#f4f6f9] text-sm"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-2 font-bold outline-none transition-colors hover:bg-[#eaf0f6] focus-visible:ring-4 focus-visible:ring-[#2d67b2]/20"><span>{section}</span><span className="flex items-center gap-2"><strong>{result.done}/{result.total}</strong><span aria-hidden="true" className="text-lg leading-none transition-transform group-open:rotate-90">›</span></span></summary><div className="border-t border-white px-3 pb-2">{result.tasks.map((task: { id: string; label: string; completed: boolean }) => <div key={task.id} className="flex items-start gap-2 py-2"><span className={task.completed ? "text-emerald-700" : "text-[#657089]"}>{task.completed ? "✓" : "○"}</span><span>{task.label}</span></div>)}</div></details>)}</div>}</section>}
    {issues.length > 0 && <section className="mt-5 rounded-xl border bg-white p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-extrabold text-[#071f49]">Issues</h2><span className="text-sm font-bold text-[#657089]">{openIssues.length} open</span></div><div className="mt-4 grid gap-3">{issues.map((issue: { id: string; issue_type: string; severity: string; description: string; status: string; blocking: boolean; owner_response?: string | null }) => <article key={issue.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-extrabold text-[#071f49]">{issueCategory(issue.issue_type)}</h3><p className="mt-1 text-xs font-bold text-[#657089]">Reported by cleaner · {issuePriority(issue.severity)}</p></div><div className="flex flex-wrap gap-2 text-xs font-extrabold"><span className="rounded-full bg-[#eef3f8] px-2.5 py-1 text-[#33445d]">{issueStatus(issue.status)}</span>{issue.blocking && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">Blocking</span>}</div></div><p className="mt-3 text-sm text-[#33445d]">{issue.description}</p>{issue.status === "open" && <form action={updateIssue} className="mt-4 grid gap-2"><input type="hidden" name="issueId" value={issue.id}/><input type="hidden" name="turnoverId" value={id}/><input type="hidden" name="issueAction" value="acknowledge"/><label className="text-sm font-bold text-[#071f49]">Optional note<textarea name="ownerResponse" rows={2} placeholder="Add a note…" className="mt-1 min-h-11 w-full rounded-lg border px-3 py-2" /></label><button className="min-h-11 w-full rounded-lg border border-[#071f49] px-3 text-sm font-extrabold text-[#071f49] sm:w-auto">Acknowledge issue</button></form>}{["acknowledged", "waiting_for_owner"].includes(issue.status) && <form action={resolveIssue} className="mt-4 grid gap-2"><input type="hidden" name="issueId" value={issue.id}/><input type="hidden" name="turnoverId" value={id}/><label className="text-sm font-bold text-[#071f49]">Resolution<textarea name="resolution" required rows={2} placeholder="Describe how this was resolved…" className="mt-1 min-h-11 w-full rounded-lg border px-3 py-2" /></label><button className="min-h-11 w-full rounded-lg bg-[#071f49] px-3 text-sm font-extrabold text-white sm:w-auto">Mark resolved</button></form>}</article>)}</div></section>}
    {!active && <section className="mt-5 rounded-xl border bg-white p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-extrabold">Checklist</h2><span className="font-extrabold">{completed}/{tasks.length} complete</span></div>{sections.size > 0 ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{Array.from(sections.entries()).map(([section, result]) => <details key={section} className="group rounded-lg bg-[#f4f6f9] text-sm"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-2 font-bold"><span>{section}</span><span>{result.done}/{result.total}</span></summary><div className="border-t border-white px-3 pb-2">{result.tasks.map((task: { id: string; label: string; completed: boolean }) => <div key={task.id} className="flex items-start gap-2 py-2"><span className="text-emerald-700">{task.completed ? "✓" : "○"}</span><span>{task.label}</span></div>)}</div></details>)}</div> : <p className="mt-3 text-sm text-[#657089]">No checklist tasks were recorded for this clean.</p>}</section>}
    {!active && <details className="mt-5 rounded-xl border bg-white p-5"><summary className="cursor-pointer list-none text-lg font-extrabold">Completion evidence <span className="ml-2 text-sm font-bold text-[#657089]">· {evidence.length} photos</span></summary><div className="mt-4">{evidence.length === 0 ? <p className="text-sm text-[#657089]">No completion photos were submitted for this clean.</p> : <><p className="text-sm text-[#657089]">{evidence.length} photos submitted</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{evidence.map((entry: { id: string; evidence_type: string; checklist_task_id: string | null; caption: string | null }, index: number) => { const signedUrl = signedEvidence?.[index]?.signedUrl; const label = entry.checklist_task_id ? taskLabels.get(entry.checklist_task_id) || "Task evidence" : entry.evidence_type === "key_return" ? "Key return" : "Final completion photo"; return signedUrl ? <a key={entry.id} href={signedUrl} target="_blank" rel="noreferrer" className="group"><Image src={signedUrl} alt={entry.caption || label} width={480} height={360} className="aspect-[4/3] w-full rounded-lg object-cover"/><span className="mt-1 block text-xs font-bold text-[#526078] group-hover:underline">{label}</span></a> : null; })}</div>{(signedEvidence || []).filter((entry) => Boolean(entry?.signedUrl)).length === 0 && <p className="mt-3 text-sm text-amber-800">Evidence was saved, but the images could not be loaded right now.</p>}</>}</div></details>}
    {active && evidence.length > 0 && <details className="mt-5 rounded-xl border bg-white p-5"><summary className="cursor-pointer text-lg font-extrabold">Evidence ({evidence.length})</summary><div className="mt-3 grid gap-2 text-sm">{evidence.map((entry: { id: string; evidence_type: string; caption: string | null }) => <p key={entry.id}>{entry.caption || entry.evidence_type.replaceAll("_", " ")}</p>)}</div></details>}
    {events.length > 0 && <details className="mt-5 rounded-xl border bg-white p-5"><summary className="cursor-pointer text-lg font-extrabold">Recent activity</summary><ol className="mt-3 divide-y">{events.map((event) => { const text = formatActivityEvent({ ...event, work_items: { properties: property, assignments: item.assignments } }); const title = item.status === "ready" && (event.event_type === "property_ready" || event.event_type === "turnover_ready" || event.event_type === "readiness_evaluated") ? "Clean completed" : text.title; return <li key={event.id} className="py-2"><p className="text-sm font-bold">{title}</p><time className="text-xs text-[#748096]">{new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(event.created_at))}</time></li>; })}</ol><Link href={`/business/activity?turnover=${id}`} className="mt-3 block text-sm font-extrabold text-[#16467e]">View full history</Link></details>}
    {active && assignment && <details className="mt-5 rounded-xl border bg-white p-5"><summary className="cursor-pointer font-extrabold">More assignment actions</summary><div className="mt-4 grid gap-3">{item.status === "awaiting_response" ? <form action={cancelAssignment}><input type="hidden" name="turnoverId" value={id}/><button className="min-h-10 text-sm font-bold text-red-700">Cancel assignment</button></form> : <p className="text-sm font-bold text-[#657089]">This cleaner has already accepted this clean and can no longer be removed.</p>}</div></details>}
  </div>;
}
