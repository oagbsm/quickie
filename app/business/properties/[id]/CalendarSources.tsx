"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  initialCalendarActionState,
  type CalendarActionState,
} from "@/lib/calendar/action-state";
import type { SafeCalendarConnection } from "@/lib/server/property-calendars";
import {
  connectCalendarAction,
  manageCalendarAction,
  syncCalendarAction,
} from "../calendar-actions";

const field =
  "mt-1.5 min-h-11 w-full rounded-lg border border-[#cfd7e3] bg-white px-3 py-2 outline-none focus:border-[#2d67b2] focus:ring-4 focus:ring-[#2d67b2]/15";

const providerName = (provider: SafeCalendarConnection["provider"]) =>
  ({ airbnb: "Airbnb", booking_com: "Booking.com", vrbo: "Vrbo", expedia: "Expedia", other: "Other calendar" })[provider];

const providerOptions = [
  { value: "airbnb", label: "Airbnb", image: "/icons/airbnb.png", width: 82, height: 30 },
  { value: "booking_com", label: "Booking.com", image: "/icons/booking.jpg", width: 105, height: 27 },
  { value: "vrbo", label: "Vrbo", image: "/icons/vrbo.png", width: 82, height: 30 },
  { value: "expedia", label: "Expedia", image: "/icons/expedia.png", width: 88, height: 28 },
  { value: "other", label: "Other", image: null, width: 0, height: 0 },
] as const;

function CalendarIcon({ link = false }: { link?: boolean }) {
  return link ? (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m10 13 4-4M8.5 16.5l-1 1a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0M15.5 7.5l1-1a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" />
    </svg>
  );
}

