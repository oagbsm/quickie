import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";;
import {
  matchRequestToBusiness,
  updateRequestStatus,
} from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminStatus = "new" | "taken" | "done" | "cancelled";

type AdminPageProps = {
  searchParams?: Promise<{
    status?: string;
    q?: string;
    service?: string;
  }>;
};

type RequestRow = {
  id: string;
  service: string | null;
  area: string | null;
  postcode: string | null;
  time_needed: string | null;
  details: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
  matched_business_id: string | null;
  admin_notes: string | null;
  customer_budget: string | null;
  budget_note: string | null;
};

type BusinessRow = {
  id: string;
  business_name: string | null;
  category: string | null;
  whatsapp: string | null;
  phone: string | null;
  areas: string[] | null;
  status: string | null;
  active: boolean | null;
};

type RequestMatchRow = {
  id: string;
  request_id: string | null;
  business_id: string | null;
  status: string | null;
  accepted_at: string | null;
  selected_at: string | null;
  completed_at: string | null;
  created_at: string | null;
};

const tabs: { key: AdminStatus; label: string }[] = [
  { key: "new", label: "New" },
  { key: "taken", label: "Taken" },
  { key: "done", label: "Done" },
  { key: "cancelled", label: "Cancelled" },
];

const maxCategoryOptions = 10;

const normaliseStatus = (status: string | null | undefined): AdminStatus => {
  const value = String(status || "new").toLowerCase();

  if (["done", "completed", "complete"].includes(value)) return "done";
  if (["cancelled", "canceled", "cancel"].includes(value)) return "cancelled";
  if (["taken", "assigned", "matched", "contacted", "booked"].includes(value)) return "taken";

  return "new";
};

