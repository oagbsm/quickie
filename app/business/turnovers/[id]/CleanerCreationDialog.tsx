"use client";

import { useRef } from "react";
import { addWorkerForTurnover } from "../../str-actions";

export default function CleanerCreationDialog({ turnoverId, compact = false }: { turnoverId: string; compact?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" onClick={() => dialogRef.current?.showModal()} className={compact ? "text-sm font-extrabold text-[#16467e] underline underline-offset-2" : "min-h-11 rounded-lg border border-[#16467e] px-4 font-extrabold text-[#16467e]"}>
      + Add {compact ? "new " : ""}cleaner
    </button>
    <dialog ref={dialogRef} className="w-[calc(100%-2rem)] max-w-lg rounded-xl p-0 shadow-xl backdrop:bg-[#071f49]/40">
      <form action={addWorkerForTurnover} className="grid gap-4 p-5 sm:p-6">
        <input type="hidden" name="turnoverId" value={turnoverId}/>
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-extrabold text-[#071f49]">Add a cleaner</h2><p className="mt-1 text-sm text-[#657089]">They’ll receive a secure invitation to join your team.</p></div><button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close" className="min-h-11 min-w-11 rounded-lg text-2xl text-[#657089]">×</button></div>
        <label className="font-bold">Full name<input name="displayName" required minLength={2} className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label>
        <label className="font-bold">Email<input name="email" type="email" required className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="font-bold">Company (optional)<input name="companyName" className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label><label className="font-bold">Mobile (optional)<input name="mobile" type="tel" className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label></div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => dialogRef.current?.close()} className="min-h-11 rounded-lg border px-4 font-extrabold">Cancel</button><button className="min-h-11 rounded-lg bg-[#071f49] px-4 font-extrabold text-white">Add cleaner</button></div>
      </form>
    </dialog>
  </>;
}
