"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MarketplaceService } from "@/app/data/marketplace";
import ServiceQuotePanel, { OPEN_SERVICE_QUOTE_EVENT } from "./ServiceQuotePanel";

export default function ServiceJobCards({ service, locationName, interactive = false, heading, showLabel = true }: { service: MarketplaceService; locationName?: string; interactive?: boolean; heading: string; showLabel?: boolean }) {
  const [selectedJob, setSelectedJob] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!interactive) return; const openPanel = () => { setSelectedJob(""); setOpen(true); document.documentElement.classList.add("service-quote-open"); }; window.addEventListener(OPEN_SERVICE_QUOTE_EVENT, openPanel); return () => { window.removeEventListener(OPEN_SERVICE_QUOTE_EVENT, openPanel); document.documentElement.classList.remove("service-quote-open"); }; }, [interactive]);
  const close = () => { setSelectedJob(""); setOpen(false); document.documentElement.classList.remove("service-quote-open"); };
  return <section className="px-5 py-12 sm:px-8 sm:py-16"><div className="mx-auto max-w-[1120px]">{showLabel && <p className="text-xs font-black uppercase tracking-[.16em] text-[#23a955]">Popular jobs</p>}<h2 className={`${showLabel ? "mt-3 " : ""}text-3xl font-black tracking-[-.05em]`}>{heading}</h2><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{service.jobs.filter((item) => item.active).map((item) => { const href = interactive ? "#quote-form" : `/?service=${service.slug}&job=${item.slug}#job-composer`; return <Link key={item.slug} href={href} onClick={interactive ? (event) => { event.preventDefault(); setSelectedJob(item.slug); setOpen(true); document.documentElement.classList.add("service-quote-open"); } : undefined} className={`rounded-2xl bg-white p-5 ring-1 ring-[#e9edf1] hover:ring-[#23a955] ${selectedJob === item.slug ? "ring-2 ring-[#23a955]" : ""}`} aria-label={`Choose ${item.name}`}><h3 className="font-black">{item.name}</h3><p className="mt-2 text-sm leading-6 text-[#707b8d]">{item.shortDescription}</p><span className="mt-4 block text-sm font-black text-[#167d3c]">Choose this →</span></Link>; })}</div></div>{interactive && open && <ServiceQuotePanel key={selectedJob || "job-selector"} service={service} locationName={locationName} jobSlug={selectedJob} onClose={close} onJobChange={setSelectedJob} />}</section>;
}
