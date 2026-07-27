"use client";

import { useActionState, useRef } from "react";
import { initialReservationActionState } from "@/lib/reservations/action-state";
import { cancelReservationAction } from "./actions";

export default function CancelReservation({
  reservationId,
  propertyName,
}: {
  reservationId: string;
  propertyName: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelAction = cancelReservationAction.bind(null, reservationId);
  const [state, action, pending] = useActionState(
    cancelAction,
    initialReservationActionState,
  );
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-extrabold text-red-700"
      >
        Cancel reservation
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="cancel-reservation-title"
        className="m-auto w-[min(92vw,480px)] rounded-xl border-0 p-0 text-[#071638] shadow-2xl backdrop:bg-[#020b1c]/60"
      >
        <div className="p-6">
          <h2 id="cancel-reservation-title" className="text-xl font-extrabold">
            Cancel this reservation?
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#657089]">
            The reservation and linked turnover for {propertyName} will be marked
            cancelled. Their history will be kept.
          </p>
          {state?.message && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-800"
            >
              {state.message}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="portal-action-secondary"
            >
              Keep reservation
            </button>
            <form action={action}>
              <button
                disabled={pending}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-red-700 px-4 text-sm font-extrabold text-white disabled:cursor-wait disabled:opacity-60"
              >
                {pending ? "Cancelling…" : "Yes, cancel reservation"}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
