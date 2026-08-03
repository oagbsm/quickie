"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBusinessDateTime, londonFormDateTime } from "@/lib/business/time";
import type { ReservationListItem } from "@/lib/server/reservations";
import { reservationSourceLabel } from "@/lib/reservations/source";
import type { RejectedImportConflict } from "@/lib/reservations/conflicts";
import { initialCalendarActionState } from "@/lib/calendar/action-state";
import { ignoreAllCalendarConflictsAction, ignoreCalendarConflictAction } from "../calendar-actions";

type ViewMode = "calendar" | "list";
type OperationalEvent = {
  reservation: ReservationListItem;
  kind: "check-in" | "checkout" | "cleaning";
  timestamp: string;
};

const sourceName = (reservation: ReservationListItem) => {
  const label = reservationSourceLabel(reservation.source, reservation.sourceConnection);
  if (reservation.sourceConnection?.provider === "other") return "Other";
  return label.replace(/\s+calendar$/i, "");
};
const dayKey = (value: string) => londonFormDateTime(value).date;
const shortDate = (value: string) => formatBusinessDateTime(value, { day: "numeric", month: "short" });
const shortTime = (value: string) => formatBusinessDateTime(value, { hour: "2-digit", minute: "2-digit" });

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function CalendarNavigation({ year, month, onChange }: { year: number; month: number; onChange: (year: number, month: number) => void }) {
  const label = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1)));
  return (
    <div className="flex items-center justify-between gap-2">
      <button type="button" onClick={() => onChange(year, month - 1)} className="min-h-11 rounded-lg border px-3 text-sm font-extrabold" aria-label="Previous month">‹ <span className="hidden sm:inline">Previous</span></button>
      <p className="text-base font-extrabold text-[#071f49]" aria-live="polite">{label}</p>
      <button type="button" onClick={() => onChange(year, month + 1)} className="min-h-11 rounded-lg border px-3 text-sm font-extrabold" aria-label="Next month"><span className="hidden sm:inline">Next</span> ›</button>
    </div>
  );
}

function reservationRange(reservation: ReservationListItem) {
  return `${shortDate(reservation.check_in_at)}, ${shortTime(reservation.check_in_at)} → ${shortDate(reservation.check_out_at)}, ${shortTime(reservation.check_out_at)}`;
}

function cleaningLabel(reservation: ReservationListItem) {
  const turnover = reservation.turnover;
  if (!turnover?.access_start_at || !turnover.window_end_at) return null;
  return `Cleaning window · ${shortDate(turnover.access_start_at)}, ${shortTime(turnover.access_start_at)}–${shortTime(turnover.window_end_at)}`;
}

const providerLabel = (provider: RejectedImportConflict["provider"]) => ({ airbnb: "Airbnb", booking_com: "Booking.com", vrbo: "Vrbo", expedia: "Expedia", other: "Calendar" })[provider];
const rejectedRange = (conflict: RejectedImportConflict) => conflict.startAt && conflict.endAt ? `${shortDate(conflict.startAt)}, ${shortTime(conflict.startAt)} → ${shortDate(conflict.endAt)}, ${shortTime(conflict.endAt)}` : null;
const rejectedAccessibleLabel = (conflict: RejectedImportConflict) => `${providerLabel(conflict.provider)} booking conflict${rejectedRange(conflict) ? `. Attempted guest stay from ${rejectedRange(conflict)}` : ""}. Not imported.`;

function focusConflictTarget(anchorId: string) {
  const target = document.getElementById(anchorId);
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.focus({ preventScroll: true });
  return true;
}

function IgnoreConflictButton({ propertyId, issueId }: { propertyId: string; issueId: string }) {
  const router = useRouter();
  const action = ignoreCalendarConflictAction.bind(null, propertyId, issueId);
  const [state, formAction, pending] = useActionState(action, initialCalendarActionState);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);
  if (!confirming) return <button type="button" onClick={() => setConfirming(true)} className="inline-flex min-h-11 items-center text-sm font-extrabold text-red-950">Ignore conflict</button>;
  return <div className="grid gap-2 rounded-lg border border-red-200 bg-white p-3 text-sm text-red-950"><p className="font-extrabold">Ignore this conflict?</p><p>Quickola will stop warning you about this specific booking conflict. No bookings or calendar data will be changed.</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setConfirming(false)} className="min-h-11 rounded-lg border px-3 font-extrabold">Cancel</button><form action={formAction}><input type="hidden" name="confirmIgnore" value="yes"/><button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-red-800 px-3 font-extrabold text-white disabled:opacity-60">{pending ? "Ignoring…" : "Ignore conflict"}</button></form></div>{state.status === "error" && <p role="alert" className="font-bold">{state.message}</p>}</div>;
}

