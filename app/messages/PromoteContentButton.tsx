"use client";

import { useState } from "react";
import { promoteMarketplaceDetail, promoteMarketplacePhoto } from "./actions";

export default function PromoteContentButton({ kind, messageId, attachmentId, added }: { kind: "detail" | "photo"; messageId: string; attachmentId?: string; added?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  if (added) return <span className="mt-1 block text-xs font-bold text-[#167d3c]">Added to job</span>;
  const action = kind === "photo" ? promoteMarketplacePhoto : promoteMarketplaceDetail;
  return confirming ? <form action={action} className="mt-2 rounded-lg bg-white/10 p-2 text-xs"><p>This {kind === "photo" ? "photo" : "detail"} will be added to your job and may be visible to other providers who can view this job.</p><input type="hidden" name="messageId" value={messageId} />{attachmentId && <input type="hidden" name="attachmentId" value={attachmentId} />}<div className="mt-2 flex gap-2"><button type="submit" className="rounded-md bg-[#23a955] px-2 py-1 font-black text-[#061b3f]">Confirm</button><button type="button" onClick={() => setConfirming(false)} className="rounded-md border border-current px-2 py-1 font-bold">Cancel</button></div></form> : <button type="button" onClick={() => setConfirming(true)} className="mt-1 text-xs font-black underline underline-offset-2">{kind === "photo" ? "Add to job" : "Add detail to job"}</button>;
}
