"use client";

import { useState } from "react";
import { marketplaceServices } from "@/app/data/marketplace";
import ProfilePhotoField from "./ProfilePhotoField";
import ServiceAreasField from "./ServiceAreasField";
import { updateProviderProfile } from "./actions";

type Props = { profile: Record<string, unknown>; photoUrl: string | null; photoPath: string | null; selectedServices: string[]; areas: string[] };

export default function ProfileEditForm({ profile, photoUrl, photoPath, selectedServices: initialServices, areas }: Props) {
  const [selectedServices, setSelectedServices] = useState(initialServices);
  const toggleCategory = (slug: string) => {
    const values = marketplaceServices.find((service) => service.slug === slug)?.jobs.filter((job) => job.active).map((job) => `${slug}|${job.slug}`) || [];
    const allSelected = values.every((value) => selectedServices.includes(value));
    setSelectedServices((current) => allSelected ? current.filter((value) => !values.includes(value)) : [...new Set([...current, ...values])]);
  };
  return <form action={updateProviderProfile} className="mt-7 grid gap-7 rounded-3xl border border-[#e7ebef] bg-white p-6 sm:p-8">
    <div><h2 className="text-2xl font-black">Edit profile</h2><p className="mt-2 text-sm text-[#657089]">Keep the information customers see when you send an offer up to date.</p></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="font-bold">Name<input name="displayName" defaultValue={String(profile.display_name || "")} className="mt-2 min-h-11 w-full rounded-xl border border-[#dbe1ea] px-4" /></label><label className="font-bold">Business name<input name="businessName" defaultValue={String(profile.business_name || "")} className="mt-2 min-h-11 w-full rounded-xl border border-[#dbe1ea] px-4" /></label><label className="font-bold sm:col-span-2">Mobile number<input name="phone" type="tel" defaultValue={String(profile.phone || "")} className="mt-2 min-h-11 w-full rounded-xl border border-[#dbe1ea] px-4" /></label><label className="font-bold sm:col-span-2">About<textarea name="bio" defaultValue={String(profile.marketplace_bio || "")} maxLength={500} className="mt-2 min-h-28 w-full rounded-xl border border-[#dbe1ea] p-4" /></label></div>
    <ProfilePhotoField currentUrl={photoUrl} currentPath={photoPath} />
    <fieldset><legend className="text-xl font-black">Services</legend><p className="mt-1 text-sm text-[#657089]">Choose the specific jobs you want to receive.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{marketplaceServices.map((service) => { const jobs = service.jobs.filter((job) => job.active); const values = jobs.map((job) => `${service.slug}|${job.slug}`); const count = values.filter((value) => selectedServices.includes(value)).length; const all = values.length > 0 && count === values.length; return <div key={service.slug} className="border-b border-[#edf0f3] pb-3"><div className="flex items-center justify-between gap-2"><p className="font-black">{service.name}</p><button type="button" onClick={() => toggleCategory(service.slug)} className="min-h-10 text-sm font-black text-[#167d3c]">{all ? "Deselect all" : "Select all"}</button></div><p className="text-xs font-bold text-[#657089]">{count} selected</p>{values.map((value) => <label key={value} className="mt-2 flex min-h-9 items-center gap-2 text-sm font-bold"><input type="checkbox" name="service" value={value} checked={selectedServices.includes(value)} onChange={() => setSelectedServices((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])} className="accent-[#23a955]" />{jobs.find((job) => `${service.slug}|${job.slug}` === value)?.name}</label>)}</div>; })}</div></fieldset>
    <ServiceAreasField initialAreas={areas} />
    <div className="flex flex-wrap gap-3"><button className="min-h-11 rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">Save changes</button><a href="/work/profile" className="inline-flex min-h-11 items-center rounded-xl border border-[#dbe1ea] px-5 font-black">Cancel</a></div>
  </form>;
}
