import { supabase } from "@/lib/supabase";
import {
  deleteBusiness,
  deleteRequest,
  matchRequestToBusiness,
  updateBusinessStatus,
  updateRequestStatus,
} from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminPageProps = {
  searchParams?: Promise<{
    tab?: string;
    service?: string;
    area?: string;
    status?: string;
    selected?: string;
    q?: string;
  }>;
};

type RequestRow = {
  id: string;
  service: string;
  area: string;
  time_needed: string | null;
  details: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  matched_business_id: string | null;
  admin_notes: string | null;
};

type BusinessRow = {
  id: string;
  business_name: string;
  category: string;
  whatsapp: string;
  starting_price: number | null;
  areas: string[] | null;
  availability: string | null;
  profile_slug: string | null;
  description: string | null;
  status: string;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  completed_jobs: number;
  internal_notes: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "—";

  const cleaned = value
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const labels: Record<string, string> = {
    asap: "As soon as possible",
    today: "Today",
    tomorrow: "Tomorrow",
    "this week": "This week",
    flexible: "Flexible",
    cleaning: "Cleaning",
    "regular clean": "Regular cleaning",
    "regular cleaning": "Regular cleaning",
    "deep clean": "Deep clean",
    "deep cleaning": "Deep cleaning",
    "end of tenancy": "End of tenancy",
    "end of tenancy clean": "End of tenancy clean",
    "flat apartment": "Flat / apartment",
    "flat / apartment": "Flat / apartment",
    "1 bedroom": "1 bedroom",
    "2 bedrooms": "2 bedrooms",
    "3 bedrooms": "3 bedrooms",
    "4 plus bedrooms": "4+ bedrooms",
  };

  if (labels[cleaned]) return labels[cleaned];

  return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function whatsappLink(phone: string | null | undefined, message: string) {
  if (!phone) return "#";

  const cleaned = phone.replace(/[^0-9]/g, "");
  const ukNumber = cleaned.startsWith("0") ? `44${cleaned.slice(1)}` : cleaned;

  return `https://wa.me/${ukNumber}?text=${encodeURIComponent(message)}`;
}

function cleanerRequestMessage(request: RequestRow) {
  return [
    "New Quickola cleaning request:",
    "",
    `Area: ${formatLabel(request.area)}`,
    `Service: ${formatLabel(request.service)}`,
    `Needed: ${formatLabel(request.time_needed)}`,
    request.details ? `Details: ${request.details}` : "Details: Not provided",
    "",
    "Can you take this job?",
  ].join("\n");
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean).map((value) => String(value)))).sort((a, b) =>
    formatLabel(a).localeCompare(formatLabel(b))
  );
}

function isCleaningBusiness(business: BusinessRow) {
  const category = `${business.category || ""} ${business.business_name || ""}`.toLowerCase();

  return category.includes("clean") || category.includes("tenancy");
}

