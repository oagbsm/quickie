"use client";

import { useActionState, useEffect } from "react";
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
  return (
    <section className="mt-6 grid gap-4" aria-labelledby="reservation-sources-title">
      <div>
        <h2 id="reservation-sources-title" className="text-xl font-extrabold">Booking calendar</h2>
        <p className="mt-1 text-sm text-[#657089]">Connect Airbnb, Booking.com, Vrbo, Expedia or another calendar to import bookings.</p>
        <p className="mt-2 text-xs font-semibold text-[#657089]">Healthy sources sync automatically. If a source needs attention, existing bookings stay safe while you review the issue.</p>
      </div>
      {connections.map((connection) => (
        <article key={connection.id} className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-lg font-extrabold">{connection.display_name || providerName(connection.provider)}</p>
              <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${connection.sync_status === "healthy" ? "bg-emerald-50 text-emerald-800" : connection.sync_status === "disabled" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-900"}`}>
                {connection.sync_status === "healthy" ? "Healthy" : connection.sync_status === "disabled" ? "Disabled" : connection.sync_status === "never_synced" ? "Pending first sync" : connection.sync_status === "syncing" ? "Syncing" : "Needs attention"}
              </span>
            </div>
            {connection.is_active && <SyncButton propertyId={propertyId} connectionId={connection.id} />}
          </div>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-4">
            <div><dt className="portal-label">Last successful sync</dt><dd className="mt-1 font-bold">{connection.last_successful_sync_at ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(connection.last_successful_sync_at)) : "Not yet"}</dd></div>
            <div><dt className="portal-label">Next automatic sync</dt><dd className="mt-1 font-bold">{connection.is_active ? "Pending scheduler" : "Disabled"}</dd></div>
            <div><dt className="portal-label">Imported bookings</dt><dd className="mt-1 font-bold">{connection.imported_reservation_count} active</dd></div>
            <div><dt className="portal-label">Action required</dt><dd className="mt-1 font-bold">{connection.open_issue_count || "None"}</dd></div>
          </dl>
          <p className="mt-4 break-all text-xs text-[#657089]">{connection.masked_calendar_url}</p>
          {connection.last_error_message && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-900">{connection.last_error_message}</p>}
          {connection.open_issues.length > 0 && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
              <p className="font-extrabold">Action required</p>
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
      {connections.length === 0 && (
        <details open className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
          <summary className="cursor-pointer font-extrabold">Connect booking calendar</summary>
          <RefreshOnSuccess state={state} />
          <form action={action} className="mt-5 grid gap-5" noValidate>
            <label className="font-bold">Platform
              <select name="provider" defaultValue="airbnb" className={field}>
                <option value="airbnb">Airbnb</option><option value="booking_com">Booking.com</option><option value="vrbo">Vrbo</option><option value="expedia">Expedia</option><option value="other">Other calendar</option>
              </select>
              {state.fieldErrors.provider && <span className="mt-1 block text-sm text-red-700">{state.fieldErrors.provider}</span>}
            </label>
            <label className="font-bold">Calendar URL
              <input name="calendarUrl" type="url" required autoComplete="off" placeholder="https://…" className={field} />
              <span className="mt-1 block text-xs font-normal text-[#657089]">Paste the private calendar link supplied by the booking platform.</span>
              {state.fieldErrors.calendarUrl && <span className="mt-1 block text-sm text-red-700">{state.fieldErrors.calendarUrl}</span>}
            </label>
            <button disabled={pending} className="portal-action justify-self-start disabled:opacity-60">{pending ? "Connecting…" : "Connect and sync"}</button>
          </form>
          <div className="mt-4"><Result state={state} /></div>
        </details>
      )}
    </section>
  );
}
