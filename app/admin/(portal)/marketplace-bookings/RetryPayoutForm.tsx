"use client";

import PendingButton from "@/app/components/PendingButton";

export default function RetryPayoutForm({
  action,
  bookingId,
  amountPence,
}: {
  action: (formData: FormData) => void | Promise<void>;
  bookingId: string;
  amountPence: number;
}) {
  const amount = `£${(amountPence / 100).toFixed(2)}`;
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Retry ${amount} payout to this provider?`)) event.preventDefault();
      }}
      className="grid gap-2"
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <PendingButton pending="Retrying…" className="rounded-lg border border-[#167d3c] px-3 py-2 text-sm font-black text-[#167d3c]">Retry payout</PendingButton>
    </form>
  );
}
