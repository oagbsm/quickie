import { supabase } from "@/lib/supabase";
import {
  createAdminRequest,
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

function formatLabel(value: string | null | undefined) {
  if (!value) return "—";
  return value
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function whatsappLink(phone: string | null | undefined, message: string) {
  if (!phone) return "#";
  const cleaned = phone.replace(/[^0-9]/g, "");
  const ukNumber = cleaned.startsWith("0") ? `44${cleaned.slice(1)}` : cleaned;
  return `https://wa.me/${ukNumber}?text=${encodeURIComponent(message)}`;
}

function statusClass(status: string) {
  if (status === "new") return "bg-[#dcfce7] text-[#08783f] ring-1 ring-[#86efac]";
  if (status === "contacted" || status === "pending") return "bg-[#fff4d8] text-[#b77900]";
  if (status === "matched" || status === "approved" || status === "completed") return "bg-[#ecfdf3] text-[#08783f]";
  if (status === "rejected" || status === "cancelled") return "bg-[#fee2e2] text-[#dc2626]";
  return "bg-[#f4f6f9] text-[#657089]";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-extrabold ${statusClass(status)}`}>
      {status === "completed" ? "Done" : formatLabel(status)}
    </span>
  );
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean).map((value) => String(value)))).sort((a, b) =>
    formatLabel(a).localeCompare(formatLabel(b))
  );
}

function FilterBar({
  tab,
  service,
  area,
  status = "",
  serviceOptions,
  areaOptions,
  statusOptions = [],
}: {
  tab: "requests" | "businesses";
  service: string;
  area: string;
  status?: string;
  serviceOptions: string[];
  areaOptions: string[];
  statusOptions?: string[];
}) {
  return (
    <form className="rounded-[22px] border border-[#e1e6ee] bg-white p-4 shadow-[0_12px_32px_rgba(7,22,56,0.05)] sm:p-5">
      <input type="hidden" name="tab" value={tab} />
      <div className={`grid gap-3 ${tab === "requests" ? "sm:grid-cols-[1fr_1fr_1fr_auto]" : "sm:grid-cols-[1fr_1fr_auto]"}`}>
        <label className="block">
          <span className="mb-2 block text-[13px] font-extrabold text-[#657089]">Service</span>
          <select
            name="service"
            defaultValue={service}
            className="h-12 w-full rounded-xl border border-[#dfe5ee] bg-white px-4 text-[14px] font-bold text-[#071638] outline-none"
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
          <span className="mb-2 block text-[13px] font-extrabold text-[#657089]">Area</span>
          <select
            name="area"
            defaultValue={area}
            className="h-12 w-full rounded-xl border border-[#dfe5ee] bg-white px-4 text-[14px] font-bold text-[#071638] outline-none"
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
            <span className="mb-2 block text-[13px] font-extrabold text-[#657089]">Action</span>
            <select
              name="status"
              defaultValue={status}
              className="h-12 w-full rounded-xl border border-[#dfe5ee] bg-white px-4 text-[14px] font-bold text-[#071638] outline-none"
            >
              <option value="">All actions</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "completed" ? "Done" : formatLabel(option)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="flex items-end gap-2">
          <button type="submit" className="h-12 rounded-xl bg-[#071638] px-5 text-[14px] font-extrabold text-white">
            Filter
          </button>
          <a href={`/admin?tab=${tab}`} className="inline-flex h-12 items-center rounded-xl border border-[#dfe5ee] bg-white px-5 text-[14px] font-extrabold text-[#071638]">
            Reset
          </a>
        </div>
      </div>
    </form>
  );
}

function Logo() {
  return (
    <a href="/admin" className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#08783f] text-white shadow-[0_12px_24px_rgba(0,104,47,0.2)]">
        Q
      </span>
      <span className="text-[30px] font-extrabold tracking-[-0.035em] text-[#071638]">Quickola</span>
    </a>
  );
}

function TabLink({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <a
      href={href}
      className={`flex min-h-[64px] flex-1 items-center justify-center gap-3 rounded-[18px] px-5 text-[18px] font-extrabold transition ${
        active
          ? "bg-[#071638] text-white shadow-[0_18px_45px_rgba(7,22,56,0.18)]"
          : "bg-white text-[#071638] ring-1 ring-[#e1e6ee] hover:bg-[#f8fafc]"
      }`}
    >
      {label}
      <span className={`rounded-full px-3 py-1 text-[13px] font-extrabold ${active ? "bg-white/15 text-white" : "bg-[#f1faf3] text-[#08783f]"}`}>
        {count}
      </span>
    </a>
  );
}

function ActionButton({
  label,
  action,
  id,
  status,
  tone = "dark",
}: {
  label: string;
  action: (formData: FormData) => Promise<void>;
  id: string;
  status?: string;
  tone?: "dark" | "green" | "red" | "amber";
}) {
  const toneClass = {
    dark: "bg-[#071638] text-white",
    green: "bg-[#08783f] text-white",
    red: "bg-[#dc2626] text-white",
    amber: "bg-[#f59e0b] text-white",
  }[tone];

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {status ? <input type="hidden" name="status" value={status} /> : null}
      <button type="submit" className={`h-10 rounded-xl px-4 text-[13px] font-extrabold ${toneClass}`}>
        {label}
      </button>
    </form>
  );
}

function MatchBusinessForm({ request, businesses }: { request: RequestRow; businesses: BusinessRow[] }) {
  const approvedBusinesses = businesses.filter((business) => business.status === "approved");
  const matchedBusiness = approvedBusinesses.find((business) => business.id === request.matched_business_id);

  if (approvedBusinesses.length === 0) {
    return (
      <div className="rounded-xl bg-[#fff7ed] px-4 py-3 text-[13px] font-bold leading-[1.35] text-[#9a3412]">
        No approved businesses yet
      </div>
    );
  }

  const matchForm = (
    <form action={matchRequestToBusiness} className="min-w-[260px] space-y-2">
      <input type="hidden" name="request_id" value={request.id} />
      <select
        name="business_id"
        defaultValue={request.matched_business_id || ""}
        className="h-10 w-full rounded-xl border border-[#dfe5ee] bg-white px-3 text-[13px] font-bold text-[#071638] outline-none"
        required
      >
        <option value="" disabled>
          Choose approved business
        </option>
        {approvedBusinesses.map((business) => (
          <option key={business.id} value={business.id}>
            {business.business_name} · {formatLabel(business.category)}
          </option>
        ))}
      </select>

      <button type="submit" className="h-10 w-full rounded-xl bg-[#08783f] px-4 text-[13px] font-extrabold text-white">
{matchedBusiness ? "Save and close" : "Match business"}      </button>
    </form>
  );

  if (matchedBusiness) {
    return (
<details key={request.matched_business_id} className="min-w-[260px] rounded-xl bg-[#f1faf3] px-4 py-3 ring-1 ring-[#d8eddd]">        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-extrabold text-[#08783f]">{matchedBusiness.business_name}</p>
            <p className="mt-0.5 text-[12px] font-bold text-[#657089]">{formatLabel(matchedBusiness.category)}</p>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[15px] font-extrabold text-[#071638] shadow-[0_8px_18px_rgba(7,22,56,0.08)] ring-1 ring-[#dfe5ee]">
            ✎
          </span>
        </summary>
        <div className="mt-3 rounded-2xl border border-[#dfe5ee] bg-white p-3 shadow-[0_12px_28px_rgba(7,22,56,0.08)]">
          {matchForm}
        </div>
      </details>
    );
  }

  return matchForm;
}

function AddRequestForm() {
  return (
    <details className="rounded-[22px] border border-[#e1e6ee] bg-white shadow-[0_12px_32px_rgba(7,22,56,0.05)]">
      <summary className="cursor-pointer list-none px-5 py-5 text-[18px] font-extrabold text-[#071638] sm:px-6">
        + Add manual request
      </summary>
      <form action={createAdminRequest} className="grid gap-3 border-t border-[#edf0f5] px-5 pb-5 pt-4 sm:grid-cols-6 sm:px-6">
        <input name="service" placeholder="Service" required className="h-12 rounded-xl border border-[#dfe5ee] px-4 text-[14px] font-bold outline-none" />
        <input name="area" placeholder="Area" required className="h-12 rounded-xl border border-[#dfe5ee] px-4 text-[14px] font-bold outline-none" />
        <input name="email" type="email" placeholder="Email" className="h-12 rounded-xl border border-[#dfe5ee] px-4 text-[14px] font-bold outline-none" />
        <input name="phone" placeholder="Phone optional" className="h-12 rounded-xl border border-[#dfe5ee] px-4 text-[14px] font-bold outline-none" />
        <select name="time_needed" defaultValue="today" className="h-12 rounded-xl border border-[#dfe5ee] px-4 text-[14px] font-bold outline-none">
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="this-week">This week</option>
          <option value="flexible">Flexible</option>
        </select>
        <button className="h-12 rounded-xl bg-[#071638] px-5 text-[14px] font-extrabold text-white" type="submit">Add</button>
        <textarea name="details" placeholder="Details" className="h-[82px] rounded-xl border border-[#dfe5ee] px-4 py-3 text-[14px] font-bold outline-none sm:col-span-6" />
      </form>
    </details>
  );
}

function RequestsView({
  requests,
  businesses,
  service,
  area,
  status,
  allRequests,
}: {
  requests: RequestRow[];
  businesses: BusinessRow[];
  service: string;
  area: string;
  status: string;
  allRequests: RequestRow[];
}) {
  const serviceOptions = uniqueValues(allRequests.map((request) => request.service));
  const areaOptions = uniqueValues(allRequests.map((request) => request.area));
  const statusOptions = ["new", "contacted", "matched", "completed", "cancelled"];

  return (
    <section className="space-y-4">
      <FilterBar
        tab="requests"
        service={service}
        area={area}
        status={status}
        serviceOptions={serviceOptions}
        areaOptions={areaOptions}
        statusOptions={statusOptions}
      />
      <AddRequestForm />

      <div className="overflow-hidden rounded-[24px] border border-[#e1e6ee] bg-white shadow-[0_14px_40px_rgba(7,22,56,0.06)]">
        <div className="flex flex-col gap-3 border-b border-[#edf0f5] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-[24px] font-extrabold tracking-[-0.03em] text-[#071638]">Customer Requests</h2>
            <p className="mt-1 text-[14px] font-semibold text-[#657089]">Manage jobs, match approved businesses, contact customers and close completed work.</p>
          </div>
          <div className="rounded-full bg-[#f1faf3] px-4 py-2 text-[14px] font-extrabold text-[#08783f]">
            {requests.filter((item) => item.status === "new").length} new
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-left">
            <thead className="bg-[#fbfcfd] text-[12px] font-extrabold uppercase tracking-[0.07em] text-[#657089]">
              <tr>
                <th className="px-6 py-4">Request</th>
                <th className="px-6 py-4">Area</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Match</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f5]">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-[16px] font-bold text-[#657089]">No matching requests.</td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.id}
                    className={`align-top text-[15px] font-semibold text-[#071638] ${
                      request.status === "new" ? "animate-pulse bg-[#bbf7d0]" : ""
                    }`}
                  >
                    <td className="px-6 py-5">
                      <p className="text-[16px] font-extrabold">{formatLabel(request.service)}</p>
                      <p className="mt-1 text-[13px] text-[#657089]">Needed: {formatLabel(request.time_needed)}</p>
                    </td>
                    <td className="px-6 py-5">{formatLabel(request.area)}</td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        {request.email ? (
                          <a className="block font-extrabold text-[#071638] hover:text-[#08783f]" href={`mailto:${request.email}`}>
                            {request.email}
                          </a>
                        ) : (
                          <p className="font-extrabold text-[#8b94a7]">No email</p>
                        )}

                        {request.phone ? (
                          <a
                            className="block text-[13px] font-extrabold text-[#08783f]"
                            target="_blank"
                            href={whatsappLink(request.phone, `Hi, this is Quickola. We received your request for ${formatLabel(request.service)} in ${formatLabel(request.area)}.`)}
                          >
                            {request.phone}
                          </a>
                        ) : (
                          <p className="text-[13px] font-semibold text-[#8b94a7]">Phone optional</p>
                        )}
                      </div>
                    </td>
                    <td className="max-w-[320px] px-6 py-5 text-[#657089]">{request.details || "No details"}</td>
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <StatusBadge status={request.status} />
                        {request.completed_at ? (
                          <p className="text-[12px] font-bold text-[#08783f]">Completed {formatDate(request.completed_at)}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <MatchBusinessForm request={request} businesses={businesses} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-[#657089]">{formatDate(request.created_at)}</td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        <ActionButton label="Contacted" tone="amber" action={updateRequestStatus} id={request.id} status="contacted" />
                        <ActionButton label="Matched" tone="green" action={updateRequestStatus} id={request.id} status="matched" />
                        <ActionButton label="Done" tone="dark" action={updateRequestStatus} id={request.id} status="completed" />
                        <ActionButton label="Delete" tone="red" action={deleteRequest} id={request.id} />
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

function BusinessesView({
  businesses,
  service,
  area,
  allBusinesses,
}: {
  businesses: BusinessRow[];
  service: string;
  area: string;
  allBusinesses: BusinessRow[];
}) {
  const serviceOptions = uniqueValues(allBusinesses.map((business) => business.category));
  const areaOptions = uniqueValues(allBusinesses.flatMap((business) => business.areas || []));

  return (
    <section className="space-y-4">
      <FilterBar
        tab="businesses"
        service={service}
        area={area}
        serviceOptions={serviceOptions}
        areaOptions={areaOptions}
      />

      <div className="overflow-hidden rounded-[24px] border border-[#e1e6ee] bg-white shadow-[0_14px_40px_rgba(7,22,56,0.06)]">
        <div className="flex flex-col gap-3 border-b border-[#edf0f5] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-[24px] font-extrabold tracking-[-0.03em] text-[#071638]">Business Profiles</h2>
            <p className="mt-1 text-[14px] font-semibold text-[#657089]">Approve, reject or delete business profiles from one clean table.</p>
          </div>
          <a href="/for-businesses" className="inline-flex h-11 items-center justify-center rounded-xl bg-[#071638] px-5 text-[14px] font-extrabold text-white">
            + Add business
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px] text-left">
            <thead className="bg-[#fbfcfd] text-[12px] font-extrabold uppercase tracking-[0.07em] text-[#657089]">
              <tr>
                <th className="px-6 py-4">Business</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Areas</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Availability</th>
                <th className="px-6 py-4">Jobs</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f5]">
              {businesses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-[16px] font-bold text-[#657089]">No matching business profiles.</td>
                </tr>
              ) : (
                businesses.map((business) => (
                  <tr key={business.id} className="align-top text-[15px] font-semibold text-[#071638]">
                    <td className="px-6 py-5">
                      <p className="text-[16px] font-extrabold">{business.business_name}</p>
                      <a className="mt-1 block text-[13px] font-extrabold text-[#08783f]" target="_blank" href={whatsappLink(business.whatsapp, `Hi, this is Quickola. Thanks for creating your free business profile.`)}>{business.whatsapp}</a>
                    </td>
                    <td className="px-6 py-5">{formatLabel(business.category)}</td>
                    <td className="max-w-[300px] px-6 py-5 text-[#657089]">{business.areas?.map(formatLabel).join(", ") || "—"}</td>
                    <td className="px-6 py-5">{business.starting_price ? `£${business.starting_price}` : "—"}</td>
                    <td className="px-6 py-5">{formatLabel(business.availability)}</td>
                    <td className="px-6 py-5">
                      <span className="rounded-full bg-[#f1faf3] px-3 py-1 text-[12px] font-extrabold text-[#08783f]">
                        {business.completed_jobs || 0} completed
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <StatusBadge status={business.status} />
                        {business.approved_at ? (
                          <p className="text-[12px] font-bold text-[#08783f]">Approved {formatDate(business.approved_at)}</p>
                        ) : null}
                        {business.rejected_at ? (
                          <p className="text-[12px] font-bold text-[#dc2626]">Rejected {formatDate(business.rejected_at)}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-[#657089]">{formatDate(business.created_at)}</td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        <ActionButton label="Approve" tone="green" action={updateBusinessStatus} id={business.id} status="approved" />
                        <ActionButton label="Reject" tone="amber" action={updateBusinessStatus} id={business.id} status="rejected" />
                        <ActionButton label="Delete" tone="red" action={deleteBusiness} id={business.id} />
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
      .limit(500),
    supabase
      .from("businesses")
      .select("id, business_name, category, whatsapp, starting_price, areas, availability, profile_slug, description, status, created_at, approved_at, rejected_at, completed_jobs, internal_notes")
      .order("created_at", { ascending: false })
      .limit(500),
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
  const { requests, businesses } = await getAdminData();

  const filteredRequests = requests.filter((request) => {
    const serviceMatch = activeService ? request.service === activeService : true;
    const areaMatch = activeArea ? request.area === activeArea : true;
    const statusMatch = activeStatus ? request.status === activeStatus : true;
    return serviceMatch && areaMatch && statusMatch;
  });

  const filteredBusinesses = businesses.filter((business) => {
    const serviceMatch = activeService ? business.category === activeService : true;
    const areaMatch = activeArea ? business.areas?.includes(activeArea) : true;
    return serviceMatch && areaMatch;
  });

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <header className="border-b border-[#e1e6ee] bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-5 py-5 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Logo />
            <a href="/" className="inline-flex h-11 items-center justify-center rounded-xl border border-[#dfe5ee] bg-white px-5 text-[14px] font-extrabold text-[#071638]">
              Back home
            </a>
          </div>

          <div>
            <h1 className="text-[34px] font-extrabold leading-none tracking-[-0.04em] text-[#071638] sm:text-[44px]">
              Admin
            </h1>
            <p className="mt-2 max-w-[760px] text-[16px] font-semibold leading-[1.5] text-[#657089]">
              Simple admin for requests and business profiles. No clutter, no tiny controls.
            </p>
          </div>

          <nav className="grid gap-3 sm:grid-cols-2">
            <TabLink href="/admin?tab=requests" active={activeTab === "requests"} label="Requests" count={requests.length} />
            <TabLink href="/admin?tab=businesses" active={activeTab === "businesses"} label="Businesses" count={businesses.length} />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 lg:px-10">
        {activeTab === "requests" ? (
          <RequestsView
            requests={filteredRequests}
            allRequests={requests}
            businesses={businesses}
            service={activeService}
            area={activeArea}
            status={activeStatus}
          />
        ) : (
          <BusinessesView
            businesses={filteredBusinesses}
            allBusinesses={businesses}
            service={activeService}
            area={activeArea}
          />
        )}
      </div>
    </main>
  );
}