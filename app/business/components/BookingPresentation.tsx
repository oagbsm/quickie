import { getBookingStatus, getBookingTimeline } from "@/lib/business/booking-status";

const tones = {
  neutral: "bg-slate-100 text-slate-800",
  warning: "bg-amber-100 text-amber-950",
  success: "bg-emerald-100 text-emerald-900",
  danger: "bg-red-100 text-red-900",
};

export function BookingStatusBadge({ status }: { status: string }) {
  const presentation = getBookingStatus(status);
  return <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${tones[presentation.tone]}`}>{presentation.customerLabel}</span>;
}

export function BookingProgress({ status }: { status: string }) {
  const presentation = getBookingStatus(status);
  const timeline = getBookingTimeline(status);
  if (presentation.terminalException) return <div className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="font-black text-red-900">{presentation.customerTitle}</p><p className="mt-1 text-sm text-red-800">{presentation.customerCopy}</p></div>;
  return <ol aria-label="Booking progress" className="grid gap-0">
    {timeline.map((item,index)=><li key={item.label} aria-current={item.state==="current"?"step":undefined} className="grid grid-cols-[2rem_1fr] gap-3">
      <div className="flex flex-col items-center"><span aria-hidden="true" className={`grid h-8 w-8 place-items-center rounded-full border-2 text-sm font-black ${item.state==="complete"?"border-[#08783f] bg-[#08783f] text-white":item.state==="current"?"border-[#071638] bg-white text-[#071638]":"border-[#aab5bf] bg-white text-[#526078]"}`}>{item.state==="complete"?"✓":index+1}</span>{index<timeline.length-1&&<span aria-hidden="true" className={`min-h-7 w-0.5 flex-1 ${item.state==="complete"?"bg-[#08783f]":"bg-[#d8e0e6]"}`}/>}</div>
      <div className="pb-6"><p className={`font-black ${item.state==="future"?"text-[#526078]":"text-[#071638]"}`}>{item.label}</p>{item.state==="current"&&<p className="mt-1 text-sm text-[#526078]">Current stage</p>}</div>
    </li>)}
  </ol>;
}
