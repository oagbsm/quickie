"use client";

import { useState } from "react";
import PendingButton from "@/app/components/PendingButton";

export default function RefundForm({ action, bookingId, remainingPence }: { action: (formData: FormData) => void | Promise<void>; bookingId: string; remainingPence: number }) {
  const [mode, setMode] = useState("full");
  return <form action={action} onSubmit={(event) => { if (!window.confirm(mode === "full" ? "Issue the full remaining customer refund?" : "Issue this partial customer refund?")) event.preventDefault(); }} className="grid gap-2">
    <input type="hidden" name="bookingId" value={bookingId} />
    <input type="hidden" name="amountPence" value={mode === "full" ? remainingPence : ""} />
    <label className="text-xs font-bold">Refund type<select name="refundMode" value={mode} onChange={(event) => setMode(event.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="full">Full refund (£{(remainingPence / 100).toFixed(2)})</option><option value="partial">Partial refund</option></select></label>
    {mode === "partial" && <label className="text-xs font-bold">Amount (£)<input name="amountGbp" inputMode="decimal" placeholder="0.00" required min="0.01" step="0.01" className="mt-1 w-full rounded-lg border p-2" /></label>}
    <input name="reason" required placeholder="Refund reason or admin notes" className="rounded-lg border p-2" />
    <PendingButton pending="Issuing refund…" className="rounded bg-[#112b4b] px-3 py-2 text-sm font-black text-white">Issue refund</PendingButton>
  </form>;
}
