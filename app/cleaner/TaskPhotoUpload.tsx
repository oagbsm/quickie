"use client";

import { useFormStatus } from "react-dom";
import { uploadEvidence } from "@/app/business/str-actions";

function PhotoPicker({ evidenceType, uploadError }: { evidenceType: "completion_photo" | "key_return"; uploadError: boolean }) {
  const { pending } = useFormStatus();
  return <label className={`rounded-lg border px-3 py-2 text-center font-bold ${pending ? "cursor-wait opacity-60" : "cursor-pointer"}`}>
    {pending ? "Uploading…" : uploadError ? "Retry" : evidenceType === "key_return" ? "Add key-return photo" : "Add photo"}
    <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/heic" capture="environment" className="sr-only" required disabled={pending} onChange={(event) => {
      if (event.currentTarget.files?.[0] && !pending) event.currentTarget.form?.requestSubmit();
    }} />
  </label>;
}

export default function TaskPhotoUpload({
  turnoverId,
  taskId,
  evidenceType,
  responseType,
  response,
  noteRequired,
  note,
  saved,
  uploadError = false,
}: {
  turnoverId: string;
  taskId: string;
  evidenceType: "completion_photo" | "key_return";
  responseType: string;
  response: string | null;
  noteRequired: boolean;
  note: string | null;
  saved: boolean;
  uploadError?: boolean;
}) {
  if (saved) return <p className="mt-3 text-sm font-bold text-emerald-700">✓ Photo added</p>;

  return <form action={uploadEvidence} className="mt-3 grid gap-2">
    <input type="hidden" name="turnoverId" value={turnoverId} />
    <input type="hidden" name="taskId" value={taskId} />
    <input type="hidden" name="evidenceType" value={evidenceType} />
    {responseType !== "checkbox" && <select name="response" defaultValue={response || ""} required className="min-h-10 rounded-lg border px-2">
      <option value="" disabled>Select result</option>
      <option value={responseType === "yes_no" ? "yes" : "pass"}>{responseType === "yes_no" ? "Yes" : "Pass"}</option>
      <option value={responseType === "yes_no" ? "no" : "fail"}>{responseType === "yes_no" ? "No" : "Fail"}</option>
    </select>}
    {noteRequired && <textarea name="note" defaultValue={note || ""} required placeholder="Required note" className="rounded-lg border p-2" />}
    {uploadError && <p role="alert" className="text-sm font-bold text-red-700">Photo upload failed. Try again.</p>}
    <PhotoPicker evidenceType={evidenceType} uploadError={uploadError} />
  </form>;
}
