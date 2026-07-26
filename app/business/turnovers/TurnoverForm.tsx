"use client";

import { useMemo, useState } from "react";
import { createTurnover } from "../str-actions";

type Property = { id: string; nickname: string; default_checkout_time: string; default_checkin_time: string; estimated_turnover_minutes: number; linen_requirements: string | null; default_worker_id?: string | null };
type Worker = { id: string; display_name: string; company_name: string | null };
const field = "mt-1.5 min-h-12 w-full rounded-lg border border-[#cfd7e3] bg-white px-3.5 py-2.5 outline-none focus:border-[#2d67b2] focus:ring-4 focus:ring-[#2d67b2]/15";

export default function TurnoverForm({ properties, workers, initialPropertyId }: { properties: Property[]; workers: Worker[]; initialPropertyId?: string }) {
  const firstProperty = properties.find(item => item.id === initialPropertyId) || properties[0];
  const [propertyId, setPropertyId] = useState(firstProperty?.id || "");
  const [workerId, setWorkerId] = useState(firstProperty?.default_worker_id || "");
  const property = properties.find((item) => item.id === propertyId);
  const [checkout, setCheckout] = useState(property?.default_checkout_time?.slice(0, 5) || "11:00");
  const [access, setAccess] = useState(property?.default_checkout_time?.slice(0, 5) || "11:00");
  const [checkin, setCheckin] = useState(property?.default_checkin_time?.slice(0, 5) || "15:00");
  const [duration, setDuration] = useState(property?.estimated_turnover_minutes || 180);
  const [step, setStep] = useState(1);
  const available = useMemo(() => {
    const [ch, cm] = checkout.split(":").map(Number);
    const [ih, im] = checkin.split(":").map(Number);
    return (ih * 60 + im) - (ch * 60 + cm);
  }, [checkout, checkin]);
  const risk = available < duration;
  function selectProperty(id: string) {
    setPropertyId(id);
    const next = properties.find((item) => item.id === id);
    if (next) {
      setCheckout(next.default_checkout_time.slice(0, 5));
      setAccess(next.default_checkout_time.slice(0, 5));
      setCheckin(next.default_checkin_time.slice(0, 5));
      setDuration(next.estimated_turnover_minutes);
      setWorkerId(next.default_worker_id || "");
    }
  }
  const stepButton = (next: number) => <button type="button" onClick={() => setStep(next)} className="mt-5 min-h-12 w-full rounded-lg bg-[#071f49] px-5 font-extrabold text-white sm:hidden">Continue</button>;
  return <form action={createTurnover} className="grid gap-5 sm:gap-8">
    <div className="sm:hidden"><div className="flex justify-between text-xs font-extrabold text-[#657089]"><span>Step {step} of 4</span><span>{["Property","Schedule","Requirements","Cleaner"][step-1]}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dfe4eb]"><div className="h-full bg-[#2d67b2] transition-all" style={{width:`${step*25}%`}} /></div></div>
    <section className={`${step === 1 ? "block" : "hidden"} rounded-xl border border-[#dfe4eb] bg-white p-5 sm:block sm:p-7`}>
      <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#2d67b2]">1 · Property</p>
      <label className="mt-4 block font-bold">Property<select name="propertyId" value={propertyId} onChange={e => selectProperty(e.target.value)} className={field} required><option value="">Select a property</option>{properties.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}</select></label>
      {stepButton(2)}
    </section>
    <section className={`${step === 2 ? "block" : "hidden"} rounded-xl border border-[#dfe4eb] bg-white p-5 sm:block sm:p-7`}>
      <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#2d67b2]">2 · Schedule</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="font-bold">Turnover date<input name="date" type="date" min={new Date().toISOString().slice(0,10)} className={field} required /></label>
        <label className="font-bold">Guest checkout<input name="checkoutTime" type="time" value={checkout} onChange={e => setCheckout(e.target.value)} className={field} required /></label>
        <label className="font-bold">Cleaner access<input name="accessTime" type="time" value={access} onChange={e => setAccess(e.target.value)} className={field} required /></label>
        <label className="font-bold">Next check-in<input name="checkinTime" type="time" value={checkin} onChange={e => setCheckin(e.target.value)} className={field} required /></label>
      </div>
      <label className="mt-4 block max-w-xs font-bold">Estimated duration (minutes)<input name="durationMinutes" type="number" min="15" max="1440" step="15" value={duration} onChange={e => setDuration(Number(e.target.value))} className={field} required /></label>
      {risk && <div role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-extrabold">The turnaround window appears insufficient.</p><p className="mt-1">There are {available} minutes available for an estimated {duration}-minute turnover.</p><label className="mt-3 flex min-h-11 items-center gap-3 font-bold"><input name="riskAcknowledged" type="checkbox" required className="h-5 w-5" />Create this turnover with the timing risk noted</label></div>}
      <div className="grid grid-cols-[auto_1fr] gap-2 sm:hidden"><button type="button" onClick={() => setStep(1)} className="mt-5 min-h-12 rounded-lg border px-4 font-bold">Back</button>{stepButton(3)}</div>
    </section>
    <section className={`${step === 3 ? "block" : "hidden"} rounded-xl border border-[#dfe4eb] bg-white p-5 sm:block sm:p-7`}>
      <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#2d67b2]">3 · Requirements</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="font-bold">Cleaning type<select name="cleaningType" className={field}><option value="standard_turnover">Standard turnover</option><option value="deep_turnover">Deep turnover</option><option value="mid_stay">Mid-stay clean</option><option value="custom">Custom</option></select></label>
        <label className="font-bold">Linen requirement<textarea name="linenRequirement" rows={2} defaultValue={property?.linen_requirements || ""} className={field} /></label>
      </div>
      <label className="mt-4 block font-bold">One-off notes<textarea name="notes" rows={3} className={field} /></label>
      <div className="grid grid-cols-[auto_1fr] gap-2 sm:hidden"><button type="button" onClick={() => setStep(2)} className="mt-5 min-h-12 rounded-lg border px-4 font-bold">Back</button>{stepButton(4)}</div>
    </section>
    <section className={`${step === 4 ? "block" : "hidden"} rounded-xl border border-[#dfe4eb] bg-white p-5 sm:block sm:p-7`}>
      <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#2d67b2]">4 · Assign cleaner</p>
      <label className="mt-4 block font-bold">Cleaner or contractor<select name="workerId" value={workerId} onChange={e => setWorkerId(e.target.value)} className={field}><option value="">Leave unassigned</option>{workers.map(w => <option key={w.id} value={w.id}>{w.display_name}{w.company_name ? ` · ${w.company_name}` : ""}</option>)}</select></label>
      <p className="mt-2 text-sm text-[#647086]">You can assign or change the cleaner later. Quickola does not select a cleaner for you.</p>
      <div className="mt-5 grid grid-cols-[auto_1fr] gap-2 sm:hidden"><button type="button" onClick={() => setStep(3)} className="min-h-12 rounded-lg border px-4 font-bold">Back</button><button className="min-h-12 rounded-lg bg-[#071f49] px-5 font-extrabold text-white">Create turnover</button></div>
    </section>
    <section className="hidden flex-col justify-between gap-4 rounded-xl bg-[#071f49] p-5 text-white sm:flex sm:flex-row sm:items-center sm:p-7">
      <div><p className="font-extrabold">Review and create</p><p className="mt-1 text-sm text-white/70">The property checklist and evidence rules will be copied into this turnover.</p></div>
      <button className="min-h-12 rounded-lg bg-white px-6 font-extrabold text-[#071f49] focus-visible:ring-4 focus-visible:ring-white/40">Create turnover</button>
    </section>
  </form>;
}
