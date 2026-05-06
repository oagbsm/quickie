import type { BusinessRow, RequestMatchRow, RequestRow } from "../types";
import {
  formatLabel,
  getMatchedBusiness,
  getRequestHighlightClass,
  getRequestStatusTone,
  shortDate,
} from "../lib/admin-utils";
import StatusBadge from "./StatusBadge";

function ContactLine({ email, phone }: { email: string | null; phone: string | null }) {
  return (
    <div className="min-w-0">
      {email ? (
        <p className="block truncate font-black text-[#071638]">{email}</p>
      ) : (
        <p className="font-black text-[#9aa4b5]">No email</p>
      )}

      {phone ? (
        <p className="mt-1 block text-[12px] font-bold text-[#44506a]">{phone}</p>
      ) : (
        <p className="mt-1 text-[12px] font-bold text-[#9aa4b5]">No phone</p>
      )}
    </div>
  );
}

function MatchSummary({ matches }: { matches: RequestMatchRow[] }) {
  const sent = matches.length;
  const replied = matches.filter((match) => match.provider_reply || match.quoted_price || match.availability).length;
  const accepted = matches.filter((match) => match.status === "accepted" || match.status === "selected").length;

  if (sent === 0) {
    return <span className="text-[12px] font-bold text-[#9aa4b5]">0 sent</span>;
  }

  return (
    <div className="text-[12px] font-bold leading-[1.35] text-[#44506a]">
      <p className="font-black text-[#071638]">{sent} sent</p>
      <p>{replied} replied · {accepted} accepted</p>
    </div>
  );
}

function JobSummary({ request }: { request: RequestRow }) {
  return (
    <div className="min-w-0">
      <p className="font-black text-[#071638]">{formatLabel(request.service)}</p>
      <p className="mt-1 text-[12px] font-bold text-[#657089]">
        {formatLabel(request.area)} {request.postcode ? `· ${request.postcode}` : ""}
      </p>
      <p className="mt-1 text-[11px] font-bold text-[#9aa4b5]">
        {formatLabel(request.time_needed)} · {shortDate(request.created_at)}
      </p>
    </div>
  );
}

function DetailsPreview({ request }: { request: RequestRow }) {
  return (
    <div className="min-w-0">
      <p className="line-clamp-2 whitespace-pre-line text-[13px] font-semibold leading-[1.35] text-[#44506a]">
        {request.details || "No details"}
      </p>
      <p className="mt-1 text-[11px] font-black uppercase tracking-[0.06em] text-[#9aa4b5]">
        {formatLabel(request.source)}
      </p>
    </div>
  );
}

export default function RequestsTable({
  requests,
  businesses,
  requestMatches,
  selectedRequestId,
}: {
  requests: RequestRow[];
  businesses: BusinessRow[];
  requestMatches: RequestMatchRow[];
  selectedRequestId?: string;
}) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-[#dfe5ee] bg-white shadow-[0_12px_35px_rgba(7,22,56,0.035)]">
      <div className="flex flex-col gap-2 border-b border-[#e1e6ee] px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[19px] font-black tracking-[-0.03em] text-[#071638]">Incoming requests</h2>
          <p className="mt-1 text-[12px] font-bold text-[#657089]">
            Compact view. Open a row to match providers and update the request.
          </p>
        </div>
        <p className="text-[13px] font-black text-[#08783f]">{requests.length} shown</p>
      </div>

      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[760px] table-fixed text-left text-[13px]">
          <colgroup>
            <col className="w-[21%]" />
            <col className="w-[20%]" />
            <col className="w-[24%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead className="bg-[#f7f9fb] text-[11px] font-black uppercase tracking-[0.08em] text-[#657089]">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Matches</th>
              <th className="px-4 py-3">Matched</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#edf0f5]">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[14px] font-semibold text-[#657089]">
                  No requests match these filters.
                </td>
              </tr>
            ) : null}

            {requests.map((request) => {
              const matchedBusiness = getMatchedBusiness(request, businesses);
              const selected = selectedRequestId === request.id;
              const matchesForRequest = requestMatches.filter((match) => match.request_id === request.id);
              const href = `/qk-ops-7f3a?tab=requests&request=${request.id}`;

              return (
                <tr
                  key={request.id}
                  className={`group transition hover:bg-[#fbfcfd] ${getRequestHighlightClass(request.status)} ${
                    selected ? "outline outline-2 outline-[#08783f]" : ""
                  }`}
                >
                  <td className="px-4 py-3 align-middle">
                    <a href={href} className="block rounded-[10px] p-1 -m-1 transition group-hover:bg-white/60">
                      <ContactLine email={request.email} phone={request.phone} />
                    </a>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <a href={href} className="block rounded-[10px] p-1 -m-1 transition group-hover:bg-white/60">
                      <JobSummary request={request} />
                    </a>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <a href={href} className="block rounded-[10px] p-1 -m-1 transition group-hover:bg-white/60">
                      <DetailsPreview request={request} />
                    </a>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <StatusBadge value={request.status} tone={getRequestStatusTone(request.status)} />
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <MatchSummary matches={matchesForRequest} />
                  </td>

                  <td className="px-4 py-3 align-middle">
                    {matchedBusiness ? (
                      <div className="min-w-0">
                        <p className="truncate font-black text-[#071638]">{matchedBusiness.business_name}</p>
                        <p className="mt-1 truncate text-[12px] font-bold text-[#657089]">{formatLabel(matchedBusiness.category)}</p>
                      </div>
                    ) : (
                      <span className="text-[12px] font-bold text-[#9aa4b5]">Not matched</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 xl:hidden">
        {requests.length === 0 ? (
          <div className="rounded-[18px] border border-[#e1e6ee] bg-[#fbfcfd] p-6 text-center text-[14px] font-semibold text-[#657089]">
            No requests match these filters.
          </div>
        ) : null}

        {requests.map((request) => {
          const matchedBusiness = getMatchedBusiness(request, businesses);
          const selected = selectedRequestId === request.id;
          const matchesForRequest = requestMatches.filter((match) => match.request_id === request.id);

          return (
            <a
              key={request.id}
              href={`/qk-ops-7f3a?tab=requests&request=${request.id}`}
              className={`block rounded-[20px] border border-[#dfe5ee] p-4 shadow-[0_10px_24px_rgba(7,22,56,0.035)] transition hover:-translate-y-0.5 ${getRequestHighlightClass(
                request.status
              )} ${selected ? "outline outline-2 outline-[#08783f]" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <JobSummary request={request} />
                <StatusBadge value={request.status} tone={getRequestStatusTone(request.status)} />
              </div>

              <div className="mt-4 grid gap-2 text-[13px] font-semibold text-[#44506a]">
                <p>
                  <span className="font-black text-[#071638]">Email:</span> {request.email || "Not provided"}
                </p>
                <p>
                  <span className="font-black text-[#071638]">Phone:</span> {request.phone || "Not provided"}
                </p>
                <p className="whitespace-pre-line">
                  <span className="font-black text-[#071638]">Details:</span> {request.details || "No details"}
                </p>
                <div>
                  <span className="font-black text-[#071638]">Matches:</span>
                  <div className="mt-1"><MatchSummary matches={matchesForRequest} /></div>
                </div>
                <p>
                  <span className="font-black text-[#071638]">Matched:</span>{" "}
                  {matchedBusiness ? matchedBusiness.business_name : "Not matched"}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#dfe5ee] pt-3">
                <span className="text-[12px] font-bold text-[#9aa4b5]">{shortDate(request.created_at)}</span>
                <span className="text-[13px] font-black text-[#08783f]">Open →</span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}