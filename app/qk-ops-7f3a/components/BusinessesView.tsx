import type { BusinessRow, RequestRow } from "../types";
import { formatLabel, getBusinessStatusTone, shortDate } from "../lib/admin-utils";
import StatusBadge from "./StatusBadge";

type BusinessAction = (formData: FormData) => Promise<void>;

type AddProviderAction = (formData: FormData) => Promise<void>;

function getProviderJobStats(business: BusinessRow, requests: RequestRow[]) {
  const matchedRequests = requests.filter((request) => request.matched_business_id === business.id);
  const completedRequests = matchedRequests.filter(
    (request) => request.status === "done" || request.status === "completed"
  );

  return {
    matched: matchedRequests.length,
    completed: completedRequests.length,
  };
}

function AreasList({ areas }: { areas: string[] | null }) {
  const cleanAreas = (areas || []).filter(Boolean);

  if (cleanAreas.length === 0) {
    return <span className="text-[12px] font-bold text-[#9aa4b5]">No areas</span>;
  }

  const visibleAreas = cleanAreas.slice(0, 3);
  const remaining = cleanAreas.length - visibleAreas.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleAreas.map((area) => (
        <span
          key={area}
          className="rounded-full border border-[#e1e6ee] bg-[#f7f9fb] px-2.5 py-1 text-[11px] font-bold text-[#44506a]"
        >
          {formatLabel(area)}
        </span>
      ))}
      {remaining > 0 ? (
        <span className="rounded-full border border-[#e1e6ee] bg-white px-2.5 py-1 text-[11px] font-black text-[#071638]">
          +{remaining}
        </span>
      ) : null}
    </div>
  );
}

function ProviderActions({
  business,
  approveBusiness,
  rejectBusiness,
  deleteBusiness,
}: {
  business: BusinessRow;
  approveBusiness?: BusinessAction;
  rejectBusiness?: BusinessAction;
  deleteBusiness?: BusinessAction;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {approveBusiness ? (
        <form action={approveBusiness}>
          <input type="hidden" name="business_id" value={business.id} />
          <button
            type="submit"
            className="h-8 rounded-[10px] bg-[#08783f] px-3 text-[11px] font-black text-white shadow-[0_8px_18px_rgba(8,120,63,0.12)] transition hover:-translate-y-0.5"
          >
            Approve
          </button>
        </form>
      ) : null}

      {rejectBusiness ? (
        <form action={rejectBusiness}>
          <input type="hidden" name="business_id" value={business.id} />
          <button
            type="submit"
            className="h-8 rounded-[10px] bg-white px-3 text-[11px] font-black text-[#b42318] ring-1 ring-[#ffd1d1] transition hover:-translate-y-0.5"
          >
            Reject
          </button>
        </form>
      ) : null}

      {deleteBusiness ? (
        <form action={deleteBusiness}>
          <input type="hidden" name="business_id" value={business.id} />
          <button
            type="submit"
            className="h-8 rounded-[10px] bg-white px-3 text-[11px] font-black text-[#071638] ring-1 ring-[#dfe5ee] transition hover:-translate-y-0.5 hover:ring-[#b7c2d2]"
          >
            Archive
          </button>
        </form>
      ) : null}
    </div>
  );
}

function ProviderMobileCard({
  business,
  requests,
  approveBusiness,
  rejectBusiness,
  deleteBusiness,
}: {
  business: BusinessRow;
  requests: RequestRow[];
  approveBusiness?: BusinessAction;
  rejectBusiness?: BusinessAction;
  deleteBusiness?: BusinessAction;
}) {
  const stats = getProviderJobStats(business, requests);

  return (
    <article className="rounded-[18px] border border-[#dfe5ee] bg-white p-4 shadow-[0_10px_24px_rgba(7,22,56,0.035)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-black leading-[1.1] tracking-[-0.03em] text-[#071638]">
            {business.business_name || "Unnamed provider"}
          </h3>
          <p className="mt-1 text-[13px] font-bold text-[#657089]">{formatLabel(business.category)}</p>
        </div>
        <StatusBadge value={business.status} tone={getBusinessStatusTone(business.status)} />
      </div>

      <div className="mt-3 grid gap-2 text-[13px] font-semibold text-[#44506a]">
        <p><span className="font-black text-[#071638]">WhatsApp:</span> {business.whatsapp || "Not set"}</p>
        <p><span className="font-black text-[#071638]">Price:</span> {business.starting_price ? `£${business.starting_price}` : "Not set"}</p>
        <p><span className="font-black text-[#071638]">Availability:</span> {business.availability || "Not set"}</p>
        <p><span className="font-black text-[#071638]">Matched/completed:</span> {stats.matched}/{stats.completed}</p>
        <div><span className="font-black text-[#071638]">Areas:</span><div className="mt-1"><AreasList areas={business.areas} /></div></div>
        {business.description ? (
          <p className="line-clamp-2"><span className="font-black text-[#071638]">Description:</span> {business.description}</p>
        ) : null}
      </div>

      <div className="mt-4 border-t border-[#edf0f5] pt-3">
        <ProviderActions
          business={business}
          approveBusiness={approveBusiness}
          rejectBusiness={rejectBusiness}
          deleteBusiness={deleteBusiness}
        />
      </div>
    </article>
  );
}

