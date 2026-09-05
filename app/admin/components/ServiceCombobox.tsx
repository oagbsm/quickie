"use client";

import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

export default function ServiceCombobox({ options, defaultValue = "" }: { options: Option[]; defaultValue?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [value, setValue] = useState(defaultValue);
  const [activeIndex, setActiveIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    const close = (event: MouseEvent) => { if (root.current && !root.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function choose(option?: Option) {
    setValue(option?.value || "");
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, Math.max(0, filtered.length - 1))); }
    if (event.key === "ArrowUp") { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.max(0, index - 1)); }
    if (event.key === "Enter") { event.preventDefault(); choose(filtered[activeIndex]); }
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
  }

  return <div ref={root} className="relative min-w-52">
    <input type="hidden" name="service" value={value} />
    <div className="flex min-h-10 items-center rounded-lg border bg-white px-3 focus-within:border-[#159b50] focus-within:ring-2 focus-within:ring-[#159b50]/10">
      <input value={open ? query : selected?.label || ""} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(0); }} onFocus={() => { setQuery(""); setOpen(true); }} onKeyDown={handleKeyDown} placeholder="All services" aria-label="Filter by service" aria-expanded={open} aria-controls="admin-service-options" role="combobox" className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
      {value && <button type="button" onClick={() => choose()} aria-label="Clear service filter" className="mr-1 text-sm font-black text-[#8793a4] hover:text-[#112b4b]">×</button>}
      <button type="button" onClick={() => setOpen((current) => !current)} aria-label="Open service options" className="text-xs text-[#718099]">⌄</button>
    </div>
    {open && <div id="admin-service-options" role="listbox" className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-auto rounded-lg border bg-white p-1 shadow-xl">
      <button type="button" role="option" aria-selected={!value} onMouseDown={(event) => event.preventDefault()} onClick={() => choose()} className={`block w-full rounded px-3 py-2 text-left text-xs font-bold hover:bg-[#f1f7f3] ${!value ? "text-[#159b50]" : ""}`}>All services</button>
      {filtered.map((option, index) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option)} className={`block w-full rounded px-3 py-2 text-left text-xs font-bold hover:bg-[#f1f7f3] ${index === activeIndex ? "bg-[#f1f7f3]" : ""}`}>{option.label}</button>)}
      {!filtered.length && <p className="px-3 py-2 text-xs text-[#718099]">No matching services.</p>}
    </div>}
  </div>;
}
