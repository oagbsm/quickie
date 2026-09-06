"use client";

import { useState } from "react";
import { confirmMarketplaceCompletion, reportMarketplaceCompletionIssue } from "./actions";

export default function CompletionActions({ token, bookingId }: { token: string; bookingId: string }) {
  const [reporting, setReporting] = useState(false);
  return <div className="mt-5 grid gap-3 border-t border-[#dce7df] pt-5"><form action={confirmMarketplaceCompletion}><input type="hidden" name="token" value={token} /><input type="hidden" name="bookingId" value={bookingId} /><button className="min-h-11 w-full rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">Confirm job completed</button></form>{!reporting ? <button type="button" onClick={() => setReporting(true)} className="min-h-11 w-full rounded-xl border border-[#dbe1ea] px-5 font-black">Report a problem</button> : <form action={reportMarketplaceCompletionIssue} className="grid gap-2 rounded-2xl border border-[#eadfbf] bg-[#fffaf0] p-4"><label className="text-sm font-black" htmlFor={`problem-${bookingId}`}>Tell us what went wrong<textarea id={`problem-${bookingId}`} name="reasonText" required minLength={3} maxLength={2000} placeholder="Describe the problem" className="mt-2 min-h-24 w-full rounded-xl border border-[#dbe1ea] bg-white p-3 font-normal" /></label><input type="hidden" name="token" value={token} /><input type="hidden" name="bookingId" value={bookingId} /><input type="hidden" name="reasonCode" value="customer_completion_issue" /><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setReporting(false)} className="min-h-10 rounded-xl border border-[#dbe1ea] bg-white px-4 text-sm font-black">Cancel</button><button className="min-h-10 rounded-xl bg-[#061b3f] px-4 text-sm font-black text-white">Submit problem</button></div></form>}</div>;
}
