"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

function Preview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <span className="relative inline-block"><img src={url} alt={file.name} className="h-16 w-16 rounded-lg object-cover" /><button type="button" onClick={onRemove} className="absolute -right-2 -top-2 rounded-full bg-[#061b3f] px-1.5 text-xs font-black text-white" aria-label={`Remove ${file.name}`}>×</button></span>;
}

export default function MessageComposer({ conversationId, returnTo, readOnly = false }: { conversationId: string; returnTo: string; readOnly?: boolean }) {
  const [body, setBody] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [clientMessageId, setClientMessageId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(false);
    const submissionId = clientMessageId || crypto.randomUUID();
    setClientMessageId(submissionId);
    const formData = new FormData();
    formData.append("conversationId", conversationId);
    formData.append("returnTo", returnTo);
    formData.append("body", body);
    formData.append("clientMessageId", submissionId);
    for (const file of selectedFiles) formData.append("attachments", file, file.name);
    try {
      const response = await fetch("/api/marketplace/messages", { method: "POST", body: formData, redirect: "follow" });
      if (!response.redirected) throw new Error("Message request did not redirect");
      window.location.assign(response.url);
    } catch (requestError) {
      console.error("[marketplace-message] client submit failed", { name: requestError instanceof Error ? requestError.name : "UnknownError" });
      setBusy(false);
      setError(true);
    }
  }

  if (readOnly) return <p className="mt-4 rounded-xl border border-[#e7ebef] bg-[#f7f8fa] p-3 text-sm font-bold text-[#657089]">This conversation is closed because another provider was selected for this job.</p>;
  return <form action="/api/marketplace/messages" method="post" encType="multipart/form-data" onSubmit={submit} className="mt-4 grid min-w-0 gap-2"><div className="flex min-w-0 gap-1.5 sm:gap-2"><label className="flex min-h-12 shrink-0 cursor-pointer items-center rounded-xl border border-[#dbe1ea] px-2.5 text-sm font-black sm:px-3">+ Photo<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { const files = Array.from(event.currentTarget.files || []); setClientMessageId(null); setSelectedFiles((current) => [...current, ...files].slice(0, 5)); event.currentTarget.value = ""; }} className="sr-only" disabled={busy} /></label><div className="min-w-0 flex-1"><input name="body" value={body} onChange={(event) => { setClientMessageId(null); setBody(event.target.value); }} maxLength={4000} placeholder="Write a message…" className="min-h-12 w-full min-w-0 rounded-xl border border-[#dbe1ea] px-3 sm:px-4" disabled={busy} /></div><button type="submit" disabled={busy} className="min-h-12 shrink-0 rounded-xl bg-[#23a955] px-3 text-sm font-black text-[#061b3f] sm:px-5">{busy ? "Sending…" : "Send"}</button></div>{selectedFiles.length > 0 && <div className="flex flex-wrap gap-3">{selectedFiles.map((file, index) => <Preview key={`${file.name}-${file.size}-${index}`} file={file} onRemove={() => { setClientMessageId(null); setSelectedFiles((current) => current.filter((_, itemIndex) => itemIndex !== index)); }} />)}</div>}{error && <p className="text-sm font-bold text-red-700">Message could not be sent. Please try again.</p>}</form>;
}
