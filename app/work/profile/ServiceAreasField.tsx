"use client";

import { useState } from "react";
import { ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS, MARKETPLACE_SERVICE_AREA_CODES } from "@/lib/marketplace/service-areas";

export default function ServiceAreasField({ initialAreas }: { initialAreas: string[] }) {
  const savedAreas = [...new Set(initialAreas.map((area) => area.toUpperCase()).filter(Boolean))];
  const additionalAreas = savedAreas.filter((area) => !MARKETPLACE_SERVICE_AREA_CODES.includes(area as typeof MARKETPLACE_SERVICE_AREA_CODES[number]));
  const [areas, setAreas] = useState([...new Set([...MARKETPLACE_SERVICE_AREA_CODES.filter((area) => savedAreas.includes(area)), ...additionalAreas])]);
  const toggle = (area: string) => setAreas((current) => current.includes(area) ? current.filter((item) => item !== area) : [...current, area]);
  const selectAll = () => setAreas((current) => ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS.every((area) => current.includes(area)) ? current.filter((area) => !ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS.includes(area as typeof ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS[number])) : [...new Set([...current, ...ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS])]);
  return <fieldset><legend className="text-xl font-black">Where do you work?</legend><p className="mt-1 font-bold text-[#39465b]">Maidenhead</p><p className="mt-4 text-sm text-[#657089]">Choose the postcode areas you cover.</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{MARKETPLACE_SERVICE_AREA_CODES.map((area) => { const active = ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS.includes(area as typeof ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS[number]); return <label key={area} className={`flex min-h-12 items-center gap-3 rounded-xl border border-[#e7ebef] px-4 font-black ${active ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}><input type="checkbox" name="serviceArea" value={area} checked={areas.includes(area)} onChange={() => toggle(area)} disabled={!active} className="h-5 w-5 accent-[#23a955]" />{area}<span className="ml-auto text-xs font-bold text-[#657089]">{active ? "Available now" : "Coming soon"}</span></label>; })}</div>{additionalAreas.length > 0 && <p className="mt-3 text-xs text-[#657089]">Other saved areas: {additionalAreas.join(", ")}</p>}<button type="button" onClick={selectAll} className="mt-3 min-h-10 rounded-xl border border-[#dbe1ea] px-3 text-sm font-black">{ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS.every((area) => areas.includes(area)) ? "Clear all" : "Select available area"}</button></fieldset>;
}
