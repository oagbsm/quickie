"use client";

import { useRef } from "react";
import { addTurnoverChecklistTask } from "../../str-actions";

export default function ChecklistTaskDialog({ turnoverId, sections }: { turnoverId: string; sections: string[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" onClick={() => dialogRef.current?.showModal()} className="min-h-11 rounded-lg border border-[#16467e] px-3 text-sm font-extrabold text-[#16467e]">+ Add task</button>
    <dialog ref={dialogRef} aria-labelledby="add-task-title" aria-describedby="add-task-description" className="m-auto max-h-[calc(100dvh-2rem)] w-[min(92vw,480px)] overflow-y-auto rounded-xl border-0 p-0 text-[#071638] shadow-2xl backdrop:bg-[#071f49]/40">
      <form action={addTurnoverChecklistTask} className="grid min-w-0 gap-4 p-5 sm:p-6">
        <input type="hidden" name="turnoverId" value={turnoverId}/>
        <div className="flex items-start justify-between gap-4"><div><h2 id="add-task-title" className="text-xl font-extrabold text-[#071f49]">Add task</h2><p id="add-task-description" className="mt-1 text-sm text-[#657089]">Add a checklist item for this property.</p></div><button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close" className="min-h-11 min-w-11 rounded-lg text-2xl text-[#657089]">×</button></div>
        <label className="font-bold">Task name<input name="label" required className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label>
        <label className="font-bold">Section<select name="sectionTitle" defaultValue={sections[0] || "Custom tasks"} className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3">{sections.map((section) => <option key={section}>{section}</option>)}{!sections.includes("Custom tasks") && <option>Custom tasks</option>}</select></label>
        <fieldset><legend className="font-bold">Apply to</legend><label className="mt-2 flex min-h-11 items-center gap-2"><input type="radio" name="scope" value="clean" defaultChecked/>This clean only</label><label className="flex min-h-11 items-center gap-2"><input type="radio" name="scope" value="future"/>Future cleans at this property</label></fieldset>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => dialogRef.current?.close()} className="min-h-11 rounded-lg border px-4 font-extrabold">Cancel</button><button className="min-h-11 rounded-lg bg-[#071f49] px-4 font-extrabold text-white">Add task</button></div>
      </form>
    </dialog>
  </>;
}
