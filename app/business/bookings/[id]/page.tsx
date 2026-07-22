import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";
import {
  cleanOptionalText,
  canShowAssignedProvider,
  formatRecurrenceLabel,
  formatServiceLabel,
  getBookingStatus,
  getPricePresentation,
} from "@/lib/business/booking-status";
import { BookingProgress, BookingStatusBadge } from "@/app/business/components/BookingPresentation";
import { formatBusinessDateTime } from "@/lib/business/time";
import { formatDuration, formatMoney } from "@/lib/business/pricing";
import { acceptBookingChange } from "@/app/business/actions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, accountId } = await requireBusinessUser();
  const [{ data: booking }, { data: report }] = await Promise.all([
    supabase.from("business_bookings").select(
      "id,service,scheduled_start,status,requirements,recurrence,extras,duration_minutes,pricing_breakdown,pricing_mode,estimated_price_pence,estimated_price_max_pence,agreed_price_pence,completed_at,completion_notes,check_in_at,check_out_at,assigned_at,provider_acceptance,estimated_arrival_start,estimated_arrival_end,customer_update,cancel_reason,unable_to_fulfil_reason,properties(nickname,address_line_1,address_line_2,city,postcode,access_method),service_providers:assigned_provider_id(name)",
    ).eq("id", id).eq("account_id", accountId).maybeSingle(),
    supabase.from("completion_reports").select("checklist,notes,issues_found,completed_at").eq("booking_id", id).eq("account_id", accountId).maybeSingle(),
  ]);
  if (!booking) notFound();
  const property = Array.isArray(booking.properties) ? booking.properties[0] : booking.properties;
  const joinedProvider = Array.isArray(booking.service_providers) ? booking.service_providers[0] : booking.service_providers;
  const provider = canShowAssignedProvider(booking.status) ? joinedProvider : null;
  const presentation = getBookingStatus(booking.status);
  const completed = booking.status === "completed";
  const requirements = cleanOptionalText(booking.requirements);
  const completionNotes = cleanOptionalText(booking.completion_notes) || cleanOptionalText(report?.notes);
  const issues = cleanOptionalText(report?.issues_found);
  return <div className="mx-auto max-w-5xl">
    <Link href="/business/bookings" className="text-sm font-black text-[#657089]">← Bookings</Link>
    <header className={`mt-4 rounded-3xl p-6 text-white sm:p-7 ${presentation.tone === "danger" ? "bg-red-900" : completed ? "bg-[#08783f]" : "bg-[#071638]"}`}>
      <p className="text-xs font-black uppercase tracking-[.12em] text-white/70">Booking {booking.id.slice(0, 8).toUpperCase()}</p>
      <h1 className="mt-2 text-3xl font-black">{presentation.customerTitle}</h1>
      <p className="mt-2 text-white/80">{property?.nickname || "Property"} · {formatBusinessDateTime(booking.scheduled_start, { dateStyle: "full", timeStyle: "short" })}</p>
    </header>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="grid gap-5">
        <Panel title="Current status">
          <BookingStatusBadge status={booking.status}/>
          <p className="mt-4 font-bold">{presentation.customerCopy}</p>
          <p className={`mt-2 text-sm font-bold ${presentation.actionRequired ? "text-amber-900" : "text-[#526078]"}`}>{presentation.actionCopy}</p>
          {cleanOptionalText(booking.customer_update) && <p className="mt-3 text-sm text-[#526078]">{cleanOptionalText(booking.customer_update)}</p>}
          {cleanOptionalText(booking.cancel_reason) && <p className="mt-3 text-sm text-red-800">Reason: {cleanOptionalText(booking.cancel_reason)}</p>}
          {cleanOptionalText(booking.unable_to_fulfil_reason) && <p className="mt-3 text-sm text-red-800">Reason: {cleanOptionalText(booking.unable_to_fulfil_reason)}</p>}
          {booking.status === "awaiting_customer_confirmation" && <form action={acceptBookingChange} className="mt-4"><input type="hidden" name="bookingId" value={booking.id}/><button className="min-h-11 rounded-xl bg-[#08783f] px-5 font-black text-white">Approve revised details</button></form>}
        </Panel>
        <Panel title="Booking progress"><BookingProgress status={booking.status}/></Panel>
        <Panel title="Service details"><Details rows={[
          ["Property", [property?.address_line_1, property?.address_line_2, property?.city, property?.postcode].filter(Boolean).join(", ")],
          ["Service", formatServiceLabel(booking.service)],
          ["Frequency", formatRecurrenceLabel(booking.recurrence)],
          ["Date and time", formatBusinessDateTime(booking.scheduled_start, { dateStyle: "full", timeStyle: "short" })],
          ["Estimated duration", booking.duration_minutes ? formatDuration(booking.duration_minutes) : "To be confirmed"],
          ["Extras", Array.isArray(booking.extras) && booking.extras.length ? booking.extras.map((item: string) => item.replaceAll("_", " ")).join(", ") : "None"],
          ["Your notes", requirements],
          ["Access method", property?.access_method || "Not specified"],
        ]}/></Panel>
        {completed && <Panel title="Completion details"><Details rows={[
          ["Completed", booking.completed_at ? formatBusinessDateTime(booking.completed_at) : null],
          ["Arrived", booking.check_in_at ? formatBusinessDateTime(booking.check_in_at) : null],
          ["Departed", booking.check_out_at ? formatBusinessDateTime(booking.check_out_at) : null],
          ["Time on site", elapsedTime(booking.check_in_at, booking.check_out_at)],
          ["Completion notes", completionNotes],
          ["Reported issues", issues],
        ]}/>{!completionNotes && !issues && !booking.check_in_at && !booking.check_out_at && <p className="text-sm text-[#526078]">No additional completion details were recorded.</p>}</Panel>}
      </div>
      <aside className="grid h-fit gap-5 lg:sticky lg:top-24">
        <Panel title="Price"><Price booking={booking}/></Panel>
        {provider && <Panel title="Cleaning team"><p className="font-black">{provider.name}</p>{booking.estimated_arrival_start && <p className="mt-2 text-sm text-[#526078]">Arrival window: {formatBusinessDateTime(booking.estimated_arrival_start, { timeStyle: "short" })}{booking.estimated_arrival_end ? `–${new Intl.DateTimeFormat("en-GB", { timeStyle: "short", timeZone: "Europe/London" }).format(new Date(booking.estimated_arrival_end))}` : ""}</p>}</Panel>}
        <Panel title="Operations support"><p className="text-sm text-[#526078]">Questions or changes can be sent securely through the Quickola contact form.</p><Link href={`/contact?booking=${booking.id}`} className="mt-4 inline-flex min-h-11 items-center rounded-xl border px-4 font-black">Contact Quickola</Link></Panel>
      </aside>
    </div>
  </div>;
}

