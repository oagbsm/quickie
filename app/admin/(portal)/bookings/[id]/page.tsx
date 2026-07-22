import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  assignProvider,
  confirmPrice,
  transitionBooking,
  unassignProvider,
  updateBookingOperations,
} from "@/app/admin/actions";
import StatusBadge from "@/app/admin/components/StatusBadge";
import {
  allowedBookingTransitions,
  isBookingStatus,
  getBookingStatus,
} from "@/lib/business/booking-status";
import { formatBusinessDateTime } from "@/lib/business/time";
import { formatDuration, formatMoney } from "@/lib/business/pricing";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params,
    q = await searchParams;
  await requireAdmin();
  const db = createSupabaseAdminClient();
  const [
    { data: b },
    { data: providers },
    { data: audit },
    { data: notifications },
  ] = await Promise.all([
    db
      .from("business_bookings")
      .select(
        "*,properties(*),business_accounts(*),service_providers:assigned_provider_id(*)",
      )
      .eq("id", id)
      .maybeSingle(),
    db
      .from("service_providers")
      .select("id,name,email,phone,status,service_area")
      .eq("status", "active")
      .order("name"),
    db
      .from("admin_audit_log")
      .select("id,action,previous_value,new_value,created_at")
      .eq("entity_type", "business_booking")
      .eq("entity_id", id)
      .order("created_at", { ascending: false }),
    db
      .from("business_notifications")
      .select("notification_type,channel,delivery_status,sent_at,error")
      .eq("booking_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!b) notFound();
  const p = Array.isArray(b.properties) ? b.properties[0] : b.properties,
    a = Array.isArray(b.business_accounts)
      ? b.business_accounts[0]
      : b.business_accounts,
    provider = Array.isArray(b.service_providers)
      ? b.service_providers[0]
      : b.service_providers;
  const { data: member } = await db
    .from("business_members")
    .select("user_id,full_name")
    .eq("account_id", b.account_id)
    .eq("role", "owner")
    .maybeSingle();
  const {
    data: { user: customerUser },
  } = member
    ? await db.auth.admin.getUserById(member.user_id)
    : { data: { user: null } };
  const outward = String(p?.postcode || "").toUpperCase().match(/^[A-Z]+\d+/)?.[0];
  const suitableProviders = providers?.filter((x) => outward && x.service_area?.includes(outward)) || [];
  const currentStatus = String(b.status);
  const transitions = isBookingStatus(currentStatus)
    ? allowedBookingTransitions[currentStatus]
    : [];
  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href="/admin/bookings"
        className="text-sm font-black text-[#657089]"
      >
        ← Bookings
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.12em] text-[#079448]">
            Booking {b.id.slice(0, 8).toUpperCase()}
          </p>
          <h1 className="mt-1 text-3xl font-black">{p?.nickname}</h1>
          <p className="mt-1 text-[#657089]">
            {formatBusinessDateTime(b.scheduled_start)} ·{" "}
            {b.service.replaceAll("_", " ")}
          </p>
        </div>
        <StatusBadge status={b.status} />
      </div>
      {q.error && (
        <div
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 font-bold text-red-800"
        >
          Action failed: {decodeURIComponent(q.error)}
        </div>
      )}
      {q.success && (
        <div className="mt-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">
          Booking updated successfully.
        </div>
      )}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <Panel title="Customer">
            <Details
              rows={[
                ["Account", a?.name],
                ["Contact", member?.full_name],
                ["Email", customerUser?.email],
                ["Phone", a?.phone],
              ]}
            />
          </Panel>
          <Panel title="Property">
            <Details
              rows={[
                [
                  "Address",
                  [p?.address_line_1, p?.address_line_2, p?.city, p?.postcode]
                    .filter(Boolean)
                    .join(", "),
                ],
                ["Type", p?.property_type?.replaceAll("_", " ")],
                [
                  "Layout",
                  `${p?.bedrooms ?? "—"} bedrooms, ${p?.bathrooms ?? "—"} bathrooms`,
                ],
                ["Airbnb turnover", p?.is_airbnb_turnover ? "Yes" : "No"],
                ["Service area", p?.service_area_status?.replaceAll("_", " ")],
              ]}
            />
            <details className="mt-4 rounded-xl bg-[#f5f7f8] p-4">
              <summary className="cursor-pointer font-black">
                Protected operational instructions
              </summary>
              <Details
                rows={[
                  ["Access method", p?.access_method],
                  ["Access instructions", p?.access_notes],
                  ["Key / lockbox", p?.key_instructions],
                  ["Cleaning notes", p?.cleaning_notes],
                  ["Linen", p?.linen_requirements],
                  ["Parking", p?.parking_notes],
                ]}
              />
            </details>
          </Panel>
          <Panel title="Booking">
            <Details
              rows={[
                ["Service", b.service.replaceAll("_", " ")],
                ["Frequency", b.recurrence?.replaceAll("_", " ")],
                ["Requested time", formatBusinessDateTime(b.scheduled_start)],
                [
                  "Duration",
                  b.duration_minutes
                    ? formatDuration(b.duration_minutes)
                    : "Awaiting estimate",
                ],
                ["Customer notes", b.requirements || "None"],
                [
                  "Extras",
                  Array.isArray(b.extras) && b.extras.length
                    ? b.extras.join(", ")
                    : "None",
                ],
              ]}
            />
          </Panel>
          <Panel title="Pricing">
            <div className="grid gap-3">
              {Array.isArray(b.pricing_breakdown) &&
                b.pricing_breakdown.map(
                  (line: {
                    key: string;
                    label: string;
                    amountPence: number;
                  }) => (
                    <div
                      key={line.key}
                      className="flex justify-between text-sm"
                    >
                      <span>{line.label}</span>
                      <strong>
                        {line.amountPence
                          ? formatMoney(line.amountPence)
                          : "Included"}
                      </strong>
                    </div>
                  ),
                )}
              <div className="flex justify-between border-t pt-3 text-lg font-black">
                <span>
                  {b.agreed_price_pence != null
                    ? "Agreed price"
                    : "Estimated price"}
                </span>
                <span>{b.agreed_price_pence != null || b.estimated_price_pence != null ? formatMoney(b.agreed_price_pence ?? b.estimated_price_pence) : "Awaiting price"}</span>
              </div>
              {b.price_override_reason && (
                <p className="rounded-xl bg-amber-50 p-3 text-sm">
                  <strong>Override reason:</strong> {b.price_override_reason}
                </p>
              )}
            </div>
          </Panel>
          <Panel title="Operations">
            <form action={updateBookingOperations} className="grid gap-4">
              <input type="hidden" name="bookingId" value={b.id} />
              <label className="font-bold">Internal notes<textarea name="internalNotes" defaultValue={b.internal_notes || ""} rows={3} className="mt-2 w-full rounded-xl border p-3" /></label>
              <label className="font-bold">Customer update<textarea name="customerUpdate" defaultValue={b.customer_update || ""} rows={3} className="mt-2 w-full rounded-xl border p-3" /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="font-bold">Arrival from<input type="datetime-local" name="arrivalStart" className="mt-2 w-full rounded-xl border p-3" /></label>
                <label className="font-bold">Arrival to<input type="datetime-local" name="arrivalEnd" className="mt-2 w-full rounded-xl border p-3" /></label>
              </div>
              <button className="min-h-11 rounded-xl bg-[#071638] px-4 font-black text-white">Save operational details</button>
            </form>
          </Panel>
          <Panel title="Audit timeline">
            {audit?.length ? (
              <ol className="grid gap-3">
                {audit.map((event) => (
                  <li
                    key={event.id}
                    className="border-l-2 border-[#cfd8e2] pl-4"
                  >
                    <p className="font-bold">
                      {event.action.replaceAll("_", " ")}
                    </p>
                    <p className="text-xs text-[#657089]">
                      {formatBusinessDateTime(event.created_at)}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[#657089]">
                No admin actions recorded yet.
              </p>
            )}
          </Panel>
          <Panel title="Notifications">
            {notifications?.length ? (
              <div className="grid gap-2">
                {notifications.map((n, i) => (
                  <div
                    key={`${n.notification_type}-${i}`}
                    className="flex justify-between rounded-xl bg-[#f5f7f8] p-3 text-sm"
                  >
                    <span>
                      {n.notification_type.replaceAll("_", " ")} · {n.channel}
                    </span>
                    <strong>{n.delivery_status}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#657089]">No notifications sent.</p>
            )}
          </Panel>
        </div>
        <aside className="grid h-fit gap-4 lg:sticky lg:top-24">
          <Panel title="Price confirmation">
            <form action={confirmPrice} className="grid gap-3">
              <input type="hidden" name="bookingId" value={b.id} />
              <label className="font-bold">
                Final price (£)
                <input
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  defaultValue={b.agreed_price_pence != null || b.estimated_price_pence != null ? ((b.agreed_price_pence ?? b.estimated_price_pence) / 100).toFixed(2) : ""}
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </label>
              <label className="font-bold">
                Override reason
                <input
                  name="reason"
                  placeholder="Required when price changes"
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </label>
              <button className="min-h-11 rounded-xl bg-[#079448] px-4 font-black text-white">
                Confirm price
              </button>
            </form>
          </Panel>
          <Panel title="Provider assignment">
            {provider ? (
              <div>
                <p className="font-black">Assigned to: {provider.name}</p>
                <p className="mt-1 text-sm text-[#657089]">
                  {provider.phone || provider.email || "No contact saved"}
                </p>
                <Details
                  rows={[
                    ["Acceptance", b.provider_acceptance],
                    [
                      "Assigned",
                      b.assigned_at
                        ? formatBusinessDateTime(b.assigned_at)
                        : "—",
                    ],
                    ["Notification", b.provider_notification_status],
                  ]}
                />
                <form action={unassignProvider} className="mt-4">
                  <input type="hidden" name="bookingId" value={b.id} />
                  <button className="min-h-11 w-full rounded-xl border border-red-200 font-black text-red-700">
                    Unassign provider
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-sm text-[#657089]">No provider assigned.</p>
            )}
            <form action={assignProvider} className="mt-4 grid gap-3">
              <input type="hidden" name="bookingId" value={b.id} />
              <select
                name="providerId"
                required
                defaultValue=""
                className="min-h-11 rounded-xl border px-3"
              >
                <option value="" disabled>
                  {provider ? "Change provider" : "Select provider"}
                </option>
                {suitableProviders.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
              <button
                disabled={!["confirmed", "provider_assigned"].includes(b.status) || !suitableProviders.length}
                className="min-h-11 rounded-xl bg-[#071638] px-4 font-black text-white disabled:opacity-40"
              >
                {provider ? "Change provider" : "Assign provider"}
              </button>
              {!suitableProviders.length && <p className="text-sm font-bold text-amber-800">No active provider covers {outward || "this postcode"}. Update provider service areas first.</p>}
            </form>
          </Panel>
          <Panel title="Booking actions">
            <div className="grid gap-2">
              {transitions.map((status) => (
                <form action={transitionBooking} key={status}>
                  <input type="hidden" name="bookingId" value={b.id} />
                  <input type="hidden" name="status" value={status} />
                  {(status === "cancelled" || status === "unable_to_fulfil") && <input name="reason" required minLength={5} placeholder="Reason (required)" className="mb-2 min-h-11 w-full rounded-xl border px-3" />}
                  {status === "completed" && <textarea name="completionNote" placeholder="Optional factual completion note" className="mb-2 w-full rounded-xl border p-3" />}
                  <button
                    className={`min-h-11 w-full rounded-xl px-4 font-black ${status === "cancelled" ? "border border-red-200 text-red-700" : "bg-[#071638] text-white"}`}
                  >
                    {status === "cancelled"
                      ? "Cancel booking"
                      : getBookingStatus(status).adminLabel}
                  </button>
                </form>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-5">
      <h2 className="mb-4 text-lg font-black">{title}</h2>
      {children}
    </section>
  );
}
function Details({ rows }: { rows: Array<[string, unknown]> }) {
  return (
    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-bold uppercase tracking-wide text-[#788398]">
            {label}
          </dt>
          <dd className="mt-1 break-words font-semibold">
            {String(value || "—")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
