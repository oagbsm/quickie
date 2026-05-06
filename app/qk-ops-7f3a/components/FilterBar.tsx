

import type { AdminTab } from "../types";
import { formatLabel } from "../lib/admin-utils";

function SelectFilter({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.08em] text-[#657089]">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value}
        className="h-11 w-full rounded-[13px] border border-[#dfe5ee] bg-white px-3 text-[14px] font-bold text-[#071638] outline-none transition focus:border-[#08783f] focus:ring-4 focus:ring-[#08783f]/10"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function FilterBar({
  activeTab,
  query,
  status,
  service,
  area,
  serviceOptions,
  areaOptions,
}: {
  activeTab: AdminTab;
  query: string;
  status: string;
  service: string;
  area: string;
  serviceOptions: string[];
  areaOptions: string[];
}) {
  const statusOptions =
    activeTab === "requests"
      ? ["new", "contacted", "matched", "done", "cancelled"]
      : ["pending", "approved", "rejected"];

  return (
    <form
      action="/qk-ops-7f3a"
      className="rounded-[22px] border border-[#dfe5ee] bg-white p-4 shadow-[0_12px_35px_rgba(7,22,56,0.035)]"
    >
      <input type="hidden" name="tab" value={activeTab} />

      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.2fr)_180px_200px_200px_auto] lg:items-end">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.08em] text-[#657089]">
            Search
          </span>
          <input
            name="q"
            defaultValue={query}
            placeholder={activeTab === "requests" ? "Search requests, email, phone..." : "Search providers, category, area..."}
            className="h-11 w-full rounded-[13px] border border-[#dfe5ee] bg-white px-4 text-[14px] font-bold text-[#071638] outline-none transition placeholder:text-[#9aa4b5] focus:border-[#08783f] focus:ring-4 focus:ring-[#08783f]/10"
          />
        </label>

        <SelectFilter label="Status" name="status" value={status} options={statusOptions} />
        <SelectFilter label="Service" name="service" value={service} options={serviceOptions} />
        <SelectFilter label="Area" name="area" value={area} options={areaOptions} />

        <div className="flex gap-2">
          <button
            type="submit"
            className="h-11 flex-1 rounded-[13px] bg-[#071638] px-5 text-[14px] font-black text-white shadow-[0_10px_22px_rgba(7,22,56,0.14)] transition hover:-translate-y-0.5 lg:flex-none"
          >
            Filter
          </button>
          <a
            href={`/qk-ops-7f3a?tab=${activeTab}`}
            className="grid h-11 w-11 place-items-center rounded-[13px] border border-[#dfe5ee] bg-white text-[18px] font-black text-[#071638] transition hover:-translate-y-0.5 hover:border-[#b7c2d2]"
            aria-label="Clear filters"
          >
            ×
          </a>
        </div>
      </div>
    </form>
  );
}