import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import TurnoverStatus from "@/app/business/components/TurnoverStatus";
import PendingButton from "@/app/components/PendingButton";
import {
  reportIssue,
  completeTestTurnover,
  transitionTurnover,
  updateChecklistTask,
  uploadEvidence,
} from "@/app/business/str-actions";
const nextAction: Record<string, [string, string] | undefined> = {
  awaiting_response: ["Accept turnover", "accepted"],
  accepted: ["I’m en route", "en_route"],
  en_route: ["I’ve arrived", "arrived"],
  arrived: ["Start the clean", "in_progress"],
  in_progress: ["Complete the clean", "evidence_submitted"],
  action_required: ["Resolve remaining requirements", "in_progress"],
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const s = await createSupabaseServerClient();
  const { data: i } = await s
    .from("work_items")
    .select(
      "*,properties(nickname,address_line_1,city,postcode,access_notes,key_instructions,cleaning_notes,key_return_instructions),assignments(status),checklist_tasks(id,label,section_title,mandatory,completed,response_type,response,photo_required,note_required,note),evidence_submissions(id,evidence_type,checklist_task_id),operational_issues(id,issue_type,status,blocking)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!i) notFound();
  const p = Array.isArray(i.properties) ? i.properties[0] : i.properties;
  const accepted = !["awaiting_response", "declined"].includes(i.status);
  const action = nextAction[i.status];
  const canWork = ["arrived", "in_progress", "action_required"].includes(i.status);
  const incompleteMandatory = i.checklist_tasks.filter((t: { id: string; label: string; mandatory: boolean; completed: boolean }) => t.mandatory && !t.completed);
  const missingNotes = i.checklist_tasks.filter((t: { id: string; label: string; note_required: boolean; note: string | null }) => t.note_required && !t.note?.trim());
  const missingTaskPhotos = i.checklist_tasks.filter((t: { id: string; label: string; photo_required: boolean }) => t.photo_required && !i.evidence_submissions.some((e: { checklist_task_id: string | null }) => e.checklist_task_id === t.id));
  const completionPhotos = i.evidence_submissions.filter((e: { evidence_type: string }) => e.evidence_type === "completion_photo").length;
  const blockers = [
    ...incompleteMandatory.map((t: { id: string; label: string }) => `Task ${t.id}: ${t.label} is incomplete`),
    ...missingNotes.map((t: { id: string; label: string }) => `Task ${t.id}: ${t.label} needs a note`),
    ...missingTaskPhotos.map((t: { id: string; label: string }) => `Task ${t.id}: ${t.label} needs a photo`),
    ...(completionPhotos < i.required_evidence_count ? [`${i.required_evidence_count - completionPhotos} completion photo${i.required_evidence_count - completionPhotos === 1 ? "" : "s"} missing`] : []),
    ...i.operational_issues.filter((issue: { blocking: boolean; status: string }) => issue.blocking && !["resolved", "closed"].includes(issue.status)).map(() => "An unresolved blocking issue remains"),
  ];
  return (
    <div>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 font-bold text-red-800"
        >
          {error === "pre_arrival" ? "Checklist and evidence become available after you mark Arrived." : error === "invalid_file" ? "That file is not supported. Use a JPG, PNG, WebP or HEIC image under 10 MB." : error === "storage" ? "The image passed validation but could not be stored. Try again." : error === "evidence" ? "The image was stored but its task evidence record could not be saved. Try again." : error === "task_photo_required" ? "Upload the required task photo before marking this task complete." : error === "task_requirements" ? "Complete the required result and note before marking this task complete." : error === "action_required" ? "Action required: review the outstanding completion requirements below." : "We could not save that cleaner update. Try again."}
        </p>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-[#2d67b2]">
            {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(
              new Date(i.turnover_date),
            )}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold">
            {p?.nickname || i.property_public_name}
          </h1>
          <p className="mt-1 text-[#657089]">
            {accepted && p
              ? `${p.address_line_1}, ${p.city}, ${p.postcode}`
              : i.property_general_area}
          </p>
        </div>
        <TurnoverStatus status={i.status} />
      </div>
      {i.status === "awaiting_response" && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <form action={transitionTurnover}>
            <input type="hidden" name="turnoverId" value={id} />
            <button
              name="nextStatus"
              value="declined"
              className="min-h-12 w-full rounded-lg border font-extrabold"
            >
              Decline
            </button>
          </form>
          <form action={transitionTurnover}>
            <input type="hidden" name="turnoverId" value={id} />
            <button
              name="nextStatus"
              value="accepted"
              className="min-h-12 w-full rounded-lg bg-[#071f49] font-extrabold text-white"
            >
              Accept
            </button>
          </form>
        </div>
      )}
      {accepted && (
        <>
          <section className="mt-6 rounded-xl border bg-white p-5">
            <h2 className="text-lg font-extrabold">
              Access and property notes
            </h2>
            <dl className="mt-4 grid gap-4">
              <div>
                <dt className="text-sm font-bold text-[#748096]">Access</dt>
                <dd>{p?.access_notes || "No access notes"}</dd>
              </div>
              <div>
                <dt className="text-sm font-bold text-[#748096]">Keys</dt>
                <dd>{p?.key_instructions || "No key instructions"}</dd>
              </div>
              <div>
                <dt className="text-sm font-bold text-[#748096]">
                  Turnover standard
                </dt>
                <dd>{p?.cleaning_notes || "Follow the checklist below."}</dd>
              </div>
            </dl>
          </section>
          <section className="mt-5 rounded-xl border bg-white p-5">
            <div className="flex justify-between">
              <h2 className="text-lg font-extrabold">Checklist</h2>
              <span className="text-sm font-bold text-[#657089]">
                {
                  i.checklist_tasks.filter(
                    (t: { completed: boolean }) => t.completed,
                  ).length
                }
                /{i.checklist_tasks.length}
              </span>
            </div>
            {!canWork && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-bold text-[#657089]">Checklist actions unlock after you mark Arrived.</p>}
            {canWork && blockers.length > 0 && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><p className="font-extrabold">{i.status === "action_required" ? "Resolve these before retrying" : "Before you complete the clean"}</p><ul className="mt-2 list-disc pl-5">{blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul></div>}
            <div className="mt-3 divide-y">
              {i.checklist_tasks.map(
                (t: {
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
                }) => {
                  const taskPhoto = i.evidence_submissions.some(
                    (e: { checklist_task_id: string | null }) =>
                      e.checklist_task_id === t.id,
                  );
                  const keyReturn = /key.*return/i.test(t.label);
                  return (
                    <div key={t.id} className="py-4">
                      {canWork ? t.completed ? <div className="rounded-lg bg-emerald-50 p-3 text-sm"><p className="font-extrabold text-emerald-900">✓ Task completed</p><p className="mt-1 text-emerald-800">Your saved result and note are kept.</p></div> : <form action={updateChecklistTask}>
                        <input type="hidden" name="turnoverId" value={id} />
                        <input type="hidden" name="taskId" value={t.id} />
                        <label className="flex min-h-11 items-start gap-3 font-bold">
                          <input
                            type="checkbox"
                            name="completed"
                            defaultChecked={t.completed}
                            className="mt-1 h-5 w-5"
                          />
                          <span>
                            {t.label}
                            <small className="mt-1 block font-normal text-[#657089]">
                              {t.section_title}
                              {t.photo_required ? " · Photo required" : ""}
                              {t.note_required ? " · Note required" : ""}
                            </small>
                          </span>
                        </label>
                        {t.response_type !== "checkbox" && (
                          <label className="mt-2 block text-sm font-bold">
                            Result
                            <select
                              name="response"
                              required
                              defaultValue={t.response || ""}
                              className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3"
                            >
                              <option value="" disabled>
                                Select result
                              </option>
                              {t.response_type === "yes_no" ? (
                                <>
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                </>
                              ) : (
                                <>
                                  <option value="pass">Pass</option>
                                  <option value="fail">Fail</option>
                                </>
                              )}
                            </select>
                          </label>
                        )}
                        {t.note_required && (
                          <textarea
                            name="note"
                            defaultValue={t.note || ""}
                            required
                            className="mt-2 w-full rounded-lg border p-3"
                            placeholder="Required note"
                          />
                        )}
                        <button className="mt-2 min-h-10 rounded-lg border px-3 text-sm font-bold">
                          Save task
                        </button>
                      </form> : <div className="py-2 text-sm text-[#657089]">Not available until arrival.</div>}
                      {canWork && (t.photo_required || keyReturn) && (
                        <form
                          action={uploadEvidence}
                          className="mt-3 rounded-lg bg-[#f4f6f9] p-3"
                        >
                          <input type="hidden" name="turnoverId" value={id} />
                          <input type="hidden" name="taskId" value={t.id} />
                          <input
                            type="hidden"
                            name="evidenceType"
                            value={
                              keyReturn ? "key_return" : "completion_photo"
                            }
                          />
                          <label className="text-sm font-bold">
                            {taskPhoto
                              ? `Add another ${keyReturn ? "key-return confirmation" : "task photo"}`
                              : keyReturn
                                ? "Key-return confirmation photo"
                                : "Required task photo"}
                            <input
                              type="file"
                              name="file"
                              accept="image/jpeg,image/png,image/webp,image/heic"
                              capture="environment"
                              required
                              className="mt-1 block min-h-12 w-full rounded-lg border bg-white p-2"
                            />
                          </label>
                          <PendingButton
                            idle={`Upload ${keyReturn ? "confirmation" : "task photo"}`}
                            pending="Uploading…"
                            className="mt-2 min-h-10 rounded-lg border bg-white px-3 text-sm font-bold"
                          />
                          {taskPhoto && <p className="mt-2 text-xs font-bold text-emerald-700">✓ Task photo saved{t.completed ? " — task complete" : ""}</p>}
                        </form>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </section>
          <section className="mt-5 rounded-xl border bg-white p-5">
            <h2 className="text-lg font-extrabold">Final completion evidence</h2>
            <p className="mt-1 text-sm text-[#657089]">
              {i.evidence_submissions.length} uploaded ·{" "}
              {i.required_evidence_count} completion photos required
            </p>
            {canWork && <form action={uploadEvidence} className="mt-4 grid gap-3">
              <input type="hidden" name="turnoverId" value={id} />
              <input
                type="hidden"
                name="evidenceType"
                value="completion_photo"
              />
              <label className="font-bold">
              Final completion photo
                <input
                  type="file"
                  name="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  capture="environment"
                  required
                  className="mt-2 block min-h-12 w-full rounded-lg border p-2"
                />
              </label>
              <PendingButton
                idle="Upload photo"
                pending="Uploading…"
                className="min-h-11 rounded-lg border px-4 font-bold"
              />
            </form>}
            {!canWork && <p className="mt-3 text-sm font-bold text-[#657089]">Completion evidence unlocks after you mark Arrived.</p>}
          </section>
          <details className="mt-5 rounded-xl border bg-white p-5">
            <summary className="min-h-11 cursor-pointer font-extrabold">
              Report an issue
            </summary>
            <form action={reportIssue} className="mt-4 grid gap-3">
              <input type="hidden" name="turnoverId" value={id} />
              <label className="font-bold">
                Issue type
                <select
                  name="issueType"
                  className="mt-1 w-full rounded-lg border p-3"
                >
                  {[
                    "Unable to access",
                    "Running late",
                    "Property heavily soiled",
                    "Damage found",
                    "Guest belongings left",
                    "Missing linen",
                    "Missing supplies",
                    "Extra time needed",
                    "Maintenance issue",
                    "Checklist cannot be completed",
                    "Other",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="font-bold">
                Severity
                <select
                  name="severity"
                  className="mt-1 w-full rounded-lg border p-3"
                >
                  <option>low</option>
                  <option>medium</option>
                  <option>high</option>
                  <option>critical</option>
                </select>
              </label>
              <label className="font-bold">
                What happened?
                <textarea
                  name="description"
                  required
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>
              <label className="font-bold">
                Photo{" "}
                <span className="font-normal text-[#657089]">(optional)</span>
                <input
                  type="file"
                  name="photo"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  capture="environment"
                  className="mt-1 block min-h-12 w-full rounded-lg border p-2"
                />
              </label>
              <label className="flex min-h-11 items-center gap-3 font-bold">
                <input name="blocking" type="checkbox" className="h-5 w-5" />
                This prevents completion
              </label>
              <button className="min-h-11 rounded-lg bg-red-700 px-4 font-bold text-white">
                Report issue
              </button>
            </form>
          </details>
          {action && i.status !== "awaiting_response" && (
            <form action={transitionTurnover} className="sticky bottom-20 mt-5">
              <input type="hidden" name="turnoverId" value={id} />
              <button
                name="nextStatus"
                value={action[1]}
                className="min-h-14 w-full rounded-lg bg-[#071f49] px-5 font-extrabold text-white shadow-xl"
              >
                {action[0]}
              </button>
            </form>
          )}
          {process.env.NODE_ENV === "development" && process.env.QUICKOLA_TEST_SHORTCUTS === "1" && canWork && (
            <form action={completeTestTurnover} className="mt-3">
              <input type="hidden" name="turnoverId" value={id} />
              <button className="min-h-11 w-full rounded-lg border border-dashed px-5 font-bold text-[#59677d]">Development-only: complete test turnover</button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
