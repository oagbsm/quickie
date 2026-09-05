"use client";

import { useState } from "react";
import PendingButton from "@/app/components/PendingButton";

export default function ResolveDisputeForm({ action, disputeId }: { action: (formData: FormData) => void | Promise<void>; disputeId: string }) {
  const [choice, setChoice] = useState("continue");
  return <form action={action} onSubmit={(event) => {
    const message = choice === "continue"
      ? "Resolve this issue and return the job to the customer for completion?"
      : "Resolve this issue and start the customer refund? This will keep provider payout blocked.";
    if (!window.confirm(message)) event.preventDefault();
  }} className="mt-3 grid gap-2">
    <input type="hidden" name="disputeId" value={disputeId} />
    <label className="text-xs font-bold">Resolution
      <select name="resolutionChoice" value={choice} onChange={(event) => setChoice(event.target.value)} className="mt-1 w-full rounded border p-2">
        <option value="continue">Job can continue</option>
        <option value="refund">Refund customer</option>
      </select>
    </label>
    <textarea name="resolutionNotes" maxLength={2000} placeholder="Optional internal admin notes" className="rounded border p-2" />
    <PendingButton pending="Resolving…" className="rounded bg-[#112b4b] px-3 py-2 font-black text-white">Resolve issue</PendingButton>
  </form>;
}
