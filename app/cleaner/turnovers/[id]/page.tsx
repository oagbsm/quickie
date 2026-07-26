import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import TurnoverStatus from "@/app/business/components/TurnoverStatus";
import PendingButton from "@/app/components/PendingButton";
import {
  reportIssue,
  transitionTurnover,
  updateChecklistTask,
  uploadEvidence,
} from "@/app/business/str-actions";
const nextAction: Record<string, [string, string] | undefined> = {
  awaiting_response: ["Accept turnover", "accepted"],
  accepted: ["I’m en route", "en_route"],
  en_route: ["I’ve arrived", "arrived"],
  arrived: ["Start turnover", "in_progress"],
  in_progress: ["Submit completion", "evidence_submitted"],
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
  return (
    <div>
      {error === "upload" && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 font-bold text-red-800"
        >
          The image could not be uploaded. Check that it is a JPG, PNG, WebP or
          HEIC file under 10 MB, then try again.
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
                      <form action={updateChecklistTask}>
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
                      </form>
                      {(t.photo_required || keyReturn) && (
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
                          {taskPhoto && (
                            <p className="mt-2 text-xs font-bold text-emerald-700">
                              Evidence uploaded
                            </p>
                          )}
                        </form>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </section>
          <section className="mt-5 rounded-xl border bg-white p-5">
            <h2 className="text-lg font-extrabold">Evidence</h2>
            <p className="mt-1 text-sm text-[#657089]">
              {i.evidence_submissions.length} uploaded ·{" "}
              {i.required_evidence_count} completion photos required
            </p>
            <form action={uploadEvidence} className="mt-4 grid gap-3">
              <input type="hidden" name="turnoverId" value={id} />
              <input
                type="hidden"
                name="evidenceType"
                value="completion_photo"
              />
              <label className="font-bold">
                Completion photo
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
            </form>
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
        </>
      )}
    </div>
  );
}