function IgnoreAllConflictsButton({ propertyId, count }: { propertyId: string; count: number }) {
  const router = useRouter();
  const action = ignoreAllCalendarConflictsAction.bind(null, propertyId);
  const [state, formAction, pending] = useActionState(action, initialCalendarActionState);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);
  if (!confirming) return <button type="button" onClick={() => setConfirming(true)} className="min-h-11 inline-flex items-center font-extrabold text-[#526078]">Ignore all</button>;
  return <div role="dialog" aria-labelledby="ignore-all-conflicts-title" aria-describedby="ignore-all-conflicts-description" className="grid gap-2 rounded-lg border border-[#dfe6ef] bg-white p-3 text-sm text-[#071f49]">
    <p id="ignore-all-conflicts-title" className="font-extrabold">Ignore all {count} conflicts?</p>
    <p id="ignore-all-conflicts-description">Quickola will stop warning you about these current rejected booking conflicts. No bookings or calendar data will be changed.</p>
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setConfirming(false)} className="min-h-11 rounded-lg border px-3 font-extrabold">Cancel</button>
      <form action={formAction}><input type="hidden" name="confirmIgnoreAll" value="yes" /><button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-[#071f49] px-3 font-extrabold text-white disabled:opacity-60">{pending ? "Ignoring…" : "Ignore all conflicts"}</button></form>
    </div>
    {state.status === "error" && <p role="alert" className="font-bold text-red-900">{state.message}</p>}
  </div>;
}

function RejectedConflictRow({ propertyId, conflict }: { propertyId: string; conflict: RejectedImportConflict }) {
  const range = rejectedRange(conflict);
  return <article id={conflict.anchorId} tabIndex={-1} className="scroll-mt-6 rounded-lg border border-red-200 bg-red-50/60 p-3 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-red-200 sm:p-4" aria-label={rejectedAccessibleLabel(conflict)}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0"><p className="text-xs font-extrabold uppercase tracking-[.08em] text-red-900">{conflict.startAt && conflict.endAt ? `${shortDate(conflict.startAt)}–${shortDate(conflict.endAt)}` : "Booking conflict"}</p><p className="mt-1 text-sm font-extrabold text-red-950">{providerLabel(conflict.provider)} conflict</p></div>
      <div className="flex flex-wrap justify-end gap-1.5"><span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-extrabold text-red-900">Booking conflict</span><span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-extrabold text-red-900">Not imported</span></div>
    </div>
    {range && <p className="mt-3 text-sm font-bold text-red-950">{range}</p>}
    {conflict.conflictingReservation && <p className="mt-2 text-sm text-red-950">Overlaps {providerLabel(conflict.conflictingReservation.provider)} · {shortDate(conflict.conflictingReservation.startAt)}, {shortTime(conflict.conflictingReservation.startAt)} → {shortDate(conflict.conflictingReservation.endAt)}, {shortTime(conflict.conflictingReservation.endAt)}</p>}
    {range ? <p className="mt-2 text-sm text-red-900">This {providerLabel(conflict.provider)} stay was not imported because it overlaps an existing booking.</p> : <p className="mt-2 text-sm text-red-900">Booking dates unavailable for this earlier conflict. This source booking overlaps an existing booking.</p>}
    <IgnoreConflictButton propertyId={propertyId} issueId={conflict.issueId} />
  </article>;
}

