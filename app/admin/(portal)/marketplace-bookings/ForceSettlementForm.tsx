"use client";

import PendingButton from "@/app/components/PendingButton";

export default function ForceSettlementForm({ action, bookingId, refundedPence, remainingPence, earningsPence }: { action: (formData: FormData) => void | Promise<void>; bookingId: string; refundedPence: number; remainingPence: number; earningsPence: number }) {
  return <form action={action} onSubmit={(event) => {
    const confirmed = window.confirm(`Customer has already received £${(refundedPence / 100).toFixed(2)} refund. This will close the dispute and approve provider earnings of £${(earningsPence / 100).toFixed(2)} from the remaining £${(remainingPence / 100).toFixed(2)}. Continue?`);
    if (!confirmed) event.preventDefault();
  }} className="grid gap-2 rounded-lg border border-[#eadfbf] bg-[#fffaf0] p-3">
    <p className="text-sm font-black">Force settlement — approve provider payout</p>
    <p className="text-xs font-bold text-[#795b13]">This closes the dispute as an admin/provider settlement. It does not create another refund.</p>
    <input type="hidden" name="bookingId" value={bookingId} />
    <textarea name="settlementNote" required minLength={5} maxLength={2000} placeholder="Required settlement reason" className="rounded border p-2 text-sm" />
    <PendingButton pending="Settling…" className="rounded bg-[#112b4b] px-3 py-2 text-sm font-black text-white">Force settlement — approve provider payout</PendingButton>
  </form>;
}
