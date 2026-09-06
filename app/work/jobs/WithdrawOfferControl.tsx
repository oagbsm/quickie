"use client";

import { useState } from "react";
import { withdrawWorkOffer } from "@/app/work/actions";

export default function WithdrawOfferControl({ jobId }: { jobId: string }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) return <button type="button" onClick={() => setConfirming(true)} className="min-h-11 rounded-xl border border-red-200 px-4 text-sm font-black text-red-700">Withdraw offer</button>;
  return <div className="w-full rounded-2xl border border-red-100 bg-red-50 p-4 sm:max-w-lg"><p className="font-black text-red-900">Withdraw your offer?</p><p className="mt-1 text-sm leading-6 text-red-800">The customer will no longer be able to book this quote. You can send a new quote later only if the job is still open.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setConfirming(false)} className="min-h-10 rounded-xl border border-[#dbe1ea] bg-white px-4 text-sm font-black">Keep offer</button><form action={withdrawWorkOffer}><input type="hidden" name="jobId" value={jobId} /><button className="min-h-10 rounded-xl bg-red-700 px-4 text-sm font-black text-white">Withdraw offer</button></form></div></div>;
}
