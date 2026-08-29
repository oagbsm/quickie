"use client";

import { useEffect, useMemo, useState } from "react";

function Preview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <span className="relative inline-block"><img src={url} alt={file.name} className="h-16 w-16 rounded-lg object-cover" /><button type="button" onClick={onRemove} className="absolute -right-2 -top-2 rounded-full bg-[#061b3f] px-1.5 text-xs font-black text-white" aria-label={`Remove ${file.name}`}>×</button></span>;
}

export default function MessageComposer({ conversationId, returnTo }: { conversationId: string; returnTo: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  return <form action="/api/marketplace/messages" method="post" encType="multipart/form-data" onSubmit={() => setBusy(true)} className="mt-4 grid gap-2"><input type="hidden" name="conversationId" value={conversationId} /><input type="hidden" name="returnTo" value={returnTo} /><div className="flex gap-2"><label className="cursor-pointer rounded-xl border border-[#dbe1ea] px-3 py-3 text-sm font-black">+ Photo<input name="attachments" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles((current) => [...current, ...Array.from(event.target.files || [])].slice(0, 5))} className="sr-only" disabled={busy} /></label><input name="body" maxLength={4000} placeholder="Write a message…" className="min-h-12 flex-1 rounded-xl border border-[#dbe1ea] px-4" disabled={busy} /><button disabled={busy} className="min-h-12 rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">{busy ? "Sending…" : "Send"}</button></div>{files.length > 0 && <div className="flex flex-wrap gap-3">{files.map((file, index) => <Preview key={`${file.name}-${file.size}-${index}`} file={file} onRemove={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} />)}</div>}</form>;
}
