import type { BusinessRow, RequestMatchRow, RequestRow } from "../types";
import {
  buildCustomerConsentMessage,
  buildProviderRequestMessage,
  formatDate,
  formatLabel,
  getBusinessStatusTone,
  getMatchedBusiness,
  getRequestStatusTone,
} from "../lib/admin-utils";
import StatusBadge from "./StatusBadge";

type RequestAction = (formData: FormData) => Promise<void>;

const londonAreas = [
  "ilford",
  "barking",
  "east ham",
  "stratford",
  "leyton",
  "walthamstow",
  "romford",
  "dagenham",
  "forest gate",
  "wanstead",
  "hackney",
  "tower hamlets",
  "poplar",
  "bow",
  "bethnal green",
  "whitechapel",
  "newham",
  "plaistow",
  "canning town",
  "forest hill",
  "greenwich",
  "woolwich",
  "lewisham",
  "catford",
  "croydon",
  "brixton",
  "clapham",
  "tooting",
  "wimbledon",
  "kingston",
  "richmond",
  "hounslow",
  "ealing",
  "acton",
  "wembley",
  "harrow",
  "barnet",
  "edmonton",
  "enfield",
  "tottenham",
  "finsbury park",
  "camden",
  "islington",
  "westminster",
  "kensington",
  "chelsea",
  "hammersmith",
  "fulham",
];

const serviceAliases: Record<string, string[]> = {
  "end-of-tenancy-cleaning": ["end-of-tenancy-cleaning", "end of tenancy cleaning", "cleaning"],
  "regular-cleaning": ["regular-cleaning", "regular cleaning", "domestic-cleaning", "domestic cleaning", "cleaning"],
  "deep-cleaning": ["deep-cleaning", "deep cleaning", "cleaning"],
  "man-and-van": ["man-and-van", "man and van", "removals"],
  removals: ["removals", "man-and-van", "man and van"],
  plumber: ["plumber", "plumbing"],
  electrician: ["electrician", "electrical"],
  locksmith: ["locksmith"],
  handyman: ["handyman"],
  gardener: ["gardener", "gardening"],
  "pest-control": ["pest-control", "pest control"],
  "painter-decorator": ["painter-decorator", "painter decorator", "painter / decorator", "painting"],
  "carpet-cleaning": ["carpet-cleaning", "carpet cleaning", "cleaning"],
  "oven-cleaning": ["oven-cleaning", "oven cleaning", "cleaning"],
  "waste-removal": ["waste-removal", "waste removal", "rubbish removal"],
};

function normaliseMatchValue(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

function normaliseAreaValue(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
}

function getPostcodePrefix(value: string | null | undefined) {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) return "";

  const compact = raw.replace(/\s+/g, "");

  // Full UK postcode like HA8 6HU / HA86HU -> outward prefix HA8.
  if (/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(raw)) {
    return compact.slice(0, -3).toLowerCase();
  }

  // Already a postcode prefix like HA8 / SL2 / E17.
  if (/^[A-Z]{1,2}\d[A-Z\d]?$/.test(compact)) {
    return compact.toLowerCase();
  }

  return "";
}

function providerMatchesRequest(request: RequestRow, business: BusinessRow) {
  const isApproved = business.status?.toLowerCase() === "approved";
  if (!isApproved) return false;

  const requestService = normaliseMatchValue(request.service);
  const businessCategory = normaliseMatchValue(business.category);
  const allowedServices = serviceAliases[requestService] || [requestService];
  const serviceMatches = allowedServices.map(normaliseMatchValue).includes(businessCategory);
  if (!serviceMatches) return false;

  const requestArea = normaliseAreaValue(request.area);
  const requestPostcodePrefix = getPostcodePrefix(request.postcode);
  const requestAreaPrefix = getPostcodePrefix(request.area);
  const businessAreas = (business.areas || []).map(normaliseAreaValue);
  const businessPostcodePrefixes = (business.areas || []).map(getPostcodePrefix).filter(Boolean);
  const londonAreaSet = londonAreas.map(normaliseAreaValue);
  const londonZones = ["london", "east london", "west london", "north london", "south london", "central london"];

  const areaMatches =
    businessAreas.includes(requestArea) ||
    (requestPostcodePrefix && businessPostcodePrefixes.includes(requestPostcodePrefix)) ||
    (requestAreaPrefix && businessPostcodePrefixes.includes(requestAreaPrefix)) ||
    businessAreas.some((area) => londonZones.includes(area)) ||
    (londonZones.includes(requestArea) && businessAreas.some((area) => londonAreaSet.includes(area)));

  return areaMatches;
}

