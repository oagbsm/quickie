"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { uploadEvidenceResult, type EvidenceUploadResult } from "@/app/business/str-actions";

type UploadState = EvidenceUploadResult | null;

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
  const formRef = useRef<HTMLFormElement>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photoAction = async (_previous: UploadState, form: FormData): Promise<UploadState> => (await uploadEvidenceResult(form)) ?? null;
  const [state, submit, pending] = useActionState<UploadState, FormData>(photoAction, null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const retryAttempted = useRef(false);
  const [retrying, setRetrying] = useState(false);

  const submitSelectedFile = useCallback((file: File) => {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    data.set("file", file);
    setRetrying(false);
    submit(data);
  }, [submit]);

  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
  }, []);

  useEffect(() => {
    if (!state?.retryable || retryAttempted.current || !selectedFile) return;
    retryAttempted.current = true;
    retryTimer.current = setTimeout(() => {
      setRetrying(true);
      submitSelectedFile(selectedFile);
    }, 500);
  }, [state, selectedFile, submitSelectedFile]);

  function handleFileSelected(file: File | undefined) {
    if (!file || pending || retrying) return;
    setSelectedFile(file);
    retryAttempted.current = false;
    submitSelectedFile(file);
  }

  function retryUpload() {
    if (!selectedFile || pending) return;
    retryAttempted.current = true;
    submitSelectedFile(selectedFile);
  }

  if (saved) return <p className="mt-3 text-sm font-bold text-emerald-700">✓ Photo added</p>;

  const failed = Boolean(state || uploadError);
  return <form ref={formRef} className="mt-3 grid gap-2" onSubmit={(event) => event.preventDefault()}>
    <input type="hidden" name="turnoverId" value={turnoverId} />
    <input type="hidden" name="taskId" value={taskId} />
    <input type="hidden" name="evidenceType" value={evidenceType} />
    {responseType !== "checkbox" && <select name="response" defaultValue={response || ""} required className="min-h-10 rounded-lg border px-2">
      <option value="" disabled>Select result</option>
      <option value={responseType === "yes_no" ? "yes" : "pass"}>{responseType === "yes_no" ? "Yes" : "Pass"}</option>
      <option value={responseType === "yes_no" ? "no" : "fail"}>{responseType === "yes_no" ? "No" : "Fail"}</option>
    </select>}
    {noteRequired && <textarea name="note" defaultValue={note || ""} required placeholder="Required note" className="rounded-lg border p-2" />}
    {failed && <p role="alert" className="text-sm font-bold text-red-700">Photo not uploaded. Retry when your connection is stable.</p>}
    {retrying ? <p className="text-sm font-bold text-[#526078]" aria-live="polite">Reconnecting…</p> : state && !state.retryable ? <button type="button" onClick={retryUpload} disabled={!selectedFile || pending} className="rounded-lg border px-3 py-2 text-center font-bold disabled:cursor-wait disabled:opacity-60">Retry</button> : <label className={`rounded-lg border px-3 py-2 text-center font-bold ${pending ? "cursor-wait opacity-60" : "cursor-pointer"}`}>
      {pending ? "Uploading…" : failed ? "Retry" : evidenceType === "key_return" ? "Add key-return photo" : "Add photo"}
      <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/heic" capture="environment" className="sr-only" required disabled={pending || retrying} onChange={(event) => handleFileSelected(event.currentTarget.files?.[0])} />
    </label>}
  </form>;
}
