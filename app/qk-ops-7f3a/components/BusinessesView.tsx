import type { BusinessRow } from "../types";
import { formatLabel, getBusinessStatusTone, shortDate } from "../lib/admin-utils";
import StatusBadge from "./StatusBadge";

type BusinessAction = (formData: FormData) => Promise<void>;

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
            Delete
          </button>
        </form>
      ) : null}
    </div>
  );
}

function ProviderMobileCard({
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
  approveBusiness,
  rejectBusiness,
  deleteBusiness,
}: {
  businesses: BusinessRow[];
  approveBusiness?: BusinessAction;
  rejectBusiness?: BusinessAction;
  deleteBusiness?: BusinessAction;
}) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-[#dfe5ee] bg-white shadow-[0_12px_35px_rgba(7,22,56,0.035)]">
      <div className="flex flex-col gap-2 border-b border-[#e1e6ee] px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[19px] font-black tracking-[-0.03em] text-[#071638]">Providers</h2>
          <p className="mt-1 text-[12px] font-bold text-[#657089]">
            Dense provider list for fast approval, matching and supply checks.
          </p>
        </div>
        <p className="text-[13px] font-black text-[#08783f]">{businesses.length} shown</p>
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
              <th className="px-4 py-3">Jobs</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#edf0f5]">
            {businesses.map((business) => (
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

                <td className="px-4 py-3 align-middle font-black text-[#071638]">
                  {business.completed_jobs ?? 0}
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
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 xl:hidden">
        {businesses.map((business) => (
          <ProviderMobileCard
            key={business.id}
            business={business}
            approveBusiness={approveBusiness}
            rejectBusiness={rejectBusiness}
            deleteBusiness={deleteBusiness}
          />
        ))}
      </div>
    </section>
  );
}