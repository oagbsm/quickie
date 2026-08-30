"use client";

import { useState } from "react";
import { MARKETPLACE_SERVICE_AREA_CODES } from "@/lib/marketplace/service-areas";

export default function ServiceAreasField({ initialAreas }: { initialAreas: string[] }) {
  const savedAreas = [...new Set(initialAreas.map((area) => area.toUpperCase()).filter(Boolean))];
  const additionalAreas = savedAreas.filter((area) => !MARKETPLACE_SERVICE_AREA_CODES.includes(area as typeof MARKETPLACE_SERVICE_AREA_CODES[number]));
  const [areas, setAreas] = useState([...new Set([...MARKETPLACE_SERVICE_AREA_CODES.filter((area) => savedAreas.includes(area)), ...additionalAreas])]);
  const toggle = (area: string) => setAreas((current) => current.includes(area) ? current.filter((item) => item !== area) : [...current, area]);
  const selectAll = () => setAreas((current) => MARKETPLACE_SERVICE_AREA_CODES.every((area) => current.includes(area)) ? current.filter((area) => !MARKETPLACE_SERVICE_AREA_CODES.includes(area as typeof MARKETPLACE_SERVICE_AREA_CODES[number])) : [...new Set([...current, ...MARKETPLACE_SERVICE_AREA_CODES])]);
  return <fieldset><legend className="text-xl font-black">Where do you work?</legend><p className="mt-1 font-bold text-[#39465b]">Maidenhead</p><p className="mt-4 text-sm text-[#657089]">Choose the postcode areas you cover.</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{MARKETPLACE_SERVICE_AREA_CODES.map((area) => <label key={area} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[#e7ebef] px-4 font-black"><input type="checkbox" name="serviceArea" value={area} checked={areas.includes(area)} onChange={() => toggle(area)} className="h-5 w-5 accent-[#23a955]" />{area}</label>)}</div>{additionalAreas.length > 0 && <p className="mt-3 text-xs text-[#657089]">Other saved areas: {additionalAreas.join(", ")}</p>}<button type="button" onClick={selectAll} className="mt-3 min-h-10 rounded-xl border border-[#dbe1ea] px-3 text-sm font-black">{MARKETPLACE_SERVICE_AREA_CODES.every((area) => areas.includes(area)) ? "Clear all" : "Select all"}</button></fieldset>;
}