function statusClass(status: string) {
  if (status === "new") return "bg-[#dcfce7] text-[#08783f] ring-1 ring-[#bbf7d0]";
  if (status === "contacted" || status === "pending") return "bg-[#eaf1ff] text-[#1d4ed8] ring-1 ring-[#c7d2fe]";
  if (status === "matched" || status === "approved") return "bg-[#ecfdf3] text-[#08783f] ring-1 ring-[#bbf7d0]";
  if (status === "completed") return "bg-[#f1f5f9] text-[#475569] ring-1 ring-[#e2e8f0]";
  if (status === "rejected" || status === "cancelled") return "bg-[#fee2e2] text-[#dc2626] ring-1 ring-[#fecaca]";

  return "bg-[#f4f6f9] text-[#657089] ring-1 ring-[#e1e6ee]";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(status)}`}>
      {status === "completed" ? "Done" : formatLabel(status)}
    </span>
  );
}

function Sidebar({
  activeTab,
  activeStatus,
  requestCount,
  businessCount,
  newCount,
  contactedCount,
  matchedCount,
  completedCount,
}: {
  activeTab: string;
  activeStatus: string;
  requestCount: number;
  businessCount: number;
  newCount: number;
  contactedCount: number;
  matchedCount: number;
  completedCount: number;
}) {
  const links = [
    {
      href: "/qk-ops-7f3a?tab=requests",
      label: "Requests",
      icon: "□",
      count: newCount,
      active: activeTab === "requests",
    },
    {
      href: "/qk-ops-7f3a?tab=businesses",
      label: "Businesses",
      icon: "▦",
      count: businessCount,
      active: activeTab === "businesses",
    },
  ];

  const requestStatusLinks = [
    {
      href: "/qk-ops-7f3a?tab=requests&status=new",
      label: "New",
      count: newCount,
      active: activeTab === "requests" && activeStatus === "new",
    },
    {
      href: "/qk-ops-7f3a?tab=requests&status=contacted",
      label: "Contacted",
      count: contactedCount,
      active: activeTab === "requests" && activeStatus === "contacted",
    },
    {
      href: "/qk-ops-7f3a?tab=requests&status=matched",
      label: "Matched",
      count: matchedCount,
      active: activeTab === "requests" && activeStatus === "matched",
    },
    {
      href: "/qk-ops-7f3a?tab=requests&status=completed",
      label: "Done",
      count: completedCount,
      active: activeTab === "requests" && activeStatus === "completed",
    },
  ];

  return (
    <aside className="hidden min-h-screen w-[232px] shrink-0 border-r border-[#e1e6ee] bg-white px-4 py-5 lg:block">
      <a href="/qk-ops-7f3a" className="flex items-center gap-3 px-1">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#08783f] text-[16px] font-bold text-white shadow-[0_10px_20px_rgba(8,120,63,0.18)]">
          Q
        </span>
        <span className="text-[19px] font-bold tracking-[-0.025em] text-[#071638]">Quickola Admin</span>
      </a>

      <nav className="mt-8 space-y-1">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={`flex h-11 items-center justify-between rounded-xl px-3 text-[14px] font-semibold transition ${
              link.active ? "bg-[#eef9f2] text-[#08783f]" : "text-[#071638] hover:bg-[#f6f8fb]"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="text-[16px]">{link.icon}</span>
              {link.label}
            </span>
            <span className="rounded-full bg-[#eef2f7] px-2 py-0.5 text-[11px] font-bold text-[#071638]">
              {link.count}
            </span>
          </a>
        ))}
      </nav>

      <div className="mt-6 border-t border-[#edf0f5] pt-4">
        <p className="px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8b94a7]">Request status</p>

        <div className="mt-2 space-y-1">
          {requestStatusLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`flex h-9 items-center justify-between rounded-xl px-3 text-[13px] font-semibold transition ${
                link.active ? "bg-[#071638] text-white" : "text-[#44506a] hover:bg-[#f6f8fb]"
              }`}
            >
              <span>{link.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  link.active ? "bg-white/15 text-white" : "bg-[#eef2f7] text-[#071638]"
                }`}
              >
                {link.count}
              </span>
            </a>
          ))}
        </div>
      </div>

      <div className="absolute bottom-5 left-4 right-4 hidden lg:block">
        <a href="/" className="flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold text-[#657089] hover:bg-[#f6f8fb]">
          ← Back home
        </a>
      </div>
    </aside>
  );
}

function TopBar({
  activeTab,
  requestCount,
  businessCount,
  newCount,
  todayCount,
}: {
  activeTab: "requests" | "businesses";
  requestCount: number;
  businessCount: number;
  newCount: number;
  todayCount: number;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e1e6ee] bg-white/95 backdrop-blur-md">
      <div className="flex min-h-[64px] items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-3 lg:hidden">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#08783f] text-[16px] font-bold text-white">Q</span>
          <span className="text-[20px] font-bold tracking-[-0.025em] text-[#071638]">Admin</span>
        </div>

        <nav className="hidden items-center gap-8 lg:flex">
          <a
            href="/qk-ops-7f3a?tab=requests"
            className={`border-b-2 py-[22px] text-[14px] font-bold ${
              activeTab === "requests" ? "border-[#08783f] text-[#071638]" : "border-transparent text-[#657089]"
            }`}
          >
            Requests <span className="ml-2 rounded-full bg-[#e7f8ed] px-2 py-0.5 text-[11px] text-[#08783f]">{newCount}</span>
          </a>

          <a
            href="/qk-ops-7f3a?tab=businesses"
            className={`border-b-2 py-[22px] text-[14px] font-bold ${
              activeTab === "businesses" ? "border-[#08783f] text-[#071638]" : "border-transparent text-[#657089]"
            }`}
          >
            Businesses <span className="ml-2 rounded-full bg-[#eef2f7] px-2 py-0.5 text-[11px] text-[#071638]">{businessCount}</span>
          </a>
        </nav>

        <div className="hidden items-center rounded-xl border border-[#e1e6ee] bg-white px-4 py-2 lg:flex">
          <StatPill label="New" value={newCount} tone="red" />
          <StatPill label="Today" value={todayCount} />
          <StatPill label="Total active" value={requestCount - 0} />
        </div>

        <a href="/" className="inline-flex h-9 items-center rounded-xl border border-[#dfe5ee] bg-white px-4 text-[13px] font-bold text-[#071638] shadow-[0_6px_16px_rgba(7,22,56,0.035)]">
          Back home
        </a>
      </div>
    </header>
  );
}

function StatPill({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "red" }) {
  return (
    <div className="flex items-center gap-2 px-4 text-[13px] font-bold text-[#071638]">
      <span>{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-[11px] ${tone === "red" ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#eef2f7] text-[#071638]"}`}>
        {value}
      </span>
    </div>
  );
}

