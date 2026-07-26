"use client";

import { useState } from "react";
import { assignWorker } from "../../str-actions";

export default function ReassignCleanerForm({ turnoverId, currentWorkerId, workers }: { turnoverId: string; currentWorkerId?: string; workers: Array<{ id: string; display_name: string; company_name: string | null }> }) {
  const [workerId, setWorkerId] = useState("");
  return <form action={assignWorker} className="mt-4 border-t pt-4">
    <input type="hidden" name="turnoverId" value={turnoverId}/>
    <label className="text-sm font-bold">Select another cleaner
      <select name="workerId" required value={workerId} onChange={(event)=>setWorkerId(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3">
        <option value="" disabled>Select cleaner</option>
        {workers.filter(candidate=>candidate.id!==currentWorkerId).map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.display_name}{candidate.company_name?` · ${candidate.company_name}`:""}</option>)}
      </select>
    </label>
    <button disabled={!workerId || workerId===currentWorkerId} className="mt-2 min-h-10 rounded-lg border px-4 text-sm font-extrabold text-[#16467e] disabled:cursor-not-allowed disabled:text-[#9aa6b5]">Reassign</button>
  </form>;
}