function ReservationRow({ reservation, conflict = false }: { reservation: ReservationListItem; conflict?: boolean }) {
  const cleaning = cleaningLabel(reservation);
  return (
    <article className={`rounded-lg p-3 shadow-sm sm:p-4 ${conflict ? "border border-red-200 bg-red-50/50" : "border border-[#dfe6ef] bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[.08em] text-[#657089]">{shortDate(reservation.check_in_at)}–{shortDate(reservation.check_out_at)}</p>
          <p className="mt-1 text-sm font-extrabold text-[#071f49]">{sourceName(reservation)}</p>
        </div>
        {conflict && <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-extrabold text-red-900">Booking conflict</span>}
        <Link href={`/business/reservations/${reservation.id}`} className="min-h-11 shrink-0 inline-flex items-center text-sm font-extrabold text-[#16467e]">View booking →</Link>
      </div>
      <p className="mt-3 text-xs font-extrabold uppercase tracking-[.08em] text-[#657089]">Guest stay</p>
      <p className="mt-1 text-sm font-bold text-[#273752]">{reservationRange(reservation)}</p>
      {conflict && <p className="mt-2 text-sm font-extrabold text-red-900">Overlaps another booking</p>}
      <p className="mt-3 text-sm font-bold text-[#273752]">Checkout · {shortDate(reservation.check_out_at)}, {shortTime(reservation.check_out_at)}</p>
      {cleaning && <p className="mt-1 text-sm text-[#23633a]">{cleaning}</p>}
    </article>
  );
}

function operationalEventsForDay(reservations: ReservationListItem[], key: string) {
  const events: OperationalEvent[] = [];
  for (const reservation of reservations) {
    if (dayKey(reservation.check_in_at) === key) events.push({ reservation, kind: "check-in", timestamp: reservation.check_in_at });
    if (dayKey(reservation.check_out_at) === key) events.push({ reservation, kind: "checkout", timestamp: reservation.check_out_at });
    if (reservation.turnover?.access_start_at && dayKey(reservation.turnover.access_start_at) === key) {
      events.push({ reservation, kind: "cleaning", timestamp: reservation.turnover.access_start_at });
    }
  }
  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.kind.localeCompare(b.kind));
}

function eventLabel(event: OperationalEvent, conflict = false) {
  const name = sourceName(event.reservation);
  const conflictLabel = conflict ? " Booking conflict." : "";
  if (event.kind === "check-in") return `${name} reservation. Check-in ${shortDate(event.reservation.check_in_at)} at ${shortTime(event.reservation.check_in_at)}. Checkout ${shortDate(event.reservation.check_out_at)} at ${shortTime(event.reservation.check_out_at)}.${conflictLabel}`;
  if (event.kind === "checkout") return `${name} reservation. Checkout ${shortDate(event.reservation.check_out_at)} at ${shortTime(event.reservation.check_out_at)}.${cleaningLabel(event.reservation) ? ` ${cleaningLabel(event.reservation)}.` : ""}${conflictLabel}`;
  return `${cleaningLabel(event.reservation) || "Cleaning window"}.`;
}

export default function PropertyReservations({ propertyId, reservations, hasConnections, calendarsHealthy, rejectedConflicts }: { propertyId: string; reservations: ReservationListItem[]; hasConnections: boolean; calendarsHealthy: boolean; rejectedConflicts: RejectedImportConflict[] }) {
  const firstReservationDate = reservations[0]
    ? londonFormDateTime(reservations[0].check_in_at).date
    : rejectedConflicts.find((conflict) => conflict.startAt)?.startAt
      ? londonFormDateTime(rejectedConflicts.find((conflict) => conflict.startAt)!.startAt!).date
      : londonFormDateTime(new Date().toISOString()).date;
  const [view, setView] = useState<ViewMode>("calendar");
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [pendingConflict, setPendingConflict] = useState<string | null>(null);
  const hashHandled = useRef(false);
  const [month, setMonth] = useState({ year: Number(firstReservationDate.slice(0, 4)), month: Number(firstReservationDate.slice(5, 7)) - 1 });
  const days = useMemo(() => {
    const first = new Date(Date.UTC(month.year, month.month, 1));
    const count = new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate();
    const leading = first.getUTCDay() === 0 ? 6 : first.getUTCDay() - 1;
    return Array.from({ length: leading + count }, (_, index) => {
      if (index < leading) return null;
      const day = index - leading + 1;
      return `${monthKey(month.year, month.month)}-${String(day).padStart(2, "0")}`;
    });
  }, [month]);
  const prefix = monthKey(month.year, month.month);
  const monthStart = `${prefix}-01`;
  const reservationsInMonth = reservations.filter((reservation) => {
    const checkIn = dayKey(reservation.check_in_at);
    const checkOut = dayKey(reservation.check_out_at);
    return checkIn.startsWith(prefix) || checkOut.startsWith(prefix) || (checkIn < monthStart && checkOut > monthStart);
  });
  const rejectedInMonth = rejectedConflicts.filter((conflict) => {
    if (!conflict.startAt || !conflict.endAt) return false;
    const start = dayKey(conflict.startAt);
    const end = dayKey(conflict.endAt);
    return start.startsWith(prefix) || end.startsWith(prefix) || (start < monthStart && end > monthStart);
  });
  const conflictingIds = useMemo(() => {
    const ids = new Set<string>();
    for (let index = 0; index < reservations.length; index += 1) {
      for (let next = index + 1; next < reservations.length; next += 1) {
        const first = reservations[index];
        const second = reservations[next];
        if (first.property_id === second.property_id && first.status !== "cancelled" && second.status !== "cancelled" && first.check_in_at < second.check_out_at && first.check_out_at > second.check_in_at) {
          ids.add(first.id);
          ids.add(second.id);
        }
      }
    }
    return ids;
  }, [reservations]);
  const listRecords = useMemo(() => [
    ...reservations.map((reservation) => ({ kind: "reservation" as const, timestamp: reservation.check_in_at, reservation })),
    ...rejectedConflicts.map((conflict) => ({ kind: "rejected" as const, timestamp: conflict.startAt || "9999-12-31", conflict })),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.kind.localeCompare(b.kind)), [reservations, rejectedConflicts]);
      const visibleListRecords = showAllUpcoming ? listRecords : listRecords.slice(0, 5);
      const reviewConflict = (anchorId: string) => {
        setShowAllUpcoming(true);
        setPendingConflict(anchorId);
        if (view !== "list") setView("list");
      };
  useEffect(() => {
    if (!hashHandled.current) {
      hashHandled.current = true;
      const hash = window.location.hash.slice(1);
      if (hash.startsWith("booking-conflict-")) {
        startTransition(() => {
          setPendingConflict(hash);
          setShowAllUpcoming(true);
          setView("list");
        });
        return;
      }
    }
    if (view === "list" && pendingConflict && focusConflictTarget(pendingConflict)) {
      startTransition(() => setPendingConflict(null));
    }
  }, [pendingConflict, view]);
  const changeMonth = (year: number, monthValue: number) => {
    const next = new Date(Date.UTC(year, monthValue, 1));
    setMonth({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
  };
  const upcoming = showAllUpcoming ? reservations : reservations.slice(0, 5);

  return (
    <section id="property-booking-events" className="mt-6 grid gap-4" aria-labelledby="property-bookings-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="property-bookings-title" className="text-xl font-extrabold">Bookings</h2>
          <p className="mt-1 text-sm text-[#657089]">When operational transitions happen at this property.</p>
        </div>
        <div className="grid grid-cols-2 rounded-lg bg-[#eef2f7] p-1 text-sm font-extrabold" role="group" aria-label="Booking view">
          {(["calendar", "list"] as const).map((option) => <button key={option} type="button" onClick={() => setView(option)} aria-pressed={view === option} className={`min-h-11 rounded-md px-4 capitalize ${view === option ? "bg-white text-[#16467e] shadow-sm" : "text-[#657089]"}`}>{option}</button>)}
        </div>
      </div>
      {(rejectedConflicts.length > 0 || conflictingIds.size > 0) && <section className="grid gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" aria-label="Property booking conflicts">
        {rejectedConflicts.length > 0 ? <><p className="font-extrabold">{rejectedConflicts.length === 1 ? "1 booking conflict requires review" : `${rejectedConflicts.length} booking conflicts require review`}</p><p>Some imported stays overlap existing bookings.</p><div className="flex flex-wrap items-center gap-x-4 gap-y-1"><a href={`#${rejectedConflicts[0].anchorId}`} onClick={(event) => { event.preventDefault(); reviewConflict(rejectedConflicts[0].anchorId); }} className="min-h-11 inline-flex items-center font-extrabold">{rejectedConflicts.length === 1 ? "Review conflict ↓" : "Review conflicts ↓"}</a><IgnoreAllConflictsButton propertyId={propertyId} count={rejectedConflicts.length} /></div></> : <><p className="font-extrabold">Booking conflict</p><p>{conflictingIds.size} booking{conflictingIds.size === 1 ? "" : "s"} overlap for this property.</p><Link href="#property-booking-events" className="min-h-11 inline-flex items-center font-extrabold">Review conflict →</Link></>}
      </section>}
      {reservations.length === 0 && rejectedConflicts.length === 0 ? (
        <div className="rounded-xl border border-[#dfe6ef] bg-white px-5 py-6 text-center shadow-sm">
          <h3 className="font-extrabold text-[#071f49]">{hasConnections ? "No upcoming bookings" : "No booking calendar connected"}</h3>
          <p className="mt-1 text-sm text-[#657089]">{hasConnections && calendarsHealthy ? "Your connected calendars are syncing normally." : hasConnections ? "Review the connected calendar status below." : "Connect a reservation calendar to automatically import guest stays."}</p>
          {!hasConnections && <Link href="#manage-calendars" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#071f49] px-4 font-extrabold text-white">Connect calendar</Link>}
        </div>
      ) : view === "list" ? (
        <div className="grid gap-3" aria-label="Upcoming property bookings">{visibleListRecords.map((record) => record.kind === "reservation" ? <ReservationRow key={record.reservation.id} reservation={record.reservation} conflict={conflictingIds.has(record.reservation.id)} /> : <RejectedConflictRow key={record.conflict.anchorId} propertyId={propertyId} conflict={record.conflict} />)}</div>
      ) : (
        <div className="grid gap-3 rounded-xl border border-[#dfe6ef] bg-white p-3 shadow-sm sm:p-5">
          <CalendarNavigation year={month.year} month={month.month} onChange={changeMonth} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-[#657089]" aria-label="Calendar legend"><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#b9d5ff]" aria-hidden="true" />Guest stay</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#b9e2c8]" aria-hidden="true" />Cleaning window</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-red-200" aria-hidden="true" />Booking conflict</span></div>
          <div className="hidden grid-cols-7 gap-px overflow-hidden rounded-lg border bg-[#dfe6ef] md:grid" aria-label="Property booking calendar">
            {(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const).map((day) => <div key={day} className="bg-[#f7f9fc] p-2 text-xs font-extrabold text-[#657089]">{day}</div>)}
            {days.map((key, index) => {
              const dayEvents = key ? reservationsInMonth.filter((reservation) => dayKey(reservation.check_in_at) <= key && dayKey(reservation.check_out_at) >= key) : [];
              const rejectedEvents = key ? rejectedInMonth.filter((conflict) => Boolean(conflict.startAt && conflict.endAt && dayKey(conflict.startAt) <= key && dayKey(conflict.endAt) >= key)) : [];
              return <div key={key || `empty-${index}`} className="min-h-28 min-w-0 bg-white p-2"><span className="text-xs font-extrabold text-[#657089]">{key?.slice(-2).replace(/^0/, "")}</span>{key && <div className="mt-1 grid gap-1">{dayEvents.map((reservation) => { const start = dayKey(reservation.check_in_at); const end = dayKey(reservation.check_out_at); const firstVisibleDay = start < monthStart ? monthStart : start; const lastVisibleDay = end.startsWith(prefix) ? end : `${prefix}-${String(new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate()).padStart(2, "0")}`; const isFirst = key === firstVisibleDay; const isLast = key === lastVisibleDay; const conflict = conflictingIds.has(reservation.id); const cleaning = reservation.turnover?.access_start_at && dayKey(reservation.turnover.access_start_at) === key ? `Clean ${shortTime(reservation.turnover.access_start_at)}–${shortTime(reservation.turnover.window_end_at)}` : null; return <div key={reservation.id} className={`min-w-0 border-l-2 px-2 py-1 text-xs font-bold ${conflict ? "border-red-500 bg-red-50 text-red-950" : "border-transparent bg-[#eef5ff] text-[#16467e]"} ${isFirst ? "rounded-l-md" : ""} ${isLast ? "rounded-r-md" : ""}`} title={`${sourceName(reservation)} guest stay${conflict ? ", booking conflict with another stay" : ""}`} aria-label={`${sourceName(reservation)} guest stay${conflict ? ", booking conflict with another stay" : ""}${cleaning ? `. ${cleaning}` : ""}`}>{isFirst && <span className="block truncate">{sourceName(reservation)} · Guest stay</span>}{conflict && isFirst && <span className="block truncate">Conflict</span>}{isFirst && dayKey(reservation.check_in_at) === key && <span className="block truncate">Check-in · {shortTime(reservation.check_in_at)}</span>}{isLast && dayKey(reservation.check_out_at) === key && <span className="block truncate">Checkout · {shortTime(reservation.check_out_at)}</span>}{cleaning && <span className="mt-1 block truncate rounded bg-[#eef8f2] px-1 text-[#23633a]">{cleaning}</span>}</div>; })}{rejectedEvents.map((conflict) => <button type="button" key={conflict.anchorId} onClick={() => reviewConflict(conflict.anchorId)} className="min-w-0 border-l-2 border-red-500 bg-red-50 px-2 py-1 text-left text-xs font-bold text-red-950" aria-label={rejectedAccessibleLabel(conflict)}><span className="block truncate">{providerLabel(conflict.provider)} · Conflict</span><span className="block truncate">Not imported</span>{conflict.startAt && dayKey(conflict.startAt) === key && <span className="block truncate">{shortTime(conflict.startAt)}</span>}</button>)}</div>}</div>;
            })}
          </div>
          <div className="grid gap-2 md:hidden" aria-label="Property booking operational agenda">{days.filter((key): key is string => Boolean(key && (operationalEventsForDay(reservations, key).length || rejectedInMonth.some((conflict) => Boolean(conflict.startAt && conflict.endAt && dayKey(conflict.startAt) <= key && dayKey(conflict.endAt) >= key))))).map((key) => { const events = operationalEventsForDay(reservations, key); const rejectedEvents = rejectedInMonth.filter((conflict) => Boolean(conflict.startAt && conflict.endAt && dayKey(conflict.startAt) <= key && dayKey(conflict.endAt) >= key)); return <div key={key} className="rounded-lg border border-[#e7ebf0] p-3"><p className="text-xs font-extrabold uppercase tracking-[.08em] text-[#657089]">{shortDate(`${key}T12:00:00Z`)}</p><div className="mt-2 grid gap-2">{events.map((event, index) => { const conflict = conflictingIds.has(event.reservation.id); return <div key={`${event.reservation.id}-${event.kind}`}><div className="text-sm" aria-label={eventLabel(event, conflict)}><p className={`font-extrabold ${event.kind === "cleaning" ? "text-[#23633a]" : conflict ? "text-red-900" : "text-[#16467e]"}`}>{event.kind === "cleaning" ? "Cleaning window" : sourceName(event.reservation)}{conflict && event.kind !== "cleaning" ? " · Conflict" : ""}</p><p className="text-[#273752]">{event.kind === "check-in" ? `Check-in · ${shortTime(event.reservation.check_in_at)}` : event.kind === "checkout" ? `Checkout · ${shortTime(event.reservation.check_out_at)}` : `${shortTime(event.reservation.turnover!.access_start_at)}–${shortTime(event.reservation.turnover!.window_end_at)}`}</p></div>{index < events.length - 1 && <p className="py-1 text-center text-sm font-extrabold text-[#657089]" aria-hidden="true">↓</p>}</div>; })}{rejectedEvents.map((conflict) => <button type="button" key={conflict.anchorId} onClick={() => reviewConflict(conflict.anchorId)} className="rounded-lg border border-red-200 bg-red-50 p-3 text-left text-sm text-red-950" aria-label={rejectedAccessibleLabel(conflict)}><p className="font-extrabold">{providerLabel(conflict.provider)} · Conflict</p><p className="font-bold">Not imported{conflict.startAt ? ` · ${shortTime(conflict.startAt)}` : ""}</p><span className="sr-only">Select to review conflict</span></button>)}</div></div>; })}</div>
        </div>
      )}
      {reservations.length > 0 && <section className="grid gap-3" aria-labelledby="upcoming-property-bookings-title"><div className="flex items-center justify-between gap-3"><h3 id="upcoming-property-bookings-title" className="text-lg font-extrabold text-[#071f49]">Upcoming bookings</h3>{listRecords.length > 5 && <button type="button" onClick={() => setShowAllUpcoming((current) => !current)} className="min-h-11 text-sm font-extrabold text-[#245b9d]">{showAllUpcoming ? "Show fewer ↑" : "View all upcoming bookings →"}</button>}</div><div className="grid gap-2">{upcoming.map((reservation) => <ReservationRow key={`upcoming-${reservation.id}`} reservation={reservation} conflict={conflictingIds.has(reservation.id)} />)}</div></section>}
    </section>
  );
}
