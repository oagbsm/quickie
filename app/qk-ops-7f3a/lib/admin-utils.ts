import type { BusinessRow, RequestRow } from "../types";

export function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

export function slugify(value: string | null | undefined) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatLabel(value: string | null | undefined) {
  const cleaned = cleanText(value)
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (!cleaned) return "Not set";

  const labels: Record<string, string> = {
    asap: "ASAP",
    today: "Today",
    tomorrow: "Tomorrow",
    "this week": "This week",
    flexible: "Flexible",
    new: "New",
    contacted: "Contacted",
    matched: "Matched",
    done: "Done",
    completed: "Completed",
    sent: "Sent",
    accepted: "Accepted",
    selected: "Selected",
    cancelled: "Cancelled",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    website: "Website",
    "check price": "Check price",
    "seo page": "SEO page",
    manual: "Manual",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    cleaning: "Cleaning",
    "regular cleaning": "Regular cleaning",
    "deep cleaning": "Deep cleaning",
    "domestic cleaning": "Domestic cleaning",
    "one off cleaning": "One-off cleaning",
    "end of tenancy cleaning": "End of tenancy cleaning",
    "move out cleaning": "Move-out cleaning",
    "after builders cleaning": "After builders cleaning",
    "airbnb cleaning": "Airbnb cleaning",
    "carpet cleaning": "Carpet cleaning",
    "oven cleaning": "Oven cleaning",
    "man and van": "Man and van",
    removals: "Removals",
    plumber: "Plumber",
    electrician: "Electrician",
    locksmith: "Locksmith",
    handyman: "Handyman",
    gardener: "Gardener",
    "pest control": "Pest control",
    "painter decorator": "Painter / decorator",
    "waste removal": "Waste removal",
    "appliance repair": "Appliance repair",
    "boiler repair": "Boiler repair",
    "gas engineer": "Gas engineer",
    roofer: "Roofer",
    tiler: "Tiler",
    plasterer: "Plasterer",
    carpenter: "Carpenter",
    builder: "Builder",
    "window cleaner": "Window cleaner",
    "mobile car wash": "Mobile car wash",
    valeting: "Valeting",
    london: "London",
    "east london": "East London",
    "west london": "West London",
    "north london": "North London",
    "south london": "South London",
    "central london": "Central London",
  };

  if (labels[cleaned]) return labels[cleaned];

  return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function shortDate(value: string | null | undefined) {
  if (!value) return "Not set";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => cleanText(value))
        .filter(Boolean)
    )
  ).sort((a, b) => formatLabel(a).localeCompare(formatLabel(b)));
}

export function isRelevantBusiness(business: BusinessRow) {
  return Boolean(cleanText(business.business_name) && cleanText(business.category));
}

export function requestMatchesQuery(request: RequestRow, query: string) {
  const q = cleanText(query).toLowerCase();
  if (!q) return true;

  const haystack = [
    request.service,
    request.area,
    request.postcode,
    request.time_needed,
    request.details,
    request.phone,
    request.email,
    request.status,
    request.source,
    request.admin_notes,
  ]
    .map((value) => cleanText(value).toLowerCase())
    .join(" ");

  return haystack.includes(q);
}

export function businessMatchesQuery(business: BusinessRow, query: string) {
  const q = cleanText(query).toLowerCase();
  if (!q) return true;

  const haystack = [
    business.business_name,
    business.category,
    business.whatsapp,
    business.starting_price,
    business.availability,
    business.profile_slug,
    business.description,
    business.status,
    business.source,
    business.internal_notes,
    ...(business.areas || []),
  ]
    .map((value) => cleanText(value).toLowerCase())
    .join(" ");

  return haystack.includes(q);
}

export function requestMatchesFilters(
  request: RequestRow,
  filters: { query?: string; status?: string; service?: string; area?: string }
) {
  const status = cleanText(filters.status);
  const service = cleanText(filters.service);
  const area = cleanText(filters.area);

  if (!requestMatchesQuery(request, filters.query || "")) return false;
  if (status && request.status !== status) return false;
  if (service && request.service !== service) return false;
  if (area && request.area !== area) return false;

  return true;
}

export function businessMatchesFilters(
  business: BusinessRow,
  filters: { query?: string; status?: string; service?: string; area?: string }
) {
  const status = cleanText(filters.status);
  const service = cleanText(filters.service);
  const area = cleanText(filters.area);

  if (!businessMatchesQuery(business, filters.query || "")) return false;
  if (status && business.status !== status) return false;
  if (service && business.category !== service) return false;
  if (area && !(business.areas || []).includes(area)) return false;

  return true;
}

export function getMatchedBusiness(request: RequestRow, businesses: BusinessRow[]) {
  if (!request.matched_business_id) return null;
  return businesses.find((business) => business.id === request.matched_business_id) || null;
}

export function buildProviderRequestMessage(request: RequestRow) {
  return [
    "New Quickola request:",
    "",
    `Service: ${formatLabel(request.service)}`,
    `Location: ${formatLabel(request.area)}`,
    request.postcode ? `Postcode: ${request.postcode}` : "Postcode: Not provided",
    `Needed: ${formatLabel(request.time_needed)}`,
    request.details ? `Details: ${request.details}` : "Details: Not provided",
    "",
    "Can you do this job?",
    "Reply with YES, earliest availability and rough starting price.",
    "",
    "No upfront fee. Quickola fee only after completed jobs.",
  ].join("\n");
}

export function buildCustomerConsentMessage(request: RequestRow, business?: BusinessRow | null) {
  const providerLine = business?.business_name
    ? `I found a suitable provider: ${business.business_name}.`
    : "I found a suitable local provider.";

  return [
    providerLine,
    "",
    `Location: ${formatLabel(request.area)}`,
    request.postcode ? `Postcode: ${request.postcode}` : "",
    `Needed: ${formatLabel(request.time_needed)}`,
    "",
    "Are you happy for me to share your number so they can contact you?",
    "",
    "No automatic booking. Please confirm the final price before any work starts.",
  ].filter(Boolean).join("\n");
}

export function getRequestHighlightClass(status: string | null | undefined) {
  if (status === "new") return "bg-[#effcf3] ring-1 ring-[#ccefd7]";
  if (status === "contacted") return "bg-[#fff9e8] ring-1 ring-[#f4e3a6]";
  if (status === "matched") return "bg-[#eef6ff] ring-1 ring-[#cfe2ff]";
  if (status === "done" || status === "completed") return "bg-white";
  if (status === "cancelled") return "bg-[#fff1f1] ring-1 ring-[#ffd2d2]";
  return "bg-white";
}

export function getRequestStatusTone(status: string | null | undefined) {
  if (status === "new") return "green";
  if (status === "contacted") return "yellow";
  if (status === "matched") return "blue";
  if (status === "done" || status === "completed") return "dark";
  if (status === "cancelled") return "red";
  return "neutral";
}

export function getBusinessStatusTone(status: string | null | undefined) {
  if (status === "approved") return "green";
  if (status === "pending") return "yellow";
  if (status === "rejected") return "red";
  return "neutral";
}