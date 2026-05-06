import { supabase } from "@/lib/supabase";
import {
  deleteBusiness,
  deleteRequest,
  matchRequestToBusiness,
  updateBusinessStatus,
  updateRequestStatus,
} from "../actions";
import BusinessesView from "./components/BusinessesView";
import FilterBar from "./components/FilterBar";
import RequestDetailsPanel from "./components/RequestDetailsPanel";
import RequestsTable from "./components/RequestsTable";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import type { AdminTab, BusinessRow, RequestMatchRow, RequestRow } from "./types";
import {
  businessMatchesFilters,
  isRelevantBusiness,
  requestMatchesFilters,
  uniqueValues,
} from "./lib/admin-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminPageProps = {
  searchParams?: Promise<{
    tab?: string;
    service?: string;
    area?: string;
    status?: string;
    selected?: string;
    request?: string;
    q?: string;
  }>;
};

async function approveProvider(formData: FormData) {
  "use server";

  const id = String(formData.get("business_id") || formData.get("id") || "");
  const nextFormData = new FormData();
  nextFormData.set("id", id);
  nextFormData.set("status", "approved");
  await updateBusinessStatus(nextFormData);
}

async function rejectProvider(formData: FormData) {
  "use server";

  const id = String(formData.get("business_id") || formData.get("id") || "");
  const nextFormData = new FormData();
  nextFormData.set("id", id);
  nextFormData.set("status", "rejected");
  await updateBusinessStatus(nextFormData);
}

async function deleteProvider(formData: FormData) {
  "use server";

  const id = String(formData.get("business_id") || formData.get("id") || "");
  const nextFormData = new FormData();
  nextFormData.set("id", id);
  await deleteBusiness(nextFormData);
}

async function updateSelectedRequestStatus(formData: FormData) {
  "use server";

  const id = String(formData.get("request_id") || formData.get("id") || "");
  const status = String(formData.get("status") || "new");
  const nextFormData = new FormData();
  nextFormData.set("id", id);
  nextFormData.set("status", status);
  await updateRequestStatus(nextFormData);
}

async function matchSelectedRequestToBusiness(formData: FormData) {
  "use server";

  await matchRequestToBusiness(formData);
}

async function getAdminData() {
  const [requestsResult, businessesResult, matchesResult] = await Promise.all([
    supabase
      .from("requests")
      .select(
        "id, service, area, postcode, time_needed, details, phone, email, status, source, created_at, updated_at, completed_at, matched_business_id, admin_notes"
      )
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("businesses")
      .select(
        "id, business_name, category, whatsapp, starting_price, areas, availability, profile_slug, description, status, source, created_at, updated_at, approved_at, rejected_at, completed_jobs, internal_notes"
      )
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("request_matches")
      .select(
        "id, request_id, business_id, status, quoted_price, availability, provider_reply, sent_at, accepted_at, rejected_at, selected_at, completed_at, created_at, updated_at"
      )
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

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;

  const activeTab: AdminTab = params?.tab === "businesses" ? "businesses" : "requests";
  const activeService = params?.service || "";
  const activeArea = params?.area || "";
  const activeStatus = params?.status || "";
  const activeSearch = (params?.q || "").trim();
  const selectedRequestId = params?.request || params?.selected || "";

  const { requests, businesses, requestMatches } = await getAdminData();

  const relevantBusinesses = businesses.filter(isRelevantBusiness);

  const filteredRequests = requests.filter((request) =>
    requestMatchesFilters(request, {
      query: activeSearch,
      status: activeStatus,
      service: activeService,
      area: activeArea,
    })
  );

  const filteredBusinesses = relevantBusinesses.filter((business) =>
    businessMatchesFilters(business, {
      query: activeSearch,
      status: activeStatus,
      service: activeService,
      area: activeArea,
    })
  );

  const selectedRequest = selectedRequestId
    ? requests.find((request) => request.id === selectedRequestId) || null
    : filteredRequests[0] || requests[0] || null;

  const requestServiceOptions = uniqueValues(requests.map((request) => request.service));
  const requestAreaOptions = uniqueValues(requests.map((request) => request.area));
  const businessServiceOptions = uniqueValues(relevantBusinesses.map((business) => business.category));
  const businessAreaOptions = uniqueValues(relevantBusinesses.flatMap((business) => business.areas || []));

  const newRequestCount = requests.filter((request) => request.status === "new").length;
  const contactedRequestCount = requests.filter((request) => request.status === "contacted").length;
  const matchedRequestCount = requests.filter((request) => request.status === "matched").length;
  const doneRequestCount = requests.filter((request) => request.status === "done" || request.status === "completed").length;
  const cancelledRequestCount = requests.filter((request) => request.status === "cancelled").length;
  const approvedBusinessCount = relevantBusinesses.filter((business) => business.status === "approved").length;
  const pendingBusinessCount = relevantBusinesses.filter((business) => business.status === "pending").length;

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#071638] [font-family:'Nunito_Sans','Nunito','Inter',system-ui,sans-serif]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar
          activeTab={activeTab}
          activeStatus={activeStatus}
          requestCount={requests.length}
          businessCount={relevantBusinesses.length}
          newRequestCount={newRequestCount}
          matchedRequestCount={matchedRequestCount}
          completedRequestCount={doneRequestCount}
          cancelledRequestCount={cancelledRequestCount}
          pendingBusinessCount={pendingBusinessCount}
        />

        <div className="min-w-0 flex-1 px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
          <div className="space-y-4">
            <TopBar
              activeTab={activeTab}
              requestCount={requests.length}
              businessCount={relevantBusinesses.length}
              newRequestCount={newRequestCount}
              contactedRequestCount={contactedRequestCount}
              matchedRequestCount={matchedRequestCount}
              doneRequestCount={doneRequestCount}
              approvedBusinessCount={approvedBusinessCount}
              pendingBusinessCount={pendingBusinessCount}
            />

            {activeTab === "requests" ? (
              <>
                <FilterBar
                  activeTab="requests"
                  query={activeSearch}
                  status={activeStatus}
                  service={activeService}
                  area={activeArea}
                  serviceOptions={requestServiceOptions}
                  areaOptions={requestAreaOptions}
                />

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_410px] xl:items-start">
                  <RequestsTable
                    requests={filteredRequests}
                    businesses={relevantBusinesses}
                    requestMatches={requestMatches}
                    selectedRequestId={selectedRequest?.id}
                  />

                  <RequestDetailsPanel
                    request={selectedRequest}
                    businesses={relevantBusinesses}
                    requestMatches={requestMatches}
                    updateRequestStatus={updateSelectedRequestStatus}
                    matchRequestToBusiness={matchSelectedRequestToBusiness}
                  />
                </div>
              </>
            ) : (
              <>
                <FilterBar
                  activeTab="businesses"
                  query={activeSearch}
                  status={activeStatus}
                  service={activeService}
                  area={activeArea}
                  serviceOptions={businessServiceOptions}
                  areaOptions={businessAreaOptions}
                />

                <BusinessesView
                  businesses={filteredBusinesses}
                  approveBusiness={approveProvider}
                  rejectBusiness={rejectProvider}
                  deleteBusiness={deleteProvider}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}