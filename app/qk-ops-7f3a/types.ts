export type AdminTab = "requests" | "businesses";

export type RequestStatus = "new" | "contacted" | "matched" | "done" | "cancelled" | string;

export type BusinessStatus = "pending" | "approved" | "rejected" | string;

export type RequestRow = {
  id: string;
  service: string | null;
  area: string | null;
  postcode: string | null;
  time_needed: string | null;
  details: string | null;
  phone: string | null;
  email: string | null;
  status: RequestStatus;
  source: string | null;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
  matched_business_id: string | null;
  admin_notes: string | null;
};

export type BusinessRow = {
  id: string;
  business_name: string | null;
  category: string | null;
  whatsapp: string | null;
  starting_price: number | null;
  areas: string[] | null;
  availability: string | null;
  profile_slug: string | null;
  description: string | null;
  status: BusinessStatus;
  source: string | null;
  completed_jobs: number | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
};

export type RequestMatchRow = {
  id: string;
  request_id: string;
  business_id: string;
  status: string;
  quoted_price: number | null;
  availability: string | null;
  provider_reply: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  selected_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
};

export type AdminStats = {
  totalRequests: number;
  newRequests: number;
  contactedRequests: number;
  matchedRequests: number;
  doneRequests: number;
  totalBusinesses: number;
  approvedBusinesses: number;
  pendingBusinesses: number;
};

export type RequestFilters = {
  query: string;
  status: string;
  service: string;
  area: string;
};

export type BusinessFilters = {
  query: string;
  status: string;
  service: string;
  area: string;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type ProviderMessagePayload = {
  request: RequestRow;
  matchedBusiness?: BusinessRow | null;
};