function FilterBar({
  tab,
  service,
  area,
  status = "",
  q = "",
  serviceOptions,
  areaOptions,
  statusOptions = [],
}: {
  tab: "requests" | "businesses";
  service: string;
  area: string;
  status?: string;
  q?: string;
  serviceOptions: string[];
  areaOptions: string[];
  statusOptions?: string[];
}) {
  return (
    <form className="admin-auto-submit rounded-2xl border border-[#e1e6ee] bg-white p-4 shadow-[0_8px_22px_rgba(7,22,56,0.035)]">
      <input type="hidden" name="tab" value={tab} />

      <div className={`grid gap-2 ${tab === "requests" ? "xl:grid-cols-[minmax(180px,1fr)_140px_140px_140px_64px_64px]" : "xl:grid-cols-[minmax(180px,1fr)_150px_150px_64px_64px]"}`}>
        <label className="block">
          <span className="sr-only">Search</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, phone..."
            className="h-10 w-full rounded-xl border border-[#dfe5ee] bg-white px-3 text-[13px] font-medium text-[#071638] outline-none placeholder:text-[#8b94a7]"
          />
        </label>

        <label className="block">
          <span className="sr-only">Service</span>
          <select
            name="service"
            defaultValue={service}
            className="h-10 w-full rounded-xl border border-[#dfe5ee] bg-white px-3 text-[13px] font-semibold text-[#071638] outline-none"
          >
            <option value="">All services</option>
            {serviceOptions.map((option) => (
              <option key={option} value={option}>
                {formatLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">Area</span>
          <select
            name="area"
            defaultValue={area}
            className="h-10 w-full rounded-xl border border-[#dfe5ee] bg-white px-3 text-[13px] font-semibold text-[#071638] outline-none"
          >
            <option value="">All areas</option>
            {areaOptions.map((option) => (
              <option key={option} value={option}>
                {formatLabel(option)}
              </option>
            ))}
          </select>
        </label>

        {tab === "requests" ? (
          <label className="block">
            <span className="sr-only">Status</span>
            <select
              name="status"
              defaultValue={status}
              className="h-10 w-full rounded-xl border border-[#dfe5ee] bg-white px-3 text-[13px] font-semibold text-[#071638] outline-none"
            >
              <option value="">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "completed" ? "Done" : formatLabel(option)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <button type="submit" className="h-10 rounded-xl bg-[#071638] px-2 text-[13px] font-bold text-white">
          Filter
        </button>

        <a href={`/qk-ops-7f3a?tab=${tab}`} className="inline-flex h-10 items-center justify-center rounded-xl border border-[#dfe5ee] bg-white px-2 text-[13px] font-bold text-[#071638]">
          Clear
        </a>
      </div>
    </form>
  );
}

function SmallStatusForm({
  id,
  status,
  label,
  tone = "dark",
}: {
  id: string;
  status: string;
  label: string;
  tone?: "dark" | "green" | "blue";
}) {
  const toneClass = {
    dark: "bg-[#071638] text-white",
    green: "bg-[#08783f] text-white",
    blue: "bg-[#eaf1ff] text-[#1d4ed8] ring-1 ring-[#c7d2fe]",
  }[tone];

  return (
    <form action={updateRequestStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={`h-8 rounded-lg px-3 text-[12px] font-bold ${toneClass}`}>
        {label}
      </button>
    </form>
  );
}

function MatchBusinessForm({ request, businesses }: { request: RequestRow; businesses: BusinessRow[] }) {
  const approvedBusinesses = businesses.filter((business) => business.status === "approved");
  const matchedBusiness = approvedBusinesses.find((business) => business.id === request.matched_business_id);

  if (approvedBusinesses.length === 0) {
    return <p className="rounded-xl bg-[#fff7ed] px-3 py-2 text-[12px] font-semibold text-[#9a3412]">No approved businesses yet</p>;
  }

  return (
    <form action={matchRequestToBusiness} className="space-y-3">
      <input type="hidden" name="request_id" value={request.id} />

      <select
        name="business_id"
        defaultValue={request.matched_business_id || ""}
        className="h-10 w-full rounded-xl border border-[#dfe5ee] bg-white px-3 text-[13px] font-semibold text-[#071638] outline-none"
        required
      >
        <option value="" disabled>
          Select a business...
        </option>
        {approvedBusinesses.map((business) => (
          <option key={business.id} value={business.id}>
            {business.business_name} · {formatLabel(business.category)}
          </option>
        ))}
      </select>

      <button type="submit" className="h-10 w-full rounded-xl bg-[#071638] px-4 text-[13px] font-bold text-white">
        {matchedBusiness ? "Update match" : "Match business"}
      </button>
    </form>
  );
}

function RequestDetailsPanel({ request, businesses }: { request: RequestRow | null; businesses: BusinessRow[] }) {
  if (!request) return null;

  const matchedBusiness = businesses.find((business) => business.id === request.matched_business_id);

  return (
    <aside className="fixed bottom-4 right-4 top-[84px] z-50 w-[370px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-2xl border border-[#e1e6ee] bg-white shadow-[0_24px_80px_rgba(7,22,56,0.18)]">
      <div className="sticky top-0 z-10 border-b border-[#edf0f5] bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <StatusBadge status={request.status} />
            <h2 className="mt-4 text-[19px] font-bold tracking-[-0.02em] text-[#071638]">Request details</h2>
            <p className="mt-1 text-[13px] font-medium text-[#657089]">{formatDate(request.created_at)}</p>
          </div>
          <a href="/qk-ops-7f3a?tab=requests" className="grid h-8 w-8 place-items-center rounded-lg text-[20px] font-light text-[#657089] hover:bg-[#f5f8fb]">
            ×
          </a>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <section>
          <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#657089]">Customer</h3>
          <p className="mt-3 text-[14px] font-bold text-[#071638]">{request.email || "No email"}</p>

          {request.phone ? (
            <a
              className="mt-1 block text-[13px] font-semibold text-[#08783f]"
              target="_blank"
              href={whatsappLink(
                request.phone,
                `Hi, this is Quickola. We received your request for ${formatLabel(request.service)} in ${formatLabel(request.area)}.`
              )}
            >
              {request.phone}
            </a>
          ) : null}

          <p className="mt-1 text-[13px] font-medium text-[#657089]">{formatLabel(request.area)}</p>
        </section>

        <section className="border-t border-[#edf0f5] pt-5">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#657089]">Request</h3>

          <dl className="mt-3 space-y-2 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-[#657089]">Service</dt>
              <dd className="font-semibold text-[#071638]">{formatLabel(request.service)}</dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-[#657089]">When</dt>
              <dd className="font-semibold text-[#071638]">{formatLabel(request.time_needed)}</dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-[#657089]">Details</dt>
              <dd className="max-w-[190px] text-right font-semibold text-[#071638]">{request.details || "No details"}</dd>
            </div>
          </dl>
        </section>

        <section className="border-t border-[#edf0f5] pt-5">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#657089]">Cleaner message</h3>
          <textarea
            id={`cleaner-message-${request.id}`}
            readOnly
            value={cleanerRequestMessage(request)}
            className="mt-3 h-[150px] w-full resize-none rounded-xl border border-[#dfe5ee] bg-[#fbfcfd] px-3 py-3 text-[12px] font-medium leading-[1.45] text-[#071638] outline-none"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="h-9 rounded-xl bg-[#071638] px-3 text-[12px] font-bold text-white"
              dangerouslySetInnerHTML={{
                __html: `<span onclick="navigator.clipboard.writeText(document.getElementById('cleaner-message-${request.id}').value); this.textContent='Copied'; setTimeout(() => this.textContent='Copy text', 1200);">Copy text</span>`,
              }}
            />
            <a
              target="_blank"
              href={`https://wa.me/?text=${encodeURIComponent(cleanerRequestMessage(request))}`}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-[#08783f] px-3 text-[12px] font-bold text-white"
            >
              WhatsApp draft
            </a>
          </div>
        </section>

        <section className="border-t border-[#edf0f5] pt-5">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#657089]">Match</h3>

          {matchedBusiness ? (
            <p className="mt-3 rounded-xl bg-[#f1faf3] px-3 py-2 text-[13px] font-bold text-[#08783f]">{matchedBusiness.business_name}</p>
          ) : null}

          <div className="mt-3">
            <MatchBusinessForm request={request} businesses={businesses} />
          </div>
        </section>

        <section className="border-t border-[#edf0f5] pt-5">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#657089]">Status</h3>

          <div className="mt-3 flex flex-wrap gap-2">
            <SmallStatusForm id={request.id} status="contacted" label="Contacted" tone="blue" />
            <SmallStatusForm id={request.id} status="matched" label="Matched" tone="green" />
            <SmallStatusForm id={request.id} status="completed" label="Done" />
          </div>
        </section>

        <section className="border-t border-[#edf0f5] pt-5">
          <form action={deleteRequest}>
            <input type="hidden" name="id" value={request.id} />
            <button type="submit" className="h-9 rounded-xl border border-[#fecaca] bg-white px-4 text-[13px] font-bold text-[#dc2626]">
              Delete request
            </button>
          </form>
        </section>
      </div>
    </aside>
  );
}

function RequestsTable({ requests, selectedId }: { requests: RequestRow[]; selectedId?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e1e6ee] bg-white shadow-[0_10px_28px_rgba(7,22,56,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead className="border-b border-[#edf0f5] bg-[#fbfcfd] text-[11px] font-bold uppercase tracking-[0.06em] text-[#657089]">
            <tr>
              <th className="px-4 py-3">View</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#edf0f5]">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[14px] font-semibold text-[#657089]">
                  No matching requests.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr
                  key={request.id}
                  className={`h-[60px] text-[13px] text-[#071638] ${request.status === "new" ? "bg-[#f0fdf4]" : "bg-white"} ${
                    selectedId === request.id ? "outline outline-2 outline-[#08783f]/25" : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3 align-middle">
                    <a
                      href={`/qk-ops-7f3a?tab=requests&selected=${request.id}`}
                      className="inline-flex h-8 items-center rounded-lg bg-[#071638] px-3 text-[12px] font-bold text-white hover:bg-[#0d214d]"
                    >
                      View
                    </a>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 align-middle font-semibold">
                    {formatTime(request.created_at)}
                    <p className="text-[11px] font-medium text-[#657089]">{formatDate(request.created_at).split(",")[0]}</p>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <StatusBadge status={request.status} />
                  </td>

                  <td className="px-4 py-3 align-middle font-bold">{formatLabel(request.service)}</td>
                  <td className="px-4 py-3 align-middle font-medium text-[#44506a]">{formatLabel(request.area)}</td>

                  <td className="px-4 py-3 align-middle">
                    <p className="font-bold">{request.email || "No email"}</p>
                    {request.phone ? <p className="text-[12px] font-medium text-[#657089]">{request.phone}</p> : null}
                  </td>

                  <td className="max-w-[180px] px-4 py-3 align-middle text-[#44506a]">
                    <p className="truncate">{request.details || formatLabel(request.time_needed)}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequestsView({
  requests,
  businesses,
  service,
  area,
  status,
  q,
  allRequests,
  selectedId,
}: {
  requests: RequestRow[];
  businesses: BusinessRow[];
  service: string;
  area: string;
  status: string;
  q: string;
  allRequests: RequestRow[];
  selectedId?: string;
}) {
  const serviceOptions = uniqueValues(allRequests.map((request) => request.service));
  const areaOptions = uniqueValues(allRequests.map((request) => request.area));
  const statusOptions = ["new", "contacted", "matched", "completed", "cancelled"];
  const selectedRequest = selectedId
    ? requests.find((request) => request.id === selectedId) || allRequests.find((request) => request.id === selectedId) || null
    : null;

  return (
    <div className="relative flex gap-5">
      <section className={`min-w-0 flex-1 space-y-4 ${selectedRequest ? "xl:pr-[390px]" : ""}`}>
        <FilterBar
          tab="requests"
          service={service}
          area={area}
          status={status}
          q={q}
          serviceOptions={serviceOptions}
          areaOptions={areaOptions}
          statusOptions={statusOptions}
        />

        <RequestsTable requests={requests} selectedId={selectedRequest?.id} />
      </section>

      <RequestDetailsPanel request={selectedRequest} businesses={businesses} />
    </div>
  );
}

function BusinessesView({
  businesses,
  service,
  area,
  q,
  allBusinesses,
}: {
  businesses: BusinessRow[];
  service: string;
  area: string;
  q: string;
  allBusinesses: BusinessRow[];
}) {
  const cleaningBusinesses = allBusinesses.filter(isCleaningBusiness);
  const serviceOptions = uniqueValues(cleaningBusinesses.map((business) => business.category));
  const areaOptions = uniqueValues(cleaningBusinesses.flatMap((business) => business.areas || []));

  return (
    <section className="space-y-4">
      <FilterBar tab="businesses" service={service} area={area} q={q} serviceOptions={serviceOptions} areaOptions={areaOptions} />

      <div className="overflow-hidden rounded-2xl border border-[#e1e6ee] bg-white shadow-[0_10px_28px_rgba(7,22,56,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-b border-[#edf0f5] bg-[#fbfcfd] text-[11px] font-bold uppercase tracking-[0.06em] text-[#657089]">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Areas</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#edf0f5]">
              {businesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[14px] font-semibold text-[#657089]">
                    No matching business profiles.
                  </td>
                </tr>
              ) : (
                businesses.map((business) => (
                  <tr key={business.id} className="h-[60px] text-[13px] text-[#071638]">
                    <td className="px-4 py-3">
                      <p className="font-bold">{business.business_name}</p>
                      <a
                        className="text-[12px] font-semibold text-[#08783f]"
                        target="_blank"
                        href={whatsappLink(business.whatsapp, `Hi, this is Quickola. Thanks for creating your free business profile.`)}
                      >
                        {business.whatsapp}
                      </a>
                    </td>

                    <td className="px-4 py-3 font-medium">{formatLabel(business.category)}</td>

                    <td className="max-w-[300px] px-4 py-3 text-[#657089]">
                      <p className="truncate">{business.areas?.map(formatLabel).join(", ") || "—"}</p>
                    </td>

                    <td className="px-4 py-3">{business.starting_price ? `£${business.starting_price}` : "—"}</td>

                    <td className="px-4 py-3">
                      <StatusBadge status={business.status} />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <form action={updateBusinessStatus}>
                          <input type="hidden" name="id" value={business.id} />
                          <input type="hidden" name="status" value="approved" />
                          <button className="h-8 rounded-lg bg-[#08783f] px-3 text-[12px] font-bold text-white">Approve</button>
                        </form>

                        <form action={updateBusinessStatus}>
                          <input type="hidden" name="id" value={business.id} />
                          <input type="hidden" name="status" value="rejected" />
                          <button className="h-8 rounded-lg bg-[#fff4d8] px-3 text-[12px] font-bold text-[#b77900]">Reject</button>
                        </form>

                        <form action={deleteBusiness}>
                          <input type="hidden" name="id" value={business.id} />
                          <button className="h-8 rounded-lg border border-[#fecaca] bg-white px-3 text-[12px] font-bold text-[#dc2626]">Delete</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

async function getAdminData() {
  const [requestsResult, businessesResult] = await Promise.all([
    supabase
      .from("requests")
      .select("id, service, area, time_needed, details, phone, email, status, created_at, completed_at, matched_business_id, admin_notes")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("businesses")
      .select("id, business_name, category, whatsapp, starting_price, areas, availability, profile_slug, description, status, created_at, approved_at, rejected_at, completed_jobs, internal_notes")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (requestsResult.error) console.error("Failed to load requests:", requestsResult.error);
  if (businessesResult.error) console.error("Failed to load businesses:", businessesResult.error);

  return {
    requests: (requestsResult.data || []) as RequestRow[],
    businesses: (businessesResult.data || []) as BusinessRow[],
  };
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;

  const activeTab = params?.tab === "businesses" ? "businesses" : "requests";
  const activeService = params?.service || "";
  const activeArea = params?.area || "";
  const activeStatus = params?.status || "";
  const selectedId = params?.selected || "";
  const activeSearch = (params?.q || "").trim().toLowerCase();

  const { requests, businesses } = await getAdminData();

  const filteredRequests = requests.filter((request) => {
    const serviceMatch = activeService ? request.service === activeService : true;
    const areaMatch = activeArea ? request.area === activeArea : true;
    const statusMatch = activeStatus ? request.status === activeStatus : request.status !== "completed";
    const searchTarget = `${request.email || ""} ${request.phone || ""} ${request.service || ""} ${request.area || ""} ${request.details || ""}`.toLowerCase();
    const searchMatch = activeSearch ? searchTarget.includes(activeSearch) : true;

    return serviceMatch && areaMatch && statusMatch && searchMatch;
  });

  const filteredBusinesses = businesses.filter((business) => {
    const cleaningMatch = isCleaningBusiness(business);
    const serviceMatch = activeService ? business.category === activeService : true;
    const areaMatch = activeArea ? business.areas?.includes(activeArea) : true;
    const searchTarget = `${business.business_name || ""} ${business.whatsapp || ""} ${business.category || ""} ${(business.areas || []).join(" ")}`.toLowerCase();
    const searchMatch = activeSearch ? searchTarget.includes(activeSearch) : true;

    return cleaningMatch && serviceMatch && areaMatch && searchMatch;
  });

  const today = new Date().toDateString();

  const todayCount = requests.filter((request) => new Date(request.created_at).toDateString() === today).length;
  const newCount = requests.filter((request) => request.status === "new").length;
  const contactedCount = requests.filter((request) => request.status === "contacted").length;
  const matchedCount = requests.filter((request) => request.status === "matched").length;
  const completedCount = requests.filter((request) => request.status === "completed").length;
  const cleaningBusinessCount = businesses.filter(isCleaningBusiness).length;

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <div className="flex min-h-screen">
        <Sidebar
          activeTab={activeTab}
          activeStatus={activeStatus}
          requestCount={requests.length}
          businessCount={cleaningBusinessCount}
          newCount={newCount}
          contactedCount={contactedCount}
          matchedCount={matchedCount}
          completedCount={completedCount}
        />

        <div className="min-w-0 flex-1">
          <TopBar
            activeTab={activeTab}
            requestCount={requests.length}
            businessCount={cleaningBusinessCount}
            newCount={newCount}
            todayCount={todayCount}
          />

          <div className="px-4 py-4 lg:px-6">
            {activeTab === "requests" ? (
              <RequestsView
                requests={filteredRequests}
                allRequests={requests}
                businesses={businesses.filter(isCleaningBusiness)}
                service={activeService}
                area={activeArea}
                status={activeStatus}
                q={activeSearch}
                selectedId={selectedId}
              />
            ) : (
              <BusinessesView
                businesses={filteredBusinesses}
                allBusinesses={businesses}
                service={activeService}
                area={activeArea}
                q={activeSearch}
              />
            )}
          </div>
        </div>
      </div>

    </main>
  );
}