function Result({ state }: { state: CalendarActionState }) {
  if (!state.message) return null;
  return (
    <div
      role={state.status === "error" ? "alert" : "status"}
      className={`rounded-lg p-3 text-sm font-bold ${state.status === "error" ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}
    >
      <p>{state.message}</p>
      {state.summary && <p className="mt-1 font-medium">{state.summary}</p>}
    </div>
  );
}

function RefreshOnSuccess({ state }: { state: CalendarActionState }) {
  const router = useRouter();
  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);
  return null;
}

function SyncButton({ propertyId, connectionId }: { propertyId: string; connectionId: string }) {
  const action = syncCalendarAction.bind(null, propertyId, connectionId);
  const [state, formAction, pending] = useActionState(action, initialCalendarActionState);
  return (
    <div className="grid gap-2">
      <RefreshOnSuccess state={state} />
      <form action={formAction}>
        <button disabled={pending} className="portal-action-secondary w-full disabled:opacity-60 sm:w-auto">
          {pending ? "Syncing…" : "Sync now"}
        </button>
      </form>
      <Result state={state} />
    </div>
  );
}

function ManageConnection({ propertyId, connection }: { propertyId: string; connection: SafeCalendarConnection }) {
  const action = manageCalendarAction.bind(null, propertyId, connection.id);
  const [state, formAction, pending] = useActionState(action, initialCalendarActionState);
  return (
    <details className="rounded-lg border border-[#dfe4eb] bg-[#fafbfd] p-3">
      <summary className="cursor-pointer text-sm font-extrabold">Manage</summary>
      <RefreshOnSuccess state={state} />
      <form action={formAction} className="mt-4 grid gap-4">
        <label className="text-sm font-bold">
          Replace calendar URL
          <input name="calendarUrl" type="url" autoComplete="off" placeholder="https://…" className={field} />
        </label>
        <button name="intent" value="replace_url" disabled={pending} className="portal-action-secondary justify-self-start">
          Replace URL
        </button>
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <button name="intent" value={connection.is_active ? "disable" : "enable"} disabled={pending} className="portal-action-secondary">
            {connection.is_active ? "Disable" : "Re-enable"}
          </button>
        </div>
        <div className="grid gap-2 border-t border-red-100 pt-4">
          <label className="flex items-start gap-2 text-sm font-bold text-red-800">
            <input type="checkbox" name="confirmRemove" value="yes" className="mt-1 h-4 w-4" />
            Remove this connection. Imported booking history will remain.
          </label>
          <button name="intent" value="remove" disabled={pending} className="min-h-11 justify-self-start rounded-lg bg-red-700 px-4 font-extrabold text-white">
            Remove connection
          </button>
        </div>
      </form>
      <div className="mt-3"><Result state={state} /></div>
    </details>
  );
}

export default function CalendarSources({ propertyId, connections }: { propertyId: string; connections: SafeCalendarConnection[] }) {
  const connect = connectCalendarAction.bind(null, propertyId);
  const [state, action, pending] = useActionState(connect, initialCalendarActionState);
  const [selectedProvider, setSelectedProvider] = useState("airbnb");
  const [showConnectForm, setShowConnectForm] = useState(connections.length === 0);
  const selectedProviderLabel = providerOptions.find((option) => option.value === selectedProvider)?.label;
  const connectFormVisible = connections.length === 0 || (showConnectForm && state.status !== "success");
  return (
    <section className="mt-6 grid gap-4" aria-labelledby="reservation-sources-title">
      <div>
        <h2 id="reservation-sources-title" className="text-xl font-extrabold">Booking calendar</h2>
        <p className="mt-1 text-sm text-[#657089]">Import bookings automatically from your reservation calendars.</p>
      </div>
      {connections.length > 0 && <h3 className="text-sm font-extrabold text-[#657089]">Connected calendars</h3>}
      {connections.map((connection) => (
        <article key={connection.id} className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
          {(() => {
            const conflictOnly = connection.open_issues.length > 0 && connection.open_issues.every((issue) => issue.issue_type === "overlap_conflict");
            return <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-lg font-extrabold">{connection.display_name || providerName(connection.provider)}</p>
              <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${connection.sync_status === "healthy" || conflictOnly ? "bg-emerald-50 text-emerald-800" : connection.sync_status === "disabled" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-900"}`}>
                {connection.sync_status === "healthy" || conflictOnly ? "Healthy" : connection.sync_status === "disabled" ? "Disabled" : connection.sync_status === "never_synced" ? "Pending first sync" : connection.sync_status === "syncing" ? "Syncing" : "Needs attention"}
              </span>
            </div>
            {connection.is_active && <SyncButton propertyId={propertyId} connectionId={connection.id} />}
          </div>;
          })()}
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-4">
            <div><dt className="portal-label">Last successful sync</dt><dd className="mt-1 font-bold">{connection.last_successful_sync_at ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(connection.last_successful_sync_at)) : "Not yet"}</dd></div>
            <div><dt className="portal-label">Automatic sync</dt><dd className="mt-1 font-bold">{connection.is_active ? "Enabled" : "Disabled"}</dd></div>
            <div><dt className="portal-label">Imported bookings</dt><dd className="mt-1 font-bold">{connection.imported_reservation_count} active</dd></div>
            <div><dt className="portal-label">Action required</dt><dd className="mt-1 font-bold">{connection.open_issue_count || "None"}</dd></div>
          </dl>
          <p className="mt-4 break-all text-xs text-[#657089]">{connection.masked_calendar_url}</p>
          {connection.last_error_message && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-900">{connection.last_error_message}</p>}
          {connection.open_issues.length > 0 && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
              <p className="font-extrabold">{connection.open_issues.every((issue) => issue.issue_type === "overlap_conflict") ? "Booking conflict" : "Action required"}</p>
              <ul className="mt-1 grid gap-1">
                {connection.open_issues.map((issue) => (
                  <li key={issue.id}>{issue.safe_message}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4"><ManageConnection propertyId={propertyId} connection={connection} /></div>
        </article>
      ))}
      {connections.length > 0 && !connectFormVisible && (
        <button
          type="button"
          onClick={() => setShowConnectForm(true)}
          className="portal-action-secondary min-h-11 w-full justify-center sm:w-auto"
          aria-expanded={showConnectForm}
        >
          + Add calendar
        </button>
      )}
      {connectFormVisible && (
        <article className="max-w-3xl rounded-xl border border-[#dfe4eb] bg-white p-4 shadow-sm sm:p-6">
          <RefreshOnSuccess state={state} />
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-extrabold text-[#071f49]">Connect your calendar</h3>
            {connections.length > 0 && (
              <button type="button" onClick={() => setShowConnectForm(false)} className="min-h-11 px-2 text-sm font-bold text-[#245b9d]">
                Cancel
              </button>
            )}
          </div>
          <form action={action} className="mt-4 grid gap-4" noValidate>
            <fieldset>
              <legend className="font-bold">Platform</legend>
              <div className="mt-2 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
                {providerOptions.map((option) => (
                  <label key={option.value} className={`flex min-h-16 min-w-0 cursor-pointer items-center justify-start gap-3 rounded-lg border border-[#cfd7e3] bg-white px-3 py-2 text-left text-sm font-bold outline-none transition-colors hover:bg-[#f7f9fc] has-[:checked]:border-[#2d67b2] has-[:checked]:bg-[#eef5ff] has-[:checked]:text-[#071f49] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#2d67b2]/15 sm:min-h-[68px] sm:justify-center sm:px-2 sm:text-center ${option.value === "other" ? "col-span-2 sm:col-span-1" : ""}`}>
                    <input type="radio" name="provider" value={option.value} checked={selectedProvider === option.value} onChange={() => setSelectedProvider(option.value)} className="sr-only" />
                    <span className="grid h-7 w-8 shrink-0 place-items-center sm:h-8">{option.image ? <Image src={option.image} alt="" width={option.width} height={option.height} className="max-h-7 max-w-8 object-contain sm:max-h-8" /> : <CalendarIcon />}</span>
                    <span className="min-w-0 truncate whitespace-nowrap">{option.label}</span>
                  </label>
                ))}
              </div>
              {state.fieldErrors.provider && <span className="mt-1 block text-sm text-red-700">{state.fieldErrors.provider}</span>}
            </fieldset>
            <label className="font-bold">Calendar URL
              <span className="relative mt-1.5 block"><CalendarIcon link /><input name="calendarUrl" type="url" required autoComplete="off" placeholder="Paste calendar URL" aria-describedby="calendar-url-help" className={`${field} mt-0 pl-10`} /></span>
              <span id="calendar-url-help" className="mt-1 block text-xs font-normal text-[#657089]">Paste the private calendar link supplied by the booking platform.</span>
              {state.fieldErrors.calendarUrl && <span className="mt-1 block text-sm text-red-700">{state.fieldErrors.calendarUrl}</span>}
            </label>
            <details className="-mt-2 text-sm"><summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-bold text-[#245b9d]"><span className="text-[#657089]" aria-hidden="true">?</span>{selectedProvider === "other" ? "Where do I find my calendar URL?" : `Where do I find my ${selectedProviderLabel} calendar URL?`}</summary><p className="mt-1 max-w-xl text-xs font-normal text-[#657089]">Open your booking platform’s calendar export or sharing settings and copy its private iCal/ICS link.</p></details>
            <button disabled={pending} className="portal-action min-h-12 w-full justify-center disabled:opacity-60 sm:w-[280px]">{pending ? "Connecting…" : "Connect calendar"}</button>
          </form>
          <div className="mt-4"><Result state={state} /></div>
        </article>
      )}
    </section>
  );
}