function Price({ booking }: { booking: Parameters<typeof getPricePresentation>[0] & { pricing_breakdown?: unknown } }) {
  const price = getPricePresentation(booking);
  return <div>{Array.isArray(booking.pricing_breakdown) && <div className="mb-4 grid gap-2">{booking.pricing_breakdown.map((line: { key:string; label:string; amountPence:number }) => <div key={line.key} className="flex justify-between gap-4 text-sm"><span>{line.label}</span><strong>{line.amountPence ? formatMoney(line.amountPence) : "Included"}</strong></div>)}</div>}<div className="border-t pt-4"><p className="text-sm font-bold text-[#526078]">{price.label}</p><p className="mt-1 text-3xl font-black">{price.amountPence == null ? "To be confirmed" : price.maximumPence ? `${formatMoney(price.amountPence)}–${formatMoney(price.maximumPence)}` : formatMoney(price.amountPence)}</p><p className="mt-2 text-sm text-[#526078]">{price.explanation}</p></div></div>;
}
function Panel({ title, children }: { title:string; children:React.ReactNode }) { return <section className="rounded-2xl border bg-white p-5"><h2 className="mb-4 text-lg font-black">{title}</h2>{children}</section>; }
function Details({ rows }: { rows:Array<[string, unknown]> }) { const visible=rows.filter(([,value])=>value !== null && value !== undefined && String(value).trim() !== ""); return <dl className="grid gap-4 sm:grid-cols-2">{visible.map(([label,value])=><div key={label}><dt className="text-xs font-bold uppercase tracking-wide text-[#667286]">{label}</dt><dd className="mt-1 font-semibold">{String(value)}</dd></div>)}</dl>; }
function elapsedTime(start: string | null, end: string | null) { if (!start || !end) return null; const minutes=Math.max(0,Math.round((new Date(end).getTime()-new Date(start).getTime())/60000)); return formatDuration(minutes); }