export default function BusinessesView({
  businesses,
  requests,
  approveBusiness,
  rejectBusiness,
  deleteBusiness,
  addProvider,
}: {
  businesses: BusinessRow[];
  requests: RequestRow[];
  approveBusiness?: BusinessAction;
  rejectBusiness?: BusinessAction;
  deleteBusiness?: BusinessAction;
  addProvider?: AddProviderAction;
}) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-[#dfe5ee] bg-white shadow-[0_12px_35px_rgba(7,22,56,0.035)]">
      <div className="border-b border-[#e1e6ee] px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[19px] font-black tracking-[-0.03em] text-[#071638]">Providers</h2>
            <p className="mt-1 text-[12px] font-bold text-[#657089]">
              Dense provider list for fast approval, matching and supply checks.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[13px] font-black text-[#08783f]">{businesses.length} shown</p>
            {addProvider ? (
              <details className="group relative">
                <summary className="flex h-9 cursor-pointer list-none items-center justify-center rounded-[11px] bg-[#08783f] px-4 text-[13px] font-black text-white shadow-[0_8px_18px_rgba(8,120,63,0.12)] transition hover:-translate-y-0.5 [&::-webkit-details-marker]:hidden">
                  + Add provider
                </summary>
              </details>
            ) : null}
          </div>
        </div>

        {addProvider ? (
          <details className="mt-3 rounded-[18px] border border-[#dfe5ee] bg-[#fbfcfd] p-3 open:shadow-[0_10px_24px_rgba(7,22,56,0.035)]">
            <summary className="cursor-pointer list-none text-[13px] font-black text-[#08783f] [&::-webkit-details-marker]:hidden">
              Open provider form
            </summary>
            <form action={addProvider} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#657089]">Business name</span>
                <input name="business_name" required placeholder="ABC Cleaning" className="h-10 rounded-[11px] border border-[#dfe5ee] bg-white px-3 text-[13px] font-bold text-[#071638] outline-none focus:border-[#08783f]" />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#657089]">Service</span>
                <select name="category" required defaultValue="cleaning" className="h-10 rounded-[11px] border border-[#dfe5ee] bg-white px-3 text-[13px] font-bold text-[#071638] outline-none focus:border-[#08783f]">
                  <option value="cleaning">Cleaning</option>
                  <option value="plumber">Plumber</option>
                  <option value="electrician">Electrician</option>
                  <option value="locksmith">Locksmith</option>
                  <option value="removals">Removals</option>
                  <option value="handyman">Handyman</option>
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#657089]">WhatsApp</span>
                <input name="whatsapp" required placeholder="447700900123" className="h-10 rounded-[11px] border border-[#dfe5ee] bg-white px-3 text-[13px] font-bold text-[#071638] outline-none focus:border-[#08783f]" />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#657089]">Starting price</span>
                <input name="starting_price" type="number" min="0" step="1" placeholder="80" className="h-10 rounded-[11px] border border-[#dfe5ee] bg-white px-3 text-[13px] font-bold text-[#071638] outline-none focus:border-[#08783f]" />
              </label>

              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#657089]">Areas</span>
                <input name="areas" placeholder="HA8, SL2, E17" className="h-10 rounded-[11px] border border-[#dfe5ee] bg-white px-3 text-[13px] font-bold text-[#071638] outline-none focus:border-[#08783f]" />
                <span className="text-[11px] font-bold text-[#9aa4b5]">Use postcode prefixes separated by commas.</span>
              </label>

              <label className="grid gap-1.5 sm:col-span-2">
                <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#657089]">Availability</span>
                <input name="availability" placeholder="This week / evenings / weekends" className="h-10 rounded-[11px] border border-[#dfe5ee] bg-white px-3 text-[13px] font-bold text-[#071638] outline-none focus:border-[#08783f]" />
              </label>

              <label className="grid gap-1.5 sm:col-span-2 lg:col-span-4">
                <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#657089]">Notes</span>
                <textarea name="description" rows={3} placeholder="What they do, checks made, pricing notes..." className="rounded-[11px] border border-[#dfe5ee] bg-white px-3 py-2 text-[13px] font-bold text-[#071638] outline-none focus:border-[#08783f]" />
              </label>

              <div className="sm:col-span-2 lg:col-span-4">
                <button type="submit" className="h-10 rounded-[11px] bg-[#08783f] px-5 text-[13px] font-black text-white shadow-[0_8px_18px_rgba(8,120,63,0.12)] transition hover:-translate-y-0.5">
                  Save approved provider
                </button>
              </div>
            </form>
          </details>
        ) : null}
      </div>

      {businesses.length === 0 ? (
        <div className="m-3 rounded-[18px] border border-[#e1e6ee] bg-[#fbfcfd] p-8 text-center">
          <p className="text-[16px] font-black text-[#071638]">No providers match these filters.</p>
          <p className="mt-2 text-[14px] font-semibold text-[#657089]">Clear filters or add more provider supply.</p>
        </div>
      ) : null}

      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[980px] table-fixed text-left text-[13px]">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[13%]" />
            <col className="w-[20%]" />
            <col className="w-[12%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[7%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead className="bg-[#f7f9fb] text-[11px] font-black uppercase tracking-[0.08em] text-[#657089]">
            <tr>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Locations</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">M/C</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#edf0f5]">
            {businesses.map((business) => {
              const stats = getProviderJobStats(business, requests);

              return (
              <tr key={business.id} className="transition hover:bg-[#fbfcfd]">
                <td className="px-4 py-3 align-middle">
                  <div className="min-w-0">
                    <p className="truncate font-black text-[#071638]">{business.business_name || "Unnamed provider"}</p>
                    <p className="mt-1 truncate text-[12px] font-bold text-[#657089]">
                      {business.availability || "Availability not set"} · {shortDate(business.created_at)}
                    </p>
                    {business.description ? (
                      <p className="mt-1 line-clamp-1 text-[12px] font-semibold text-[#44506a]">{business.description}</p>
                    ) : null}
                  </div>
                </td>

                <td className="px-4 py-3 align-middle font-bold text-[#071638]">
                  {formatLabel(business.category)}
                </td>

                <td className="px-4 py-3 align-middle">
                  <AreasList areas={business.areas} />
                </td>

                <td className="px-4 py-3 align-middle font-bold text-[#071638]">
                  {business.whatsapp || "—"}
                </td>

                <td className="px-4 py-3 align-middle font-black text-[#071638]">
                  {business.starting_price ? `£${business.starting_price}` : "—"}
                </td>

                <td className="px-4 py-3 align-middle">
                  <StatusBadge value={business.status} tone={getBusinessStatusTone(business.status)} />
                </td>

                <td className="px-4 py-3 align-middle">
                  <div className="text-[13px] font-black text-[#071638]">{stats.matched}/{stats.completed}</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-[0.06em] text-[#9aa4b5]">matched/done</div>
                </td>

                <td className="px-4 py-3 align-middle text-right">
                  <ProviderActions
                    business={business}
                    approveBusiness={approveBusiness}
                    rejectBusiness={rejectBusiness}
                    deleteBusiness={deleteBusiness}
                  />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 xl:hidden">
        {businesses.map((business) => (
          <ProviderMobileCard
            key={business.id}
            business={business}
            requests={requests}
            approveBusiness={approveBusiness}
            rejectBusiness={rejectBusiness}
            deleteBusiness={deleteBusiness}
          />
        ))}
      </div>
    </section>
  );
}