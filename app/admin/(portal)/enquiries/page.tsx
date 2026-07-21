import { requireAdmin } from "@/lib/admin/auth";
import { inviteBusiness } from "@/app/admin/actions";
import { formatBusinessDateTime } from "@/lib/business/time";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const query = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("business_enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[.12em] text-[#079448]">
            Commercial intake
          </p>
          <h1 className="mt-2 text-3xl font-black">Business enquiries</h1>
          <p className="mt-1 text-[#657089]">
            Review requirements before inviting an organisation to the
            controlled pilot.
          </p>
        </div>
      </div>
      {query.success && (
        <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm font-bold text-green-900">
          Secure account invitation sent.
        </p>
      )}
      {query.error && (
        <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-900">
          The invitation could not be sent. Check the details and try again.
        </p>
      )}
      <div className="mt-6 grid gap-4">
        {data?.length ? (
          data.map((e: any) => (
            <article
              key={e.id}
              className="rounded-2xl border bg-white p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#079448]">
                    ENQ-{e.id.slice(0, 8).toUpperCase()}
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    {e.organisation_name}
                  </h2>
                  <p className="mt-1 text-sm text-[#657089]">
                    {e.contact_name} · {e.role_title} · {e.email} · {e.phone}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-[#f1f3f6] px-3 py-1 text-xs font-black">
                    {e.status}
                  </span>
                  <p className="mt-2 text-xs text-[#657089]">
                    {formatBusinessDateTime(e.created_at)}
                  </p>
                </div>
              </div>
              <dl className="mt-5 grid gap-3 rounded-xl bg-[#f5f7f8] p-4 text-sm sm:grid-cols-4">
                <Item label="Organisation" value={e.customer_type} />
                <Item label="Sites" value={String(e.site_count)} />
                <Item label="Area" value={e.operating_area} />
                <Item
                  label="Requirement"
                  value={`${e.cleaning_type} · ${e.expected_frequency}`}
                />
              </dl>
              {e.notes && (
                <p className="mt-4 text-sm leading-6">
                  <strong>Notes:</strong> {e.notes}
                </p>
              )}
              {e.status !== "invited" && (
                <form
                  action={inviteBusiness}
                  className="mt-5 grid gap-3 border-t pt-5 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end"
                >
                  <input type="hidden" name="enquiryId" value={e.id} />
                  <Input
                    label="Contact name"
                    name="fullName"
                    value={e.contact_name}
                  />
                  <Input
                    label="Business name"
                    name="businessName"
                    value={e.organisation_name}
                  />
                  <Input
                    label="Email"
                    name="email"
                    value={e.email}
                    type="email"
                  />
                  <input type="hidden" name="phone" value={e.phone} />
                  <label className="text-sm font-bold">
                    Account type
                    <select
                      name="customerType"
                      defaultValue={mapType(e.customer_type)}
                      className="mt-1 min-h-11 w-full rounded-xl border px-3"
                    >
                      <option value="letting_agent">Letting agent</option>
                      <option value="property_manager">Property manager</option>
                      <option value="airbnb_operator">
                        Accommodation operator
                      </option>
                      <option value="landlord">Portfolio landlord</option>
                      <option value="office_business">Office/business</option>
                      <option value="block_manager">Block manager</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <button className="min-h-11 rounded-xl bg-[#079448] px-5 font-black text-white">
                    Invite business
                  </button>
                </form>
              )}
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed bg-white p-8 text-center text-[#657089]">
            No business enquiries have been submitted.
          </p>
        )}
      </div>
    </div>
  );
}
function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-[#7a8498]">{label}</dt>
      <dd className="mt-1 font-black capitalize">
        {value.replaceAll("_", " ")}
      </dd>
    </div>
  );
}
function Input({
  label,
  name,
  value,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value}
        required
        className="mt-1 min-h-11 w-full rounded-xl border px-3"
      />
    </label>
  );
}
function mapType(type: string) {
  if (type === "serviced_accommodation") return "airbnb_operator";
  if (type === "portfolio_landlord") return "landlord";
  if (type === "commercial_operator") return "office_business";
  return [
    "letting_agent",
    "property_manager",
    "airbnb_operator",
    "office_business",
    "block_manager",
  ].includes(type)
    ? type
    : "other";
}
