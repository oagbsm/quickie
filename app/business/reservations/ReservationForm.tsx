"use client";

import { useActionState } from "react";
import {
  createReservationAction,
  updateReservationAction,
} from "./actions";
import {
  initialReservationActionState,
  reservationFieldError,
} from "@/lib/reservations/action-state";
import type { ReservationField } from "@/lib/reservations/validation";

type Property = { id: string; nickname: string; postcode: string };
type InitialValues = {
  propertyId: string;
  guestName: string;
  guestCount: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
};

const field =
  "mt-1.5 min-h-12 w-full rounded-lg border border-[#cfd7e3] bg-white px-3.5 py-2.5 outline-none focus:border-[#2d67b2] focus:ring-4 focus:ring-[#2d67b2]/15";

export default function ReservationForm({
  mode,
  reservationId,
  requestKey,
  properties,
  initial,
}: {
  mode: "create" | "edit";
  reservationId?: string;
  requestKey?: string;
  properties: Property[];
  initial: InitialValues;
}) {
  const updateAction = reservationId
    ? updateReservationAction.bind(null, reservationId)
    : updateReservationAction.bind(null, "");
  const [state, action, pending] = useActionState(
    mode === "create" ? createReservationAction : updateAction,
    initialReservationActionState,
  );
  const currentState = state ?? initialReservationActionState;
  const error = (name: ReservationField) =>
    reservationFieldError(state, name);
  return (
    <form action={action} className="grid gap-5" noValidate>
      {mode === "create" && (
        <input type="hidden" name="requestKey" value={requestKey} />
      )}
      {currentState.message && (
        <div
          role="alert"
          className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-800"
        >
          {currentState.message}
        </div>
      )}
      <section className="portal-card p-5 sm:p-7">
        <h2 className="text-lg font-extrabold">Stay details</h2>
        <div className="mt-5 grid gap-5">
          <label className="font-bold">
            Property
            <select
              name="propertyId"
              defaultValue={initial.propertyId}
              required
              aria-invalid={Boolean(error("propertyId"))}
              aria-describedby={error("propertyId") ? "property-error" : undefined}
              className={field}
            >
              <option value="" disabled>
                Select a property
              </option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.nickname} · {property.postcode}
                </option>
              ))}
            </select>
            {error("propertyId") && (
              <span id="property-error" className="mt-1 block text-sm text-red-700">
                {error("propertyId")}
              </span>
            )}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="font-bold">
              Guest name <span className="font-normal text-[#657089]">(optional)</span>
              <input
                name="guestName"
                maxLength={160}
                defaultValue={initial.guestName}
                autoComplete="off"
                aria-invalid={Boolean(error("guestName"))}
                className={field}
              />
              {error("guestName") && (
                <span className="mt-1 block text-sm text-red-700">
                  {error("guestName")}
                </span>
              )}
            </label>
            <label className="font-bold">
              Guest count <span className="font-normal text-[#657089]">(optional)</span>
              <input
                name="guestCount"
                type="number"
                inputMode="numeric"
                min="1"
                max="1000"
                step="1"
                defaultValue={initial.guestCount}
                aria-invalid={Boolean(error("guestCount"))}
                className={field}
              />
              {error("guestCount") && (
                <span className="mt-1 block text-sm text-red-700">
                  {error("guestCount")}
                </span>
              )}
            </label>
          </div>
        </div>
      </section>
      <section className="portal-card p-5 sm:p-7">
        <h2 className="text-lg font-extrabold">Arrival and departure</h2>
        <p className="mt-1 text-sm text-[#657089]">
          Enter local UK dates and times. Quickola stores the correct London time,
          including clock changes.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <fieldset className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
            <legend className="font-extrabold md:col-span-2">Check-in</legend>
            <label className="font-bold">
              <span className="text-sm">Date</span>
              <input
                name="checkInDate"
                type="date"
                required
                defaultValue={initial.checkInDate}
                aria-invalid={Boolean(error("checkInDate"))}
                className={field}
              />
            </label>
            <label className="font-bold">
              <span className="text-sm">Time</span>
              <input
                name="checkInTime"
                type="time"
                required
                defaultValue={initial.checkInTime}
                aria-invalid={Boolean(error("checkInTime"))}
                className={field}
              />
            </label>
            {(error("checkInDate") || error("checkInTime")) && (
              <p className="text-sm text-red-700 md:col-span-2">
                {error("checkInDate") || error("checkInTime")}
              </p>
            )}
          </fieldset>
          <fieldset className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
            <legend className="font-extrabold md:col-span-2">Check-out</legend>
            <label className="font-bold">
              <span className="text-sm">Date</span>
              <input
                name="checkOutDate"
                type="date"
                required
                defaultValue={initial.checkOutDate}
                aria-invalid={Boolean(error("checkOutDate"))}
                className={field}
              />
            </label>
            <label className="font-bold">
              <span className="text-sm">Time</span>
              <input
                name="checkOutTime"
                type="time"
                required
                defaultValue={initial.checkOutTime}
                aria-invalid={Boolean(error("checkOutTime"))}
                className={field}
              />
            </label>
            {(error("checkOutDate") || error("checkOutTime")) && (
              <p className="text-sm text-red-700 md:col-span-2">
                {error("checkOutDate") || error("checkOutTime")}
              </p>
            )}
          </fieldset>
        </div>
      </section>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <a
          href={
            mode === "edit" && reservationId
              ? `/business/reservations/${reservationId}`
              : "/business/reservations"
          }
          className="portal-action-secondary"
        >
          Cancel
        </a>
        <button
          disabled={pending}
          className="portal-action disabled:cursor-wait disabled:opacity-60"
        >
          {pending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create reservation"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}
