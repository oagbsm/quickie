"use client";

import { cancelCustomerMarketplaceJob } from "@/app/jobs/actions";

export default function CancelPrePaymentJobButton({ token }: { token: string }) {
  return <form action={cancelCustomerMarketplaceJob} onSubmit={(event) => { if (!window.confirm("Cancel this job?\n\nYou haven't paid yet, so no payment will be taken. Your selected provider will no longer be selected for this job.")) event.preventDefault(); }}><input type="hidden" name="token" value={token} /><button type="submit" className="min-h-11 py-2 font-bold text-red-700">Cancel job</button></form>;
}