function DetailRow({
  label,
  value,
  preserveLines = false,
}: {
  label: string;
  value: React.ReactNode;
  preserveLines?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#edf0f5] py-3 last:border-b-0">
      <dt className="shrink-0 text-[13px] font-black uppercase tracking-[0.07em] text-[#657089]">{label}</dt>
      <dd
        className={`max-w-[260px] text-right text-[14px] font-bold leading-[1.45] text-[#071638] ${
          preserveLines ? "whitespace-pre-line" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function CopyBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[18px] border border-[#dfe5ee] bg-[#fbfcfd] p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[12px] font-black uppercase tracking-[0.08em] text-[#657089]">{title}</h3>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#08783f] ring-1 ring-[#d8eddd]">
          Copy manually
        </span>
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded-[14px] bg-white p-3 text-[13px] font-semibold leading-[1.55] text-[#071638] ring-1 ring-[#e1e6ee]">
        {text}
      </pre>
    </div>
  );
}

function StatusForm({
  request,
  updateRequestStatus,
}: {
  request: RequestRow;
  updateRequestStatus?: RequestAction;
}) {
  if (!updateRequestStatus) return null;

  return (
    <form action={updateRequestStatus} className="rounded-[16px] border border-[#dfe5ee] bg-white p-3">
      <input type="hidden" name="request_id" value={request.id} />
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.08em] text-[#657089]">
          Update status
        </span>
        <select
          name="status"
          defaultValue={request.status || "new"}
          className="h-11 w-full rounded-[13px] border border-[#dfe5ee] bg-white px-3 text-[14px] font-bold text-[#071638] outline-none transition focus:border-[#08783f] focus:ring-4 focus:ring-[#08783f]/10"
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="matched">Matched</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      <button
        type="submit"
        className="mt-2 h-10 w-full rounded-[12px] bg-[#071638] text-[13px] font-black text-white shadow-[0_10px_22px_rgba(7,22,56,0.14)] transition hover:-translate-y-0.5"
      >
        Save status
      </button>
    </form>
  );
}

function NotesForm({
  request,
  updateRequestNotes,
}: {
  request: RequestRow;
  updateRequestNotes?: RequestAction;
}) {
  if (!updateRequestNotes) return null;

  return (
    <form action={updateRequestNotes} className="rounded-[18px] border border-[#dfe5ee] bg-white p-4">
      <input type="hidden" name="request_id" value={request.id} />
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.08em] text-[#657089]">
          Admin notes
        </span>
        <textarea
          name="admin_notes"
          defaultValue={request.admin_notes || ""}
          rows={4}
          placeholder="Provider contacted, quoted £120, waiting for customer consent..."
          className="w-full resize-none rounded-[13px] border border-[#dfe5ee] bg-white px-3 py-3 text-[14px] font-semibold leading-[1.45] text-[#071638] outline-none transition placeholder:text-[#9aa4b5] focus:border-[#08783f] focus:ring-4 focus:ring-[#08783f]/10"
        />
      </label>
      <button
        type="submit"
        className="mt-3 h-11 w-full rounded-[13px] bg-white text-[14px] font-black text-[#071638] ring-1 ring-[#dfe5ee] transition hover:-translate-y-0.5 hover:ring-[#b7c2d2]"
      >
        Save notes
      </button>
    </form>
  );
}

function MatchBusinessForm({
  request,
  businesses,
  matchRequestToBusiness,
}: {
  request: RequestRow;
  businesses: BusinessRow[];
  matchRequestToBusiness?: RequestAction;
}) {
  if (!matchRequestToBusiness) return null;

  const approvedBusinesses = businesses.filter((business) => providerMatchesRequest(request, business));

  if (approvedBusinesses.length === 0) {
    return (
      <div className="rounded-[16px] border border-[#f4e3a6] bg-[#fff9e8] p-3 text-[13px] font-bold leading-[1.45] text-[#8a6400]">
        No approved providers match this request service and location yet.
      </div>
    );
  }

  return (
    <form action={matchRequestToBusiness} className="rounded-[16px] border border-[#d8eddd] bg-[#f7fcf8] p-3">
      <input type="hidden" name="request_id" value={request.id} />
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.08em] text-[#657089]">
          Match provider
        </span>
        <select
          name="business_id"
          defaultValue={request.matched_business_id || ""}
          className="h-11 w-full rounded-[13px] border border-[#dfe5ee] bg-white px-3 text-[14px] font-bold text-[#071638] outline-none transition focus:border-[#08783f] focus:ring-4 focus:ring-[#08783f]/10"
        >
          <option value="">Choose matching approved provider...</option>
          {approvedBusinesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.business_name || "Unnamed provider"} · {formatLabel(business.category)} · {(business.areas || []).join(", ") || "No areas"}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-[11px] font-bold leading-[1.35] text-[#657089]">
          Only approved providers matching this service and location appear here.
        </p>
      </label>
      <button
        type="submit"
        className="mt-2 h-10 w-full rounded-[12px] bg-[#08783f] text-[13px] font-black text-white shadow-[0_10px_22px_rgba(8,120,63,0.16)] transition hover:-translate-y-0.5"
      >
        Save match
      </button>
    </form>
  );
}

function MatchedProviderCard({ business }: { business: BusinessRow | null }) {
  if (!business) {
    return (
      <div className="rounded-[16px] border border-dashed border-[#cbd3df] bg-[#fbfcfd] p-3 text-[13px] font-bold text-[#657089]">
        No provider matched yet.
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[#d8eddd] bg-[#f1faf4] p-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[18px] font-black tracking-[-0.02em] text-[#071638]">{business.business_name}</p>
          <p className="mt-1 text-[13px] font-bold text-[#44506a]">{formatLabel(business.category)}</p>
        </div>
        <StatusBadge value={business.status} tone={getBusinessStatusTone(business.status)} />
      </div>
      <div className="mt-3 grid gap-1.5 text-[12px] font-semibold text-[#44506a]">
        <p><span className="font-black text-[#071638]">WhatsApp:</span> {business.whatsapp || "Not set"}</p>
        <p><span className="font-black text-[#071638]">Starting price:</span> {business.starting_price || "Not set"}</p>
        <p><span className="font-black text-[#071638]">Areas:</span> {(business.areas || []).join(", ") || "Not set"}</p>
        <p><span className="font-black text-[#071638]">Completed jobs:</span> {business.completed_jobs ?? 0}</p>
      </div>
    </div>
  );
}

function MatchAttemptsCard({
  requestMatches,
  businesses,
}: {
  requestMatches: RequestMatchRow[];
  businesses: BusinessRow[];
}) {
  if (requestMatches.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-[#cbd3df] bg-[#fbfcfd] p-3 text-[13px] font-bold text-[#657089]">
        No providers contacted yet.
      </div>
    );
  }

  return (
    <section className="rounded-[16px] border border-[#dfe5ee] bg-white p-3">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[12px] font-black uppercase tracking-[0.08em] text-[#657089]">
          Provider attempts
        </h3>
        <span className="rounded-full bg-[#f7f9fb] px-3 py-1 text-[11px] font-black text-[#071638] ring-1 ring-[#e1e6ee]">
          {requestMatches.length} sent
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {requestMatches.map((match) => {
          const business = businesses.find((item) => item.id === match.business_id);

          return (
            <div key={match.id} className="rounded-[14px] border border-[#edf0f5] bg-[#fbfcfd] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-black text-[#071638]">
                    {business?.business_name || "Unknown provider"}
                  </p>
                  <p className="mt-1 text-[12px] font-bold text-[#657089]">
                    {business ? formatLabel(business.category) : "Provider not found"}
                  </p>
                </div>
                <StatusBadge value={match.status} tone={match.status === "accepted" || match.status === "selected" ? "green" : "neutral"} />
              </div>

              <div className="mt-3 grid gap-1.5 text-[12px] font-semibold text-[#44506a]">
                <p><span className="font-black text-[#071638]">Quote:</span> {match.quoted_price ? `£${match.quoted_price}` : "Not provided"}</p>
                <p><span className="font-black text-[#071638]">Availability:</span> {match.availability || "Not provided"}</p>
                <p><span className="font-black text-[#071638]">Reply:</span> {match.provider_reply || "No reply yet"}</p>
                <p><span className="font-black text-[#071638]">Sent:</span> {formatDate(match.sent_at || match.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function RequestDetailsPanel({
  request,
  businesses,
  requestMatches,
  updateRequestStatus,
  updateRequestNotes,
  matchRequestToBusiness,
}: {
  request: RequestRow | null;
  businesses: BusinessRow[];
  requestMatches: RequestMatchRow[];
  updateRequestStatus?: RequestAction;
  updateRequestNotes?: RequestAction;
  matchRequestToBusiness?: RequestAction;
}) {
  if (!request) {
    return (
      <aside className="rounded-[22px] border border-[#dfe5ee] bg-white p-5 shadow-[0_12px_35px_rgba(7,22,56,0.035)] lg:sticky lg:top-5">
        <h2 className="text-[21px] font-black tracking-[-0.03em] text-[#071638]">Request details</h2>
        <p className="mt-2 text-[14px] font-semibold leading-[1.55] text-[#657089]">
          Select a request to view contact details, provider messages, consent message and matching controls.
        </p>
      </aside>
    );
  }

  const matchedBusiness = getMatchedBusiness(request, businesses);
  const providerMessage = buildProviderRequestMessage(request);
  const customerConsentMessage = buildCustomerConsentMessage(request, matchedBusiness);
  const matchesForRequest = requestMatches.filter((match) => match.request_id === request.id);

  return (
    <aside className="space-y-3 lg:sticky lg:top-5">
      <section className="rounded-[20px] border border-[#dfe5ee] bg-white p-3 shadow-[0_12px_35px_rgba(7,22,56,0.035)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-[12px] font-black uppercase tracking-[0.08em] text-[#657089]">Actions</h3>
          <span className="rounded-full bg-[#f1faf4] px-3 py-1 text-[11px] font-black text-[#08783f] ring-1 ring-[#d8eddd]">Match first</span>
        </div>
        <div className="grid gap-3">
          <MatchBusinessForm request={request} businesses={businesses} matchRequestToBusiness={matchRequestToBusiness} />
          <StatusForm request={request} updateRequestStatus={updateRequestStatus} />
        </div>
      </section>

      <section className="rounded-[20px] border border-[#dfe5ee] bg-white p-4 shadow-[0_12px_35px_rgba(7,22,56,0.035)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#08783f]">Selected request</p>
            <h2 className="mt-1 text-[22px] font-black leading-[1.05] tracking-[-0.04em] text-[#071638]">
              {formatLabel(request.service)}
            </h2>
            <p className="mt-1 text-[13px] font-bold text-[#657089]">
              {formatLabel(request.area)} {request.postcode ? `· ${request.postcode}` : ""}
            </p>
          </div>
          <StatusBadge value={request.status} tone={getRequestStatusTone(request.status)} />
        </div>

        <dl className="mt-4 rounded-[16px] border border-[#edf0f5] bg-[#fbfcfd] px-3">
          <DetailRow label="Email" value={request.email || "Not provided"} />
          <DetailRow label="Phone" value={request.phone || "Not provided"} />
          <DetailRow label="Postcode" value={request.postcode || "Not provided"} />
          <DetailRow label="Needed" value={formatLabel(request.time_needed)} />
          <DetailRow label="Details" value={request.details || "No details"} preserveLines />
          <DetailRow label="Source" value={formatLabel(request.source)} />
          <DetailRow label="Created" value={formatDate(request.created_at)} />
          <DetailRow label="Updated" value={formatDate(request.updated_at)} />
        </dl>
      </section>

      <MatchedProviderCard business={matchedBusiness} />
      <MatchAttemptsCard requestMatches={matchesForRequest} businesses={businesses} />

      <CopyBox title="Provider message" text={providerMessage} />
      <CopyBox title="Customer consent message" text={customerConsentMessage} />

      <NotesForm request={request} updateRequestNotes={updateRequestNotes} />
    </aside>
  );
}