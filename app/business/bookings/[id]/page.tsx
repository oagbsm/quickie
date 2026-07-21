import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";
import {
  bookingStatusConfig,
  getBookingStatus,
  isBookingStatus,
} from "@/lib/business/booking-status";
import { formatBusinessDateTime } from "@/lib/business/time";
import { formatDuration, formatMoney } from "@/lib/business/pricing";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    { supabase, accountId } = await requireBusinessUser();
  const [{ data: b }, { data: report }, { data: photos }] = await Promise.all([
    supabase
      .from("business_bookings")
      .select(
        "id,service,scheduled_start,status,requirements,recurrence,extras,duration_minutes,pricing_breakdown,pricing_mode,estimated_price_pence,estimated_price_max_pence,agreed_price_pence,completed_at,check_in_at,assigned_at,provider_acceptance,properties(nickname,address_line_1,address_line_2,city,postcode,access_method),service_providers:assigned_provider_id(name)",
      )
      .eq("id", id)
      .eq("account_id", accountId)
      .maybeSingle(),
    supabase
      .from("completion_reports")
      .select("checklist,notes,issues_found,completed_at")
      .eq("booking_id", id)
      .eq("account_id", accountId)
      .maybeSingle(),
    supabase
      .from("booking_photos")
      .select("id,storage_path")
      .eq("booking_id", id)
      .eq("account_id", accountId),
  ]);
  if (!b) notFound();
  const signed = photos?.length
      ? (
          await supabase.storage.from("business-evidence").createSignedUrls(
            photos.map((p) => p.storage_path),
            3600,
          )
        ).data || []
      : [],
    p = Array.isArray(b.properties) ? b.properties[0] : b.properties,
    provider = Array.isArray(b.service_providers)
      ? b.service_providers[0]
      : b.service_providers,
    status = getBookingStatus(b.status),
    completed = b.status === "completed" && report,
    currentOrder = isBookingStatus(b.status)
      ? bookingStatusConfig[b.status].order
      : 1;
  const steps = [
    { label: "Request received", order: 1, when: true, time: null },
    {
      label: "Quickola reviewing",
      order: 2,
      when: currentOrder >= 2,
      time: null,
    },
    {
      label: "Price confirmed",
      order: 3,
      when: b.agreed_price_pence != null,
      time: null,
    },
    {
      label: "Cleaner assigned",
      order: 4,
      when: Boolean(b.assigned_at),
      time: b.assigned_at,
    },
    {
      label: "Cleaner checked in",
      order: 5,
      when: Boolean(b.check_in_at),
      time: b.check_in_at,
    },
    {
      label: "Clean completed",
      order: 6,
      when: Boolean(b.completed_at),
      time: b.completed_at,
    },
    {
      label: "Property ready",
      order: 7,
      when: Boolean(completed),
      time: report?.completed_at,
    },
  ].filter((x) => x.when);
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/business/bookings"
        className="text-sm font-black text-[#657089]"
      >
        ← Bookings
      </Link>
      <header
        className={`mt-4 rounded-3xl p-7 text-white ${completed ? "bg-[#079448]" : "bg-[#071638]"}`}
      >
        <p className="text-xs font-black uppercase tracking-[.12em] text-white/65">
          Booking {b.id.slice(0, 8).toUpperCase()}
        </p>
        <h1 className="mt-2 text-3xl font-black">
          {completed ? "Your property is ready." : status.customerLabel}
        </h1>
        <p className="mt-2 text-white/75">
          {p?.nickname} ·{" "}
          {formatBusinessDateTime(b.scheduled_start, {
            dateStyle: "full",
            timeStyle: "short",
          })}
        </p>
      </header>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-5">
          <Panel title="What happens next">
            <p className="font-bold">{status.customerCopy}</p>
            {b.status === "requested" && (
              <p className="mt-2 text-sm text-[#657089]">
                Quickola is confirming cleaner availability.
              </p>
            )}
            {b.status === "under_review" && (
              <p className="mt-2 text-sm text-[#657089]">
                We will confirm your final price before work begins.
              </p>
            )}
          </Panel>
          <Panel title="Booking progress">
            <ol className="grid gap-4">
              {steps.map((step, i) => (
                <li key={step.label} className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#079448] font-black text-white">
                    ✓
                  </span>
                  <div>
                    <p className="font-black">{step.label}</p>
                    {step.time && (
                      <p className="text-xs text-[#657089]">
                        {formatBusinessDateTime(step.time)}
                      </p>
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <span className="sr-only">then</span>
                  )}
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="Service details">
            <Details
              rows={[
                [
                  "Property",
                  [p?.address_line_1, p?.address_line_2, p?.city, p?.postcode]
                    .filter(Boolean)
                    .join(", "),
                ],
                ["Service", b.service.replaceAll("_", " ")],
                ["Frequency", b.recurrence.replaceAll("_", " ")],
                [
                  "Date and time",
                  formatBusinessDateTime(b.scheduled_start, {
                    dateStyle: "full",
                    timeStyle: "short",
                  }),
                ],
                [
                  "Estimated duration",
                  b.duration_minutes
                    ? formatDuration(b.duration_minutes)
                    : "To be confirmed",
                ],
                [
                  "Extras",
                  Array.isArray(b.extras) && b.extras.length
                    ? b.extras
                        .map((x: string) => x.replaceAll("_", " "))
                        .join(", ")
                    : "None",
                ],
                ["Your notes", b.requirements || "None"],
                ["Access", p?.access_method || "Not specified"],
              ]}
            />
          </Panel>
          {completed && (
            <>
              <Panel title="Completion report">
                <Details
                  rows={[
                    ["Completed", formatBusinessDateTime(report.completed_at)],
                    ["Cleaner", provider?.name || "Quickola cleaner"],
                    ["Notes", report.notes || "No additional notes"],
                    ["Issues", report.issues_found || "None reported"],
                  ]}
                />
                <ul className="mt-5 grid gap-2">
                  {Array.isArray(report.checklist) &&
                    report.checklist.map(
                      (x: { label: string; complete: boolean }) => (
                        <li key={x.label} className="flex gap-2 font-bold">
                          <span className="text-[#079448]">✓</span>
                          {x.label}
                        </li>
                      ),
                    )}
                </ul>
              </Panel>
              <Panel title="Completion photos">
                {signed.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {signed.map((x, i) =>
                      x.signedUrl ? (
                        <Image
                          key={x.signedUrl}
                          src={x.signedUrl}
                          alt={`Completion photo ${i + 1}`}
                          width={600}
                          height={450}
                          className="aspect-[4/3] rounded-xl object-cover"
                        />
                      ) : null,
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#657089]">
                    No completion photos available.
                  </p>
                )}
              </Panel>
            </>
          )}
        </div>
        <aside className="grid h-fit gap-5 lg:sticky lg:top-24">
          <Panel title="Price">
            <Price booking={b} />
          </Panel>
          <Panel title="Cleaner">
            <p className="font-black">{provider?.name || "Being arranged"}</p>
            <p className="mt-2 text-sm text-[#657089]">
              {provider
                ? b.provider_acceptance === "accepted"
                  ? "Cleaner accepted"
                  : "Assignment in progress"
                : "Quickola will update this booking when a cleaner is assigned."}
            </p>
          </Panel>
          <Panel title="Need help?">
            <p className="text-sm text-[#657089]">
              Questions or changes can be sent securely through the Quickola
              contact form.
            </p>
            <Link
              href={`/contact?booking=${b.id}`}
              className="mt-4 inline-flex min-h-11 items-center rounded-xl border px-4 font-black"
            >
              Contact Quickola
            </Link>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
function Price({ booking: b }: { booking: any }) {
  const agreed = b.agreed_price_pence != null,
    manual = b.pricing_mode === "manual_review",
    hasEstimate = b.estimated_price_pence != null;
  return (
    <div>
      {Array.isArray(b.pricing_breakdown) && (
        <div className="mb-4 grid gap-2">
          {b.pricing_breakdown.map(
            (line: { key: string; label: string; amountPence: number }) => (
              <div key={line.key} className="flex justify-between text-sm">
                <span>{line.label}</span>
                <strong>
                  {line.amountPence
                    ? formatMoney(line.amountPence)
                    : "Included"}
                </strong>
              </div>
            ),
          )}
        </div>
      )}
      <div className="border-t pt-4">
        <p className="text-sm font-bold text-[#657089]">
          {agreed
            ? "Agreed price"
            : manual
              ? "Estimated range"
              : "Estimated price"}
        </p>
        <p className="mt-1 text-3xl font-black">
          {agreed
            ? formatMoney(b.agreed_price_pence)
            : !hasEstimate
              ? "Awaiting price"
              : manual
              ? `${formatMoney(b.estimated_price_pence)}–${formatMoney(b.estimated_price_max_pence)}`
              : formatMoney(b.estimated_price_pence)}
        </p>
        <p className="mt-2 text-xs text-[#657089]">
          {agreed
            ? "This is your confirmed total."
            : manual
              ? "Final price will be confirmed before work begins."
              : "Quickola is confirming cleaner availability."}
        </p>
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
    <dl className="grid gap-4 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-bold uppercase tracking-wide text-[#788398]">
            {label}
          </dt>
          <dd className="mt-1 font-semibold capitalize">
            {String(value || "—")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