const serviceLabel = (value: string | null | undefined) =>
  String(value || "Service")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const shortDate = (value: string | null | undefined) => {
  if (!value) return "No time";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const phoneHref = (phone: string | null | undefined) => {
  const clean = String(phone || "").replace(/[^+\d]/g, "");
  return clean ? `tel:${clean}` : "#";
};

const whatsappHref = (phone: string | null | undefined) => {
  const clean = String(phone || "").replace(/[^\d]/g, "");
  if (!clean) return "#";
  const withCountry = clean.startsWith("0") ? `44${clean.slice(1)}` : clean;
  return `https://wa.me/${withCountry}`;
};

async function getAdminData() {
  const [requestsResult, businessesResult, matchesResult] = await Promise.all([
    supabase
      .from("requests")
      .select(
        "id, service, area, postcode, time_needed, details, phone, email, status, created_at, updated_at, completed_at, matched_business_id, admin_notes, customer_budget, budget_note"
      )
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("businesses")
      .select("id, business_name, category, whatsapp, phone, areas, status, active")
      .order("business_name", { ascending: true })
      .limit(300),
    supabase
      .from("request_matches")
      .select("id, request_id, business_id, status, accepted_at, selected_at, completed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  if (requestsResult.error) console.error("Failed to load requests:", requestsResult.error);
  if (businessesResult.error) console.error("Failed to load businesses:", businessesResult.error);
  if (matchesResult.error) console.error("Failed to load request matches:", matchesResult.error);

  return {
    requests: (requestsResult.data || []) as RequestRow[],
    businesses: (businessesResult.data || []) as BusinessRow[],
    requestMatches: (matchesResult.data || []) as RequestMatchRow[],
  };
}

async function setRequestStatus(formData: FormData) {
  "use server";

  const id = String(formData.get("request_id") || "");
  const status = String(formData.get("status") || "new");

  if (!id) return;

  const nextFormData = new FormData();
  nextFormData.set("id", id);
  nextFormData.set("status", status);

  await updateRequestStatus(nextFormData);
}

async function assignProvider(formData: FormData) {
  "use server";

  const requestId = String(formData.get("request_id") || "");
  let businessId = String(formData.get("business_id") || "").trim();
  const providerQuery = String(formData.get("provider_query") || "").trim().toLowerCase();

  if (!requestId) return;

  if (!businessId && providerQuery) {
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id, business_name, category, whatsapp, phone, active")
      .limit(500);

    const matchedBusiness = (businesses || []).find((business) => {
      if (business.active === false) return false;

      const providerName = String(business.business_name || "").toLowerCase();
      const providerCategory = String(business.category || "").toLowerCase();
      const providerPhone = String(business.whatsapp || business.phone || "").toLowerCase();
      const providerSearchText = `${providerName} ${providerCategory} ${providerPhone}`;

      return (
        providerName === providerQuery ||
        providerPhone === providerQuery ||
        providerSearchText.includes(providerQuery)
      );
    });

    businessId = matchedBusiness?.id || "";
  }

  if (!businessId) return;

  formData.set("business_id", businessId);

  await matchRequestToBusiness(formData);

  const nextFormData = new FormData();
  nextFormData.set("id", requestId);
  nextFormData.set("status", "taken");

  await updateRequestStatus(nextFormData);
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("quickola_admin")?.value === "true";

  if (!isAdmin) {
    redirect("/qk-ops-7f3a-login?next=/qk-ops-7f3a");
  }

  const params = (await searchParams) || {};
  const activeStatus = normaliseStatus(params.status);
  const activeSearch = String(params.q || "").trim().toLowerCase();
  const activeService = String(params.service || "").trim();

  const { requests, businesses, requestMatches } = await getAdminData();

  const assignableBusinesses = businesses.filter((business) => business.active !== false);
  const providerById = new Map(assignableBusinesses.map((business) => [business.id, business]));
  const latestMatchByRequestId = new Map<string, RequestMatchRow>();

  for (const match of requestMatches) {
    if (!match.request_id) continue;
    if (!latestMatchByRequestId.has(match.request_id)) {
      latestMatchByRequestId.set(match.request_id, match);
    }
  }

  const phoneRequests = requests.filter(
    (request) => String(request.phone || "").replace(/[^\d]/g, "").length >= 7
  );

  const counts = tabs.reduce(
    (total, tab) => ({
      ...total,
      [tab.key]: phoneRequests.filter((request) => normaliseStatus(request.status) === tab.key).length,
    }),
    {} as Record<AdminStatus, number>
  );

  const serviceCounts = requests.reduce((map, request) => {
    if (!request.service) return map;
    map.set(request.service, (map.get(request.service) || 0) + 1);
    return map;
  }, new Map<string, number>());

  const serviceOptions = Array.from(serviceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCategoryOptions)
    .map(([service]) => service);

  const visibleRequests = requests.filter((request) => {
    const hasPhone = String(request.phone || "").replace(/[^\d]/g, "").length >= 7;
    if (!hasPhone) return false;

    const statusMatch = normaliseStatus(request.status) === activeStatus;
    const serviceMatch = !activeService || request.service === activeService;
    const searchText = [
      request.service,
      request.area,
      request.postcode,
      request.phone,
      request.email,
      request.details,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const searchMatch = !activeSearch || searchText.includes(activeSearch);

    return statusMatch && serviceMatch && searchMatch;
  });

  return (
    <main className="min-h-screen bg-slate-100 px-2 py-3 text-slate-950 sm:px-4 lg:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <header className="rounded-3xl bg-slate-950 px-4 py-4 text-white shadow-sm sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Quickola Ops</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">Jobs</h1>
              <p className="mt-1 text-xs font-bold text-slate-300">New → Taken → Done. Failed jobs go Cancelled.</p>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/10 px-3 py-2 text-center">
              <p className="text-xl font-black leading-none">{phoneRequests.length}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-300">Total</p>
            </div>
          </div>
        </header>

        <nav className="sticky top-2 z-20 grid grid-cols-4 gap-1 rounded-2xl bg-white/95 p-1.5 shadow-sm ring-1 ring-slate-200 backdrop-blur">
          {tabs.map((tab) => {
            const isActive = activeStatus === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/qk-ops-7f3a?status=${tab.key}`}
                className={`rounded-xl px-1.5 py-2 text-center text-[11px] font-black sm:text-sm ${
                  isActive ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="block">{tab.label}</span>
                <span className={`mt-0.5 block text-base ${isActive ? "text-emerald-300" : "text-slate-950"}`}>
                  {counts[tab.key] || 0}
                </span>
              </Link>
            );
          })}
        </nav>

        <form className="grid gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200 sm:grid-cols-[1fr_180px_auto]">
          <input type="hidden" name="status" value={activeStatus} />
          <input
            name="q"
            defaultValue={params.q || ""}
            placeholder="Search phone, postcode, service..."
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-slate-400 focus:bg-white"
          />
          <select
            name="service"
            defaultValue={activeService}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-slate-400 focus:bg-white"
          >
            <option value="">Top 10 categories</option>
            {serviceOptions.map((service) => (
              <option key={service} value={service}>
                {serviceLabel(service)}
              </option>
            ))}
          </select>
          <button className="h-11 rounded-xl bg-slate-950 px-4 text-sm font-black text-white">
            Filter
          </button>
        </form>

        <section className="grid gap-1.5">
          {visibleRequests.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-lg font-black text-slate-950">No {activeStatus} jobs</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Nothing to do in this tab right now.</p>
            </div>
          ) : (
            visibleRequests.map((request) => {
              const match = latestMatchByRequestId.get(request.id);
              const provider = request.matched_business_id
                ? providerById.get(request.matched_business_id)
                : match?.business_id
                  ? providerById.get(match.business_id)
                  : null;
              const currentStatus = normaliseStatus(request.status);

              return (
                <article
                  key={request.id}
                  className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="grid gap-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[12px] leading-4">
                          <span className="text-[13px] font-black uppercase tracking-tight text-slate-950">
                            {serviceLabel(request.service)}
                          </span>
                          <span className="font-black text-slate-400">•</span>
                          <span className="font-black text-blue-700">
                            {request.time_needed || "Time not given"}
                          </span>
                          <span className="font-black text-slate-400">•</span>
                          <span className="font-black text-slate-700">
                            {request.postcode || request.area || "No area"}
                          </span>
                          <span className="font-black text-slate-400">•</span>
                          <span className="font-black text-slate-700">
                            {request.phone || "No phone"}
                          </span>
                        </div>

                        <span className="shrink-0 rounded-full bg-slate-950 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white">
                          {currentStatus}
                        </span>
                      </div>

                      <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[10px] font-bold leading-3 text-slate-500">
                        <span>{shortDate(request.created_at)}</span>
                        <span>•</span>
                        <span className="truncate">{provider?.business_name || "No provider yet"}</span>
                      </div>

                      <details className="group mt-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 open:bg-white open:shadow-sm">
                        <summary className="cursor-pointer list-none text-[10px] font-black uppercase tracking-wide text-blue-700 marker:hidden">
                          <span className="group-open:hidden">Tap for details</span>
                          <span className="hidden group-open:inline">Close details</span>
                        </summary>
                        <div className="mt-2 grid gap-1.5 text-[11px] font-bold leading-4 text-slate-700">
                          <p className="whitespace-pre-line rounded-md bg-white p-2 text-slate-900 ring-1 ring-slate-100">
                            {request.details || "No description saved."}
                          </p>
                          <div className="grid gap-1 sm:grid-cols-2">
                            <p><span className="font-black text-slate-950">Request:</span> {request.id}</p>
                            <p><span className="font-black text-slate-950">Email:</span> {request.email || "Not given"}</p>
                            <p><span className="font-black text-slate-950">Budget:</span> {request.customer_budget || "Not given"}</p>
                            <p><span className="font-black text-slate-950">Budget note:</span> {request.budget_note || "Not given"}</p>
                            <p><span className="font-black text-slate-950">Admin notes:</span> {request.admin_notes || "None"}</p>
                            <p><span className="font-black text-slate-950">Updated:</span> {shortDate(request.updated_at)}</p>
                          </div>
                        </div>
                      </details>
                    </div>

                    <div className="grid gap-1">
                      <div className="grid grid-cols-3 gap-1">
                        <a
                          href={phoneHref(request.phone)}
                          className="rounded-md bg-slate-100 px-1.5 py-1 text-center text-[10px] font-black text-slate-900"
                        >
                          Call
                        </a>
                        <a
                          href={whatsappHref(request.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md bg-emerald-600 px-1.5 py-1 text-center text-[10px] font-black text-white"
                        >
                          WA
                        </a>
                        {currentStatus !== "cancelled" && currentStatus !== "done" ? (
                          <form action={setRequestStatus}>
                            <input type="hidden" name="request_id" value={request.id} />
                            <input type="hidden" name="status" value="cancelled" />
                            <button className="h-full w-full rounded-md bg-red-50 px-1.5 py-1 text-[10px] font-black text-red-700">
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <span className="rounded-md bg-slate-50 px-1.5 py-1 text-center text-[10px] font-black text-slate-400">
                            —
                          </span>
                        )}
                      </div>

                      {currentStatus === "new" ? (
                        <form action={assignProvider} className="grid grid-cols-[minmax(0,1fr)_44px] gap-1">
                          <input type="hidden" name="request_id" value={request.id} />
                          <input
                            name="provider_query"
                            list={`providers-${request.id}`}
                            required
                            placeholder="Type provider..."
                            className="h-7 min-w-0 w-full rounded-md border border-slate-200 bg-white px-1.5 text-[10px] font-bold outline-none focus:border-blue-500"
                          />
                          <datalist id={`providers-${request.id}`}>
                            {assignableBusinesses.map((business) => {
                              const providerName = business.business_name || "Unnamed provider";
                              const providerCategory = business.category ? serviceLabel(business.category) : "No category";
                              const providerPhone = business.whatsapp || business.phone || "No phone";

                              return (
                                <option
                                  key={business.id}
                                  value={`${providerName} ${providerCategory} ${providerPhone}`}
                                />
                              );
                            })}
                          </datalist>
                          <button className="h-7 rounded-md bg-blue-600 px-1 text-[10px] font-black text-white">
                            Take
                          </button>
                        </form>
                      ) : null}

                      {currentStatus === "taken" ? (
                        <div className="grid grid-cols-2 gap-1">
                          <form action={setRequestStatus}>
                            <input type="hidden" name="request_id" value={request.id} />
                            <input type="hidden" name="status" value="done" />
                            <button className="h-7 w-full rounded-md bg-emerald-600 px-1 text-[10px] font-black text-white">
                              Done
                            </button>
                          </form>
                          <form action={setRequestStatus}>
                            <input type="hidden" name="request_id" value={request.id} />
                            <input type="hidden" name="status" value="new" />
                            <button className="h-7 w-full rounded-md bg-orange-100 px-1 text-[10px] font-black text-orange-800">
                              Failed
                            </button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}